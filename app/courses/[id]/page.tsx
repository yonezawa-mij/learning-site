import Link from 'next/link'
import { notFound } from 'next/navigation'
import { AppShell } from '@/components/AppShell'
import { Breadcrumb } from '@/components/Breadcrumb'
import { ProgressBar } from '@/components/ProgressBar'
import { requirePremium } from '@/lib/guards'
import { getCourseById, getLessonProgress } from '@/lib/courses'

export const dynamic = 'force-dynamic'

export default async function CourseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await requirePremium(`/courses/${id}`)
  const course = await getCourseById(id)
  if (!course) notFound()

  const completed = await getLessonProgress(user.id, id)
  const firstIncomplete = course.lessons.find((l) => !completed.has(l.id)) ?? course.lessons[0]
  const allDone = course.lessons.length > 0 && course.lessons.every((l) => completed.has(l.id))

  return (
    <AppShell subNav>
      <div className="mx-auto max-w-3xl px-6 py-10 sm:py-12">
        <Breadcrumb
          items={[
            { label: 'コース', href: '/courses' },
            { label: course.title },
          ]}
        />

        <div className="card p-8">
          <div className="flex items-start gap-4">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-soft text-3xl">
              {course.icon ?? '📘'}
            </span>
            <div className="flex-1">
              {course.level && (
                <span className="inline-block rounded-full bg-stone-100 px-2.5 py-0.5 text-xs font-medium text-muted mb-2">
                  {course.level}
                </span>
              )}
              <h1 className="text-2xl font-bold">{course.title}</h1>
              <p className="mt-3 text-muted leading-relaxed">{course.description}</p>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-border">
            <ProgressBar value={completed.size} max={course.lessons.length} />
          </div>

          {firstIncomplete && (
            <Link
              href={`/courses/${id}/lessons/${firstIncomplete.id}`}
              className="btn-primary mt-6 inline-flex"
            >
              {allDone ? '最初から復習する' : completed.size > 0 ? '学習を続ける' : '学習を始める'}
            </Link>
          )}
        </div>

        <h2 className="mt-10 text-lg font-semibold">カリキュラム</h2>
        <ul className="mt-4 space-y-2">
          {course.lessons.map((lesson, i) => {
            const done = completed.has(lesson.id)
            return (
              <li key={lesson.id}>
                <Link
                  href={`/courses/${id}/lessons/${lesson.id}`}
                  className="card flex items-center gap-4 px-4 py-3.5 hover:border-emerald-200 transition-colors"
                >
                  <span
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${
                      done ? 'bg-accent text-white' : 'bg-stone-100 text-muted'
                    }`}
                  >
                    {done ? '✓' : i + 1}
                  </span>
                  <span className="flex-1 text-sm font-medium">{lesson.title}</span>
                  {lesson.duration_minutes && (
                    <span className="text-xs text-muted">{lesson.duration_minutes}分</span>
                  )}
                  {done && <span className="text-xs font-medium text-accent">完了</span>}
                </Link>
              </li>
            )
          })}
        </ul>
      </div>
    </AppShell>
  )
}
