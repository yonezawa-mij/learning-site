'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  getDueReviewItems,
  loadLearningStore,
  markReviewDone,
  type LocalQuizAttempt,
} from '@/lib/learning-local-store'
import { daysUntilReview } from '@/lib/ebbinghaus'

export function ReviewReminderCards() {
  const [dueItems, setDueItems] = useState<LocalQuizAttempt[]>([])
  const [upcoming, setUpcoming] = useState<LocalQuizAttempt[]>([])

  useEffect(() => {
    const store = loadLearningStore()
    const due = getDueReviewItems(store)
    const soon = store.attempts
      .filter((a) => !a.isCorrect && a.nextReviewAt && !due.includes(a))
      .slice(0, 3)
    setDueItems(due)
    setUpcoming(soon)
  }, [])

  function handleDismiss(id: string) {
    markReviewDone(id)
    const store = loadLearningStore()
    setDueItems(getDueReviewItems(store))
  }

  if (dueItems.length === 0 && upcoming.length === 0) return null

  return (
    <div className="space-y-4">
      {dueItems.length > 0 && (
        <div className="rounded-2xl border-2 border-amber-300 bg-amber-50 p-5 sm:p-6">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xl">🔔</span>
            <h3 className="text-lg font-bold text-amber-950">復習リマインダー</h3>
            <span className="rounded-full bg-amber-200 px-2.5 py-0.5 text-xs font-bold text-amber-900">
              忘却曲線に基づく
            </span>
          </div>
          <p className="text-sm text-amber-900/80 mb-4">
            忘れた頃に復習すると記憶が定着します。以下の問題をもう一度確認しましょう。
          </p>
          <div className="space-y-3">
            {dueItems.slice(0, 5).map((item) => (
              <div
                key={item.id}
                className="flex flex-wrap items-start justify-between gap-3 rounded-xl bg-white border border-amber-200 px-4 py-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-amber-800">{item.theme}</p>
                  <p className="text-sm font-medium mt-0.5 line-clamp-2">{item.question}</p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Link href="/dashboard#quiz-select" className="btn-primary !py-2 !px-4 text-xs">
                    類題に挑戦
                  </Link>
                  <button
                    type="button"
                    onClick={() => handleDismiss(item.id)}
                    className="btn-secondary !py-2 !px-3 text-xs"
                  >
                    後で
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {upcoming.length > 0 && dueItems.length === 0 && (
        <div className="rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-muted">
          次の復習予定: {upcoming[0].theme}（あと {daysUntilReview(upcoming[0])} 日）
        </div>
      )}
    </div>
  )
}
