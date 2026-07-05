import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { getCourseById, getLessonById } from '@/lib/courses'
import { getQuizQuestions, getQuizAttempts } from '@/lib/quiz'
import { ensureQuizQuestions } from '@/lib/quiz-orchestrator'

export const dynamic = 'force-dynamic'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ courseId: string; lessonId: string }> },
) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { courseId, lessonId } = await params
  const course = await getCourseById(courseId)
  const lesson = course?.lessons.find((l) => l.id === lessonId)
  if (!lesson) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await ensureQuizQuestions(user.id, lesson)

  const questions = await getQuizQuestions(lessonId, user.id)
  const attempts = await getQuizAttempts(user.id, lessonId)

  let currentOrder = 1
  for (const q of questions) {
    if (!attempts.has(q.id)) {
      currentOrder = q.sort_order
      break
    }
    currentOrder = q.sort_order
  }
  const allDone = questions.length > 0 && questions.every((q) => attempts.has(q.id))

  return NextResponse.json({
    questions: questions.map((q) => ({
      id: q.id,
      sort_order: q.sort_order,
      question: q.question,
      choices: JSON.parse(q.choices || '[]'),
      bridge_text: q.bridge_text,
      answered: attempts.has(q.id),
      attempt: attempts.get(q.id) ?? null,
    })),
    currentOrder,
    allDone,
    domain: lesson.domain,
    title: lesson.title,
    quizSource: lesson.quiz_source,
  })
}
