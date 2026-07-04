import { NextResponse } from 'next/server'
import { getCurrentUser, userIsPremium } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET() {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ user: null })

  return NextResponse.json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      subscription_status: user.subscription_status,
      isPremium: userIsPremium(user),
    },
  })
}
