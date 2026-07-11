import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { runDifyChat, getDifyConfig } from '@/lib/dify-quiz'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  if (!getDifyConfig()) {
    return NextResponse.json({ error: 'Dify API が未設定です。' }, { status: 503 })
  }

  const user = await getCurrentUser()
  const userId = user?.id ?? `guest-${Date.now()}`

  let body: {
    message?: string
    question?: string
    theme?: string
    conversationId?: string
  } = {}
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'リクエストが不正です。' }, { status: 400 })
  }

  const message = body.message?.trim()
  if (!message) {
    return NextResponse.json({ error: 'メッセージを入力してください。' }, { status: 400 })
  }

  const { answer, conversationId, error } = await runDifyChat(message, userId, {
    question: body.question,
    theme: body.theme,
    conversationId: body.conversationId,
  })

  if (error || !answer) {
    return NextResponse.json({ error: error ?? '回答を取得できませんでした。' }, { status: 502 })
  }

  return NextResponse.json({ answer, conversationId })
}
