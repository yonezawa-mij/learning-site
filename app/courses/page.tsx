import Link from 'next/link'
import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'
import { requirePremium } from '@/lib/guards'
import { getCourses } from '@/lib/courses'
import { getLessonProgress } from '@/lib/courses'

export const dynamic = 'force-dynamic'

export default async function CoursesPage() {
  const user = await requirePremium('/courses')
  const courses = await getCourses()

  const progressByCourse = await Promise.all(
    courses.map(async (c) => ({
      courseId: c.id,
      completed: await getLessonProgress(user.id, c.id),
    })),
  )
  const progressMap = new Map(progressByCourse.map((p) => [p.courseId, p.completed]))

  return (
    <>
      <Navbar />
      <main className="flex-1 py-12">
        <div className="mx-auto max-w-6xl px-6">
          <h1 className="text-3xl font-bold">コース一覧</h1>
          <p className="mt-2 text-muted">会員限定コンテンツ · 自分のペースで進められます</p>

          {courses.length === 0 ? (
            <p className="mt-12 text-center text-muted">コース準備中です</p>
          ) : (
            <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {courses.map((course) => {
                const completed = progressMap.get(course.id) ?? new Set<string>()
                const pct = course.lesson_count > 0
                  ? Math.round((completed.size / course.lesson_count) * 100)
                  : 0
                return (
                  <Link
                    key={course.id}
                    href={`/courses/${course.id}`}
                    className="group rounded-2xl border border-border bg-white p-6 hover:border-accent/40 hover:shadow-md transition-all"
                  >
                    <div className="text-3xl mb-3">{course.icon ?? '📘'}</div>
                    {course.level && (
                      <span className="inline-block rounded-full bg-stone-100 px-2.5 py-0.5 text-xs font-medium text-muted mb-2">
                        {course.level}
                      </span>
                    )}
                    <h2 className="font-semibold group-hover:text-accent transition-colors">{course.title}</h2>
                    <p className="mt-2 text-sm text-muted line-clamp-3">{course.description}</p>
                    <div className="mt-4 pt-4 border-t border-border flex justify-between text-xs text-muted">
                      <span>{course.lesson_count} レッスン</span>
                      <span>{pct}% 完了</span>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  )
}
