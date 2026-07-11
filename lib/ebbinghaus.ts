/** 誤答後の復習間隔（日）— エビングハウスの忘却曲線に基づく段階的間隔 */
export const REVIEW_INTERVALS_DAYS = [1, 3, 7, 14, 30] as const

export type ReviewableAttempt = {
  id: string
  question: string
  theme: string
  isCorrect: boolean
  timestamp: number
  reviewCount: number
  nextReviewAt: number | null
}

export function scheduleNextReview(wrongAt: number, reviewCount: number): number | null {
  if (reviewCount >= REVIEW_INTERVALS_DAYS.length) return null
  const days = REVIEW_INTERVALS_DAYS[reviewCount]
  return wrongAt + days * 24 * 60 * 60 * 1000
}

export function isReviewDue(entry: ReviewableAttempt, now = Date.now()): boolean {
  if (entry.isCorrect) return false
  if (entry.nextReviewAt == null) return false
  return now >= entry.nextReviewAt
}

export function daysUntilReview(entry: ReviewableAttempt, now = Date.now()): number {
  if (!entry.nextReviewAt) return 0
  return Math.max(0, Math.ceil((entry.nextReviewAt - now) / (24 * 60 * 60 * 1000)))
}
