import 'server-only'
import bcrypt from 'bcryptjs'
import { sql } from './db'
import type { SessionUser } from './auth'

const DEV_EMAIL = 'dev@learning.local'
const DEV_NAME = '開発ユーザー'

/** ローカルはデフォルト ON。本番は DEV_AUTO_LOGIN=true のときのみ有効。 */
export function isDevAutoLogin(): boolean {
  if (process.env.DEV_AUTO_LOGIN === 'false') return false
  if (process.env.NODE_ENV === 'production') {
    return process.env.DEV_AUTO_LOGIN === 'true'
  }
  return true
}

export async function getOrCreateDevUser(): Promise<SessionUser> {
  const existing = (await sql`
    SELECT id, name, email, stripe_customer_id, subscription_status, current_period_end
    FROM users WHERE email = ${DEV_EMAIL}
  `) as SessionUser[]

  if (existing[0]) {
    if (existing[0].subscription_status !== 'active') {
      await sql`UPDATE users SET subscription_status = 'active' WHERE id = ${existing[0].id}`
      return { ...existing[0], subscription_status: 'active' }
    }
    return existing[0]
  }

  const passwordHash = await bcrypt.hash('dev-local-only', 10)
  const rows = (await sql`
    INSERT INTO users (name, email, password_hash, subscription_status)
    VALUES (${DEV_NAME}, ${DEV_EMAIL}, ${passwordHash}, 'active')
    RETURNING id, name, email, stripe_customer_id, subscription_status, current_period_end
  `) as SessionUser[]

  return rows[0]
}
