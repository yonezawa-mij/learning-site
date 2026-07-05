import { config } from 'dotenv'
import { neon } from '@neondatabase/serverless'

config({ path: '.env.local' })

async function main() {
  const url = process.env.DATABASE_OWNER_URL?.trim() || process.env.DATABASE_URL?.trim()
  if (!url) throw new Error('DATABASE_URL is not set in .env.local')
  const sql = neon(url)

  await sql`ALTER TABLE course_lessons ADD COLUMN IF NOT EXISTS lesson_type TEXT NOT NULL DEFAULT 'reading'`
  await sql`ALTER TABLE course_lessons ADD COLUMN IF NOT EXISTS domain TEXT`
  console.log('✓ course_lessons extended')

  await sql`
    CREATE TABLE IF NOT EXISTS quiz_questions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      lesson_id UUID NOT NULL REFERENCES course_lessons(id) ON DELETE CASCADE,
      sort_order INTEGER NOT NULL DEFAULT 1,
      question TEXT NOT NULL,
      correct_answer TEXT NOT NULL,
      answer_variants TEXT NOT NULL DEFAULT '[]',
      choices TEXT NOT NULL DEFAULT '[]',
      explanation TEXT NOT NULL DEFAULT '',
      bridge_text TEXT NOT NULL DEFAULT '',
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      UNIQUE(lesson_id, sort_order)
    )
  `
  console.log('✓ quiz_questions')

  await sql`
    CREATE TABLE IF NOT EXISTS quiz_attempts (
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      question_id UUID NOT NULL REFERENCES quiz_questions(id) ON DELETE CASCADE,
      user_answer TEXT NOT NULL DEFAULT '',
      is_correct BOOLEAN NOT NULL DEFAULT false,
      understanding_score INTEGER NOT NULL DEFAULT 0,
      ai_feedback TEXT NOT NULL DEFAULT '',
      answered_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      PRIMARY KEY (user_id, question_id)
    )
  `
  console.log('✓ quiz_attempts')

  await sql`
    CREATE TABLE IF NOT EXISTS quiz_set_scores (
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      lesson_id UUID NOT NULL REFERENCES course_lessons(id) ON DELETE CASCADE,
      avg_score INTEGER NOT NULL DEFAULT 0,
      completed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      PRIMARY KEY (user_id, lesson_id)
    )
  `
  console.log('✓ quiz_set_scores')
  console.log('Migration complete.')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
