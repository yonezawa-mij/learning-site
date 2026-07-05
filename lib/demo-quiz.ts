import 'server-only'
import { sql } from './db'
import { parseJsonArray } from './quiz-utils'

export type DemoQuizQuestion = {
  id: string
  sort_order: number
  question: string
  correct_answer: string
  answer_variants: string
  choices: string[]
  explanation: string
  bridge_text: string
}

export type DemoQuiz = {
  lessonTitle: string
  courseId: string
  lessonId: string
  questions: DemoQuizQuestion[]
}

const DEMO_LIMIT = 5

export async function getHomeDemoQuiz(): Promise<DemoQuiz | null> {
  const lessons = (await sql`
    SELECT l.id AS lesson_id, l.title AS lesson_title, c.id AS course_id
    FROM course_lessons l
    JOIN courses c ON c.id = l.course_id
    WHERE l.lesson_type = 'quiz'
      AND COALESCE(l.quiz_source, 'fixed') = 'fixed'
    ORDER BY c.sort_order ASC, l.sort_order ASC
    LIMIT 1
  `) as { lesson_id: string; lesson_title: string; course_id: string }[]

  const lesson = lessons[0]
  if (!lesson) return null

  const rows = (await sql`
    SELECT id, sort_order, question, correct_answer, answer_variants, choices, explanation, bridge_text
    FROM quiz_questions
    WHERE lesson_id = ${lesson.lesson_id}
      AND user_id IS NULL
    ORDER BY sort_order ASC
    LIMIT ${DEMO_LIMIT}
  `) as {
    id: string
    sort_order: number
    question: string
    correct_answer: string
    answer_variants: string
    choices: string
    explanation: string
    bridge_text: string
  }[]

  if (rows.length === 0) return null

  return {
    lessonTitle: lesson.lesson_title,
    courseId: lesson.course_id,
    lessonId: lesson.lesson_id,
    questions: rows.map((row) => ({
      id: row.id,
      sort_order: row.sort_order,
      question: row.question,
      correct_answer: row.correct_answer,
      answer_variants: row.answer_variants,
      choices: parseJsonArray(row.choices),
      explanation: row.explanation,
      bridge_text: row.bridge_text,
    })),
  }
}
