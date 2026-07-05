'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { AuthNav } from './AuthNav'
import { SITE_NAME } from '@/lib/site-config'

type SessionUser = {
  name: string
  isPremium: boolean
}

export function Navbar() {
  const [user, setUser] = useState<SessionUser | null>(null)

  useEffect(() => {
    fetch('/api/auth/session')
      .then((r) => r.json())
      .then((data) => setUser(data.user ?? null))
      .catch(() => setUser(null))
  }, [])

  const loggedIn = Boolean(user)

  return (
    <header className="border-b border-border bg-white/95 backdrop-blur-md sticky top-0 z-50">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link href={loggedIn ? '/dashboard' : '/'} className="text-lg font-semibold tracking-tight text-foreground">
          {SITE_NAME}
        </Link>
        <nav className="hidden md:flex items-center gap-6 text-sm text-muted">
          {loggedIn ? (
            <>
              <Link href="/dashboard" className="hover:text-foreground transition-colors">
                マイページ
              </Link>
              {user?.isPremium ? (
                <Link href="/courses" className="hover:text-foreground transition-colors">
                  コース
                </Link>
              ) : (
                <Link href="/pricing" className="hover:text-foreground transition-colors">
                  プラン加入
                </Link>
              )}
            </>
          ) : (
            <>
              <Link href="/#ai-learning" className="hover:text-foreground transition-colors">
                AI学習
              </Link>
              <Link href="/#features" className="hover:text-foreground transition-colors">
                特徴
              </Link>
              <Link href="/pricing" className="hover:text-foreground transition-colors">
                料金
              </Link>
            </>
          )}
        </nav>
        <AuthNav />
      </div>
    </header>
  )
}
