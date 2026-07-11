import Link from 'next/link'
import { notFound } from 'next/navigation'
import { AppShell } from '@/components/AppShell'
import { Breadcrumb } from '@/components/Breadcrumb'
import { QuizProgressHero } from '@/components/QuizProgressHero'
import { QuizTrackColumns } from '@/components/QuizTrackColumns'
import { DomainBarChart } from '@/components/DomainBarChart'
import { requirePremium } from '@/lib/guards'
import { getCourseById, getLessonProgress } from '@/lib/courses'
import { getCourseDomainStats, getCourseLearningStats, getCourseLessonStats } from '@/lib/quiz-analytics'
import { normalizeQuizSource } from '@/lib/quiz-sources'

export const dynamic = 'force-dynamic'

export default async function CourseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await requirePremium(`/courses/${id}`)
  const course = await getCourseById(id)
  if (!course) notFound()

  const [completed, stats, lessonStats, domainStats] = await Promise.all([
    getLessonProgress(user.id, id),
    getCourseLearningStats(user.id, id),
    getCourseLessonStats(user.id, id),
    getCourseDomainStats(user.id, id),
  ])

  const fixedLessons = course.lessons.filter((l) => normalizeQuizSource(l.quiz_source) === 'fixed')
  const difyLessons = course.lessons.filter((l) => normalizeQuizSource(l.quiz_source) === 'dify')
  const firstFixed = fixedLessons.find((l) => !completed.has(l.id))
  const firstDify = difyLessons.find((l) => !completed.has(l.id))

  return (
    <AppShell subNav>
      <div className="mx-auto max-w-6xl px-6 py-10 sm:py-12">
        <Breadcrumb
          items={[
            { label: 'コース', href: '/courses' },
            { label: course.title },
          ]}
        />

        <div className="mt-6">
          <QuizProgressHero
            title={course.title}
            icon={course.icon}
            level={course.level}
            description={course.description}
            stats={stats}
            completedLessons={completed.size}
            totalLessons={course.lessons.length}
          />
        </div>

        {(firstFixed || firstDify) && (
          <div className="mt-6 flex flex-wrap gap-3">
            {firstFixed && (
              <Link href={`/courses/${id}/lessons/${firstFixed.id}`} className="btn-primary !py-3 !px-6 text-base">
                カリキュラムを続ける →
              </Link>
            )}
            {firstDify && (
              <Link
                href={`/courses/${id}/lessons/${firstDify.id}`}
                className="btn-secondary !py-3 !px-6 text-base"
              >
                AI問題に挑戦 →
              </Link>
            )}
          </div>
        )}

        {domainStats.length > 0 && (
          <div className="card p-6 sm:p-8 mt-8">
            <div className="flex flex-wrap items-end justify-between gap-3 mb-6">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-accent">実績</p>
                <h2 className="mt-1 text-xl font-bold">分野別の得意・不得意</h2>
              </div>
              <p className="text-4xl font-bold tabular-nums text-accent">
                {stats.overall_accuracy}%
                <span className="ml-2 text-sm font-medium text-muted">総合正答率</span>
              </p>
            </div>
            <DomainBarChart stats={domainStats} />
          </div>
        )}

        <div className="mt-10">
          <h2 className="text-xl font-bold mb-5">セットを選ぶ</h2>
          <QuizTrackColumns
            courseId={id}
            lessons={course.lessons}
            completed={completed}
            lessonStats={lessonStats}
          />
        </div>
      </div>
    </AppShell>
  )
}
