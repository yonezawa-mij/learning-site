import { AppShell } from '@/components/AppShell'
import { PageHeader } from '@/components/PageHeader'
import { QuizProgressHero } from '@/components/QuizProgressHero'
import { QuizTrackColumns } from '@/components/QuizTrackColumns'
import { DomainBarChart } from '@/components/DomainBarChart'
import { requirePremium } from '@/lib/guards'
import { getCourses, getCourseById, getLessonProgress } from '@/lib/courses'
import { getCourseDomainStats, getCourseLearningStats, getCourseLessonStats } from '@/lib/quiz-analytics'

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
      const [completed, stats, lessonStats, domainStats] = await Promise.all([
        getLessonProgress(user.id, c.id),
        getCourseLearningStats(user.id, c.id),
        getCourseLessonStats(user.id, c.id),
        getCourseDomainStats(user.id, c.id),
      ])
      return { course: c, detail, completed, stats, lessonStats, domainStats }
    }),
  )

  return (
    <AppShell subNav>
      <div className="mx-auto max-w-6xl px-6 py-10 sm:py-12">
        <PageHeader
          eyebrow="Courses"
          title="クイズを選ぶ"
          description="進捗と実績を確認しながら、次に挑戦するセットを選びましょう。"
        />

        <div className="space-y-14">
          {courseDetails.map(({ course, detail, completed, stats, lessonStats, domainStats }) => {
            if (!detail) return null

            return (
              <section key={course.id}>
                <QuizProgressHero
                  title={course.title}
                  icon={course.icon}
                  level={course.level}
                  description={course.description}
                  stats={stats}
                  completedLessons={completed.size}
                  totalLessons={detail.lessons.length}
                />

                {domainStats.length > 0 && (
                  <div className="card p-6 sm:p-8 mt-6">
                    <div className="flex flex-wrap items-end justify-between gap-3 mb-6">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-accent">実績</p>
                        <h3 className="mt-1 text-xl font-bold">分野別の得意・不得意</h3>
                      </div>
                      <p className="text-3xl font-bold tabular-nums text-accent">
                        {stats.overall_accuracy}%
                        <span className="ml-2 text-sm font-medium text-muted">総合正答率</span>
                      </p>
                    </div>
                    <DomainBarChart stats={domainStats} />
                  </div>
                )}

                <div className="mt-8">
                  <h3 className="text-lg font-bold mb-4">セットを選ぶ</h3>
                  <QuizTrackColumns
                    courseId={course.id}
                    lessons={detail.lessons}
                    completed={completed}
                    lessonStats={lessonStats}
                  />
                </div>
              </section>
            )
          })}
        </div>
      </div>
    </AppShell>
  )
}
