'use client'

import { useState, useTransition } from 'react'
import { startCheckoutAction, openPortalAction } from '@/app/actions/platform'
import { MEMBERSHIP_PRICE_LABEL } from '@/lib/site-config'

export function SubscribeButton() {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  return (
    <div className="space-y-3">
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            setError(null)
            const res = await startCheckoutAction()
            if (res?.error) setError(res.error)
          })
        }
        className="btn-primary w-full !py-3.5 disabled:opacity-60"
      >
        {pending ? '処理中...' : `有料会員になる（${MEMBERSHIP_PRICE_LABEL}）`}
      </button>
      {error && <p className="text-sm text-red-600 text-center">{error}</p>}
    </div>
  )
}

export function ManageButton() {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  return (
    <div className="space-y-3">
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            setError(null)
            const res = await openPortalAction()
            if (res?.error) setError(res.error)
          })
        }
        className="btn-secondary w-full !py-3.5 disabled:opacity-60"
      >
        {pending ? '処理中...' : 'プラン・支払いを管理'}
      </button>
      {error && <p className="text-sm text-red-600 text-center">{error}</p>}
    </div>
  )
}
