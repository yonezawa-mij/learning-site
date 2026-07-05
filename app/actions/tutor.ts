'use server'

import { revalidatePath } from 'next/cache'
import { getCurrentUser } from '@/lib/auth'
import { getTutorMessages, saveTutorMessage, clearTutorHistory } from '@/lib/tutor'
import { generateTutorReply } from '@/lib/tutor-ai'
import { getLearningPlan } from '@/lib/learning-plan'

export type TutorActionResult = {
  error?: string
  message?: { id: string; role: 'assistant'; content: string; created_at: string }
}

export async function sendTutorMessageAction(
  message: string,
  context?: { lessonId?: string; lessonTitle?: string; domain?: string | null },
): Promise<TutorActionResult> {
  const user = await getCurrentUser()
  if (!user) return { error: 'ログインが必要です' }

  const trimmed = message.trim()
  if (!trimmed) return { error: 'メッセージを入力してください' }
  if (trimmed.length > 2000) return { error: 'メッセージが長すぎます' }

  const history = await getTutorMessages(user.id)
  await saveTutorMessage(user.id, 'user', trimmed, context?.lessonId ?? null)

  const reply = await generateTutorReply(user.id, trimmed, history, {
    lessonTitle: context?.lessonTitle,
    domain: context?.domain,
  })

  const saved = await saveTutorMessage(user.id, 'assistant', reply.content, context?.lessonId ?? null)

  revalidatePath('/tutor')
  revalidatePath('/dashboard')

  return {
    message: {
      id: saved.id,
      role: 'assistant',
      content: saved.content,
      created_at: saved.created_at,
    },
  }
}

export async function refreshLearningPlanAction(): Promise<void> {
  const user = await getCurrentUser()
  if (!user) return

  await getLearningPlan(user.id, true)
  revalidatePath('/dashboard')
}

export async function clearTutorHistoryAction() {
  const user = await getCurrentUser()
  if (!user) return { error: 'ログインが必要です' as const }

  await clearTutorHistory(user.id)
  revalidatePath('/tutor')
  return { ok: true as const }
}

export async function getTutorHistoryAction() {
  const user = await getCurrentUser()
  if (!user) return { error: 'ログインが必要です' as const, messages: [] as const }

  const messages = await getTutorMessages(user.id)
  return { messages }
}
