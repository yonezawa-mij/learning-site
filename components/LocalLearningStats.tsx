'use client'

import { useEffect, useState } from 'react'
import { getLocalStats, loadLearningStore } from '@/lib/learning-local-store'

type Props = {
  serverTotal?: number
  serverAccuracy?: number
}

export function LocalLearningStats({ serverTotal = 0, serverAccuracy = 0 }: Props) {
  const [stats, setStats] = useState(getLocalStats())

  useEffect(() => {
    setStats(getLocalStats(loadLearningStore()))
  }, [])

  const total = Math.max(stats.total, serverTotal)
  const accuracy = stats.total > 0 ? stats.accuracy : serverAccuracy

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <div className="card p-5">
        <p className="text-xs font-medium text-muted">回答問題数</p>
        <p className="mt-2 text-3xl font-bold tabular-nums">{total}</p>
        <p className="mt-1 text-xs text-muted">ローカル + サーバー</p>
      </div>
      <div className="card p-5">
        <p className="text-xs font-medium text-muted">通算正答率</p>
        <p className="mt-2 text-3xl font-bold tabular-nums text-accent">{accuracy}%</p>
      </div>
      <div className="card p-5">
        <p className="text-xs font-medium text-muted">目標達成</p>
        <p className="mt-2 text-3xl font-bold tabular-nums">{stats.goalProgress}%</p>
        <div className="mt-3 h-2 rounded-full bg-stone-100 overflow-hidden">
          <div
            className="h-full bg-accent rounded-full transition-all duration-500"
            style={{ width: `${stats.goalProgress}%` }}
          />
        </div>
        <p className="mt-1 text-xs text-muted">{stats.total} / {stats.goalTarget} 問</p>
      </div>
    </div>
  )
}
