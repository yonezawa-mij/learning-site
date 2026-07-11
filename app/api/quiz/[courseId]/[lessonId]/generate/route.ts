import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { getLessonById } from '@/lib/courses'
import { ensureQuizQuestions } from '@/lib/quiz-orchestrator'
import { normalizeQuizSource } from '@/lib/quiz-sources'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ courseId: string; lessonId: string }> },
) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'ログインが必要です' }, { status: 401 })

  const { courseId, lessonId } = await params
  const lesson = await getLessonById(courseId, lessonId)
  if (!lesson || lesson.lesson_type !== 'quiz') {
    return NextResponse.json({ error: 'クイズレッスンが見つかりません' }, { status: 404 })
  }

  const source = normalizeQuizSource(lesson.quiz_source)
  if (source === 'fixed') {
    return NextResponse.json({ error: 'このセットは再生成できません' }, { status: 400 })
  }

  const result = await ensureQuizQuestions(user.id, lesson, { force: true, autoGenerate: true })
  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 502 })
  }

  return NextResponse.json({ ok: true, generated: result.generated })
}
