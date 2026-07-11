'use client'

import { useEffect, useState } from 'react'
import { getWeaknessThemes, loadLearningStore } from '@/lib/learning-local-store'

type Props = {
  serverWeaknesses?: string[]
  className?: string
}

export function WeaknessTags({ serverWeaknesses = [], className = '' }: Props) {
  const [themes, setThemes] = useState<string[]>(serverWeaknesses)

  useEffect(() => {
    const local = getWeaknessThemes(loadLearningStore())
    const merged = [...new Set([...serverWeaknesses, ...local])]
    setThemes(merged)
  }, [serverWeaknesses])

  if (themes.length === 0) {
    return (
      <p id="weakness-tags" className={`text-xs text-muted ${className}`}>
        つまずき分野はまだありません。クイズに挑戦すると自動で表示されます。
      </p>
    )
  }

  return (
    <div id="weakness-tags" className={`flex flex-wrap gap-2 ${className}`}>
      {themes.map((theme) => (
        <span
          key={theme}
          className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-900 border border-amber-200"
        >
          つまずき: {theme}
        </span>
      ))}
    </div>
  )
}
