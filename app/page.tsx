import { Navbar } from '@/components/Navbar'
import { Hero } from '@/components/Hero'
import { Features } from '@/components/Features'
import { AiLearningShowcase } from '@/components/AiLearningShowcase'
import { Footer } from '@/components/Footer'
import { HomeQuiz } from '@/components/HomeQuiz'
import Link from 'next/link'
import { MEMBERSHIP_PRICE_LABEL } from '@/lib/site-config'
import { getCurrentUser, userIsPremium } from '@/lib/auth'
import { getDifyConfig } from '@/lib/dify-quiz'

export default async function Home() {
  const user = await getCurrentUser()
  const isPremium = userIsPremium(user)
  const difyEnabled = Boolean(getDifyConfig())

  return (
    <>
      <Navbar />
      <main className="flex-1">
        <Hero />
        <section id="quiz" className="border-t border-border bg-stone-50/50 py-20">
          <div className="mx-auto max-w-3xl px-6">
            <div className="text-center mb-10">
              <p className="text-sm font-medium tracking-wide text-accent uppercase">Try it now</p>
              <h2 className="mt-2 text-2xl font-bold sm:text-3xl">AI 体験クイズ</h2>
              <p className="mt-3 text-muted max-w-lg mx-auto">
                テーマとレベルを入力すると、Dify が英語の4択問題を1問ずつ生成します。解説は日本語で表示されます。
              </p>
            </div>
            <HomeQuiz isPremium={isPremium} difyEnabled={difyEnabled} />
          </div>
        </section>
        <AiLearningShowcase />
        <section className="border-t border-border py-20">
          <div className="mx-auto max-w-6xl px-6 text-center">
            <h2 className="text-2xl font-bold">会員プラン</h2>
            <p className="mt-3 text-muted max-w-xl mx-auto">
              すべてのコースと学習機能は有料会員向けです。
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
