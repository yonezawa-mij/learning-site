'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

type SessionUser = {
  name: string
  isPremium: boolean
}

const links = (premium: boolean) => [
  { href: '/dashboard', label: 'マイページ' },
  ...(premium
    ? [
        { href: '/courses', label: 'コース' },
        { href: '/tutor', label: 'チューター' },
      ]
    : [{ href: '/pricing', label: 'プラン加入' }]),
]

export function MemberSubNav() {
  const pathname = usePathname()
  const [user, setUser] = useState<SessionUser | null>(null)

  useEffect(() => {
    fetch('/api/auth/session')
      .then((r) => r.json())
      .then((data) => setUser(data.user))
      .catch(() => setUser(null))
  }, [])

  if (!user) return null

  const items = links(user.isPremium)

  return (
    <div className="border-b border-border bg-white">
      <div className="mx-auto flex max-w-6xl items-center gap-1 px-6 py-2 overflow-x-auto">
        {items.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`shrink-0 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                active
                  ? 'bg-accent-soft text-emerald-800'
                  : 'text-muted hover:bg-stone-50 hover:text-foreground'
              }`}
            >
              {item.label}
            </Link>
          )
        })}
      </div>
    </div>
  )
}
