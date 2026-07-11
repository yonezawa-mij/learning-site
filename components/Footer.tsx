import Link from 'next/link'
import { SITE_NAME, SITE_TAGLINE } from '@/lib/site-config'

export function Footer() {
  return (
    <footer className="border-t border-border bg-white py-12">
      <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 px-6 sm:flex-row sm:items-center">
        <div>
          <p className="font-semibold">{SITE_NAME}</p>
          <p className="mt-1 text-sm text-muted">{SITE_TAGLINE}</p>
          <p className="mt-1 text-sm text-muted">© {new Date().getFullYear()} All rights reserved.</p>
        </div>
        <div className="flex gap-6 text-sm text-muted">
          <Link href="/pricing" className="hover:text-foreground transition-colors">料金</Link>
          <Link href="/login" className="hover:text-foreground transition-colors">ログイン</Link>
        </div>
      </div>
    </footer>
  )
}
