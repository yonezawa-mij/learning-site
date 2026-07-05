import { AppShell } from '@/components/AppShell'
import { PageHeader } from '@/components/PageHeader'
import { QuizTrackColumns } from '@/components/QuizTrackColumns'
import { ProgressBar } from '@/components/ProgressBar'
import { requirePremium } from '@/lib/guards'
import { getCourses, getCourseById, getLessonProgress } from '@/lib/courses'

export const dynamic = 'force-dynamic'

export default async function CoursesPage() {
  const user = await requirePremium('/courses')
  const courses = await getCourses()

  if (courses.length === 0) {
    return (
      <AppShell subNav>
        <div className="mx-auto max-w-6xl px-6 py-10 sm:py-12">
          <PageHeader eyebrow="Courses" title="コース" />
          <div className="card p-12 text-center text-muted">現在、受講可能なコースはありません。</div>
        </div>
      </AppShell>
    )
  }

  const courseDetails = await Promise.all(
    courses.map(async (c) => {
      const detail = await getCourseById(c.id)
      const completed = await getLessonProgress(user.id, c.id)
      return { course: c, detail, completed }
    }),
  )

  return (
    <AppShell subNav>
      <div className="mx-auto max-w-6xl px-6 py-10 sm:py-12">
        <PageHeader eyebrow="Courses" title="コース" />

        <div className="space-y-12">
          {courseDetails.map(({ course, detail, completed }) => {
            if (!detail) return null

            return (
              <section key={course.id}>
                <div className="flex flex-wrap items-start gap-4 mb-6">
                  <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-soft text-3xl">
                    {course.icon ?? '🇬🇧'}
                  </span>
                  <div className="flex-1 min-w-0">
                    {course.level && (
                      <span className="inline-block rounded-full bg-stone-100 px-2.5 py-0.5 text-xs font-medium text-muted mb-2">
                        {course.level}
                      </span>
                    )}
                    <h2 className="text-xl font-bold">{course.title}</h2>
                    <p className="mt-2 text-sm text-muted leading-relaxed max-w-2xl">
                      {course.description}
                    </p>
                    <div className="mt-4 max-w-md">
                      <ProgressBar value={completed.size} max={detail.lessons.length} />
                      <p className="mt-1 text-xs text-muted">
                        {completed.size}/{detail.lessons.length} セット完了
                      </p>
                    </div>
                  </div>
                </div>

                <QuizTrackColumns
                  courseId={course.id}
                  lessons={detail.lessons}
                  completed={completed}
                />
              </section>
            )
          })}
        </div>
      </div>
    </AppShell>
  )
}
