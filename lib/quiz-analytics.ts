import 'server-only'
import { sql } from './db'

export type DomainStat = {
  domain: string
  course_id: string
  course_title: string
  total_attempts: number
  correct_count: number
  avg_score: number
  correct_rate: number
  status: 'strong' | 'average' | 'weak' | 'not_started'
}

export type RecentActivity = {
  answered_at: string
  question: string
  is_correct: boolean
  understanding_score: number
  domain: string | null
  lesson_title: string
}

export type LearningStats = {
  total_attempts: number
  correct_count: number
  overall_accuracy: number
  avg_understanding: number
  completed_quiz_sets: number
  total_quiz_sets: number
  domains_studied: number
}

export type PendingLesson = {
  lesson_id: string
  lesson_title: string
  course_id: string
  course_title: string
  domain: string | null
  sort_order: number
  question_count: number
}

function domainStatus(avgScore: number, correctRate: number, attempts: number): DomainStat['status'] {
  if (attempts === 0) return 'not_started'
  if (avgScore >= 80 && correctRate >= 0.75) return 'strong'
  if (avgScore >= 55 && correctRate >= 0.45) return 'average'
  return 'weak'
}

export async function getDomainStats(userId: string): Promise<DomainStat[]> {
  const rows = (await sql`
    SELECT
      COALESCE(l.domain, 'その他') AS domain,
      l.course_id,
      c.title AS course_title,
      COUNT(*)::int AS total_attempts,
      COUNT(*) FILTER (WHERE qa.is_correct)::int AS correct_count,
      ROUND(AVG(qa.understanding_score))::int AS avg_score
    FROM quiz_attempts qa
    JOIN quiz_questions qq ON qq.id = qa.question_id
    JOIN course_lessons l ON l.id = qq.lesson_id
    JOIN courses c ON c.id = l.course_id
    WHERE qa.user_id = ${userId}
    GROUP BY l.domain, l.course_id, c.title
    ORDER BY avg_score ASC, total_attempts DESC
  `) as {
    domain: string
    course_id: string
    course_title: string
    total_attempts: number
    correct_count: number
    avg_score: number
  }[]

  return rows.map((r) => {
    const correct_rate = r.total_attempts > 0 ? r.correct_count / r.total_attempts : 0
    return {
      ...r,
      correct_rate,
      status: domainStatus(r.avg_score, correct_rate, r.total_attempts),
    }
  })
}

export async function getWeakDomains(userId: string): Promise<DomainStat[]> {
  const stats = await getDomainStats(userId)
  return stats.filter((s) => s.status === 'weak')
}

export async function getRecentActivity(userId: string, limit = 8): Promise<RecentActivity[]> {
  return (await sql`
    SELECT
      qa.answered_at,
      qq.question,
      qa.is_correct,
      qa.understanding_score,
      l.domain,
      l.title AS lesson_title
    FROM quiz_attempts qa
    JOIN quiz_questions qq ON qq.id = qa.question_id
    JOIN course_lessons l ON l.id = qq.lesson_id
    WHERE qa.user_id = ${userId}
    ORDER BY qa.answered_at DESC
    LIMIT ${limit}
  `) as RecentActivity[]
}

export async function getLearningStats(userId: string): Promise<LearningStats> {
  const attemptRows = (await sql`
    SELECT
      COUNT(*)::int AS total_attempts,
      COUNT(*) FILTER (WHERE is_correct)::int AS correct_count,
      ROUND(AVG(understanding_score))::int AS avg_understanding
    FROM quiz_attempts
    WHERE user_id = ${userId}
  `) as { total_attempts: number; correct_count: number; avg_understanding: number | null }[]

  const setRows = (await sql`
    SELECT
      COUNT(*)::int AS completed
    FROM quiz_set_scores
    WHERE user_id = ${userId}
  `) as { completed: number }[]

  const totalSetRows = (await sql`
    SELECT COUNT(*)::int AS total
    FROM course_lessons
    WHERE lesson_type = 'quiz'
  `) as { total: number }[]

  const domainRows = (await sql`
    SELECT COUNT(DISTINCT l.domain)::int AS c
    FROM quiz_attempts qa
    JOIN quiz_questions qq ON qq.id = qa.question_id
    JOIN course_lessons l ON l.id = qq.lesson_id
    WHERE qa.user_id = ${userId} AND l.domain IS NOT NULL
  `) as { c: number }[]

  const total = attemptRows[0]?.total_attempts ?? 0
  const correct = attemptRows[0]?.correct_count ?? 0

  return {
    total_attempts: total,
    correct_count: correct,
    overall_accuracy: total > 0 ? Math.round((correct / total) * 100) : 0,
    avg_understanding: attemptRows[0]?.avg_understanding ?? 0,
    completed_quiz_sets: setRows[0]?.completed ?? 0,
    total_quiz_sets: totalSetRows[0]?.total ?? 0,
    domains_studied: domainRows[0]?.c ?? 0,
  }
}

export async function getPendingQuizLessons(userId: string): Promise<PendingLesson[]> {
  return (await sql`
    SELECT
      l.id AS lesson_id,
      l.title AS lesson_title,
      l.course_id,
      c.title AS course_title,
      l.domain,
      l.sort_order,
      COUNT(q.id)::int AS question_count
    FROM course_lessons l
    JOIN courses c ON c.id = l.course_id
    LEFT JOIN quiz_questions q ON q.lesson_id = l.id
    WHERE l.lesson_type = 'quiz'
      AND c.status = 'published'
      AND NOT EXISTS (
        SELECT 1 FROM quiz_set_scores qss
        WHERE qss.user_id = ${userId} AND qss.lesson_id = l.id
      )
    GROUP BY l.id, c.title, c.sort_order
    ORDER BY c.sort_order ASC, l.sort_order ASC
  `) as PendingLesson[]
}

export async function getMissedQuestions(userId: string, limit = 5) {
  return (await sql`
    SELECT
      qq.question,
      qq.correct_answer,
      qq.explanation,
      l.title AS lesson_title,
      l.domain,
      l.course_id,
      l.id AS lesson_id,
      qa.understanding_score
    FROM quiz_attempts qa
    JOIN quiz_questions qq ON qq.id = qa.question_id
    JOIN course_lessons l ON l.id = qq.lesson_id
    WHERE qa.user_id = ${userId}
      AND (qa.is_correct = false OR qa.understanding_score < 60)
    ORDER BY qa.answered_at DESC
    LIMIT ${limit}
  `) as {
    question: string
    correct_answer: string
    explanation: string
    lesson_title: string
    domain: string | null
    course_id: string
    lesson_id: string
    understanding_score: number
  }[]
}
