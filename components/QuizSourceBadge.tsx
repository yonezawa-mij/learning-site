import { QUIZ_SOURCE_META, normalizeQuizSource, type QuizSource } from '@/lib/quiz-sources'

type Props = {
  source: string
}

export function QuizSourceBadge({ source: raw }: Props) {
  const source = normalizeQuizSource(raw) as QuizSource
  const meta = QUIZ_SOURCE_META[source]

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${
        source === 'fixed'
          ? 'bg-stone-100 text-stone-700'
          : 'bg-violet-100 text-violet-800'
      }`}
    >
      {meta.label}
    </span>
  )
}
