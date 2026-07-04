import { Navbar } from '@/components/Navbar'
import { Hero } from '@/components/Hero'
import { Features } from '@/components/Features'
import { Footer } from '@/components/Footer'
import Link from 'next/link'
import { MEMBERSHIP_PRICE_LABEL } from '@/lib/site-config'

export default function Home() {
  return (
    <>
      <Navbar />
      <main className="flex-1">
        <Hero />
        <section className="border-t border-border py-20">
          <div className="mx-auto max-w-6xl px-6 text-center">
            <h2 className="text-2xl font-bold">学習は会員限定</h2>
            <p className="mt-3 text-muted max-w-xl mx-auto">
              コース一覧・レッスン・進捗管理はすべて有料会員向けです。
              まずアカウントを作成し、プランに加入して学習を開始してください。
            </p>
            <Link
              href="/pricing"
              className="mt-8 inline-block rounded-full bg-foreground px-8 py-3 text-sm font-medium text-white hover:bg-stone-800 transition-colors"
            >
              {MEMBERSHIP_PRICE_LABEL} で始める
            </Link>
          </div>
        </section>
        <Features />
      </main>
      <Footer />
    </>
  )
}
