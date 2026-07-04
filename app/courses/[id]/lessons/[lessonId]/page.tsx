import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'
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
    <>
      <Navbar />
      <main className="flex-1 py-8">
        <div className="mx-auto max-w-6xl px-6">
          <Link href={`/courses/${id}`} className="text-sm text-accent hover:underline">
            ← {course.title}
          </Link>

          <div className="mt-6 grid gap-6 lg:grid-cols-[280px_1fr]">
            <LessonSidebar
              courseId={id}
              lessons={course.lessons}
              currentLessonId={lessonId}
              completed={completed}
            />

            <article className="rounded-2xl border border-border bg-white p-6 sm:p-8">
              <p className="text-xs font-medium text-muted uppercase tracking-wide">
                レッスン {idx + 1} / {course.lessons.length}
              </p>
              <h1 className="mt-2 text-2xl font-bold">{lesson.title}</h1>
              {lesson.duration_minutes && (
                <p className="mt-1 text-sm text-muted">目安 {lesson.duration_minutes} 分</p>
              )}

              <div className="mt-8">
                <LessonContent content={lesson.content} />
              </div>

              <div className="mt-10 flex flex-wrap items-center gap-3 border-t border-border pt-6">
                {!isDone && (
                  <form action={completeLessonAction.bind(null, lessonId, id)}>
                    <button
                      type="submit"
                      className="rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700"
                    >
                      完了にする
                    </button>
                  </form>
                )}
                {isDone && (
                  <span className="text-sm font-medium text-accent">✓ このレッスンは完了済みです</span>
                )}
                <div className="ml-auto flex gap-2">
                  {prev && (
                    <Link
                      href={`/courses/${id}/lessons/${prev.id}`}
                      className="rounded-full border border-border px-4 py-2 text-sm hover:bg-stone-50"
                    >
                      前へ
                    </Link>
                  )}
                  {next ? (
                    <Link
                      href={`/courses/${id}/lessons/${next.id}`}
                      className="rounded-full bg-foreground px-4 py-2 text-sm text-white hover:bg-stone-800"
                    >
                      次へ
                    </Link>
                  ) : (
                    <Link
                      href={`/courses/${id}`}
                      className="rounded-full bg-foreground px-4 py-2 text-sm text-white hover:bg-stone-800"
                    >
                      コースに戻る
                    </Link>
                  )}
                </div>
              </div>
            </article>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
