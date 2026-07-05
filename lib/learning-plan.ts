import 'server-only'
import { sql } from './db'
import {
  getDomainStats,
  getLearningStats,
  getPendingQuizLessons,
  getMissedQuestions,
  type DomainStat,
} from './quiz-analytics'

export type PlanItem = {
  type: 'review' | 'continue' | 'new' | 'strengthen'
  title: string
  description: string
  href: string
  priority: number
  estimatedMinutes: number
  domain?: string
}

export type LearningPlan = {
  generatedAt: string
  overallLevel: string
  overallAccuracy: number
  avgUnderstanding: number
  domainStats: DomainStat[]
  weakDomains: string[]
  items: PlanItem[]
  aiSummary: string
}

function overallLevel(accuracy: number, avgUnderstanding: number): string {
  if (accuracy >= 80 && avgUnderstanding >= 80) return '上級'
  if (accuracy >= 60 && avgUnderstanding >= 60) return '中級'
  if (accuracy > 0 || avgUnderstanding > 0) return '初級'
  return 'スタート前'
}

function ruleBasedSummary(
  stats: Awaited<ReturnType<typeof getLearningStats>>,
  weakDomains: string[],
  items: PlanItem[],
): string {
  if (stats.total_attempts === 0) {
    return 'まだ学習データがありません。最初のクイズセットに取り組み、AIがあなたの得意・不得意を分析します。'
  }

  const parts: string[] = []
  parts.push(
    `正答率 ${stats.overall_accuracy}%、理解度スコア平均 ${stats.avg_understanding} 点です。`,
  )

  if (weakDomains.length > 0) {
    parts.push(`弱点分野は「${weakDomains.join('」「')}」です。`)
  } else if (stats.overall_accuracy >= 75) {
    parts.push('全体的に安定した理解度です。')
  }

  const next = items[0]
  if (next) {
    parts.push(`今日のおすすめ: ${next.title}（${next.description}）`)
  }

  return parts.join(' ')
}

async function aiPlanSummary(
  stats: Awaited<ReturnType<typeof getLearningStats>>,
  domainStats: DomainStat[],
  items: PlanItem[],
): Promise<string | null> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) return null

  const domainLines = domainStats
    .map((d) => `- ${d.domain}: 正答率${Math.round(d.correct_rate * 100)}%, 理解度${d.avg_score}`)
    .join('\n')
  const itemLines = items.slice(0, 3).map((i) => `- ${i.title}: ${i.description}`).join('\n')

  const prompt = `あなたは学習コーチです。以下のデータから、日本語で2-4文の個別最適化学習プラン要約を書いてください。
具体的で励まし、次に何をすべきか明確に。

正答率: ${stats.overall_accuracy}%
理解度平均: ${stats.avg_understanding}
完了セット: ${stats.completed_quiz_sets}/${stats.total_quiz_sets}

分野別:
${domainLines || '（データなし）'}

推奨アクション:
${itemLines || '（データなし）'}`

  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL ?? 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.5,
      }),
    })
    if (!res.ok) return null
    const data = await res.json()
    return data.choices?.[0]?.message?.content?.trim() || null
  } catch {
    return null
  }
}

function buildPlanItems(
  domainStats: DomainStat[],
  pending: Awaited<ReturnType<typeof getPendingQuizLessons>>,
  missed: Awaited<ReturnType<typeof getMissedQuestions>>,
): PlanItem[] {
  const items: PlanItem[] = []
  let priority = 1

  for (const m of missed.slice(0, 2)) {
    items.push({
      type: 'review',
      title: `復習: ${m.domain ?? m.lesson_title}`,
      description: `間違えた問題を確認 —「${m.question.slice(0, 40)}...」`,
      href: `/courses/${m.course_id}/lessons/${m.lesson_id}`,
      priority: priority++,
      estimatedMinutes: 10,
      domain: m.domain ?? undefined,
    })
  }

  for (const d of domainStats.filter((s) => s.status === 'weak')) {
    const lesson = pending.find((p) => p.domain === d.domain)
    if (lesson) {
      items.push({
        type: 'strengthen',
        title: `弱点強化: ${d.domain}`,
        description: `正答率${Math.round(d.correct_rate * 100)}% — 基礎から再挑戦しましょう`,
        href: `/courses/${lesson.course_id}/lessons/${lesson.lesson_id}`,
        priority: priority++,
        estimatedMinutes: 15,
        domain: d.domain,
      })
    }
  }

  const nextPending = pending[0]
  if (nextPending) {
    items.push({
      type: pending.some((p) => domainStats.some((d) => d.domain === p.domain && d.total_attempts > 0))
        ? 'continue'
        : 'new',
      title: nextPending.lesson_title,
      description: `${nextPending.domain ?? nextPending.course_title} — ${nextPending.question_count}問`,
      href: `/courses/${nextPending.course_id}/lessons/${nextPending.lesson_id}`,
      priority: priority++,
      estimatedMinutes: Math.max(10, nextPending.question_count * 2),
      domain: nextPending.domain ?? undefined,
    })
  }

  for (const d of domainStats.filter((s) => s.status === 'average')) {
    const lesson = pending.find((p) => p.domain === d.domain)
    if (lesson && !items.some((i) => i.href.includes(lesson.lesson_id))) {
      items.push({
        type: 'continue',
        title: `定着確認: ${d.domain}`,
        description: `理解度${d.avg_score}点 — もう一度解いて定着させましょう`,
        href: `/courses/${lesson.course_id}/lessons/${lesson.lesson_id}`,
        priority: priority++,
        estimatedMinutes: 12,
        domain: d.domain,
      })
    }
  }

  return items.sort((a, b) => a.priority - b.priority)
}

export async function buildLearningPlan(userId: string): Promise<LearningPlan> {
  const [stats, domainStats, pending, missed] = await Promise.all([
    getLearningStats(userId),
    getDomainStats(userId),
    getPendingQuizLessons(userId),
    getMissedQuestions(userId),
  ])

  const weakDomains = domainStats.filter((d) => d.status === 'weak').map((d) => d.domain)
  const items = buildPlanItems(domainStats, pending, missed)

  const aiSummary = await aiPlanSummary(stats, domainStats, items)
  const plan: LearningPlan = {
    generatedAt: new Date().toISOString(),
    overallLevel: overallLevel(stats.overall_accuracy, stats.avg_understanding),
    overallAccuracy: stats.overall_accuracy,
    avgUnderstanding: stats.avg_understanding,
    domainStats,
    weakDomains,
    items,
    aiSummary: aiSummary ?? ruleBasedSummary(stats, weakDomains, items),
  }

  await sql`
    INSERT INTO learning_plans (user_id, plan_json, updated_at)
    VALUES (${userId}, ${JSON.stringify(plan)}, now())
    ON CONFLICT (user_id) DO UPDATE SET
      plan_json = EXCLUDED.plan_json,
      updated_at = now()
  `

  return plan
}

export async function getCachedLearningPlan(userId: string): Promise<LearningPlan | null> {
  const rows = (await sql`
    SELECT plan_json, updated_at FROM learning_plans WHERE user_id = ${userId}
  `) as { plan_json: string; updated_at: string }[]

  if (!rows[0]) return null

  const age = Date.now() - new Date(rows[0].updated_at).getTime()
  if (age > 30 * 60 * 1000) return null

  try {
    return JSON.parse(rows[0].plan_json) as LearningPlan
  } catch {
    return null
  }
}

export async function getLearningPlan(userId: string, refresh = false): Promise<LearningPlan> {
  if (!refresh) {
    const cached = await getCachedLearningPlan(userId)
    if (cached) return cached
  }
  return buildLearningPlan(userId)
}
