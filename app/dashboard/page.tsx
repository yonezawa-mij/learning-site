import Link from 'next/link'
import { AppShell } from '@/components/AppShell'
import { StatCard } from '@/components/StatCard'
import { ManageButton } from '@/components/BillingButtons'
import { LearningPlanSection } from '@/components/LearningPlanSection'
import { DomainBarChart } from '@/components/DomainBarChart'
import { AiCapabilitiesPanel } from '@/components/AiCapabilitiesPanel'
import { requireUser } from '@/lib/guards'
import { userIsPremium } from '@/lib/auth'
import { getUserProgressSummary, getTotalCompletedLessons } from '@/lib/courses'
import { getLearningPlan } from '@/lib/learning-plan'
import { getLearningStats, getRecentActivity } from '@/lib/quiz-analytics'
import { getTutorMessages } from '@/lib/tutor'
import { refreshLearningPlanAction } from '@/app/actions/tutor'

export const dynamic = 'force-dynamic'

function RefreshPlanButton() {
  return (
    <form action={refreshLearningPlanAction}>
      <button
        type="submit"
        className="text-sm font-medium text-accent hover:underline"
      >
        プランを更新
      </button>
    </form>
  )
}

export default async function DashboardPage() {
  const user = await requireUser('/dashboard')
  const premium = userIsPremium(user)
  const progress = premium ? await getUserProgressSummary(user.id) : []
  const totalCompleted = premium ? await getTotalCompletedLessons(user.id) : 0
  const inProgress = progress.filter((p) => p.completed_lessons > 0 && p.completed_lessons < p.total_lessons)

  const [plan, stats, recentActivity, tutorMessages] = premium
    ? await Promise.all([
        getLearningPlan(user.id),
        getLearningStats(user.id),
        getRecentActivity(user.id, 5),
        getTutorMessages(user.id),
      ])
    : [null, null, [], []]

  return (
    <AppShell subNav>
      <div className="mx-auto max-w-5xl px-6 py-10 sm:py-12">
        <div className="card overflow-hidden mb-8">
          <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 px-6 py-8 sm:px-8 text-white">
            <p className="text-sm text-emerald-100">おかえりなさい</p>
            <h1 className="mt-1 text-2xl sm:text-3xl font-bold">{user.name} さん</h1>
            <p className="mt-2 text-emerald-100 text-sm">
              {premium
                ? plan
                  ? `AI分析: ${plan.overallLevel}レベル · 正答率 ${plan.overallAccuracy}% · 理解度 ${plan.avgUnderstanding}点`
                  : '今日も学習を続けましょう'
                : 'プランに加入して学習を開始できます'}
            </p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="会員ステータス"
            value={premium ? '有料会員' : '未加入'}
            hint={user.current_period_end && premium
              ? `次回更新: ${new Date(user.current_period_end).toLocaleDateString('ja-JP')}`
              : undefined}
            icon={premium ? '⭐' : '○'}
          />
          <StatCard label="完了レッスン" value={`${totalCompleted} 件`} icon="✓" />
          <StatCard
            label="学習中コース"
            value={`${inProgress.length} 件`}
            hint={premium ? '進行中のコース' : '加入後に利用可能'}
            icon="📚"
          />
          {premium && stats ? (
            <StatCard
              label="正答率"
              value={`${stats.overall_accuracy}%`}
              hint={`理解度平均 ${stats.avg_understanding}点 · ${stats.domains_studied}分野`}
              icon="📊"
            />
          ) : (
            <StatCard
              label="正答率"
              value="—"
              hint="加入後に利用可能"
              icon="📊"
            />
          )}
        </div>

        {!premium ? (
          <div className="mt-8 card p-8 text-center border-dashed border-emerald-200 bg-accent-soft/50">
            <h2 className="text-lg font-semibold text-emerald-900">有料会員プランに加入してください</h2>
            <p className="mt-2 text-sm text-emerald-800 max-w-md mx-auto">
              コースの閲覧・レッスン学習・AI個別最適化プランは有料会員限定です。
            </p>
            <Link href="/pricing" className="btn-primary mt-6 inline-flex">
              プランを見る
            </Link>
          </div>
        ) : (
          <>
            <div className="mt-8">
              <AiCapabilitiesPanel
                stats={{
                  hasPlan: Boolean(plan && plan.items.length >= 0),
                  hasQuizData: (stats?.total_attempts ?? 0) > 0,
                  hasTutorHistory: tutorMessages.length > 0,
                  overallAccuracy: stats?.overall_accuracy ?? 0,
                  weakDomainCount: plan?.weakDomains.length ?? 0,
                }}
              />
            </div>

            {plan && (
              <div className="mt-8">
                <div className="flex items-center justify-between gap-4 mb-4">
                  <h2 className="text-lg font-semibold">学習プラン</h2>
                  <RefreshPlanButton />
                </div>
                <LearningPlanSection plan={plan} />
              </div>
            )}

            <div className="mt-8 grid gap-6 lg:grid-cols-2">
              <div className="card p-6">
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="font-bold">弱点・得意分野分析</h2>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                    データ可視化
                  </span>
                </div>
                <p className="text-sm text-muted mb-5">AIが解答データから自動分析 · 客観的な学習管理</p>
                {plan && <DomainBarChart stats={plan.domainStats} />}
              </div>

              <div className="card p-6">
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="font-bold">最近の学習履歴</h2>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                    記録・可視化
                  </span>
                </div>
                <p className="text-sm text-muted mb-5">正答率・理解度スコアに基づく復習タイミングの提案</p>
                {recentActivity.length === 0 ? (
                  <p className="text-sm text-muted text-center py-6">
                    クイズに取り組むと、解答履歴がここに記録されます
                  </p>
                ) : (
                  <ul className="space-y-3">
                    {recentActivity.map((a, i) => (
                      <li key={i} className="flex items-start gap-3 text-sm">
                        <span
                          className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs text-white ${
                            a.is_correct ? 'bg-emerald-500' : 'bg-red-400'
                          }`}
                        >
                          {a.is_correct ? '✓' : '×'}
                        </span>
                        <div className="min-w-0">
                          <p className="font-medium truncate">{a.lesson_title}</p>
                          <p className="text-xs text-muted line-clamp-1">{a.question}</p>
                          <p className="text-xs text-muted mt-0.5">
                            理解度 {a.understanding_score}点 ·{' '}
                            {new Date(a.answered_at).toLocaleDateString('ja-JP')}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            <div className="mt-8 card p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="flex-1">
                <h2 className="font-bold">学習チューター</h2>
                <p className="mt-1 text-sm text-muted">
                  わからないところや復習の進め方について相談できます。
                </p>
              </div>
              <Link href="/tutor" className="btn-primary shrink-0">
                相談する
              </Link>
            </div>

            <div className="mt-10">
              <div className="flex items-end justify-between gap-4 mb-6">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-accent mb-2">Learning</p>
                  <h2 className="text-xl font-bold">学習中のコース</h2>
                </div>
                <Link href="/courses" className="shrink-0 text-sm font-medium text-accent hover:underline">
                  すべて見る →
                </Link>
              </div>
              <div className="grid gap-6 sm:grid-cols-2">
                {progress.map((p) => (
                  <Link
                    key={p.course_id}
                    href={`/courses/${p.course_id}`}
                    className="card p-5 hover:border-emerald-200 hover:shadow-md transition-all"
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent-soft text-xl">
                        {p.icon ?? '📘'}
                      </span>
                      <div>
                        <p className="font-semibold">{p.course_title}</p>
                        <p className="text-xs text-muted">
                          {p.completed_lessons}/{p.total_lessons} レッスン完了
                        </p>
                      </div>
                    </div>
                    <div className="h-2 rounded-full bg-stone-100 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-full"
                        style={{
                          width: `${p.total_lessons > 0 ? (p.completed_lessons / p.total_lessons) * 100 : 0}%`,
                        }}
                      />
                    </div>
                  </Link>
                ))}
              </div>
              <div className="mt-10 max-w-sm">
                <ManageButton />
              </div>
            </div>
          </>
        )}
      </div>
    </AppShell>
  )
}
