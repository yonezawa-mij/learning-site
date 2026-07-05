import 'server-only'
import { sql } from './db'

export type TutorMessage = {
  id: string
  role: 'user' | 'assistant'
  content: string
  context_lesson_id: string | null
  created_at: string
}

export async function getTutorMessages(userId: string, limit = 30): Promise<TutorMessage[]> {
  const rows = (await sql`
    SELECT id, role, content, context_lesson_id, created_at
    FROM tutor_messages
    WHERE user_id = ${userId}
    ORDER BY created_at DESC
    LIMIT ${limit}
  `) as TutorMessage[]
  return rows.reverse()
}

export async function saveTutorMessage(
  userId: string,
  role: 'user' | 'assistant',
  content: string,
  contextLessonId?: string | null,
): Promise<TutorMessage> {
  const rows = (await sql`
    INSERT INTO tutor_messages (user_id, role, content, context_lesson_id)
    VALUES (${userId}, ${role}, ${content}, ${contextLessonId ?? null})
    RETURNING id, role, content, context_lesson_id, created_at
  `) as TutorMessage[]
  return rows[0]
}

export async function clearTutorHistory(userId: string): Promise<void> {
  await sql`DELETE FROM tutor_messages WHERE user_id = ${userId}`
}
