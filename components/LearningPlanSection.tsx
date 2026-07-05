import Link from 'next/link'
import type { LearningPlan } from '@/lib/learning-plan'

type Props = {
  plan: LearningPlan
}

const typeIcon: Record<string, string> = {
  review: '🔄',
  continue: '▶️',
  new: '✨',
  strengthen: '💪',
}

const typeLabel: Record<string, string> = {
  review: '復習',
  continue: '続き',
  new: '新規',
  strengthen: '弱点強化',
}

export function LearningPlanSection({ plan }: Props) {
  return (
    <div className="card overflow-hidden">
      <div className="bg-gradient-to-r from-emerald-50 to-teal-50 px-6 py-5 border-b border-emerald-100">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-emerald-900">学習プラン</h2>
          </div>
          <div className="text-right shrink-0">
            <p className="text-2xl font-bold text-emerald-700">{plan.overallLevel}</p>
            <p className="text-xs text-emerald-600">現在のレベル</p>
          </div>
        </div>
        <p className="mt-3 text-sm text-emerald-800 leading-relaxed">{plan.aiSummary}</p>
      </div>

      {plan.items.length > 0 ? (
        <div className="divide-y divide-border">
          {plan.items.map((item, i) => (
            <Link
              key={`${item.href}-${i}`}
              href={item.href}
              className="flex items-start gap-4 px-6 py-4 hover:bg-stone-50 transition-colors group"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-lg">
                {typeIcon[item.type] ?? '📌'}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-medium text-accent">
                    {typeLabel[item.type] ?? item.type}
                  </span>
                  {item.domain && (
                    <span className="text-xs text-muted bg-stone-100 px-2 py-0.5 rounded-full">
                      {item.domain}
                    </span>
                  )}
                  <span className="text-xs text-muted">約 {item.estimatedMinutes} 分</span>
                </div>
                <p className="mt-0.5 font-semibold group-hover:text-accent transition-colors">
                  {item.title}
                </p>
                <p className="mt-0.5 text-sm text-muted line-clamp-2">{item.description}</p>
              </div>
              <span className="text-muted group-hover:text-accent shrink-0 mt-2">→</span>
            </Link>
          ))}
        </div>
      ) : (
        <div className="px-6 py-8 text-center text-sm text-muted">
          すべてのクイズセットを完了しました。AIチューターで復習相談ができます。
        </div>
      )}
    </div>
  )
}
