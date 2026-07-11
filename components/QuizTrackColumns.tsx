import Link from 'next/link'
import type { CourseLesson } from '@/lib/courses'
import { QUIZ_SOURCE_META, normalizeQuizSource } from '@/lib/quiz-sources'

export type LessonQuizStat = {
  lesson_id: string
  completed: boolean
  avg_score: number | null
  attempts: number
  answered_questions: number
  total_questions: number
}

type Props = {
  courseId: string
  lessons: CourseLesson[]
  completed: Set<string>
  lessonStats: LessonQuizStat[]
}

function lessonProgress(stat: LessonQuizStat | undefined): number {
  if (!stat) return 0
  if (stat.completed) return 100
  if (stat.total_questions <= 0) return stat.attempts > 0 ? 50 : 0
  return Math.round((stat.answered_questions / stat.total_questions) * 100)
}

function scoreLabel(stat: LessonQuizStat | undefined, done: boolean): string {
  if (done && stat?.avg_score != null) return `${stat.avg_score}点`
  if (stat && stat.answered_questions > 0) return `${lessonProgress(stat)}%`
  return '未挑戦'
}

function TrackColumn({
  title,
  description,
  lessons,
  courseId,
  completed,
  lessonStatsMap,
  accent,
}: {
  title: string
  description: string
  lessons: CourseLesson[]
  courseId: string
  completed: Set<string>
  lessonStatsMap: Map<string, LessonQuizStat>
  accent: 'stone' | 'violet'
}) {
  const doneCount = lessons.filter((l) => completed.has(l.id)).length
  const trackPct = lessons.length > 0 ? Math.round((doneCount / lessons.length) * 100) : 0
  const border = accent === 'stone' ? 'border-stone-200' : 'border-violet-200/80'
  const headerBg = accent === 'stone' ? 'bg-stone-50/80' : 'bg-violet-50/50'
  const accentText = accent === 'stone' ? 'text-stone-800' : 'text-violet-900'
  const accentBar = accent === 'stone' ? 'bg-stone-700' : 'bg-violet-600'
  const accentSoft = accent === 'stone' ? 'bg-stone-100' : 'bg-violet-100'

  return (
    <div className={`card overflow-hidden ${border}`}>
      <div className={`px-5 py-5 sm:px-6 sm:py-6 border-b border-border ${headerBg}`}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className={`text-lg font-bold ${accentText}`}>{title}</h3>
            <p className="text-sm text-muted mt-1">{description}</p>
          </div>
          <div className="text-right shrink-0">
            <p className={`text-3xl font-bold tabular-nums leading-none ${accentText}`}>{trackPct}%</p>
            <p className="mt-1 text-xs text-muted">
              {doneCount}/{lessons.length} 完了
            </p>
          </div>
        </div>
        <div className="mt-4 h-2.5 rounded-full bg-white/80 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${accentBar}`}
            style={{ width: `${trackPct}%` }}
          />
        </div>
      </div>

      {lessons.length === 0 ? (
        <p className="p-5 text-sm text-muted text-center">準備中</p>
      ) : (
        <ul className="divide-y divide-border">
          {lessons.map((lesson, i) => {
            const done = completed.has(lesson.id)
            const stat = lessonStatsMap.get(lesson.id)
            const progress = lessonProgress(stat)
            const inProgress = !done && (stat?.answered_questions ?? 0) > 0

            return (
              <li key={lesson.id}>
                <Link
                  href={`/courses/${courseId}/lessons/${lesson.id}`}
                  className="block px-5 py-5 sm:px-6 hover:bg-stone-50/80 transition-colors group"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-2xl text-center ${
                        done
                          ? 'bg-accent text-white'
                          : inProgress
                            ? 'bg-amber-100 text-amber-800'
                            : `${accentSoft} text-muted`
                      }`}
                    >
                      {done ? (
                        <>
                          <span className="text-lg font-bold leading-none">{stat?.avg_score ?? '✓'}</span>
                          <span className="text-[10px] font-medium mt-0.5">点</span>
                        </>
                      ) : inProgress ? (
                        <>
                          <span className="text-lg font-bold leading-none">{progress}</span>
                          <span className="text-[10px] font-medium mt-0.5">%</span>
                        </>
                      ) : (
                        <span className="text-xl font-bold">{i + 1}</span>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-base font-semibold group-hover:text-accent transition-colors">
                          {lesson.title}
                        </p>
                        {done && (
                          <span className="rounded-full bg-accent-soft px-2.5 py-0.5 text-xs font-semibold text-accent">
                            完了
                          </span>
                        )}
                        {inProgress && (
                          <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800">
                            学習中
                          </span>
                        )}
                      </div>
                      {lesson.domain && <p className="text-xs text-muted mt-1">{lesson.domain}</p>}

                      <div className="mt-3 flex items-center gap-3">
                        <div className="h-2 flex-1 max-w-xs rounded-full bg-stone-100 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              done ? 'bg-accent' : inProgress ? 'bg-amber-400' : 'bg-stone-300'
                            }`}
                            style={{ width: `${Math.max(done ? 100 : progress, done || inProgress ? 8 : 0)}%` }}
                          />
                        </div>
                        <span className="text-xs font-medium text-muted shrink-0">
                          {scoreLabel(stat, done)}
                        </span>
                      </div>
                    </div>

                    <span className="hidden sm:block text-muted group-hover:text-accent transition-colors text-lg">
                      →
                    </span>
                  </div>
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

export function QuizTrackColumns({ courseId, lessons, completed, lessonStats }: Props) {
  const lessonStatsMap = new Map(lessonStats.map((s) => [s.lesson_id, s]))
  const fixedLessons = lessons.filter((l) => normalizeQuizSource(l.quiz_source) === 'fixed')
  const difyLessons = lessons.filter((l) => normalizeQuizSource(l.quiz_source) === 'dify')

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <TrackColumn
        title={QUIZ_SOURCE_META.fixed.label}
        description={QUIZ_SOURCE_META.fixed.description}
        lessons={fixedLessons}
        courseId={courseId}
        completed={completed}
        lessonStatsMap={lessonStatsMap}
        accent="stone"
      />
      <TrackColumn
        title={QUIZ_SOURCE_META.dify.label}
        description={QUIZ_SOURCE_META.dify.description}
        lessons={difyLessons}
        courseId={courseId}
        completed={completed}
        lessonStatsMap={lessonStatsMap}
        accent="violet"
      />
    </div>
  )
}
