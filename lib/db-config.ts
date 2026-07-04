import 'server-only'

export function getDatabaseUrl(): string {
  const raw = process.env.DATABASE_URL?.trim()
  if (!raw) {
    throw new Error('DATABASE_URL is not set. Add it to .env.local and Vercel environment variables.')
  }
  const parsed = new URL(raw)
  if (!parsed.password) throw new Error('DATABASE_URL must include a password.')
  if (parsed.searchParams.get('sslmode') !== 'require') {
    throw new Error('DATABASE_URL must include sslmode=require')
  }
  return raw
}

export function getOwnerDatabaseUrl(): string {
  return process.env.DATABASE_OWNER_URL?.trim() || getDatabaseUrl()
}
