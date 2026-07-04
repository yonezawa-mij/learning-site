import { AppShell } from '@/components/AppShell'
import { PageHeader } from '@/components/PageHeader'
import { CourseCard } from '@/components/CourseCard'
import { requirePremium } from '@/lib/guards'
import { getCourses, getLessonProgress } from '@/lib/courses'

export const dynamic = 'force-dynamic'

export default async function CoursesPage() {
  const user = await requirePremium('/courses')
  const courses = await getCourses()

  const progressByCourse = await Promise.all(
    courses.map(async (c) => ({
      courseId: c.id,
      completed: (await getLessonProgress(user.id, c.id)).size,
    })),
  )
  const progressMap = new Map(progressByCourse.map((p) => [p.courseId, p.completed]))

  return (
    <AppShell subNav>
      <div className="mx-auto max-w-6xl px-6 py-10 sm:py-12">
        <PageHeader
          eyebrow="Courses"
          title="コース一覧"
          description="会員限定コンテンツ。自分のペースで、順番に学べます。"
        />

        {courses.length === 0 ? (
          <div className="card p-12 text-center text-muted">コース準備中です</div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {courses.map((course) => (
              <CourseCard
                key={course.id}
                course={course}
                completedCount={progressMap.get(course.id) ?? 0}
              />
            ))}
          </div>
        )}
      </div>
    </AppShell>
  )
}
