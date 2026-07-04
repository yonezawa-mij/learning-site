import Link from 'next/link'
import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'
import { ProgressBar } from '@/components/ProgressBar'
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

  return (
    <>
      <Navbar />
      <main className="flex-1 py-12">
        <div className="mx-auto max-w-4xl px-6">
          <h1 className="text-2xl font-bold">マイページ</h1>
          <p className="mt-1 text-muted">こんにちは、{user.name} さん</p>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-border bg-white p-6">
              <p className="text-sm text-muted">会員ステータス</p>
              <p className="mt-1 text-lg font-semibold">
                {premium ? '有料会員（アクティブ）' : '未加入'}
              </p>
              {user.current_period_end && premium && (
                <p className="mt-2 text-xs text-muted">
                  次回更新: {new Date(user.current_period_end).toLocaleDateString('ja-JP')}
                </p>
              )}
            </div>
            <div className="rounded-2xl border border-border bg-white p-6">
              <p className="text-sm text-muted">完了レッスン数</p>
              <p className="mt-1 text-lg font-semibold">{totalCompleted} レッスン</p>
            </div>
          </div>

          {!premium ? (
            <div className="mt-8 rounded-2xl border border-dashed border-accent/40 bg-accent-soft p-8 text-center">
              <h2 className="font-semibold text-emerald-900">有料会員プランに加入してください</h2>
              <p className="mt-2 text-sm text-emerald-800">コースの閲覧・学習には有料会員登録が必要です。</p>
              <Link href="/pricing" className="mt-5 inline-block rounded-full bg-accent px-6 py-3 text-sm font-semibold text-white hover:bg-emerald-700">
                プランを見る
              </Link>
            </div>
          ) : (
            <>
              <div className="mt-8 flex items-center justify-between">
                <h2 className="text-lg font-semibold">学習中のコース</h2>
                <Link href="/courses" className="text-sm text-accent hover:underline">すべて見る</Link>
              </div>
              <div className="mt-4 space-y-4">
                {progress.map((p) => (
                  <Link
                    key={p.course_id}
                    href={`/courses/${p.course_id}`}
                    className="block rounded-2xl border border-border bg-white p-5 hover:border-accent/40 transition-colors"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-2xl">{p.icon ?? '📘'}</span>
                      <p className="font-medium">{p.course_title}</p>
                    </div>
                    <ProgressBar value={p.completed_lessons} max={p.total_lessons} />
                  </Link>
                ))}
              </div>
              <div className="mt-8">
                <ManageButton />
              </div>
            </>
          )}
        </div>
      </main>
      <Footer />
    </>
  )
}
