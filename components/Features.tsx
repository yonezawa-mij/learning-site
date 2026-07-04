import { MEMBERSHIP_FEATURES } from '@/lib/site-config'

const features = [
  {
    title: '会員限定コンテンツ',
    description: '全コース・全レッスンは有料会員のみ閲覧可能。学習環境を集中して設計しています。',
  },
  {
    title: '進捗が可視化される',
    description: 'レッスン完了状況とコース進捗をダッシュボードで確認。続けやすい仕組みです。',
  },
  {
    title: '実践ワーク中心',
    description: '読むだけで終わらない構成。各レッスンにワークを用意し、定着を支援します。',
  },
]

export function Features() {
  return (
    <section id="features" className="border-t border-border bg-white py-20">
      <div className="mx-auto max-w-6xl px-6">
        <h2 className="text-2xl font-bold tracking-tight">会員制プラットフォームの特徴</h2>
        <p className="mt-3 max-w-xl text-muted">
          無料の断片的な情報ではなく、学び続けるための環境を提供します。
        </p>
        <div className="mt-12 grid gap-6 sm:grid-cols-3">
          {features.map((item) => (
            <div key={item.title} className="rounded-2xl border border-border p-6">
              <h3 className="font-semibold">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{item.description}</p>
            </div>
          ))}
        </div>
        <div className="mt-12 rounded-2xl border border-accent/20 bg-accent-soft p-6">
          <p className="text-sm font-semibold text-emerald-800 mb-3">有料会員に含まれるもの</p>
          <ul className="grid gap-2 sm:grid-cols-2">
            {MEMBERSHIP_FEATURES.map((f) => (
              <li key={f} className="flex items-center gap-2 text-sm text-emerald-900">
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
