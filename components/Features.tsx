import { MEMBERSHIP_FEATURES } from '@/lib/site-config'

const features = [
  {
    title: 'カリキュラム問題',
    description: '挨拶・自己紹介・日常会話など、厳選された問題を順番に学べます。',
  },
  {
    title: 'AI 個別問題',
    description: '学習データに基づき、あなたの弱点に合わせた問題が自動で作成されます。',
  },
  {
    title: '学習分析',
    description: '正答率・理解度・弱点分野を記録し、効率的な復習をサポートします。',
  },
]

export function Features() {
  return (
    <section id="features" className="border-t border-border bg-white py-20">
      <div className="mx-auto max-w-6xl px-6">
        <h2 className="text-2xl font-bold tracking-tight">学習の特徴</h2>
        <p className="mt-3 max-w-xl text-muted">
          英会話クイズと AI サポートで、継続しやすい学習環境を提供します。
        </p>
        <div className="mt-12 grid gap-6 sm:grid-cols-3">
          {features.map((item) => (
            <div key={item.title} className="rounded-2xl border border-border p-6">
              <h3 className="font-semibold">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{item.description}</p>
            </div>
          ))}
        </div>

        <div className="mt-12 rounded-2xl border border-border p-6">
          <p className="text-sm font-semibold text-foreground mb-3">有料会員に含まれるもの</p>
          <ul className="grid gap-2 sm:grid-cols-2">
            {MEMBERSHIP_FEATURES.map((f) => (
              <li key={f} className="flex items-center gap-2 text-sm text-muted">
                <span className="text-accent">✓</span>
                {f}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}
