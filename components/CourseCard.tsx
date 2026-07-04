import Link from 'next/link'
import { ProgressBar } from '@/components/ProgressBar'
import type { Course } from '@/lib/courses'

type Props = {
  course: Course
  completedCount: number
}

export function CourseCard({ course, completedCount }: Props) {
  const pct = course.lesson_count > 0 ? Math.round((completedCount / course.lesson_count) * 100) : 0

  return (
    <Link
      href={`/courses/${course.id}`}
      className="card group flex flex-col p-6 transition-all hover:border-emerald-200 hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-3">
        <span className="text-3xl">{course.icon ?? '📘'}</span>
        {course.level && (
          <span className="rounded-full bg-stone-100 px-2.5 py-0.5 text-xs font-medium text-muted">
            {course.level}
          </span>
        )}
      </div>
      <h2 className="mt-4 font-semibold text-foreground group-hover:text-accent transition-colors">
        {course.title}
      </h2>
      <p className="mt-2 flex-1 text-sm leading-relaxed text-muted line-clamp-3">{course.description}</p>
      <div className="mt-5 pt-4 border-t border-border space-y-3">
        <ProgressBar value={completedCount} max={course.lesson_count} />
        <div className="flex justify-between text-xs text-muted">
          <span>{course.lesson_count} レッスン</span>
          <span>{pct === 100 ? '完了' : pct === 0 ? '未開始' : `${pct}% 完了`}</span>
        </div>
      </div>
    </Link>
  )
}
