import 'server-only'
import { redirect } from 'next/navigation'
import { getCurrentUser, userIsPremium, type SessionUser } from './auth'

export async function requireUser(nextPath: string): Promise<SessionUser> {
  const user = await getCurrentUser()
  if (!user) {
    redirect(`/login?next=${encodeURIComponent(nextPath)}`)
  }
  return user
}

export async function requirePremium(nextPath: string): Promise<SessionUser> {
  const user = await requireUser(nextPath)
  if (!userIsPremium(user)) {
    redirect(`/pricing?next=${encodeURIComponent(nextPath)}`)
  }
  return user
}
