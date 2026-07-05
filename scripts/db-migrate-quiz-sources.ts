import { config } from 'dotenv'
import { neon } from '@neondatabase/serverless'

config({ path: '.env.local' })

async function main() {
  const url = process.env.DATABASE_OWNER_URL?.trim() || process.env.DATABASE_URL?.trim()
  if (!url) throw new Error('DATABASE_URL is not set in .env.local')
  const sql = neon(url)

  await sql`ALTER TABLE course_lessons ADD COLUMN IF NOT EXISTS quiz_source TEXT NOT NULL DEFAULT 'fixed'`
  await sql`ALTER TABLE course_lessons ADD COLUMN IF NOT EXISTS quiz_config TEXT NOT NULL DEFAULT '{}'`
  console.log('✓ course_lessons.quiz_source / quiz_config')

  await sql`ALTER TABLE quiz_questions ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id) ON DELETE CASCADE`
  await sql`ALTER TABLE quiz_questions ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'fixed'`
  await sql`ALTER TABLE quiz_questions ADD COLUMN IF NOT EXISTS source_url TEXT`
  await sql`ALTER TABLE quiz_questions ADD COLUMN IF NOT EXISTS generated_at TIMESTAMPTZ`
  console.log('✓ quiz_questions source columns')

  await sql`
    CREATE INDEX IF NOT EXISTS idx_quiz_questions_lesson_user
    ON quiz_questions (lesson_id, user_id)
  `
  console.log('Migration complete.')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
