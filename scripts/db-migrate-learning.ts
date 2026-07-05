import { config } from 'dotenv'
import { neon } from '@neondatabase/serverless'

config({ path: '.env.local' })

async function main() {
  const url = process.env.DATABASE_OWNER_URL?.trim() || process.env.DATABASE_URL?.trim()
  if (!url) throw new Error('DATABASE_URL is not set in .env.local')
  const sql = neon(url)

  await sql`
    CREATE TABLE IF NOT EXISTS tutor_messages (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
      content TEXT NOT NULL,
      context_lesson_id UUID REFERENCES course_lessons(id) ON DELETE SET NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `
  console.log('✓ tutor_messages')

  await sql`
    CREATE INDEX IF NOT EXISTS idx_tutor_messages_user_created
    ON tutor_messages (user_id, created_at DESC)
  `
  console.log('✓ tutor_messages index')

  await sql`
    CREATE TABLE IF NOT EXISTS learning_plans (
      user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      plan_json TEXT NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `
  console.log('✓ learning_plans')
  console.log('Migration complete.')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
