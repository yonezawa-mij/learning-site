import 'server-only'
import type { GeneratedQuestion } from './quiz-generator'
import { buildDifyPersonalization } from './dify-personalized'
import { generateDifyQuizFromQuery, getDifyConfig, DIFY_HISTORY_MAX, DIFY_QUERY_MAX } from './dify-quiz'
import type { DifyPersonalization } from './dify-personalized'

type DifyInput = {
  userId: string
  domain: string | null
  topic: string
  count: number
  difficulty: string
  weakDomains: string[]
}

type DifyResult = {
  questions: GeneratedQuestion[]
  error?: string
}

function buildDifyRequest(
  input: DifyInput,
  index: number,
  total: number,
  personalization: DifyPersonalization,
): { query: string; history: string; weaknesses: string } {
  const query = `${input.topic}, ${input.difficulty}`.trim().slice(0, DIFY_QUERY_MAX)
  const detail = `問題 ${index + 1}/${total} | 分野: ${input.domain ?? 'English'} | 弱点: ${input.weakDomains.join(', ') || 'なし'}`
  const historyParts = [
    personalization.history !== '（履歴なし）' ? personalization.history : '',
    detail,
  ].filter(Boolean)
  return {
    query,
    history: historyParts.join('\n').slice(0, DIFY_HISTORY_MAX),
    weaknesses: personalization.weaknesses,
  }
}

export async function generateDifyQuizQuestions(input: DifyInput): Promise<DifyResult> {
  if (!getDifyConfig()) {
    return {
      questions: [],
      error: '問題を生成できませんでした。しばらく経ってから再度お試しください。',
    }
  }

  const personalization = await buildDifyPersonalization(input.userId)

  const total = Math.max(1, input.count)
  const results = await Promise.all(
    Array.from({ length: total }, (_, i) => {
      const req = buildDifyRequest(input, i, total, personalization)
      return generateDifyQuizFromQuery(req.query, input.userId, {
        history: req.history,
        weaknesses: req.weaknesses,
      })
    }),
  )

  const questions: GeneratedQuestion[] = []
  for (let i = 0; i < results.length; i++) {
    const { question, error } = results[i]
    if (!question) {
      return { questions: [], error: error ?? '問題を生成できませんでした。' }
    }
    questions.push({ ...question, bridge_text: i > 0 ? question.bridge_text : '' })
  }

  return { questions }
}
