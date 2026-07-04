import Link from 'next/link'
import type { CourseLesson } from '@/lib/courses'

type Props = {
  courseId: string
  lessons: CourseLesson[]
  currentLessonId: string
  completed: Set<string>
}

export function LessonSidebar({ courseId, lessons, currentLessonId, completed }: Props) {
  return (
    <aside className="rounded-2xl border border-border bg-white p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted mb-3">レッスン一覧</p>
      <ul className="space-y-1">
        {lessons.map((lesson, i) => {
          const active = lesson.id === currentLessonId
          const done = completed.has(lesson.id)
          return (
            <li key={lesson.id}>
              <Link
                href={`/courses/${courseId}/lessons/${lesson.id}`}
                className={`flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm transition-colors ${
                  active ? 'bg-accent-soft text-emerald-800 font-medium' : 'hover:bg-stone-50 text-foreground'
                }`}
              >
                <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs ${
                  done ? 'bg-accent text-white' : 'bg-stone-100 text-muted'
                }`}>
                  {done ? '✓' : i + 1}
                </span>
                <span className="line-clamp-2">{lesson.title}</span>
              </Link>
            </li>
          )
        })}
      </ul>
    </aside>
  )
}
