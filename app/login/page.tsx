'use client'

import { Suspense, useActionState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Navbar } from '@/components/Navbar'
import { loginAction, type AuthState } from '@/app/actions/auth'
import { SITE_NAME, SITE_TAGLINE } from '@/lib/site-config'

function LoginForm() {
  const searchParams = useSearchParams()
  const next = searchParams.get('next') ?? '/dashboard'
  const [state, formAction, pending] = useActionState<AuthState, FormData>(loginAction, {})

  return (
    <div className="card w-full max-w-md p-8 sm:p-10">
      <h1 className="text-2xl font-bold">ログイン</h1>
      <p className="mt-2 text-sm text-muted">会員アカウントでサインイン</p>

      {state?.error && (
        <div className="mt-5 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.error}
        </div>
      )}

      <form action={formAction} className="mt-6 space-y-4">
        <input type="hidden" name="next" value={next} />
        <div>
          <label htmlFor="email" className="block text-sm font-medium mb-1.5">メールアドレス</label>
          <input id="email" name="email" type="email" required className="input-field" placeholder="you@example.com" />
        </div>
        <div>
          <label htmlFor="password" className="block text-sm font-medium mb-1.5">パスワード</label>
          <input id="password" name="password" type="password" required className="input-field" placeholder="••••••••" />
        </div>
        <button type="submit" disabled={pending} className="btn-primary w-full disabled:opacity-60">
          {pending ? 'ログイン中...' : 'ログイン'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-muted">
        アカウントをお持ちでない方は{' '}
        <Link href={`/register?next=${encodeURIComponent(next)}`} className="font-medium text-accent hover:underline">
          会員登録
        </Link>
      </p>
    </div>
  )
}

export default function LoginPage() {
  return (
    <div className="min-h-full flex flex-col">
      <Navbar />
      <main className="flex-1 grid lg:grid-cols-2">
        <div className="hidden lg:flex flex-col justify-center px-12 xl:px-20 bg-gradient-to-br from-emerald-700 to-emerald-900 text-white">
          <p className="text-sm font-medium text-emerald-200 uppercase tracking-wider">{SITE_NAME}</p>
          <h2 className="mt-4 text-3xl font-bold leading-tight">{SITE_TAGLINE}</h2>
          <p className="mt-4 text-emerald-100 leading-relaxed max-w-md">
            ログインして、コース学習・進捗管理・会員限定コンテンツにアクセスできます。
          </p>
        </div>
        <div className="flex items-center justify-center px-6 py-16 app-main">
          <Suspense fallback={<div className="h-96 w-full max-w-md animate-pulse rounded-2xl bg-stone-200/60" />}>
            <LoginForm />
          </Suspense>
        </div>
      </main>
    </div>
  )
}
