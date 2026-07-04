import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'
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

  return (
    <>
      <Navbar />
      <main className="flex-1 py-12">
        <div className="mx-auto max-w-3xl px-6">
          <Link href="/courses" className="text-sm text-accent hover:underline">← コース一覧</Link>

          <div className="mt-6 rounded-3xl border border-border bg-white p-8">
            <div className="text-4xl mb-4">{course.icon ?? '📘'}</div>
            {course.level && (
              <span className="inline-block rounded-full bg-stone-100 px-2.5 py-0.5 text-xs font-medium text-muted">
                {course.level}
              </span>
            )}
            <h1 className="mt-3 text-2xl font-bold">{course.title}</h1>
            <p className="mt-3 text-muted leading-relaxed">{course.description}</p>
            <div className="mt-6">
              <ProgressBar value={completed.size} max={course.lessons.length} />
            </div>
            {firstIncomplete && (
              <Link
                href={`/courses/${id}/lessons/${firstIncomplete.id}`}
                className="mt-6 inline-block rounded-full bg-accent px-6 py-3 text-sm font-semibold text-white hover:bg-emerald-700"
              >
                {completed.size > 0 ? '学習を続ける' : '学習を始める'}
              </Link>
            )}
          </div>

          <h2 className="mt-10 text-lg font-semibold">カリキュラム</h2>
          <ul className="mt-4 space-y-2">
            {course.lessons.map((lesson, i) => (
              <li key={lesson.id}>
                <Link
                  href={`/courses/${id}/lessons/${lesson.id}`}
                  className="flex items-center justify-between rounded-xl border border-border bg-white px-4 py-3 hover:border-accent/40 transition-colors"
                >
                  <span className="text-sm">
                    <span className="text-muted mr-2">{i + 1}.</span>
                    {lesson.title}
                  </span>
                  {completed.has(lesson.id) && <span className="text-xs font-medium text-accent">完了</span>}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </main>
      <Footer />
    </>
  )
}
