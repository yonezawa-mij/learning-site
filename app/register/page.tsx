'use client'

import { Suspense, useActionState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Navbar } from '@/components/Navbar'
import { registerAction, type AuthState } from '@/app/actions/auth'
import { SITE_NAME, MEMBERSHIP_FEATURES } from '@/lib/site-config'

function RegisterForm() {
  const searchParams = useSearchParams()
  const next = searchParams.get('next') ?? '/pricing'
  const [state, formAction, pending] = useActionState<AuthState, FormData>(registerAction, {})

  return (
    <div className="card w-full max-w-md p-8 sm:p-10">
      <h1 className="text-2xl font-bold">会員登録</h1>
      <p className="mt-2 text-sm text-muted">{SITE_NAME} の無料アカウントを作成</p>

      {state?.error && (
        <div className="mt-5 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.error}
        </div>
      )}

      <form action={formAction} className="mt-6 space-y-4">
        <input type="hidden" name="next" value={next} />
        <div>
          <label htmlFor="name" className="block text-sm font-medium mb-1.5">お名前</label>
          <input id="name" name="name" type="text" required className="input-field" />
        </div>
        <div>
          <label htmlFor="email" className="block text-sm font-medium mb-1.5">メールアドレス</label>
          <input id="email" name="email" type="email" required className="input-field" />
        </div>
        <div>
          <label htmlFor="password" className="block text-sm font-medium mb-1.5">パスワード（8文字以上）</label>
          <input id="password" name="password" type="password" required minLength={8} className="input-field" />
        </div>
        <button type="submit" disabled={pending} className="btn-primary w-full disabled:opacity-60">
          {pending ? '登録中...' : 'アカウントを作成'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-muted">
        すでにアカウントをお持ちの方は{' '}
        <Link href="/login" className="font-medium text-accent hover:underline">ログイン</Link>
      </p>
    </div>
  )
}

export default function RegisterPage() {
  return (
    <div className="min-h-full flex flex-col">
      <Navbar />
      <main className="flex-1 grid lg:grid-cols-2">
        <div className="hidden lg:flex flex-col justify-center px-12 xl:px-20 bg-gradient-to-br from-stone-800 to-stone-950 text-white">
          <p className="text-sm font-medium text-stone-400 uppercase tracking-wider">Welcome</p>
          <h2 className="mt-4 text-3xl font-bold leading-tight">学びを始める準備は<br />数分で完了</h2>
          <ul className="mt-8 space-y-3">
            {MEMBERSHIP_FEATURES.slice(0, 3).map((f) => (
              <li key={f} className="flex items-start gap-2 text-sm text-stone-300">
                <span className="text-emerald-400 mt-0.5">✓</span>
                {f}
              </li>
            ))}
          </ul>
        </div>
        <div className="flex items-center justify-center px-6 py-16 app-main">
          <Suspense fallback={<div className="h-96 w-full max-w-md animate-pulse rounded-2xl bg-stone-200/60" />}>
            <RegisterForm />
          </Suspense>
        </div>
      </main>
    </div>
  )
}
