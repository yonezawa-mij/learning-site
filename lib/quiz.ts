import 'server-only'
import { sql } from './db'
import { checkAnswer, parseJsonArray, normalizeAnswer } from './quiz-utils'

export { parseJsonArray, normalizeAnswer, checkAnswer }

export type QuizQuestion = {
  id: string
  lesson_id: string
  sort_order: number
  question: string
  correct_answer: string
  answer_variants: string
  choices: string
  explanation: string
  bridge_text: string
  source?: string
  source_url?: string | null
  generated_at?: string | null
}

export type QuizAttempt = {
  question_id: string
  user_answer: string
  is_correct: boolean
  understanding_score: number
  ai_feedback: string
}

export type QuizLessonMeta = {
  id: string
  title: string
  domain: string | null
  lesson_type: string
  sort_order: number
  question_count: number
}

export async function getQuizQuestions(lessonId: string, userId?: string): Promise<QuizQuestion[]> {
  if (userId) {
    return (await sql`
      SELECT id, lesson_id, sort_order, question, correct_answer, answer_variants, choices, explanation, bridge_text,
        source, source_url, generated_at
      FROM quiz_questions
      WHERE lesson_id = ${lessonId}
        AND (user_id IS NULL OR user_id = ${userId})
      ORDER BY user_id NULLS FIRST, sort_order ASC
    `) as QuizQuestion[]
  }
  return (await sql`
    SELECT id, lesson_id, sort_order, question, correct_answer, answer_variants, choices, explanation, bridge_text,
      source, source_url, generated_at
    FROM quiz_questions WHERE lesson_id = ${lessonId} AND user_id IS NULL
    ORDER BY sort_order ASC
  `) as QuizQuestion[]
}

export async function getQuizQuestionByOrder(lessonId: string, order: number): Promise<QuizQuestion | null> {
  const rows = (await sql`
    SELECT id, lesson_id, sort_order, question, correct_answer, answer_variants, choices, explanation, bridge_text
    FROM quiz_questions WHERE lesson_id = ${lessonId} AND sort_order = ${order}
  `) as QuizQuestion[]
  return rows[0] ?? null
}

export async function getQuizAttempts(userId: string, lessonId: string): Promise<Map<string, QuizAttempt>> {
  const rows = (await sql`
    SELECT qa.question_id, qa.user_answer, qa.is_correct, qa.understanding_score, qa.ai_feedback
    FROM quiz_attempts qa
    JOIN quiz_questions qq ON qq.id = qa.question_id
    WHERE qa.user_id = ${userId} AND qq.lesson_id = ${lessonId}
  `) as QuizAttempt[]
  return new Map(rows.map((r) => [r.question_id, r]))
}

export async function saveQuizAttempt(
  userId: string,
  questionId: string,
  userAnswer: string,
  isCorrect: boolean,
  score: number,
  feedback: string,
): Promise<void> {
  await sql`
    INSERT INTO quiz_attempts (user_id, question_id, user_answer, is_correct, understanding_score, ai_feedback)
    VALUES (${userId}, ${questionId}, ${userAnswer}, ${isCorrect}, ${score}, ${feedback})
    ON CONFLICT (user_id, question_id) DO UPDATE SET
      user_answer = EXCLUDED.user_answer,
      is_correct = EXCLUDED.is_correct,
      understanding_score = EXCLUDED.understanding_score,
      ai_feedback = EXCLUDED.ai_feedback,
      answered_at = now()
  `
}

export async function getQuizLessonAverage(userId: string, lessonId: string): Promise<number | null> {
  const rows = (await sql`
    SELECT avg_score FROM quiz_set_scores WHERE user_id = ${userId} AND lesson_id = ${lessonId}
  `) as { avg_score: number }[]
  return rows[0]?.avg_score ?? null
}

export async function completeQuizSet(userId: string, lessonId: string, avgScore: number): Promise<void> {
  await sql`
    INSERT INTO quiz_set_scores (user_id, lesson_id, avg_score)
    VALUES (${userId}, ${lessonId}, ${avgScore})
    ON CONFLICT (user_id, lesson_id) DO UPDATE SET avg_score = EXCLUDED.avg_score, completed_at = now()
  `
  await sql`
    INSERT INTO lesson_progress (user_id, lesson_id)
    VALUES (${userId}, ${lessonId})
    ON CONFLICT DO NOTHING
  `
}

export async function getQuizLessonsForCourse(courseId: string): Promise<QuizLessonMeta[]> {
  return (await sql`
    SELECT l.id, l.title, l.domain, l.lesson_type, l.sort_order,
      COUNT(q.id)::int AS question_count
    FROM course_lessons l
    LEFT JOIN quiz_questions q ON q.lesson_id = l.id
    WHERE l.course_id = ${courseId}
    GROUP BY l.id
    ORDER BY l.sort_order ASC
  `) as QuizLessonMeta[]
}
