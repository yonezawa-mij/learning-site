import { config } from 'dotenv'
import { neon } from '@neondatabase/serverless'

config({ path: '.env.local' })

const ENGLISH_TITLES = ['英会話クイズ', 'English Conversation Quiz']

async function main() {
  const url = process.env.DATABASE_OWNER_URL?.trim() || process.env.DATABASE_URL?.trim()
  if (!url) throw new Error('DATABASE_URL is not set')
  const sql = neon(url)

  const rows = (await sql`
    SELECT id, title FROM courses
    WHERE title NOT IN (${ENGLISH_TITLES[0]}, ${ENGLISH_TITLES[1]})
  `) as { id: string; title: string }[]

  for (const c of rows) {
    await sql`DELETE FROM courses WHERE id = ${c.id}`
    console.log(`✓ removed: ${c.title}`)
  }

  if (rows.length === 0) {
    console.log('✓ no non-English courses')
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
