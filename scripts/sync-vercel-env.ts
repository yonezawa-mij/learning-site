/**
 * .env.local の値を Vercel production に同期
 */
import { readFileSync, writeFileSync, existsSync, unlinkSync } from 'fs'
import { resolve } from 'path'
import { execSync } from 'child_process'
import { tmpdir } from 'os'
import { join } from 'path'

const ROOT = resolve(import.meta.dirname, '..')
const LEARN_ENV = resolve(ROOT, '.env.local')
const KEYS = [
  'DATABASE_URL',
  'AUTH_SECRET',
  'NEXT_PUBLIC_SITE_URL',
  'STRIPE_SECRET_KEY',
  'STRIPE_PRICE_ID',
  'STRIPE_WEBHOOK_SECRET',
]

function parseEnv(path: string): Record<string, string> {
  const out: Record<string, string> = {}
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    const m = line.match(/^([A-Z_]+)="(.*)"/)
    if (m) out[m[1]] = m[2]
  }
  return out
}

function setVercelEnv(key: string, value: string) {
  if (!value) {
    console.warn(`skip ${key} (empty)`)
    return
  }
  try {
    execSync(`npx vercel env rm ${key} production -y`, { cwd: ROOT, stdio: 'pipe' })
  } catch {
    // not exists
  }
  const tmp = join(tmpdir(), `vercel-env-${key}`)
  writeFileSync(tmp, value, 'utf8')
  execSync(`npx vercel env add ${key} production < "${tmp}"`, { cwd: ROOT, stdio: 'inherit', shell: '/bin/bash' })
  unlinkSync(tmp)
  console.log(`✓ vercel env: ${key}`)
}

function main() {
  if (!existsSync(LEARN_ENV)) {
    console.error('.env.local がありません。先に npm run setup:db を実行してください')
    process.exit(1)
  }
  const env = parseEnv(LEARN_ENV)
  for (const key of KEYS) {
    setVercelEnv(key, env[key] ?? '')
  }
  console.log('Vercel env sync complete.')
}

main()
