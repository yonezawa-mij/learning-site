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

function initials(name: string) {
  return name.trim().slice(0, 1).toUpperCase() || '?'
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
    return <div className="h-9 w-28 animate-pulse rounded-full bg-stone-100" />
  }

  if (!user) {
    return (
      <div className="flex items-center gap-2 sm:gap-3">
        <Link href="/login" className="text-sm text-muted hover:text-foreground transition-colors px-2 py-1">
          ログイン
        </Link>
        <Link href="/register" className="btn-primary !py-2 !px-4 text-sm">
          会員登録
        </Link>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2 sm:gap-3">
      <Link
        href="/dashboard"
        className="hidden sm:flex items-center gap-2 rounded-full border border-border bg-white pl-1.5 pr-3 py-1 hover:border-emerald-200 transition-colors"
      >
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-accent text-xs font-semibold text-white">
          {initials(user.name)}
        </span>
        <span className="text-sm font-medium max-w-[8rem] truncate">{user.name}</span>
      </Link>
      {user.isPremium ? (
        <Link href="/courses" className="sm:hidden text-sm font-medium text-accent">
          コース
        </Link>
      ) : (
        <Link href="/pricing" className="text-sm font-medium text-accent hover:text-emerald-700">
          加入
        </Link>
      )}
      <form action={logoutAction}>
        <button
          type="submit"
          className="text-sm text-muted hover:text-foreground transition-colors px-2 py-1"
        >
          ログアウト
        </button>
      </form>
    </div>
  )
}
