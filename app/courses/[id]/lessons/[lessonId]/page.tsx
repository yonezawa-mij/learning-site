import Link from 'next/link'
import { notFound } from 'next/navigation'
import { AppShell } from '@/components/AppShell'
import { Breadcrumb } from '@/components/Breadcrumb'
import { LessonSidebar } from '@/components/LessonSidebar'
import { LessonContent } from '@/components/LessonContent'
import { QuizPlayer } from '@/components/QuizPlayer'
import { TutorChat } from '@/components/TutorChat'
import { QuizSourceBadge } from '@/components/QuizSourceBadge'
import { requirePremium } from '@/lib/guards'
import { getCourseById, getLessonById, getLessonProgress } from '@/lib/courses'
import { getQuizQuestions, getQuizAttempts } from '@/lib/quiz'
import { normalizeQuizSource } from '@/lib/quiz-sources'
import { getTutorMessages } from '@/lib/tutor'
import { completeLessonAction } from '@/app/actions/platform'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

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
  const isQuiz = lesson.lesson_type === 'quiz'

  let quizProps = null
  let quizMeta = null

  if (isQuiz) {
    const questions = await getQuizQuestions(lessonId, user.id)
    const attempts = await getQuizAttempts(user.id, lessonId)
    let currentOrder = 1
    for (const q of questions) {
      if (!attempts.has(q.id)) {
        currentOrder = q.sort_order
        break
      }
      currentOrder = q.sort_order
    }
    const allDone = questions.length > 0 && questions.every((q) => attempts.has(q.id))
    const source = normalizeQuizSource(lesson.quiz_source)
    const firstGenerated = questions.find((q) => q.generated_at)?.generated_at ?? null
    const sourceUrl = questions.find((q) => q.source_url)?.source_url ?? null

    quizMeta = { source, generatedAt: firstGenerated, sourceUrl, canRegenerate: source !== 'fixed' }
    quizProps = {
      initialQuestions: questions.map((q) => ({
        id: q.id,
        sort_order: q.sort_order,
        question: q.question,
        choices: JSON.parse(q.choices || '[]') as string[],
        bridge_text: q.bridge_text,
        answered: attempts.has(q.id),
        attempt: attempts.get(q.id) ?? null,
      })),
      initialOrder: currentOrder,
      initialAllDone: allDone,
    }
  }

  const tutorMessages = await getTutorMessages(user.id, 20)

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

          {isQuiz && quizProps ? (
            <div className="space-y-6">
              {quizMeta && <QuizSourceBadge source={quizMeta.source} />}
              <QuizPlayer
                courseId={id}
                lessonId={lessonId}
                domain={lesson.domain}
                title={lesson.title}
                quizSource={quizMeta?.source ?? 'fixed'}
                canRegenerate={quizMeta?.canRegenerate ?? false}
                {...quizProps}
              />
              <TutorChat
                initialMessages={tutorMessages}
                compact
                lessonContext={{
                  lessonId,
                  lessonTitle: lesson.title,
                  domain: lesson.domain,
                }}
              />
              <div className="flex gap-2 justify-end">
                {prev && (
                  <Link href={`/courses/${id}/lessons/${prev.id}`} className="btn-secondary !py-2 !px-4 text-sm">
                    ← 前のセット
                  </Link>
                )}
                {next && (
                  <Link href={`/courses/${id}/lessons/${next.id}`} className="btn-primary !py-2 !px-4 text-sm">
                    次のセット →
                  </Link>
                )}
              </div>
            </div>
          ) : (
            <article className="card p-6 sm:p-8 lg:p-10">
              <div className="flex flex-wrap items-center gap-3 text-xs font-medium text-muted">
                <span className="rounded-full bg-stone-100 px-2.5 py-1">
                  レッスン {idx + 1} / {course.lessons.length}
                </span>
                {lesson.duration_minutes && <span>目安 {lesson.duration_minutes} 分</span>}
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
          )}
        </div>
      </div>
    </AppShell>
  )
}
