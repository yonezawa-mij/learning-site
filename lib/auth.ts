import 'server-only'
import bcrypt from 'bcryptjs'
import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import { sql } from './db'
import { ACTIVE_STATUSES } from './stripe'

const COOKIE_NAME = 'learn_session'
const MAX_AGE = 60 * 60 * 24 * 7

function getSecret() {
  const secret = process.env.AUTH_SECRET
  if (!secret) {
    throw new Error('AUTH_SECRET is not set.')
  }
  return new TextEncoder().encode(secret)
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

export async function createSession(userId: string): Promise<void> {
  const token = await new SignJWT({ sub: userId })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(getSecret())

  const cookieStore = await cookies()
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: MAX_AGE,
  })
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(COOKIE_NAME)
}

async function getSessionUserId(): Promise<string | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(COOKIE_NAME)?.value
  if (!token) return null
  try {
    const { payload } = await jwtVerify(token, getSecret())
    return typeof payload.sub === 'string' ? payload.sub : null
  } catch {
    return null
  }
}

export type SessionUser = {
  id: string
  name: string
  email: string
  stripe_customer_id: string | null
  subscription_status: string | null
  current_period_end: string | null
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  const userId = await getSessionUserId()
  if (!userId) return null
  const rows = (await sql`
    SELECT id, name, email, stripe_customer_id, subscription_status, current_period_end
    FROM users WHERE id = ${userId}
  `) as SessionUser[]
  return rows[0] ?? null
}

export function userIsPremium(user: Pick<SessionUser, 'subscription_status'> | null): boolean {
  if (!user?.subscription_status) return false
  return ACTIVE_STATUSES.includes(user.subscription_status)
}

export async function isPremium(): Promise<boolean> {
  const user = await getCurrentUser()
  return userIsPremium(user)
}
