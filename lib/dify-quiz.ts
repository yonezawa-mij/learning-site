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
}

export function getDifyConfig(): DifyConfig | null {
  const apiKey = process.env.DIFY_API_KEY?.trim()
  if (!apiKey) return null
  const baseUrl = (process.env.DIFY_API_BASE ?? 'https://api.dify.ai/v1').replace(/\/$/, '')
  const raw = process.env.DIFY_APP_TYPE?.trim().toLowerCase()
  const appType = raw === 'completion' ? 'completion' : raw === 'chat' ? 'chat' : 'workflow'
  return { apiKey, baseUrl, appType }
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

export async function runDifyWorkflow(query: string, userId: string): Promise<{ text: string; error?: string }> {
  const config = getDifyConfig()
  if (!config) {
    return { text: '', error: '問題を生成できませんでした。しばらく経ってから再度お試しください。' }
  }

  if (config.appType !== 'workflow') {
    return runDifyLegacy(query, userId, config)
  }

  try {
    const res = await fetch(`${config.baseUrl}/workflows/run`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: { query },
        response_mode: 'blocking',
        user: userId,
      }),
      signal: AbortSignal.timeout(60000),
    })

    if (!res.ok) {
      console.error('Dify workflow error:', res.status, await res.text().catch(() => ''))
      return { text: '', error: '問題を生成できませんでした。しばらく経ってから再度お試しください。' }
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
      return { text: '', error: '問題を生成できませんでした。しばらく経ってから再度お試しください。' }
    }
    const data = (await res.json()) as Record<string, unknown>
    const text = extractOutputText(data) || String(data.answer ?? '')
    return text ? { text } : { text: '', error: '問題を生成できませんでした。しばらく経ってから再度お試しください。' }
  } catch {
    return { text: '', error: '問題を生成できませんでした。しばらく経ってから再度お試しください。' }
  }
}

export async function generateDifyQuizFromQuery(query: string, userId: string): Promise<{
  question: GeneratedQuestion | null
  error?: string
}> {
  const { text, error } = await runDifyWorkflow(query, userId)
  if (error) return { question: null, error }

  const parsed = parseWorkflowQuizJson(text)
  if (!parsed) {
    return { question: null, error: '問題を生成できませんでした。しばらく経ってから再度お試しください。' }
  }
  return { question: toGeneratedQuestion(parsed) }
}
