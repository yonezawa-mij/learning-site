import Link from 'next/link'
import { MEMBERSHIP_FEATURES, MEMBERSHIP_PRICE_LABEL, SITE_TAGLINE } from '@/lib/site-config'

export function Hero() {
  return (
    <section className="mx-auto max-w-6xl px-6 pt-20 pb-16">
      <div className="max-w-3xl">
        <p className="mb-4 text-sm font-medium tracking-wide text-accent uppercase">
          {SITE_TAGLINE}
        </p>
        <h1 className="text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
          本気で学ぶ人のための
          <br />
          会員制ラーニング
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted">
          体系的なカリキュラム、進捗管理、実践ワークで学びを継続。
          有料会員だけがすべてのコースとレッスンにアクセスできます。
        </p>
        <div className="mt-10 flex flex-wrap gap-4">
          <Link
            href="/pricing"
            className="rounded-full bg-accent px-6 py-3 text-sm font-medium text-white hover:bg-emerald-700 transition-colors"
          >
            プランを見る
          </Link>
          <Link
            href="/register"
            className="rounded-full border border-border bg-white px-6 py-3 text-sm font-medium hover:bg-stone-50 transition-colors"
          >
            無料でアカウント作成
          </Link>
        </div>
        <p className="mt-4 text-sm text-muted">月額 {MEMBERSHIP_PRICE_LABEL} · いつでも解約可能</p>
      </div>
    </section>
  )
}
