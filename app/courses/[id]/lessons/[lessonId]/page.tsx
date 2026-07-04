import Link from 'next/link'
import { notFound } from 'next/navigation'
import { AppShell } from '@/components/AppShell'
import { Breadcrumb } from '@/components/Breadcrumb'
import { LessonSidebar } from '@/components/LessonSidebar'
import { LessonContent } from '@/components/LessonContent'
import { requirePremium } from '@/lib/guards'
import { getCourseById, getLessonById, getLessonProgress } from '@/lib/courses'
import { completeLessonAction } from '@/app/actions/platform'

export const dynamic = 'force-dynamic'

export default async function LessonPage({
  params,
}: {
  params: Promise<{ id: string; lessonId: string }>
}) {
  const { id, lessonId } = await params
  const user = await requirePremium(`/courses/${id}/lessons/${lessonId}`)
  const course = await getCourseById(id)
  if (!course) notFound()

  const lesson = await getLessonById(id, lessonId)
  if (!lesson) notFound()

  const completed = await getLessonProgress(user.id, id)
  const idx = course.lessons.findIndex((l) => l.id === lessonId)
  const prev = idx > 0 ? course.lessons[idx - 1] : null
  const next = idx < course.lessons.length - 1 ? course.lessons[idx + 1] : null
  const isDone = completed.has(lessonId)

  return (
    <AppShell subNav>
      <div className="mx-auto max-w-6xl px-6 py-8 sm:py-10">
        <Breadcrumb
          items={[
            { label: 'コース', href: '/courses' },
            { label: course.title, href: `/courses/${id}` },
            { label: lesson.title },
          ]}
        />

        <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
          <LessonSidebar
            courseId={id}
            lessons={course.lessons}
            currentLessonId={lessonId}
            completed={completed}
          />

          <article className="card p-6 sm:p-8 lg:p-10">
            <div className="flex flex-wrap items-center gap-3 text-xs font-medium text-muted">
              <span className="rounded-full bg-stone-100 px-2.5 py-1">
                レッスン {idx + 1} / {course.lessons.length}
              </span>
              {lesson.duration_minutes && (
                <span>目安 {lesson.duration_minutes} 分</span>
              )}
              {isDone && (
                <span className="rounded-full bg-accent-soft px-2.5 py-1 text-emerald-700">完了済み</span>
              )}
            </div>

            <h1 className="mt-4 text-2xl sm:text-3xl font-bold tracking-tight">{lesson.title}</h1>

            <div className="mt-8 rounded-xl bg-stone-50/80 p-6 sm:p-8 border border-stone-100">
              <LessonContent content={lesson.content} />
            </div>

            <div className="mt-10 flex flex-wrap items-center gap-3 border-t border-border pt-6">
              {!isDone && (
                <form action={completeLessonAction.bind(null, lessonId, id)}>
                  <button type="submit" className="btn-primary !py-2.5 !px-5">
                    完了にする
                  </button>
                </form>
              )}
              {isDone && (
                <span className="inline-flex items-center gap-1.5 text-sm font-medium text-accent">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-accent text-white text-xs">✓</span>
                  このレッスンは完了済みです
                </span>
              )}
              <div className="ml-auto flex gap-2">
                {prev && (
                  <Link href={`/courses/${id}/lessons/${prev.id}`} className="btn-secondary !py-2 !px-4 text-sm">
                    ← 前へ
                  </Link>
                )}
                {next ? (
                  <Link href={`/courses/${id}/lessons/${next.id}`} className="btn-primary !py-2 !px-4 text-sm">
                    次へ →
                  </Link>
                ) : (
                  <Link href={`/courses/${id}`} className="btn-primary !py-2 !px-4 text-sm">
                    コースに戻る
                  </Link>
                )}
              </div>
            </div>
          </article>
        </div>
      </div>
    </AppShell>
  )
}
