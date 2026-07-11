import type { LearningStats } from '@/lib/quiz-analytics'

type Props = {
  title: string
  icon?: string | null
  level?: string | null
  description?: string
  stats: LearningStats
  completedLessons: number
  totalLessons: number
}

function ProgressRing({ pct, size = 140 }: { pct: number; size?: number }) {
  const stroke = 10
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (pct / 100) * circumference

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.2)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="white"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-700"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
        <span className="text-4xl sm:text-5xl font-bold tabular-nums leading-none">{pct}%</span>
        <span className="mt-1 text-xs text-emerald-100">進捗率</span>
      </div>
    </div>
  )
}

export function QuizProgressHero({
  title,
  icon,
  level,
  description,
  stats,
  completedLessons,
  totalLessons,
}: Props) {
  const progressPct = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0

  const metrics = [
    {
      label: 'セット完了',
      value: `${completedLessons}/${totalLessons}`,
      sub: 'クイズセット',
    },
    {
      label: '正答率',
      value: stats.total_attempts > 0 ? `${stats.overall_accuracy}%` : '—',
      sub: stats.total_attempts > 0 ? `${stats.correct_count}/${stats.total_attempts} 問` : '未挑戦',
    },
    {
      label: '理解度',
      value: stats.total_attempts > 0 ? `${stats.avg_understanding}` : '—',
      sub: stats.total_attempts > 0 ? '平均スコア' : '未挑戦',
    },
    {
      label: '学習分野',
      value: `${stats.domains_studied}`,
      sub: '分野に挑戦',
    },
  ]

  return (
    <div className="overflow-hidden rounded-3xl border border-emerald-200/60 bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 text-white shadow-lg shadow-emerald-900/10">
      <div className="px-6 py-8 sm:px-10 sm:py-10">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center gap-6 lg:flex-1">
            <ProgressRing pct={progressPct} />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                {icon && <span className="text-3xl">{icon}</span>}
                {level && (
                  <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-emerald-50">
                    {level}
                  </span>
                )}
              </div>
              <h2 className="mt-3 text-2xl sm:text-3xl font-bold tracking-tight">{title}</h2>
              {description && (
                <p className="mt-2 max-w-xl text-sm sm:text-base leading-relaxed text-emerald-100">
                  {description}
                </p>
              )}
              <p className="mt-4 text-lg font-semibold text-white">
                {progressPct >= 100
                  ? '全セット完了！'
                  : progressPct > 0
                    ? `あと ${totalLessons - completedLessons} セットで完走`
                    : 'さあ、最初のセットに挑戦しよう'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:w-[22rem] shrink-0">
            {metrics.map((m) => (
              <div
                key={m.label}
                className="rounded-2xl bg-white/10 backdrop-blur-sm px-4 py-4 border border-white/10"
              >
                <p className="text-xs font-medium text-emerald-100">{m.label}</p>
                <p className="mt-1 text-2xl sm:text-3xl font-bold tabular-nums leading-none">{m.value}</p>
                <p className="mt-1 text-xs text-emerald-200/80">{m.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
