import 'server-only'
import { sql } from './db'
import type { GeneratedQuestion } from './quiz-generator'
import { generateDifyQuizQuestions } from './quiz-generator-dify'
import { parseQuizConfig, normalizeQuizSource, type QuizSource } from './quiz-sources'
import { getWeakDomains } from './quiz-analytics'

export type QuizLessonContext = {
  id: string
  title: string
  domain: string | null
  content: string
  quiz_source: string
  quiz_config: string
}

export async function deleteUserQuizQuestions(userId: string, lessonId: string): Promise<void> {
  await sql`
    DELETE FROM quiz_questions
    WHERE lesson_id = ${lessonId} AND user_id = ${userId}
  `
}

export async function saveGeneratedQuestions(
  userId: string,
  lessonId: string,
  source: QuizSource,
  questions: GeneratedQuestion[],
): Promise<void> {
  for (let i = 0; i < questions.length; i++) {
    const q = questions[i]
    await sql`
      INSERT INTO quiz_questions (
        lesson_id, user_id, sort_order, question, correct_answer,
        answer_variants, choices, explanation, bridge_text,
        source, generated_at
      )
      VALUES (
        ${lessonId}, ${userId}, ${i + 1}, ${q.question}, ${q.correct_answer},
        ${JSON.stringify(q.answer_variants)}, ${JSON.stringify(q.choices)},
        ${q.explanation}, ${q.bridge_text},
        ${source}, now()
      )
    `
  }
}

async function countUserQuestions(userId: string, lessonId: string): Promise<number> {
  const rows = (await sql`
    SELECT COUNT(*)::int AS c FROM quiz_questions
    WHERE lesson_id = ${lessonId} AND user_id = ${userId}
  `) as { c: number }[]
  return rows[0]?.c ?? 0
}

/** Dify 1問あたり十数秒かかるため、1リクエスト内の生成数に上限を設ける */
const DIFY_GENERATION_CAP = 4

export async function ensureQuizQuestions(
  userId: string,
  lesson: QuizLessonContext,
  options?: { force?: boolean; autoGenerate?: boolean },
): Promise<{ source: QuizSource; generated: boolean; error?: string }> {
  const source = normalizeQuizSource(lesson.quiz_source)
  const config = parseQuizConfig(lesson.quiz_config)
  const count = Math.min(config.question_count ?? 8, DIFY_GENERATION_CAP)

  if (source === 'fixed') {
    return { source, generated: false }
  }

  const existing = await countUserQuestions(userId, lesson.id)
  const force = options?.force ?? false
  const autoGenerate = options?.autoGenerate ?? false

  if (existing > 0 && !force) {
    return { source, generated: false }
  }

  if (existing === 0 && !force && !autoGenerate) {
    return { source, generated: false }
  }

  const weakDomains =
    config.weakness_focus !== false
      ? (await getWeakDomains(userId)).map((d) => d.domain)
      : []

  const questions = await generateDifyQuizQuestions({
    userId,
    domain: lesson.domain,
    topic: config.topic ?? lesson.title,
    count,
    difficulty: config.difficulty ?? '初級',
    weakDomains,
  })

  if (questions.error || questions.questions.length === 0) {
    return {
      source,
      generated: false,
      error: questions.error ?? '問題を生成できませんでした。',
    }
  }

  await deleteUserQuizQuestions(userId, lesson.id)
  await saveGeneratedQuestions(userId, lesson.id, 'dify', questions.questions)
  return { source, generated: true }
}
