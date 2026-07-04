'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { logoutAction } from '@/app/actions/auth'

type SessionUser = {
  id: string
  name: string
  email: string
  isPremium: boolean
}

export function AuthNav() {
  const [user, setUser] = useState<SessionUser | null | undefined>(undefined)

  useEffect(() => {
    fetch('/api/auth/session')
      .then((r) => r.json())
      .then((data) => setUser(data.user))
      .catch(() => setUser(null))
  }, [])

  if (user === undefined) {
    return <div className="h-9 w-24 animate-pulse rounded-full bg-stone-100" />
  }

  if (!user) {
    return (
      <div className="flex items-center gap-3">
        <Link href="/login" className="text-sm text-muted hover:text-foreground transition-colors">
          ログイン
        </Link>
        <Link
          href="/register"
          className="rounded-full bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 transition-colors"
        >
          会員登録
        </Link>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-3">
      {user.isPremium ? (
        <Link href="/courses" className="text-sm text-muted hover:text-foreground transition-colors">
          コース
        </Link>
      ) : (
        <Link href="/pricing" className="text-sm font-medium text-accent hover:text-emerald-700 transition-colors">
          プラン加入
        </Link>
      )}
      <Link href="/dashboard" className="text-sm text-muted hover:text-foreground transition-colors">
        マイページ
      </Link>
      <form action={logoutAction}>
        <button type="submit" className="text-sm text-muted hover:text-foreground transition-colors">
          ログアウト
        </button>
      </form>
    </div>
  )
}
