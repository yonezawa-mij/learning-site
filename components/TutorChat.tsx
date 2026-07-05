'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import { sendTutorMessageAction, clearTutorHistoryAction } from '@/app/actions/tutor'

type Message = {
  id: string
  role: 'user' | 'assistant'
  content: string
  created_at: string
}

type Props = {
  initialMessages: Message[]
  lessonContext?: {
    lessonId: string
    lessonTitle: string
    domain: string | null
  }
  compact?: boolean
}

const STARTERS = [
  '弱点分野を教えて',
  '復習のコツは？',
  'なぜそうなるのか一緒に考えて',
]

export function TutorChat({ initialMessages, lessonContext, compact = false }: Props) {
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [input, setInput] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, pending])

  function send(text: string) {
    const trimmed = text.trim()
    if (!trimmed || pending) return

    setError(null)
    const optimistic: Message = {
      id: `temp-${Date.now()}`,
      role: 'user',
      content: trimmed,
      created_at: new Date().toISOString(),
    }
    setMessages((prev) => [...prev, optimistic])
    setInput('')

    startTransition(async () => {
      const result = await sendTutorMessageAction(trimmed, lessonContext
        ? {
            lessonId: lessonContext.lessonId,
            lessonTitle: lessonContext.lessonTitle,
            domain: lessonContext.domain,
          }
        : undefined)

      if (result.error) {
        setError(result.error)
        setMessages((prev) => prev.filter((m) => m.id !== optimistic.id))
        return
      }

      if (result.message) {
        const assistantMsg: Message = {
          id: result.message.id,
          role: 'assistant',
          content: result.message.content,
          created_at: result.message.created_at,
        }
        setMessages((prev) => [
          ...prev.filter((m) => m.id !== optimistic.id),
          { ...optimistic, id: `user-${Date.now()}` },
          assistantMsg,
        ])
      }
    })
  }

  function handleClear() {
    if (!confirm('会話履歴を削除しますか？')) return
    startTransition(async () => {
      await clearTutorHistoryAction()
      setMessages([])
    })
  }

  return (
    <div className={`card flex flex-col ${compact ? 'h-[420px]' : 'h-[600px]'}`}>
      <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-border">
        <div>
          <p className="font-semibold">学習チューター</p>
          <p className="text-xs text-muted mt-0.5">
            {lessonContext
              ? lessonContext.domain ?? lessonContext.lessonTitle
              : '学習内容について質問できます'}
          </p>
        </div>
        {messages.length > 0 && (
          <button
            type="button"
            onClick={handleClear}
            className="text-xs text-muted hover:text-foreground shrink-0"
            disabled={pending}
          >
            履歴削除
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center py-6">
            <p className="text-4xl mb-3">🎓</p>
            <p className="text-sm font-semibold text-foreground">自分専用の学習サポート</p>
            <p className="text-sm text-muted max-w-xs mx-auto leading-relaxed mt-2">
              わからないところを質問したり、復習の進め方を相談したりできます。
            </p>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              {STARTERS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => send(s)}
                  className="text-xs px-3 py-1.5 rounded-full border border-border hover:border-emerald-300 hover:bg-accent-soft transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
                m.role === 'user'
                  ? 'bg-emerald-600 text-white rounded-br-md'
                  : 'bg-stone-100 text-foreground rounded-bl-md'
              }`}
            >
              {m.content}
            </div>
          </div>
        ))}

        {pending && (
          <div className="flex justify-start">
            <div className="bg-stone-100 rounded-2xl rounded-bl-md px-4 py-3 text-sm text-muted">
              <span className="inline-flex gap-1">
                <span className="animate-bounce">·</span>
                <span className="animate-bounce [animation-delay:0.1s]">·</span>
                <span className="animate-bounce [animation-delay:0.2s]">·</span>
              </span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {error && (
        <p className="px-5 text-xs text-red-600">{error}</p>
      )}

      <form
        className="border-t border-border px-4 py-3 flex gap-2 items-end"
        onSubmit={(e) => {
          e.preventDefault()
          send(input)
        }}
      >
        <textarea
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              send(input)
            }
          }}
          placeholder="質問や疑問を入力..."
          rows={compact ? 1 : 2}
          className="input-field resize-none flex-1 !py-2.5 text-sm"
          disabled={pending}
        />
        <button
          type="submit"
          disabled={pending || !input.trim()}
          className="btn-primary !py-2.5 !px-4 shrink-0"
        >
          送信
        </button>
      </form>
    </div>
  )
}
