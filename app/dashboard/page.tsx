import Link from 'next/link'
import { AppShell } from '@/components/AppShell'
import { StatCard } from '@/components/StatCard'
import { ManageButton } from '@/components/BillingButtons'
import { requireUser } from '@/lib/guards'
import { userIsPremium } from '@/lib/auth'
import { getUserProgressSummary, getTotalCompletedLessons } from '@/lib/courses'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const user = await requireUser('/dashboard')
  const premium = userIsPremium(user)
  const progress = premium ? await getUserProgressSummary(user.id) : []
  const totalCompleted = premium ? await getTotalCompletedLessons(user.id) : 0
  const inProgress = progress.filter((p) => p.completed_lessons > 0 && p.completed_lessons < p.total_lessons)

  return (
    <AppShell subNav>
      <div className="mx-auto max-w-5xl px-6 py-10 sm:py-12">
        <div className="card overflow-hidden mb-8">
          <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 px-6 py-8 sm:px-8 text-white">
            <p className="text-sm text-emerald-100">おかえりなさい</p>
            <h1 className="mt-1 text-2xl sm:text-3xl font-bold">{user.name} さん</h1>
            <p className="mt-2 text-emerald-100 text-sm">
              {premium ? '今日も学習を続けましょう' : 'プランに加入して学習を開始できます'}
            </p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
        </div>

        {!premium ? (
          <div className="mt-8 card p-8 text-center border-dashed border-emerald-200 bg-accent-soft/50">
            <h2 className="text-lg font-semibold text-emerald-900">有料会員プランに加入してください</h2>
            <p className="mt-2 text-sm text-emerald-800 max-w-md mx-auto">
              コースの閲覧・レッスン学習・進捗管理は有料会員限定です。
            </p>
            <Link href="/pricing" className="btn-primary mt-6 inline-flex">
              プランを見る
            </Link>
          </div>
        ) : (
          <>
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
