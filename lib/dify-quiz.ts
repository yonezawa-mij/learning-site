import 'server-only'
import type { GeneratedQuestion } from './quiz-generator'

export type DifyWorkflowQuiz = {
  question: string
  choices: string[]
  answer_index: number
  explanation: string
}

type DifyConfig = {
  apiKey: string
  baseUrl: string
  appType: 'workflow' | 'chat' | 'completion'
  chatApiKey?: string
}

export function getDifyConfig(): DifyConfig | null {
  const apiKey = process.env.DIFY_API_KEY?.trim()
  if (!apiKey) return null
  const baseUrl = (process.env.DIFY_API_BASE ?? 'https://api.dify.ai/v1').replace(/\/$/, '')
  const raw = process.env.DIFY_APP_TYPE?.trim().toLowerCase()
  const appType = raw === 'completion' ? 'completion' : raw === 'chat' ? 'chat' : 'workflow'
  const chatApiKey = process.env.DIFY_CHAT_API_KEY?.trim() || apiKey
  return { apiKey, baseUrl, appType, chatApiKey }
}

export type DifyWorkflowInputs = {
  query: string
  history?: string
  weaknesses?: string
  mode?: 'quiz' | 'chat'
  user_message?: string
}

/** Dify PersonalizedQuizTutor の query 入力上限 */
export const DIFY_QUERY_MAX = 48
export const DIFY_USER_MESSAGE_MAX = 512
export const DIFY_HISTORY_MAX = 1000

export function clampDifyInputs(inputs: DifyWorkflowInputs): DifyWorkflowInputs {
  return {
    ...inputs,
    query: inputs.query.trim().slice(0, DIFY_QUERY_MAX),
    history: (inputs.history ?? '').slice(0, DIFY_HISTORY_MAX),
    weaknesses: (inputs.weaknesses ?? '').slice(0, 256),
    user_message: (inputs.user_message ?? '').slice(0, DIFY_USER_MESSAGE_MAX),
  }
}

function isDifyRefusal(text: string): boolean {
  const markers = [
    'モードが指定',
    'モード（クイズ',
    'Selected Mode',
    '情報が不足',
    'Please provide the full prompt',
    "didn't receive the full",
    'システムモードが選択',
  ]
  return markers.some((m) => text.includes(m))
}

export function parseWorkflowQuizJson(text: string): DifyWorkflowQuiz | null {
  const cleaned = text.replace(/```json\s*/gi, '').replace(/```/g, '').trim()
  const match = cleaned.match(/\{[\s\S]*\}/)
  if (!match) return null

  try {
    const parsed = JSON.parse(match[0]) as Record<string, unknown>

    if (Array.isArray(parsed.questions) && parsed.questions[0]) {
      return workflowQuizToLegacyShape(parsed.questions[0] as Record<string, unknown>)
    }

    return workflowQuizToLegacyShape(parsed)
  } catch {
    return null
  }
}

function workflowQuizToLegacyShape(raw: Record<string, unknown>): DifyWorkflowQuiz | null {
  const question = String(raw.question ?? '').trim()
  const choices = Array.isArray(raw.choices) ? raw.choices.map(String) : []
  const explanation = String(raw.explanation ?? '').trim()

  let answerIndex = typeof raw.answer_index === 'number' ? raw.answer_index : -1
  if (answerIndex < 0 && raw.correct_answer) {
    const idx = choices.findIndex((c) => c === String(raw.correct_answer))
    answerIndex = idx >= 0 ? idx : 0
  }
  if (!question || choices.length < 2) return null
  if (answerIndex < 0 || answerIndex >= choices.length) answerIndex = 0

  return { question, choices, answer_index: answerIndex, explanation }
}

export function toGeneratedQuestion(q: DifyWorkflowQuiz, index = 0): GeneratedQuestion {
  return {
    question: q.question,
    correct_answer: q.choices[q.answer_index] ?? q.choices[0],
    answer_variants: [],
    choices: q.choices,
    explanation: q.explanation,
    bridge_text: index > 0 ? 'Continue from the previous question.' : '',
  }
}

function extractOutputText(data: Record<string, unknown>): string {
  const outputs = (data.data as Record<string, unknown> | undefined)?.outputs as
    | Record<string, string>
    | undefined
  if (outputs?.text) return outputs.text
  if (typeof data.answer === 'string') return data.answer
  return ''
}

function mapDifyError(status: number, body: string): string {
  try {
    const parsed = JSON.parse(body) as { code?: string; message?: string }
    if (parsed.message?.includes('query in input form must be less than')) {
      return 'テーマが長すぎます。48文字以内に短くしてください。'
    }
    if (parsed.message?.includes('mode is required')) {
      return 'Dify ワークフローに mode が渡されていません。アプリを再デプロイしてください。'
    }
    if (parsed.message?.includes('Workflow not published')) {
      return 'Dify のワークフローが未公開です。Dify 管理画面で PersonalizedQuizTutor を公開してください。'
    }
    if (parsed.code === 'app_unavailable') {
      return 'Dify アプリの設定を確認してください（ワークフローの公開・API キーの紐付け）。'
    }
    if (status === 401 || status === 403) {
      return 'Dify API キーが無効です。キーを再発行して環境変数を更新してください。'
    }
  } catch {
    // ignore parse errors
  }
  return '問題を生成できませんでした。しばらく経ってから再度お試しください。'
}

export async function runDifyWorkflow(
  inputs: DifyWorkflowInputs,
  userId: string,
): Promise<{ text: string; error?: string }> {
  const config = getDifyConfig()
  if (!config) {
    return { text: '', error: '問題を生成できませんでした。しばらく経ってから再度お試しください。' }
  }

  if (config.appType !== 'workflow') {
    return runDifyLegacy(inputs.query, userId, config)
  }

  try {
    const normalized = clampDifyInputs(inputs)
    const res = await fetch(`${config.baseUrl}/workflows/run`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: {
          query: normalized.query,
          history: normalized.history ?? '',
          weaknesses: normalized.weaknesses ?? '',
          mode: normalized.mode ?? 'quiz',
          user_message: normalized.user_message ?? '',
        },
        response_mode: 'blocking',
        user: userId,
      }),
      signal: AbortSignal.timeout(60000),
    })

    if (!res.ok) {
      const body = await res.text().catch(() => '')
      console.error('Dify workflow error:', res.status, body)
      return { text: '', error: mapDifyError(res.status, body) }
    }

    const data = (await res.json()) as Record<string, unknown>
    const text = extractOutputText(data)
    if (!text.trim()) {
      return { text: '', error: '問題を生成できませんでした。しばらく経ってから再度お試しください。' }
    }
    return { text }
  } catch (err) {
    console.error('Dify workflow fetch failed:', err)
    return { text: '', error: '問題を生成できませんでした。しばらく経ってから再度お試しください。' }
  }
}

async function runDifyLegacy(
  query: string,
  userId: string,
  config: DifyConfig,
): Promise<{ text: string; error?: string }> {
  const endpoint = config.appType === 'completion' ? '/completion-messages' : '/chat-messages'
  const body =
    config.appType === 'completion'
      ? { inputs: { query }, response_mode: 'blocking', user: userId }
      : { inputs: { query }, query, response_mode: 'blocking', user: userId }

  try {
    const res = await fetch(`${config.baseUrl}${endpoint}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(60000),
    })
    if (!res.ok) {
      const body = await res.text().catch(() => '')
      console.error('Dify legacy error:', res.status, body)
      return { text: '', error: mapDifyError(res.status, body) }
    }
    const data = (await res.json()) as Record<string, unknown>
    const text = extractOutputText(data) || String(data.answer ?? '')
    return text ? { text } : { text: '', error: '問題を生成できませんでした。しばらく経ってから再度お試しください。' }
  } catch {
    return { text: '', error: '問題を生成できませんでした。しばらく経ってから再度お試しください。' }
  }
}

export async function runDifyChat(
  userMessage: string,
  userId: string,
  context?: { question?: string; theme?: string; conversationId?: string },
): Promise<{ answer: string; conversationId?: string; error?: string }> {
  const theme = (context?.theme || 'English quiz').trim().slice(0, DIFY_QUERY_MAX)
  const history = [
    context?.question ? `現在の問題: ${context.question}` : '',
  ]
    .filter(Boolean)
    .join('\n')

  for (let attempt = 0; attempt < 3; attempt++) {
    const { text, error } = await runDifyWorkflow(
      {
        query: theme,
        history,
        weaknesses: '',
        mode: 'chat',
        user_message: userMessage,
      },
      `${userId}-chat-${attempt}`,
    )

    if (error) {
      if (attempt < 2) continue
      return { answer: '', error }
    }

    const cleaned = text.replace(/```json\s*/gi, '').replace(/```/g, '').trim()
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0]) as Record<string, unknown>
        const explanation = String(parsed.explanation ?? '').trim()
        if (explanation && !isDifyRefusal(explanation)) {
          return { answer: explanation, conversationId: context?.conversationId }
        }
      } catch {
        // fall through
      }
    }

    const answer = text.trim()
    if (answer && !isDifyRefusal(answer)) {
      return { answer, conversationId: context?.conversationId }
    }
  }

  return { answer: '', error: '対話の応答を取得できませんでした。もう一度お試しください。' }
}

export async function generateDifyQuizFromQuery(
  query: string,
  userId: string,
  personalization?: { history?: string; weaknesses?: string },
): Promise<{
  question: GeneratedQuestion | null
  error?: string
}> {
  let lastError: string | undefined

  for (let attempt = 0; attempt < 3; attempt++) {
    const { text, error } = await runDifyWorkflow(
      {
        query,
        history: personalization?.history,
        weaknesses: personalization?.weaknesses,
        mode: 'quiz',
      },
      `${userId}-quiz-${attempt}`,
    )
    if (error) {
      lastError = error
      if (attempt < 2) continue
      return { question: null, error }
    }

    const parsed = parseWorkflowQuizJson(text)
    if (parsed && !isDifyRefusal(parsed.explanation)) {
      return { question: toGeneratedQuestion(parsed) }
    }
    lastError = '問題を生成できませんでした。しばらく経ってから再度お試しください。'
  }

  return { question: null, error: lastError }
}
