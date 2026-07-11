import { isReviewDue, scheduleNextReview, type ReviewableAttempt } from './ebbinghaus'

export type LocalQuizAttempt = ReviewableAttempt

export type LocalLearningStore = {
  attempts: LocalQuizAttempt[]
  goalTarget: number
}

const STORAGE_KEY = 'learning-site-quiz-history'

function defaultStore(): LocalLearningStore {
  return { attempts: [], goalTarget: 50 }
}

export function loadLearningStore(): LocalLearningStore {
  if (typeof window === 'undefined') return defaultStore()
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return defaultStore()
    const parsed = JSON.parse(raw) as LocalLearningStore
    return {
      attempts: Array.isArray(parsed.attempts) ? parsed.attempts : [],
      goalTarget: typeof parsed.goalTarget === 'number' ? parsed.goalTarget : 50,
    }
  } catch {
    return defaultStore()
  }
}

export function saveLearningStore(store: LocalLearningStore): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store))
  } catch {
    // quota exceeded etc.
  }
}

export function recordLocalAttempt(input: {
  question: string
  theme: string
  isCorrect: boolean
}): LocalLearningStore {
  const store = loadLearningStore()
  const timestamp = Date.now()
  const entry: LocalQuizAttempt = {
    id: `local-${timestamp}-${Math.random().toString(36).slice(2, 8)}`,
    question: input.question,
    theme: input.theme,
    isCorrect: input.isCorrect,
    timestamp,
    reviewCount: 0,
    nextReviewAt: input.isCorrect ? null : scheduleNextReview(timestamp, 0),
  }
  store.attempts.unshift(entry)
  if (store.attempts.length > 200) store.attempts = store.attempts.slice(0, 200)
  saveLearningStore(store)
  return store
}

export function markReviewDone(attemptId: string): LocalLearningStore {
  const store = loadLearningStore()
  store.attempts = store.attempts.map((a) => {
    if (a.id !== attemptId) return a
    const nextCount = a.reviewCount + 1
    return {
      ...a,
      reviewCount: nextCount,
      nextReviewAt: scheduleNextReview(a.timestamp, nextCount),
    }
  })
  saveLearningStore(store)
  return store
}

export function getWeaknessThemes(store = loadLearningStore()): string[] {
  const themes = new Set<string>()
  for (const a of store.attempts) {
    if (!a.isCorrect && a.theme.trim()) themes.add(a.theme.trim())
  }
  return [...themes]
}

export function getLocalStats(store = loadLearningStore()) {
  const total = store.attempts.length
  const correct = store.attempts.filter((a) => a.isCorrect).length
  const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0
  const goalProgress = Math.min(100, Math.round((total / store.goalTarget) * 100))
  return { total, correct, accuracy, goalProgress, goalTarget: store.goalTarget }
}

export function getDueReviewItems(store = loadLearningStore()): LocalQuizAttempt[] {
  return store.attempts.filter((a) => isReviewDue(a))
}
