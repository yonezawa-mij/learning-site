'use client'

import { useCallback, useEffect, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { submitQuizAnswerAction, regenerateQuizAction, type QuizAnswerResult } from '@/app/actions/quiz'
import type { QuizSource } from '@/lib/quiz-sources'

type QuizQuestionView = {
  id: string
  sort_order: number
  question: string
  choices: string[]
  bridge_text: string
  answered: boolean
  attempt: {
    user_answer: string
    is_correct: boolean
    understanding_score: number
    ai_feedback: string
  } | null
}

type Props = {
  courseId: string
  lessonId: string
  domain: string | null
  title: string
  quizSource?: QuizSource
  canRegenerate?: boolean
  initialQuestions: QuizQuestionView[]
  initialOrder: number
  initialAllDone: boolean
}

export function QuizPlayer({
  courseId,
  lessonId,
  domain,
  title,
  quizSource = 'fixed',
  canRegenerate = false,
  initialQuestions,
  initialOrder,
  initialAllDone,
}: Props) {
  const router = useRouter()
  const [questions, setQuestions] = useState(initialQuestions)
  const [currentOrder, setCurrentOrder] = useState(initialOrder)
  const [allDone, setAllDone] = useState(initialAllDone)
  const [answer, setAnswer] = useState('')
  const [selectedChoice, setSelectedChoice] = useState<string | null>(null)
  const [result, setResult] = useState<QuizAnswerResult | null>(null)
  const [pending, startTransition] = useTransition()
  const [regenerating, setRegenerating] = useState(false)

  const current = questions.find((q) => q.sort_order === currentOrder)
  const total = questions.length

  const refreshFromServer = useCallback(async () => {
    const res = await fetch(`/api/quiz/${courseId}/${lessonId}`)
    if (!res.ok) return
    const data = await res.json()
    setQuestions(data.questions)
    setCurrentOrder(data.currentOrder)
    setAllDone(data.allDone)
  }, [courseId, lessonId])

  useEffect(() => {
    setQuestions(initialQuestions)
    setCurrentOrder(initialOrder)
    setAllDone(initialAllDone)
  }, [initialQuestions, initialOrder, initialAllDone])

  function goNext() {
    setResult(null)
    setAnswer('')
    setSelectedChoice(null)
    if (currentOrder < total) {
      setCurrentOrder(currentOrder + 1)
    } else {
      setAllDone(true)
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!current) return
    const finalAnswer = current.choices.length > 0 ? (selectedChoice ?? '') : answer
    if (!finalAnswer.trim()) return

    startTransition(async () => {
      const res = await submitQuizAnswerAction(courseId, lessonId, current.id, finalAnswer)
      setResult(res)
      await refreshFromServer()
    })
  }

  function handleRegenerate() {
    if (!confirm('新しい問題セットを生成します。現在の進捗はリセットされます。')) return
    setRegenerating(true)
    startTransition(async () => {
      const res = await regenerateQuizAction(courseId, lessonId)
      setRegenerating(false)
      if (res.error) {
        alert(res.error)
        return
      }
      router.refresh()
    })
  }

  if (questions.length === 0 && !pending && !regenerating) {
    return (
      <div className="card p-8 text-center">
        <h2 className="text-xl font-bold">問題を準備しています</h2>
        <p className="mt-2 text-sm text-muted">少々お待ちください</p>
        {canRegenerate && (
          <button type="button" onClick={handleRegenerate} className="btn-primary mt-6" disabled={regenerating}>
            {regenerating ? '生成中...' : '問題を生成する'}
          </button>
        )}
      </div>
    )
  }

  if (allDone && !result) {
    const scores = questions.map((q) => q.attempt?.understanding_score ?? 0)
    const avg = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0
    return (
      <div className="card p-8 text-center">
        <span className="text-4xl">🎉</span>
        <h2 className="mt-4 text-xl font-bold">セット完了</h2>
        <p className="mt-2 text-muted">理解度スコア: <strong className="text-accent">{avg}%</strong></p>
        <p className="mt-4 text-sm text-muted max-w-md mx-auto">
          {avg >= 85
            ? 'この分野はよく理解できています。次のセットに進みましょう。'
            : avg >= 60
              ? '基本は押さえています。間違えた問題を見直してから次へ。'
              : 'もう一度順番に解いて、会話の流れを復習しましょう。'}
        </p>
        {canRegenerate && (
          <button type="button" onClick={handleRegenerate} className="btn-secondary mt-6" disabled={regenerating}>
            {regenerating ? '生成中...' : '別の問題に挑戦'}
          </button>
        )}
      </div>
    )
  }

  if (!current) return null

  const showingResult = result && !pending
  const prevAnswered = current.attempt

  return (
    <div className="space-y-6">
      <div className="card p-6 sm:p-8">
        <div className="flex flex-wrap items-center gap-2 text-xs font-medium">
          {domain && (
            <span className="rounded-full bg-accent-soft px-3 py-1 text-emerald-800">分野: {domain}</span>
          )}
          <span className="rounded-full bg-stone-100 px-3 py-1 text-muted">
            問題 {currentOrder} / {total}
          </span>
          {canRegenerate && (
            <button
              type="button"
              onClick={handleRegenerate}
              disabled={regenerating || pending}
              className="rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-violet-800 hover:bg-violet-100 transition-colors"
            >
              {regenerating ? '生成中...' : '問題を再生成'}
            </button>
          )}
        </div>

        <h2 className="mt-4 text-lg font-bold">{title}</h2>

        {current.bridge_text && currentOrder > 1 && (
          <p className="mt-3 text-sm text-muted border-l-2 border-accent pl-3">{current.bridge_text}</p>
        )}

        <p className="mt-6 text-base sm:text-lg font-medium leading-relaxed">{current.question}</p>

        {!showingResult && !prevAnswered && (
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            {current.choices.length > 0 ? (
              <div className="space-y-2">
                {current.choices.map((choice) => (
                  <label
                    key={choice}
                    className={`flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 transition-colors ${
                      selectedChoice === choice
                        ? 'border-accent bg-accent-soft'
                        : 'border-border hover:border-emerald-200'
                    }`}
                  >
                    <input
                      type="radio"
                      name="choice"
                      value={choice}
                      checked={selectedChoice === choice}
                      onChange={() => setSelectedChoice(choice)}
                      className="accent-emerald-600"
                    />
                    <span className="text-sm">{choice}</span>
                  </label>
                ))}
              </div>
            ) : (
              <input
                type="text"
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder="英語で回答を入力"
                className="input-field"
                autoComplete="off"
              />
            )}
            <button type="submit" disabled={pending} className="btn-primary disabled:opacity-60">
              {pending ? '判定中...' : '回答する'}
            </button>
          </form>
        )}

        {(showingResult || prevAnswered) && (
          <div className="mt-6 space-y-4">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-600 px-2.5 py-0.5 text-[10px] font-bold text-white">
                <span className="h-1 w-1 rounded-full bg-white animate-pulse" />
                AI即時フィードバック
              </span>
              <span className="text-xs text-muted">24時間対応 · 理解度を自動判定</span>
            </div>
            <div
              className={`rounded-xl border p-4 ${
                (result?.isCorrect ?? prevAnswered?.is_correct)
                  ? 'border-emerald-200 bg-accent-soft'
                  : 'border-amber-200 bg-amber-50'
              }`}
            >
              <p className="text-sm font-semibold">
                {(result?.isCorrect ?? prevAnswered?.is_correct) ? '✓ 正解' : '✗ 不正解'}
                {(result?.score ?? prevAnswered?.understanding_score) != null && (
                  <span className="ml-2 font-normal text-muted">
                    理解度 {result?.score ?? prevAnswered?.understanding_score}%
                  </span>
                )}
              </p>
              <p className="mt-2 text-sm whitespace-pre-wrap leading-relaxed">
                {result?.feedback ?? prevAnswered?.ai_feedback?.split('\n\n')[0]}
              </p>
              {(result?.encouragement || prevAnswered?.ai_feedback?.includes('\n\n')) && (
                <p className="mt-2 text-sm text-muted whitespace-pre-wrap">
                  {result?.encouragement ?? prevAnswered?.ai_feedback?.split('\n\n').slice(1).join('\n\n')}
                </p>
              )}
              {result?.nextFocus && (
                <p className="mt-3 text-xs font-medium text-accent">次への焦点: {result.nextFocus}</p>
              )}
            </div>

            {result?.setComplete && result.setSummary && (
              <div className="rounded-xl border border-emerald-200 bg-white p-4">
                <p className="font-semibold">セット完了 — 総合理解度 {result.setSummary.avg}%（{result.setSummary.level}）</p>
                <p className="mt-1 text-sm text-muted">{result.setSummary.advice}</p>
              </div>
            )}

            <button type="button" onClick={goNext} className="btn-primary">
              {result?.setComplete || (prevAnswered && currentOrder >= total) ? '結果を見る' : '次の問題へ →'}
            </button>
          </div>
        )}
      </div>

      <div className="flex gap-1">
        {questions.map((q) => (
          <div
            key={q.id}
            className={`h-1.5 flex-1 rounded-full ${
              q.answered ? 'bg-accent' : q.sort_order === currentOrder ? 'bg-emerald-300' : 'bg-stone-200'
            }`}
          />
        ))}
      </div>
    </div>
  )
}
