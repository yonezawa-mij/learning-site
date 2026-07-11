import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { buildDifyPersonalization } from '@/lib/dify-personalized'
import { generateDifyQuizFromQuery, getDifyConfig, clampDifyInputs } from '@/lib/dify-quiz'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  const config = getDifyConfig()
  if (!config) {
    return NextResponse.json(
      { error: 'AI クイズは現在利用できません。' },
      { status: 503 },
    )
  }

  let query = 'Daily conversation, beginner'
  let history = ''
  let weaknesses = ''

  try {
    const body = (await req.json()) as {
      query?: string
      history?: string
      weaknesses?: string
    }
    if (body.query?.trim()) query = body.query.trim().slice(0, 200)
    if (body.history?.trim()) history = body.history.trim().slice(0, 2000)
    if (body.weaknesses?.trim()) weaknesses = body.weaknesses.trim().slice(0, 500)
  } catch {
    // use defaults
  }

  const user = await getCurrentUser()
  const userId = user?.id ?? `home-${Date.now()}`

  if (user && !history && !weaknesses) {
    const p = await buildDifyPersonalization(user.id)
    history = p.history
    weaknesses = p.weaknesses
  }

  const { question, error } = await generateDifyQuizFromQuery(
    clampDifyInputs({ query, history, weaknesses, mode: 'quiz' }).query,
    userId,
    { history, weaknesses },
  )
  if (!question || error) {
    return NextResponse.json({ error: error ?? '問題を生成できませんでした。' }, { status: 502 })
  }

  return NextResponse.json({
    question: {
      question: question.question,
      choices: question.choices,
      correct_answer: question.correct_answer,
      explanation: question.explanation,
    },
  })
}
