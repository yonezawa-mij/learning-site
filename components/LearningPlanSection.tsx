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
    <div className="overflow-hidden rounded-2xl border border-violet-200 bg-white shadow-sm">
      <div className="bg-gradient-to-r from-violet-600 to-indigo-600 px-6 py-5 text-white">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-violet-200">AI 提案</p>
            <p className="mt-1 text-sm text-violet-100">データに基づく次のステップ</p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-3xl font-bold">{plan.overallLevel}</p>
            <p className="text-xs text-violet-200">現在のレベル</p>
          </div>
        </div>
        <p className="mt-4 text-sm leading-relaxed text-violet-50">{plan.aiSummary}</p>
      </div>

      {plan.items.length > 0 ? (
        <div className="divide-y divide-violet-100">
          {plan.items.map((item, i) => (
            <Link
              key={`${item.href}-${i}`}
              href={item.href}
              className="flex items-start gap-4 px-6 py-4 hover:bg-violet-50/60 transition-colors group"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-lg">
                {typeIcon[item.type] ?? '📌'}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-semibold text-violet-700">
                    {typeLabel[item.type] ?? item.type}
                  </span>
                  {item.domain && (
                    <span className="text-xs text-violet-600 bg-violet-50 px-2 py-0.5 rounded-full">
                      {item.domain}
                    </span>
                  )}
                  <span className="text-xs text-muted">約 {item.estimatedMinutes} 分</span>
                </div>
                <p className="mt-0.5 font-semibold group-hover:text-violet-700 transition-colors">
                  {item.title}
                </p>
                <p className="mt-0.5 text-sm text-muted line-clamp-2">{item.description}</p>
              </div>
              <span className="text-violet-300 group-hover:text-violet-600 shrink-0 mt-2">→</span>
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
