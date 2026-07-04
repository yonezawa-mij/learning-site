/**
 * learning-site 用 DB セットアップ
 */
import { config } from 'dotenv'
import { randomBytes } from 'crypto'
import { writeFileSync, readFileSync, existsSync } from 'fs'
import { resolve } from 'path'
import { execSync } from 'child_process'
import pg from 'pg'

const { Client } = pg
const ROOT = resolve(import.meta.dirname, '..')
const PARK_ENV = resolve(ROOT, '../park-ai-latest/.env.local')
const LEARN_ENV = resolve(ROOT, '.env.local')
const DB_NAME = 'learning_site'

config({ path: PARK_ENV })

const ownerUrl = process.env.DATABASE_OWNER_URL?.trim()
if (!ownerUrl) {
  console.error('park-ai-latest/.env.local に DATABASE_OWNER_URL がありません')
  process.exit(1)
}

function learningDbUrl(): string {
  const u = new URL(ownerUrl!)
  u.pathname = `/${DB_NAME}`
  return u.toString()
}

async function createDatabaseIfNeeded() {
  const client = new Client({ connectionString: ownerUrl })
  await client.connect()
  try {
    const res = await client.query('SELECT 1 FROM pg_database WHERE datname = $1', [DB_NAME])
    if (res.rowCount === 0) {
      await client.query(`CREATE DATABASE ${DB_NAME}`)
      console.log(`✓ database "${DB_NAME}" created`)
    } else {
      console.log(`✓ database "${DB_NAME}" already exists`)
    }
  } finally {
    await client.end()
  }
}

function parseEnvFile(path: string): Record<string, string> {
  if (!existsSync(path)) return {}
  const out: Record<string, string> = {}
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    const m = line.match(/^([A-Z_]+)="(.*)"/)
    if (m) out[m[1]] = m[2]
  }
  return out
}

function writeEnvLocal() {
  const existing = parseEnvFile(LEARN_ENV)
  const dbUrl = learningDbUrl()
  const authSecret = existing.AUTH_SECRET || randomBytes(32).toString('hex')

  const env: Record<string, string> = {
    DATABASE_URL: dbUrl,
    DATABASE_OWNER_URL: dbUrl,
    AUTH_SECRET: authSecret,
    NEXT_PUBLIC_SITE_URL: existing.NEXT_PUBLIC_SITE_URL || 'https://learning-site-nu.vercel.app',
    STRIPE_SECRET_KEY: existing.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY || '',
    STRIPE_PRICE_ID: existing.STRIPE_PRICE_ID || process.env.STRIPE_PRICE_ID || '',
    STRIPE_WEBHOOK_SECRET: existing.STRIPE_WEBHOOK_SECRET || process.env.STRIPE_WEBHOOK_SECRET || '',
  }

  writeFileSync(
    LEARN_ENV,
    Object.entries(env)
      .map(([k, v]) => `${k}="${v}"`)
      .join('\n') + '\n',
  )
  console.log('✓ .env.local written')
}

async function main() {
  await createDatabaseIfNeeded()
  writeEnvLocal()
  const env = { ...process.env, ...parseEnvFile(LEARN_ENV) }
  execSync('npm run db:migrate', { cwd: ROOT, stdio: 'inherit', env })
  execSync('npm run db:seed', { cwd: ROOT, stdio: 'inherit', env })
  console.log('DB setup complete.')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
