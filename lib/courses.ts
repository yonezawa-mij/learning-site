import 'server-only'
import { sql } from './db'

export type Course = {
  id: string
  title: string
  description: string
  icon: string | null
  level: string | null
  duration_minutes: number | null
  created_at: string
  lesson_count: number
}

export type CourseLesson = {
  id: string
  course_id: string
  title: string
  content: string
  sort_order: number
  duration_minutes: number | null
  lesson_type: string
  domain: string | null
  quiz_source: string
  quiz_config: string
}

export type CourseDetail = Course & { lessons: CourseLesson[] }

export type UserProgress = {
  completed_lessons: number
  total_lessons: number
  course_id: string
  course_title: string
  icon: string | null
}

export async function getCourses(): Promise<Course[]> {
  return (await sql`
    SELECT c.id, c.title, c.description, c.icon, c.level, c.duration_minutes, c.created_at,
      COUNT(l.id)::int AS lesson_count
    FROM courses c
    LEFT JOIN course_lessons l ON l.course_id = c.id
    WHERE c.status = 'published'
    GROUP BY c.id
    ORDER BY c.sort_order ASC, c.created_at ASC
  `) as Course[]
}

export async function getCourseById(id: string): Promise<CourseDetail | null> {
  const courses = (await sql`
    SELECT id, title, description, icon, level, duration_minutes, created_at, 0::int AS lesson_count
    FROM courses WHERE id = ${id} AND status = 'published'
  `) as Course[]
  if (!courses[0]) return null
  const lessons = (await sql`
    SELECT id, course_id, title, content, sort_order, duration_minutes, lesson_type, domain, quiz_source, quiz_config
    FROM course_lessons WHERE course_id = ${id}
    ORDER BY sort_order ASC, created_at ASC
  `) as CourseLesson[]
  return { ...courses[0], lesson_count: lessons.length, lessons }
}

export async function getLessonById(courseId: string, lessonId: string): Promise<CourseLesson | null> {
  const rows = (await sql`
    SELECT id, course_id, title, content, sort_order, duration_minutes, lesson_type, domain, quiz_source, quiz_config
    FROM course_lessons
    WHERE id = ${lessonId} AND course_id = ${courseId}
  `) as CourseLesson[]
  return rows[0] ?? null
}

export async function getLessonProgress(userId: string, courseId: string): Promise<Set<string>> {
  const rows = (await sql`
    SELECT lp.lesson_id FROM lesson_progress lp
    JOIN course_lessons l ON l.id = lp.lesson_id
    WHERE lp.user_id = ${userId} AND l.course_id = ${courseId}
  `) as { lesson_id: string }[]
  return new Set(rows.map((r) => r.lesson_id))
}

export async function markLessonComplete(userId: string, lessonId: string): Promise<void> {
  await sql`
    INSERT INTO lesson_progress (user_id, lesson_id)
    VALUES (${userId}, ${lessonId})
    ON CONFLICT DO NOTHING
  `
}

export async function getUserProgressSummary(userId: string): Promise<UserProgress[]> {
  return (await sql`
    SELECT
      c.id AS course_id,
      c.title AS course_title,
      c.icon,
      COUNT(l.id)::int AS total_lessons,
      COUNT(lp.lesson_id)::int AS completed_lessons
    FROM courses c
    JOIN course_lessons l ON l.course_id = c.id
    LEFT JOIN lesson_progress lp ON lp.lesson_id = l.id AND lp.user_id = ${userId}
    WHERE c.status = 'published'
    GROUP BY c.id
    ORDER BY c.sort_order ASC
  `) as UserProgress[]
}

export async function getTotalCompletedLessons(userId: string): Promise<number> {
  const rows = (await sql`
    SELECT COUNT(*)::int AS c FROM lesson_progress WHERE user_id = ${userId}
  `) as { c: number }[]
  return rows[0]?.c ?? 0
}
