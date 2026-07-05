import Link from 'next/link'
import { AI_LEARNING_FEATURES } from '@/lib/ai-features'

type Props = {
  stats?: {
    hasPlan: boolean
    hasQuizData: boolean
    hasTutorHistory: boolean
    overallAccuracy: number
    weakDomainCount: number
  }
}

export function AiCapabilitiesPanel({ stats }: Props) {
  const statusFor = (id: string) => {
    if (!stats) return null
    switch (id) {
      case 'personalize':
        return stats.hasPlan ? `レベル分析済み` : null
      case 'feedback':
        return stats.hasQuizData ? `正答率 ${stats.overallAccuracy}%` : null
      case 'analytics':
        return stats.hasQuizData ? `データ記録中` : null
      default:
        return null
    }
  }

  return (
    <div className="card overflow-hidden">
      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-5 text-white">
        <h2 className="text-xl font-bold">学習サマリー</h2>
        <p className="mt-1 text-sm text-emerald-100">
          あなたの学習データに基づく分析と提案
        </p>
      </div>

      <div className="grid sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-border">
        {AI_LEARNING_FEATURES.map((f) => {
          const status = statusFor(f.id)
          return (
            <Link
              key={f.id}
              href={f.href}
              className="flex items-start gap-3 p-5 hover:bg-stone-50 transition-colors group"
            >
              <span className="text-2xl shrink-0">{f.icon}</span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-semibold text-accent">{f.tag}</span>
                  {status && (
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                      {status}
                    </span>
                  )}
                </div>
                <p className="mt-0.5 font-semibold text-sm group-hover:text-accent transition-colors">
                  {f.title}
                </p>
                <p className="mt-1 text-xs text-muted line-clamp-2">{f.description}</p>
              </div>
            </Link>
          )
        })}
      </div>

      {stats && stats.weakDomainCount > 0 && (
        <div className="px-5 py-3 bg-amber-50 border-t border-amber-100 text-sm text-amber-900">
          弱点分野が {stats.weakDomainCount} 件見つかりました。学習プランで復習をおすすめします。
        </div>
      )}
    </div>
  )
}
