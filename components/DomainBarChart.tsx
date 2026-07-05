type Props = {
  stats: { domain: string; avg_score: number; correct_rate: number; status: string }[]
}

const statusColor: Record<string, string> = {
  strong: 'bg-emerald-500',
  average: 'bg-amber-400',
  weak: 'bg-red-400',
  not_started: 'bg-stone-300',
}

const statusLabel: Record<string, string> = {
  strong: '得意',
  average: '標準',
  weak: '要強化',
  not_started: '未学習',
}

export function DomainBarChart({ stats }: Props) {
  if (stats.length === 0) {
    return (
      <p className="text-sm text-muted py-4 text-center">
        クイズに取り組むと、分野別の得意・不得意がここに表示されます
      </p>
    )
  }

  return (
    <div className="space-y-4">
      {stats.map((s) => (
        <div key={s.domain}>
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <span className="text-sm font-medium truncate">{s.domain}</span>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs text-muted">正答率 {Math.round(s.correct_rate * 100)}%</span>
              <span
                className={`text-xs px-2 py-0.5 rounded-full ${
                  s.status === 'strong'
                    ? 'bg-emerald-100 text-emerald-700'
                    : s.status === 'weak'
                      ? 'bg-red-100 text-red-700'
                      : s.status === 'average'
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-stone-100 text-stone-600'
                }`}
              >
                {statusLabel[s.status] ?? s.status}
              </span>
            </div>
          </div>
          <div className="h-3 rounded-full bg-stone-100 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${statusColor[s.status] ?? 'bg-stone-400'}`}
              style={{ width: `${Math.max(4, s.avg_score)}%` }}
            />
          </div>
          <p className="mt-0.5 text-xs text-muted">理解度スコア {s.avg_score} / 100</p>
        </div>
      ))}
    </div>
  )
}
