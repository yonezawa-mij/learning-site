import Link from 'next/link'
import { notFound } from 'next/navigation'
import { AppShell } from '@/components/AppShell'
import { Breadcrumb } from '@/components/Breadcrumb'
import { ProgressBar } from '@/components/ProgressBar'
import { QuizTrackColumns } from '@/components/QuizTrackColumns'
import { requirePremium } from '@/lib/guards'
import { getCourseById, getLessonProgress } from '@/lib/courses'
import { normalizeQuizSource } from '@/lib/quiz-sources'

export const dynamic = 'force-dynamic'

export default async function CourseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await requirePremium(`/courses/${id}`)
  const course = await getCourseById(id)
  if (!course) notFound()

  const completed = await getLessonProgress(user.id, id)
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

        <div className="card p-8 mb-8">
          <div className="flex items-start gap-4">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-soft text-3xl">
              {course.icon ?? '🇬🇧'}
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
            <p className="mt-2 text-xs text-muted">
              {completed.size}/{course.lessons.length} セット完了
            </p>
          </div>

          {(firstFixed || firstDify) && (
            <div className="mt-6 flex flex-wrap gap-3">
              {firstFixed && (
                <Link
                  href={`/courses/${id}/lessons/${firstFixed.id}`}
                  className="btn-primary !py-2.5 !px-5"
                >
                  カリキュラムを始める
                </Link>
              )}
              {firstDify && (
                <Link
                  href={`/courses/${id}/lessons/${firstDify.id}`}
                  className="btn-secondary !py-2.5 !px-5"
                >
                  AI問題に挑戦
                </Link>
              )}
            </div>
          )}
        </div>

        <QuizTrackColumns courseId={id} lessons={course.lessons} completed={completed} />
      </div>
    </AppShell>
  )
}
