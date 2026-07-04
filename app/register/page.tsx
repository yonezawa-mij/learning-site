'use client'

import { Suspense, useActionState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'
import { registerAction, type AuthState } from '@/app/actions/auth'
import { SITE_NAME } from '@/lib/site-config'

function RegisterForm() {
  const searchParams = useSearchParams()
  const next = searchParams.get('next') ?? '/pricing'
  const [state, formAction, pending] = useActionState<AuthState, FormData>(registerAction, {})

  return (
    <div className="w-full max-w-md rounded-2xl border border-border bg-white p-8 shadow-sm">
      <h1 className="text-2xl font-bold">会員登録</h1>
      <p className="mt-2 text-sm text-muted">{SITE_NAME} のアカウントを作成します</p>

      {state?.error && (
        <div className="mt-5 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{state.error}</div>
      )}

      <form action={formAction} className="mt-6 space-y-4">
        <input type="hidden" name="next" value={next} />
        <div>
          <label htmlFor="name" className="block text-sm font-medium mb-1.5">お名前</label>
          <input id="name" name="name" type="text" required className="w-full rounded-xl border border-border px-4 py-3 outline-none focus:border-accent" />
        </div>
        <div>
          <label htmlFor="email" className="block text-sm font-medium mb-1.5">メールアドレス</label>
          <input id="email" name="email" type="email" required className="w-full rounded-xl border border-border px-4 py-3 outline-none focus:border-accent" />
        </div>
        <div>
          <label htmlFor="password" className="block text-sm font-medium mb-1.5">パスワード（8文字以上）</label>
          <input id="password" name="password" type="password" required minLength={8} className="w-full rounded-xl border border-border px-4 py-3 outline-none focus:border-accent" />
        </div>
        <button type="submit" disabled={pending} className="w-full rounded-full bg-accent py-3 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60">
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
    <>
      <Navbar />
      <main className="flex-1 flex items-center justify-center px-6 py-20">
        <Suspense fallback={<div className="h-96 w-full max-w-md animate-pulse rounded-2xl bg-stone-100" />}>
          <RegisterForm />
        </Suspense>
      </main>
      <Footer />
    </>
  )
}
