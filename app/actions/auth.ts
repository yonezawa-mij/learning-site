'use server'

import { redirect } from 'next/navigation'
import { sql } from '@/lib/db'
import { hashPassword, verifyPassword, createSession, destroySession } from '@/lib/auth'

export type AuthState = { error?: string }

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function getNextPath(formData: FormData, fallback: string): string {
  const next = String(formData.get('next') ?? '').trim()
  if (next.startsWith('/') && !next.startsWith('//')) return next
  return fallback
}

export async function registerAction(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const name = String(formData.get('name') ?? '').trim()
  const email = String(formData.get('email') ?? '').trim().toLowerCase()
  const password = String(formData.get('password') ?? '')
  const next = getNextPath(formData, '/pricing')

  if (!name) return { error: 'お名前を入力してください' }
  if (!EMAIL_RE.test(email)) return { error: '正しいメールアドレスを入力してください' }
  if (password.length < 8) return { error: 'パスワードは8文字以上で入力してください' }

  const existing = await sql`SELECT id FROM users WHERE email = ${email}`
  if (existing.length > 0) return { error: 'このメールアドレスは既に登録されています' }

  const passwordHash = await hashPassword(password)
  const rows = (await sql`
    INSERT INTO users (name, email, password_hash)
    VALUES (${name}, ${email}, ${passwordHash})
    RETURNING id
  `) as { id: string }[]

  await createSession(rows[0].id)
  redirect(next)
}

export async function loginAction(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const email = String(formData.get('email') ?? '').trim().toLowerCase()
  const password = String(formData.get('password') ?? '')
  const next = getNextPath(formData, '/dashboard')

  if (!EMAIL_RE.test(email) || !password) {
    return { error: 'メールアドレスとパスワードを入力してください' }
  }

  const rows = (await sql`
    SELECT id, password_hash FROM users WHERE email = ${email}
  `) as { id: string; password_hash: string }[]

  const user = rows[0]
  if (!user || !(await verifyPassword(password, user.password_hash))) {
    return { error: 'メールアドレスまたはパスワードが正しくありません' }
  }

  await createSession(user.id)
  redirect(next)
}

export async function logoutAction(): Promise<void> {
  await destroySession()
  redirect('/')
}
