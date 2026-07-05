import 'server-only'
import type { GeneratedQuestion } from './quiz-generator'
import { generateDifyQuizFromQuery, getDifyConfig } from './dify-quiz'

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

function buildQuery(input: DifyInput, index: number, total: number): string {
  const weakHint = input.weakDomains.length > 0 ? input.weakDomains.join(', ') : 'none'
  return `${input.topic} | domain: ${input.domain ?? 'English conversation'} | level: ${input.difficulty} | weak areas: ${weakHint} | question ${index + 1} of ${total}`
}

export async function generateDifyQuizQuestions(input: DifyInput): Promise<DifyResult> {
  if (!getDifyConfig()) {
    return {
      questions: [],
      error: '問題を生成できませんでした。しばらく経ってから再度お試しください。',
    }
  }

  const questions: GeneratedQuestion[] = []
  for (let i = 0; i < input.count; i++) {
    const query = buildQuery(input, i, input.count)
    const { question, error } = await generateDifyQuizFromQuery(query, input.userId)
    if (!question) {
      return { questions: [], error: error ?? '問題を生成できませんでした。' }
    }
    questions.push({ ...question, bridge_text: i > 0 ? question.bridge_text : '' })
  }

  return { questions }
}
