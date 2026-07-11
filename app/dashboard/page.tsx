import Link from 'next/link'
import { AppShell } from '@/components/AppShell'
import { ManageButton } from '@/components/BillingButtons'
import { LearningPlanSection } from '@/components/LearningPlanSection'
import { DomainBarChart } from '@/components/DomainBarChart'
import { QuizProgressHero } from '@/components/QuizProgressHero'
import { QuizTrackColumns } from '@/components/QuizTrackColumns'
import { ReviewReminderCards } from '@/components/ReviewReminderCards'
import { LocalLearningStats } from '@/components/LocalLearningStats'
import { WeaknessTags } from '@/components/WeaknessTags'
import { requireUser } from '@/lib/guards'
import { userIsPremium } from '@/lib/auth'
import { getCourses, getCourseById, getLessonProgress, getUserProgressSummary } from '@/lib/courses'
import { getLearningPlan } from '@/lib/learning-plan'
import {
  getCourseLessonStats,
  getDomainStats,
  getLearningStats,
  getRecentActivity,
} from '@/lib/quiz-analytics'
import { getTutorMessages } from '@/lib/tutor'
import { refreshLearningPlanAction } from '@/app/actions/tutor'
import { SITE_LABEL } from '@/lib/site-config'

export const dynamic = 'force-dynamic'

function RefreshPlanButton() {
  return (
    <form action={refreshLearningPlanAction}>
      <button type="submit" className="text-sm font-semibold text-violet-700 hover:underline">
        プランを更新
      </button>
    </form>
  )
}

export default async function DashboardPage() {
  const user = await requireUser('/dashboard')
  const premium = userIsPremium(user)

  if (!premium) {
    return (
      <AppShell subNav>
        <div className="mx-auto max-w-5xl px-6 py-10 sm:py-12">
          <div className="card overflow-hidden">
            <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 px-6 py-10 sm:px-10 text-white text-center">
              <p className="text-sm text-emerald-100">マイページ</p>
              <h1 className="mt-2 text-2xl sm:text-3xl font-bold">{user.name} さん</h1>
              <p className="mt-3 text-emerald-100">有料会員プランに加入すると、学習データと AI 分析が利用できます。</p>
              <Link href="/pricing" className="btn-primary mt-8 inline-flex bg-white text-emerald-800 hover:bg-emerald-50">
                プランを見る
              </Link>
            </div>
          </div>
        </div>
      </AppShell>
    )
  }

  const [progress, stats, plan, domainStats, recentActivity, tutorMessages, courses] = await Promise.all([
    getUserProgressSummary(user.id),
    getLearningStats(user.id),
    getLearningPlan(user.id),
    getDomainStats(user.id),
    getRecentActivity(user.id, 6),
    getTutorMessages(user.id),
    getCourses(),
  ])

  const courseDetails = await Promise.all(
    courses.map(async (c) => {
      const detail = await getCourseById(c.id)
      const [completed, lessonStats] = await Promise.all([
        getLessonProgress(user.id, c.id),
        getCourseLessonStats(user.id, c.id),
      ])
      return { course: c, detail, completed, lessonStats }
    }),
  )

  const completedSets = stats.completed_quiz_sets
  const totalSets = stats.total_quiz_sets
  const chartStats = domainStats.length > 0 ? domainStats : plan.domainStats

  return (
    <AppShell subNav>
      <div className="mx-auto max-w-6xl px-6 py-10 sm:py-12">
        <QuizProgressHero
          title={`${user.name} さんの学習`}
          icon="📊"
          description={plan.aiSummary}
          stats={stats}
          completedLessons={completedSets}
          totalLessons={totalSets}
        />

        <div className="mt-6 flex flex-wrap gap-3">
          <a href="#quiz-select" className="btn-primary !py-3 !px-6 text-base">
            クイズを選ぶ ↓
          </a>
          <Link href="/tutor" className="btn-secondary !py-3 !px-6 text-base">
            チューターに相談
          </Link>
        </div>

        <div className="mt-8">
          <ReviewReminderCards />
        </div>

        <div className="mt-6">
          <LocalLearningStats
            serverTotal={stats.total_attempts}
            serverAccuracy={stats.overall_accuracy}
          />
        </div>

        <div className="mt-4">
          <p className="text-xs font-medium text-muted mb-2">つまずき分野タグ</p>
          <WeaknessTags serverWeaknesses={plan.weakDomains} />
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: '現在のレベル', value: plan.overallLevel, sub: 'AI 分析' },
            {
              label: '解答数',
              value: stats.total_attempts > 0 ? `${stats.total_attempts} 問` : '—',
              sub: stats.total_attempts > 0 ? `正解 ${stats.correct_count} 問` : '未挑戦',
            },
            {
              label: '完了セット',
              value: `${completedSets}/${totalSets}`,
              sub: 'クイズセット',
            },
            {
              label: '学習分野',
              value: `${stats.domains_studied}`,
              sub: tutorMessages.length > 0 ? `チューター ${tutorMessages.length} 件` : '分野に挑戦',
            },
          ].map((item) => (
            <div key={item.label} className="card p-5">
              <p className="text-xs font-medium text-muted">{item.label}</p>
              <p className="mt-2 text-3xl font-bold tabular-nums leading-none">{item.value}</p>
              <p className="mt-2 text-xs text-muted">{item.sub}</p>
            </div>
          ))}
        </div>

        <section
          id="quiz-select"
          className="mt-10 scroll-mt-24 rounded-3xl border-2 border-stone-200 bg-stone-50/70 p-6 sm:p-8 shadow-sm"
        >
          <div className="flex flex-wrap items-start justify-between gap-4 mb-8 pb-6 border-b border-stone-200">
            <div className="flex items-start gap-4">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white border border-stone-200 text-2xl shadow-sm">
                📝
              </span>
              <div>
                <span className="inline-block rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800">
                  問題セット
                </span>
                <h2 className="mt-2 text-2xl font-bold text-stone-900">クイズを選ぶ</h2>
                <p className="mt-2 text-sm text-muted max-w-xl">
                  カリキュラム問題と AI 問題から、次に挑戦するセットを選びます。
                </p>
              </div>
            </div>
            <div className="rounded-2xl bg-white border border-stone-200 px-5 py-3 text-right shadow-sm">
              <p className="text-xs font-medium text-muted">完了セット</p>
              <p className="text-2xl font-bold tabular-nums text-emerald-700">
                {completedSets}/{totalSets}
              </p>
            </div>
          </div>

          <div className="space-y-10">
            {courseDetails.map(({ course, detail, completed, lessonStats }) => {
              if (!detail) return null

              return (
                <section key={course.id}>
                  <div className="flex flex-wrap items-center gap-3 mb-5">
                    <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-accent-soft text-2xl">
                      {course.icon ?? '🇬🇧'}
                    </span>
                    <div>
                      <h3 className="text-lg font-bold">{course.title}</h3>
                      <p className="text-sm text-muted">
                        {completed.size}/{detail.lessons.length} セット完了
                      </p>
                    </div>
                  </div>
                  <QuizTrackColumns
                    courseId={course.id}
                    lessons={detail.lessons}
                    completed={completed}
                    lessonStats={lessonStats}
                  />
                </section>
              )
            })}
          </div>
        </section>

        <section className="mt-12 rounded-3xl border-2 border-violet-200 bg-gradient-to-b from-violet-50/80 via-white to-white p-6 sm:p-8 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-4 mb-6 pb-6 border-b border-violet-100">
            <div className="flex items-start gap-4">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-violet-600 text-2xl text-white shadow-sm">
                🎯
              </span>
              <div>
                <span className="inline-block rounded-full bg-violet-100 px-3 py-1 text-xs font-bold text-violet-800">
                  AI 学習プラン
                </span>
                <h2 className="mt-2 text-2xl font-bold text-violet-950">次にやること</h2>
                <p className="mt-2 text-sm text-violet-700/80 max-w-xl">
                  正答率と弱点を分析し、あなた専用の復習・強化ステップを提案します。
                </p>
              </div>
            </div>
            <RefreshPlanButton />
          </div>
          <LearningPlanSection plan={plan} />
        </section>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <div className="card p-6 sm:p-8">
            <div className="flex flex-wrap items-end justify-between gap-3 mb-6">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-accent">実績</p>
                <h2 className="mt-1 text-xl font-bold">分野別の得意・不得意</h2>
              </div>
              <p className="text-4xl font-bold tabular-nums text-accent">
                {stats.overall_accuracy}%
                <span className="ml-2 text-sm font-medium text-muted">総合正答率</span>
              </p>
            </div>
            <DomainBarChart stats={chartStats} />
          </div>

          <div className="card p-6 sm:p-8">
            <div className="flex flex-wrap items-end justify-between gap-3 mb-6">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-accent">履歴</p>
                <h2 className="mt-1 text-xl font-bold">最近の学習</h2>
              </div>
              {recentActivity.length > 0 && (
                <p className="text-3xl font-bold tabular-nums text-foreground">
                  {recentActivity.filter((a) => a.is_correct).length}
                  <span className="ml-1 text-sm font-medium text-muted">/ {recentActivity.length} 正解</span>
                </p>
              )}
            </div>
            {recentActivity.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border bg-stone-50 px-6 py-10 text-center">
                <p className="text-sm text-muted">まだ学習履歴がありません</p>
                <a href="#quiz-select" className="btn-primary mt-4 inline-flex">
                  最初のクイズに挑戦
                </a>
              </div>
            ) : (
              <ul className="space-y-4">
                {recentActivity.map((a, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span
                      className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white ${
                        a.is_correct ? 'bg-emerald-500' : 'bg-red-400'
                      }`}
                    >
                      {a.is_correct ? '✓' : '×'}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold">{a.lesson_title}</p>
                      <p className="text-sm text-muted line-clamp-1 mt-0.5">{a.question}</p>
                      <p className="text-xs text-muted mt-1">
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

        <div className="mt-10">
          <div className="flex items-end justify-between gap-4 mb-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-accent">{SITE_LABEL}</p>
              <h2 className="text-xl font-bold">コース進捗</h2>
            </div>
          </div>
          <div className="grid gap-6 sm:grid-cols-2">
            {progress.map((p) => {
              const pct = p.total_lessons > 0 ? Math.round((p.completed_lessons / p.total_lessons) * 100) : 0
              return (
                <Link
                  key={p.course_id}
                  href="#quiz-select"
                  className="card p-6 hover:border-emerald-200 hover:shadow-md transition-all"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent-soft text-2xl shrink-0">
                        {p.icon ?? '📘'}
                      </span>
                      <div className="min-w-0">
                        <p className="font-bold truncate">{p.course_title}</p>
                        <p className="text-sm text-muted mt-0.5">
                          {p.completed_lessons}/{p.total_lessons} セット完了
                        </p>
                      </div>
                    </div>
                    <p className="text-3xl font-bold tabular-nums text-accent shrink-0">{pct}%</p>
                  </div>
                  <div className="mt-4 h-3 rounded-full bg-stone-100 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-full transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </Link>
              )
            })}
          </div>
          <div className="mt-8 max-w-sm">
            <ManageButton />
          </div>
        </div>
      </div>
    </AppShell>
  )
}
