import Link from 'next/link'
import { AI_LEARNING_FEATURES } from '@/lib/ai-features'

export function AiLearningShowcase() {
  return (
    <section id="ai-learning" className="border-t border-border bg-gradient-to-b from-emerald-50/80 to-white py-20">
      <div className="mx-auto max-w-6xl px-6">
        <div className="text-center max-w-3xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
            AIが支える
            <br className="sm:hidden" />
            パーソナル学習
          </h2>
          <p className="mt-4 text-muted leading-relaxed">
            習熟度と弱点を分析し、一人ひとりに合った学習プランと問題を提供します。
          </p>
        </div>

        <div className="mt-14 grid gap-6 sm:grid-cols-2">
          {AI_LEARNING_FEATURES.map((f) => (
            <div
              key={f.id}
              className="rounded-2xl border border-emerald-100 bg-white p-6 shadow-sm"
            >
              <div className="flex items-start gap-4">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-accent-soft text-2xl">
                  {f.icon}
                </span>
                <div>
                  <span className="text-xs font-semibold text-accent">{f.tag}</span>
                  <h3 className="mt-0.5 text-lg font-bold">{f.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted">{f.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 rounded-2xl border border-emerald-200 bg-white p-8 text-center">
          <div className="mt-2 flex flex-wrap justify-center gap-3">
            <Link href="/register" className="btn-primary">
              アカウント作成
            </Link>
            <Link href="/pricing" className="btn-secondary">
              プランを見る
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
