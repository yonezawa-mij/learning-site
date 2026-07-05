import Link from 'next/link'
import type { CourseLesson } from '@/lib/courses'
import { QUIZ_SOURCE_META, normalizeQuizSource } from '@/lib/quiz-sources'

type Props = {
  courseId: string
  lessons: CourseLesson[]
  completed: Set<string>
}

function TrackColumn({
  title,
  description,
  lessons,
  courseId,
  completed,
  accent,
}: {
  title: string
  description: string
  lessons: CourseLesson[]
  courseId: string
  completed: Set<string>
  accent: 'stone' | 'violet'
}) {
  const doneCount = lessons.filter((l) => completed.has(l.id)).length
  const border = accent === 'stone' ? 'border-stone-200' : 'border-violet-200/80'
  const headerBg = accent === 'stone' ? 'bg-stone-50/80' : 'bg-violet-50/50'

  return (
    <div className={`card overflow-hidden ${border}`}>
      <div className={`px-5 py-4 border-b border-border ${headerBg}`}>
        <h3 className="font-semibold">{title}</h3>
        <p className="text-sm text-muted mt-1">{description}</p>
        <p className="text-xs text-muted mt-3">
          {doneCount}/{lessons.length} セット完了
        </p>
      </div>

      {lessons.length === 0 ? (
        <p className="p-5 text-sm text-muted text-center">準備中</p>
      ) : (
        <ul className="divide-y divide-border">
          {lessons.map((lesson, i) => {
            const done = completed.has(lesson.id)
            return (
              <li key={lesson.id}>
                <Link
                  href={`/courses/${courseId}/lessons/${lesson.id}`}
                  className="flex items-center gap-3 px-5 py-4 hover:bg-stone-50 transition-colors group"
                >
                  <span
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${
                      done ? 'bg-accent text-white' : 'bg-stone-100 text-muted'
                    }`}
                  >
                    {done ? '✓' : i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium group-hover:text-accent transition-colors">
                      {lesson.title}
                    </p>
                    {lesson.domain && (
                      <p className="text-xs text-muted mt-0.5">{lesson.domain}</p>
                    )}
                  </div>
                  {done && <span className="text-xs text-accent shrink-0">完了</span>}
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

export function QuizTrackColumns({ courseId, lessons, completed }: Props) {
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
        accent="stone"
      />
      <TrackColumn
        title={QUIZ_SOURCE_META.dify.label}
        description={QUIZ_SOURCE_META.dify.description}
        lessons={difyLessons}
        courseId={courseId}
        completed={completed}
        accent="violet"
      />
    </div>
  )
}
