'use client'

import { useRef, useState } from 'react'

type Message = { role: 'user' | 'assistant'; content: string }

type Props = {
  question: string
  theme: string
  explanation?: string
}

const STARTERS = ['ヒントをください', 'なぜこの答え？', 'もう少し詳しく']

export function QuizDialogue({ question, theme, explanation }: Props) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const conversationIdRef = useRef<string | undefined>(undefined)

  async function send(text: string) {
    const trimmed = text.trim()
    if (!trimmed || loading) return

    setError(null)
    setMessages((prev) => [...prev, { role: 'user', content: trimmed }])
    setInput('')
    setLoading(true)

    try {
      const res = await fetch('/api/quiz-dialogue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: trimmed,
          question,
          theme,
          conversationId: conversationIdRef.current,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? '送信に失敗しました')
        setMessages((prev) => prev.slice(0, -1))
        return
      }
      if (data.conversationId) conversationIdRef.current = data.conversationId
      setMessages((prev) => [...prev, { role: 'assistant', content: data.answer }])
    } catch {
      setError('通信エラーが発生しました')
      setMessages((prev) => prev.slice(0, -1))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="card overflow-hidden border-violet-200">
      <div className="bg-violet-50 px-5 py-4 border-b border-violet-100">
        <p className="font-semibold text-violet-900">質問・対話窓</p>
        <p className="text-xs text-violet-700 mt-0.5">AI家庭教師と深掘り対話（ヒント・論理の整理）</p>
      </div>

      {explanation && messages.length === 0 && (
        <p className="px-5 py-3 text-sm text-muted border-b border-border bg-stone-50">
          解説: {explanation}
        </p>
      )}

      <div className="max-h-56 overflow-y-auto px-5 py-4 space-y-3">
        {messages.length === 0 && (
          <div className="text-center py-2">
            <div className="flex flex-wrap justify-center gap-2">
              {STARTERS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => send(s)}
                  className="text-xs px-3 py-1.5 rounded-full border border-violet-200 text-violet-800 hover:bg-violet-50"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[90%] rounded-2xl px-3 py-2 text-sm leading-relaxed whitespace-pre-wrap ${
                m.role === 'user'
                  ? 'bg-violet-600 text-white rounded-br-md'
                  : 'bg-stone-100 text-foreground rounded-bl-md'
              }`}
            >
              {m.content}
            </div>
          </div>
        ))}
        {loading && (
          <p className="text-xs text-muted animate-pulse">AI が考えています...</p>
        )}
      </div>

      {error && <p className="px-5 text-xs text-red-600">{error}</p>}

      <form
        className="border-t border-border px-4 py-3 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault()
          send(input)
        }}
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="この問題について質問..."
          className="input-field flex-1 !py-2.5 text-sm"
          disabled={loading}
        />
        <button type="submit" disabled={loading || !input.trim()} className="btn-primary !py-2.5 !px-4 shrink-0">
          送信
        </button>
      </form>
    </div>
  )
}
