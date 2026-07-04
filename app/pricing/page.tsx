import Link from 'next/link'
import { AppShell } from '@/components/AppShell'
import { PageHeader } from '@/components/PageHeader'
import { SubscribeButton, ManageButton } from '@/components/BillingButtons'
import { getCurrentUser, userIsPremium } from '@/lib/auth'
import { syncCheckoutSessionAction } from '@/app/actions/platform'
import { MEMBERSHIP_FEATURES, MEMBERSHIP_PRICE_LABEL } from '@/lib/site-config'

export const dynamic = 'force-dynamic'

type Props = { searchParams: Promise<{ success?: string; canceled?: string; session_id?: string; next?: string }> }

export default async function PricingPage({ searchParams }: Props) {
  const params = await searchParams
  if (params.success === '1' && params.session_id) {
    await syncCheckoutSessionAction(params.session_id)
  }

  const user = await getCurrentUser()
  const premium = userIsPremium(user)

  return (
    <AppShell subNav={Boolean(user)}>
      <div className="mx-auto max-w-3xl px-6 py-10 sm:py-16">
        <PageHeader
          eyebrow="Pricing"
          title="有料会員プラン"
          description="すべてのコース・レッスン・進捗管理機能が利用できます"
        />

        {params.canceled === '1' && (
          <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            お支払いはキャンセルされました。
          </div>
        )}
        {params.success === '1' && premium && (
          <div className="mb-6 rounded-xl border border-emerald-200 bg-accent-soft px-4 py-3 text-sm text-emerald-800">
            有料会員への加入が完了しました。コース学習を開始できます。
          </div>
        )}

        <div className="card overflow-hidden border-emerald-200/60 shadow-sm">
          <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 px-8 py-6 text-white">
            <p className="text-sm font-semibold text-emerald-100 uppercase tracking-wide">Standard Plan</p>
            <p className="mt-2 text-4xl font-bold">{MEMBERSHIP_PRICE_LABEL}</p>
            <p className="mt-1 text-sm text-emerald-100">税込 · 自動更新 · いつでも解約可能</p>
          </div>
          <div className="p-8">
            <ul className="space-y-3">
              {MEMBERSHIP_FEATURES.map((f) => (
                <li key={f} className="flex items-start gap-3 text-sm">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent text-xs">✓</span>
                  {f}
                </li>
              ))}
            </ul>

            <div className="mt-8 pt-6 border-t border-border">
              {!user ? (
                <div className="space-y-3">
                  <Link href="/register?next=/pricing" className="btn-primary w-full block text-center !py-3.5">
                    まず無料でアカウント作成
                  </Link>
                  <p className="text-xs text-center text-muted">アカウント作成後、こちらからプランに加入できます</p>
                </div>
              ) : premium ? (
                <div className="space-y-3">
                  <Link href="/courses" className="btn-primary w-full block text-center !py-3.5">
                    コースを始める
                  </Link>
                  <ManageButton />
                </div>
              ) : (
                <SubscribeButton />
              )}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  )
}
