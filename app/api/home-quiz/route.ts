import { NextResponse } from 'next/server'
import { generateDifyQuizFromQuery, getDifyConfig } from '@/lib/dify-quiz'

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
  try {
    const body = (await req.json()) as { query?: string }
    if (body.query?.trim()) query = body.query.trim().slice(0, 200)
  } catch {
    // use default
  }

  const userId = `home-${Date.now()}`
  const { question, error } = await generateDifyQuizFromQuery(query, userId)
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
