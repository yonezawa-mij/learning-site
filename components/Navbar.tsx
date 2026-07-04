import Link from 'next/link'
import { AuthNav } from './AuthNav'
import { SITE_NAME } from '@/lib/site-config'

export function Navbar() {
  return (
    <header className="border-b border-border bg-white/90 backdrop-blur-md sticky top-0 z-50">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link href="/" className="text-lg font-semibold tracking-tight text-foreground">
          {SITE_NAME}
        </Link>
        <nav className="hidden sm:flex items-center gap-6 text-sm text-muted">
          <Link href="/#features" className="hover:text-foreground transition-colors">
            特徴
          </Link>
          <Link href="/pricing" className="hover:text-foreground transition-colors">
            料金
          </Link>
        </nav>
        <AuthNav />
      </div>
    </header>
  )
}
