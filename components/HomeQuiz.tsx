'use client'

import Link from 'next/link'
import { useState } from 'react'

type QuizQuestion = {
  question: string
  choices: string[]
  correct_answer: string
  explanation: string
}

type Props = {
  isPremium: boolean
  difyEnabled: boolean
}

const DEFAULT_QUERY = 'Daily conversation, beginner'
const DEMO_ROUNDS = 5

export function HomeQuiz({ isPremium, difyEnabled }: Props) {
  const [query, setQuery] = useState(DEFAULT_QUERY)
  const [current, setCurrent] = useState<QuizQuestion | null>(null)
  const [selectedChoice, setSelectedChoice] = useState<string | null>(null)
  const [result, setResult] = useState<{ isCorrect: boolean } | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [round, setRound] = useState(0)
  const [score, setScore] = useState(0)
  const [allDone, setAllDone] = useState(false)

  async function generateQuestion() {
    setLoading(true)
    setError(null)
    setResult(null)
    setSelectedChoice(null)

    try {
      const res = await fetch('/api/home-quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? '問題を生成できませんでした。')
        return
      }
      setCurrent(data.question as QuizQuestion)
    } catch {
      setError('問題を生成できませんでした。')
    } finally {
      setLoading(false)
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!current || !selectedChoice) return
    const isCorrect = selectedChoice === current.correct_answer
    setResult({ isCorrect })
    if (isCorrect) setScore((s) => s + 1)
  }

  async function goNext() {
    const nextRound = round + 1
    setRound(nextRound)
    if (nextRound >= DEMO_ROUNDS) {
      setAllDone(true)
      return
    }
    await generateQuestion()
  }

  function restart() {
    setRound(0)
    setScore(0)
    setAllDone(false)
    setCurrent(null)
    setResult(null)
    setSelectedChoice(null)
    setError(null)
  }

  if (allDone) {
    return (
      <div className="card p-8 text-center">
        <span className="text-4xl">🎉</span>
        <h3 className="mt-4 text-xl font-bold">体験完了</h3>
        <p className="mt-2 text-muted">
          正解 {score} / {DEMO_ROUNDS} 問
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
          <span className="rounded-full bg-violet-100 px-3 py-1 text-violet-800">AI生成</span>
          {current && (
            <span className="rounded-full bg-stone-100 px-3 py-1 text-muted">
              問題 {Math.min(round + 1, DEMO_ROUNDS)} / {DEMO_ROUNDS}
            </span>
          )}
        </div>

        <div className="mt-6 space-y-2">
          <label htmlFor="quiz-query" className="block text-sm font-medium">
            英語クイズのテーマ・レベル
          </label>
          <input
            id="quiz-query"
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            disabled={loading || Boolean(current && !result)}
            placeholder="Daily conversation, beginner"
            className="input-field"
            maxLength={200}
          />
          <p className="text-xs text-muted">例: Travel English, intermediate / 日常会話, 初級</p>
        </div>

        {!difyEnabled && (
          <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            Dify API が未設定のため、AI クイズを生成できません。
          </p>
        )}

        {error && (
          <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>
        )}

        {!current && (
          <button
            type="button"
            onClick={generateQuestion}
            disabled={!difyEnabled || loading}
            className="btn-primary mt-6 disabled:opacity-60"
          >
            {loading ? '生成中...' : '問題を生成する'}
          </button>
        )}

        {current && (
          <>
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
                <button type="button" onClick={goNext} disabled={loading} className="btn-primary disabled:opacity-60">
                  {loading ? '生成中...' : round + 1 >= DEMO_ROUNDS ? '結果を見る' : '次の問題を生成 →'}
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {round > 0 && (
        <div className="flex gap-1">
          {Array.from({ length: DEMO_ROUNDS }).map((_, i) => (
            <div
              key={i}
              className={`h-1.5 flex-1 rounded-full ${
                i < round ? 'bg-accent' : i === round && current ? 'bg-emerald-300' : 'bg-stone-200'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  )
}
