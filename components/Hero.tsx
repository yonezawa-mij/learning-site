import Link from 'next/link'
import { MEMBERSHIP_PRICE_LABEL, SITE_TAGLINE } from '@/lib/site-config'

export function Hero() {
  return (
    <section className="mx-auto max-w-6xl px-6 pt-20 pb-16">
      <div className="max-w-3xl">
        <p className="mb-4 text-sm font-medium tracking-wide text-accent uppercase">
          {SITE_TAGLINE}
        </p>
        <h1 className="text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
          英会話を、
          <br />
          あなたのペースで
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted">
          テーマとレベルを指定すると AI が英語の4択クイズを生成。解説は日本語で、サイト内の枠でそのまま回答できます。
        </p>
        <div className="mt-10 flex flex-wrap gap-4">
          <Link
            href="#quiz"
            className="rounded-full bg-accent px-6 py-3 text-sm font-medium text-white hover:bg-emerald-700 transition-colors"
          >
            クイズを試す
          </Link>
          <Link
            href="/pricing"
            className="rounded-full border border-border bg-white px-6 py-3 text-sm font-medium hover:bg-stone-50 transition-colors"
          >
            プランを見る
          </Link>
          <Link
            href="/register"
            className="rounded-full border border-border bg-white px-6 py-3 text-sm font-medium hover:bg-stone-50 transition-colors"
          >
            アカウント作成
          </Link>
        </div>
        <p className="mt-4 text-sm text-muted">月額 {MEMBERSHIP_PRICE_LABEL} · いつでも解約可能</p>
      </div>
    </section>
  )
}
