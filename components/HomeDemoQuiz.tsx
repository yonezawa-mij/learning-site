'use client'

import Link from 'next/link'
import { useState } from 'react'

type DemoQuestion = {
  question: string
  choices: string[]
  correct_answer: string
  explanation: string
  bridge_text?: string
}

type Props = {
  lessonTitle: string
  questions: DemoQuestion[]
  isPremium: boolean
}

export function HomeDemoQuiz({ lessonTitle, questions, isPremium }: Props) {
  const [started, setStarted] = useState(false)
  const [index, setIndex] = useState(0)
  const [selectedChoice, setSelectedChoice] = useState<string | null>(null)
  const [result, setResult] = useState<{ isCorrect: boolean } | null>(null)
  const [score, setScore] = useState(0)
  const [allDone, setAllDone] = useState(false)

  const total = questions.length
  const current = questions[index]

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!current || !selectedChoice) return
    const isCorrect = selectedChoice === current.correct_answer
    setResult({ isCorrect })
    if (isCorrect) setScore((s) => s + 1)
  }

  function goNext() {
    setResult(null)
    setSelectedChoice(null)
    if (index + 1 >= total) {
      setAllDone(true)
      return
    }
    setIndex((i) => i + 1)
  }

  function restart() {
    setStarted(false)
    setIndex(0)
    setScore(0)
    setAllDone(false)
    setResult(null)
    setSelectedChoice(null)
  }

  if (allDone) {
    return (
      <div className="card p-8 text-center">
        <span className="text-4xl">🎉</span>
        <h3 className="mt-4 text-xl font-bold">体験完了</h3>
        <p className="mt-2 text-muted">
          正解 {score} / {total} 問
        </p>
        <p className="mt-4 text-sm text-muted max-w-md mx-auto">
          {isPremium
            ? '会員コースでは全セットと学習分析が利用できます。'
            : '会員登録ですべてのセットと AI 個別問題に挑戦できます。'}
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          {isPremium ? (
            <Link href="/courses" className="btn-primary">
              コースで続ける
            </Link>
          ) : (
            <>
              <Link href="/register" className="btn-primary">
                無料でアカウント作成
              </Link>
              <Link href="/pricing" className="btn-secondary">
                プランを見る
              </Link>
            </>
          )}
          <button type="button" onClick={restart} className="btn-secondary">
            もう一度挑戦
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="card p-6 sm:p-8">
        <div className="flex flex-wrap items-center gap-2 text-xs font-medium">
          <span className="rounded-full bg-stone-200 px-3 py-1 text-stone-800">定番問題</span>
          {started && (
            <span className="rounded-full bg-stone-100 px-3 py-1 text-muted">
              問題 {index + 1} / {total}
            </span>
          )}
        </div>

        <p className="mt-4 text-sm text-muted">{lessonTitle}</p>

        {!started && (
          <>
            <p className="mt-6 text-sm leading-relaxed text-muted">
              最初につくった固定の英会話クイズです。Dify なしで、すぐに試せます。
            </p>
            <button type="button" onClick={() => setStarted(true)} className="btn-primary mt-6">
              クイズを始める
            </button>
          </>
        )}

        {started && current && (
          <>
            {current.bridge_text && index > 0 && (
              <p className="mt-6 rounded-xl border border-border bg-stone-50 px-4 py-3 text-sm text-muted">
                {current.bridge_text}
              </p>
            )}

            <p className="mt-8 text-base sm:text-lg font-medium leading-relaxed text-foreground">
              {current.question}
            </p>

            {!result && (
              <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                <div className="space-y-2">
                  {current.choices.map((choice, i) => (
                    <label
                      key={`${choice}-${i}`}
                      className={`flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 transition-colors ${
                        selectedChoice === choice
                          ? 'border-accent bg-accent-soft'
                          : 'border-border hover:border-emerald-200'
                      }`}
                    >
                      <input
                        type="radio"
                        name="demo-choice"
                        value={choice}
                        checked={selectedChoice === choice}
                        onChange={() => setSelectedChoice(choice)}
                        className="accent-emerald-600"
                      />
                      <span className="text-sm">{choice}</span>
                    </label>
                  ))}
                </div>
                <button type="submit" disabled={!selectedChoice} className="btn-primary disabled:opacity-60">
                  回答する
                </button>
              </form>
            )}

            {result && (
              <div className="mt-6 space-y-4">
                <div
                  className={`rounded-xl border p-4 ${
                    result.isCorrect ? 'border-emerald-200 bg-accent-soft' : 'border-amber-200 bg-amber-50'
                  }`}
                >
                  <p className="text-sm font-semibold">{result.isCorrect ? '✓ 正解' : '✗ 不正解'}</p>
                  {!result.isCorrect && (
                    <p className="mt-2 text-sm">
                      正解: <strong>{current.correct_answer}</strong>
                    </p>
                  )}
                  {current.explanation && (
                    <p className="mt-2 text-sm leading-relaxed whitespace-pre-wrap">{current.explanation}</p>
                  )}
                </div>
                <button type="button" onClick={goNext} className="btn-primary">
                  {index + 1 >= total ? '結果を見る' : '次の問題へ →'}
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {started && (
        <div className="flex gap-1">
          {questions.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 flex-1 rounded-full ${
                i < index ? 'bg-accent' : i === index ? 'bg-emerald-300' : 'bg-stone-200'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  )
}
