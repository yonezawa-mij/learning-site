import Link from 'next/link'
import type { CourseLesson } from '@/lib/courses'

type Props = {
  courseId: string
  lessons: CourseLesson[]
  currentLessonId: string
  completed: Set<string>
}

export function LessonSidebar({ courseId, lessons, currentLessonId, completed }: Props) {
  const doneCount = completed.size

  return (
    <aside className="card lg:sticky lg:top-28 lg:self-start p-4">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted">レッスン</p>
        <span className="text-xs font-medium text-accent">{doneCount}/{lessons.length}</span>
      </div>
      <ul className="space-y-1 max-h-[60vh] overflow-y-auto pr-1">
        {lessons.map((lesson, i) => {
          const active = lesson.id === currentLessonId
          const done = completed.has(lesson.id)
          return (
            <li key={lesson.id}>
              <Link
                href={`/courses/${courseId}/lessons/${lesson.id}`}
                className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm transition-colors ${
                  active
                    ? 'bg-accent-soft text-emerald-900 font-medium ring-1 ring-emerald-200'
                    : 'hover:bg-stone-50 text-foreground'
                }`}
              >
                <span
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                    done ? 'bg-accent text-white' : active ? 'bg-white text-emerald-700' : 'bg-stone-100 text-muted'
                  }`}
                >
                  {done ? '✓' : i + 1}
                </span>
                <span className="line-clamp-2 leading-snug">{lesson.title}</span>
              </Link>
            </li>
          )
        })}
      </ul>
    </aside>
  )
}
