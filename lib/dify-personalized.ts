import 'server-only'
import { getRecentActivity, getWeakDomains } from './quiz-analytics'

export type DifyPersonalization = {
  history: string
  weaknesses: string
}

export async function buildDifyPersonalization(userId: string): Promise<DifyPersonalization> {
  const [recent, weak] = await Promise.all([
    getRecentActivity(userId, 12),
    getWeakDomains(userId),
  ])

  const history =
    recent.length > 0
      ? recent
          .map(
            (r) =>
              `[${r.domain ?? r.lesson_title}] ${r.question.slice(0, 60)} → ${r.is_correct ? '正解' : '不正解'} (理解度${r.understanding_score})`,
          )
          .join('\n')
      : '（履歴なし）'

  const weaknessSet = new Set<string>()
  for (const w of weak) weaknessSet.add(w.domain)
  for (const r of recent.filter((r) => !r.is_correct)) {
    if (r.domain) weaknessSet.add(r.domain)
    else if (r.lesson_title) weaknessSet.add(r.lesson_title)
  }

  const weaknesses = weaknessSet.size > 0 ? [...weaknessSet].join(', ') : '（特定の弱点なし）'

  return { history, weaknesses }
}
