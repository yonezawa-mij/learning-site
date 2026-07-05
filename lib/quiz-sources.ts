export type QuizSource = 'fixed' | 'dify'

export type QuizConfig = {
  topic?: string
  question_count?: number
  difficulty?: string
  weakness_focus?: boolean
}

export const QUIZ_SOURCE_META: Record<
  QuizSource,
  { label: string; tag: string; description: string; icon: string }
> = {
  fixed: {
    label: 'カリキュラム',
    tag: '標準',
    description: '厳選された定番問題。会話の流れに沿って基礎を固めます。',
    icon: '📚',
  },
  dify: {
    label: 'AI問題',
    tag: 'パーソナル',
    description: '学習データに基づき、あなたに合った問題を自動で作成します。',
    icon: '✨',
  },
}

export function parseQuizConfig(raw: string | null | undefined): QuizConfig {
  if (!raw) return {}
  try {
    return JSON.parse(raw) as QuizConfig
  } catch {
    return {}
  }
}

export function normalizeQuizSource(raw: string | null | undefined): QuizSource {
  if (raw === 'dify' || raw === 'ai' || raw === 'web') return 'dify'
  return 'fixed'
}
