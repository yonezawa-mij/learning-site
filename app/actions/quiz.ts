'use server'

import { revalidatePath } from 'next/cache'
import { getCurrentUser } from '@/lib/auth'
import { getCourseById, getLessonById } from '@/lib/courses'
import {
  getQuizQuestions,
  saveQuizAttempt,
  completeQuizSet,
  getQuizAttempts,
  checkAnswer,
} from '@/lib/quiz'
import { evaluateQuizAnswer, summarizeSetUnderstanding } from '@/lib/quiz-ai'
import { ensureQuizQuestions } from '@/lib/quiz-orchestrator'
import { normalizeQuizSource } from '@/lib/quiz-sources'

export type QuizAnswerResult = {
  error?: string
  isCorrect?: boolean
  score?: number
  feedback?: string
  encouragement?: string
  nextFocus?: string
  setComplete?: boolean
  setSummary?: { avg: number; level: string; advice: string }
}

export async function submitQuizAnswerAction(
  courseId: string,
  lessonId: string,
  questionId: string,
  userAnswer: string,
): Promise<QuizAnswerResult> {
  const user = await getCurrentUser()
  if (!user) return { error: 'ログインが必要です' }

  const questions = await getQuizQuestions(lessonId, user.id)
  const question = questions.find((q) => q.id === questionId)
  if (!question) return { error: '問題が見つかりません' }

  const evaluation = await evaluateQuizAnswer(user.id, lessonId, question, userAnswer, questions)
  const correct = checkAnswer(question, userAnswer)

  await saveQuizAttempt(
    user.id,
    questionId,
    userAnswer,
    correct,
    evaluation.score,
    `${evaluation.feedback}\n\n${evaluation.encouragement}`,
  )

  const isLast = question.sort_order === questions.length
  let setComplete = false
  let setSummary: QuizAnswerResult['setSummary']

  if (isLast) {
    const attempts = await getQuizAttempts(user.id, lessonId)
    const scores = questions.map((q) => attempts.get(q.id)?.understanding_score ?? 0)
    setSummary = summarizeSetUnderstanding(scores)
    await completeQuizSet(user.id, lessonId, setSummary.avg)
    setComplete = true
  }

  revalidatePath(`/courses/${courseId}/lessons/${lessonId}`)
  revalidatePath(`/courses/${courseId}`)
  revalidatePath('/dashboard')
  revalidatePath('/tutor')

  return {
    isCorrect: correct,
    score: evaluation.score,
    feedback: evaluation.feedback,
    encouragement: evaluation.encouragement,
    nextFocus: evaluation.nextFocus,
    setComplete,
    setSummary,
  }
}

export async function regenerateQuizAction(courseId: string, lessonId: string) {
  const user = await getCurrentUser()
  if (!user) return { error: 'ログインが必要です' as const }

  const lesson = await getLessonById(courseId, lessonId)
  if (!lesson || lesson.lesson_type !== 'quiz') {
    return { error: 'クイズレッスンが見つかりません' as const }
  }

  const source = normalizeQuizSource(lesson.quiz_source)
  if (source === 'fixed') {
    return { error: 'このセットは再生成できません' as const }
  }

  const result = await ensureQuizQuestions(user.id, lesson, { force: true })
  revalidatePath(`/courses/${courseId}/lessons/${lessonId}`)

  if (result.error) return { error: result.error }
  return { ok: true as const, generated: result.generated }
}

export async function getQuizStateAction(courseId: string, lessonId: string) {
  const user = await getCurrentUser()
  if (!user) return { error: 'ログインが必要です' as const }

  const course = await getCourseById(courseId)
  const lesson = course?.lessons.find((l) => l.id === lessonId)
  if (!lesson) return { error: 'レッスンが見つかりません' as const }

  const questions = await getQuizQuestions(lessonId, user.id)
  const attempts = await getQuizAttempts(user.id, lessonId)

  let currentOrder = 1
  for (const q of questions) {
    if (!attempts.has(q.id)) {
      currentOrder = q.sort_order
      break
    }
    if (q.sort_order === questions.length) currentOrder = q.sort_order
  }

  const allDone = questions.every((q) => attempts.has(q.id))
  if (allDone) currentOrder = questions.length

  return {
    questions: questions.map((q) => ({
      id: q.id,
      sort_order: q.sort_order,
      question: q.question,
      choices: JSON.parse(q.choices || '[]') as string[],
      bridge_text: q.bridge_text,
      answered: attempts.has(q.id),
      attempt: attempts.get(q.id) ?? null,
    })),
    currentOrder,
    allDone,
    domain: lesson.domain,
    title: lesson.title,
    quizSource: lesson.quiz_source,
  }
}
