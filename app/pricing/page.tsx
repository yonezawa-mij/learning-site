import Link from 'next/link'
import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'
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
    <>
      <Navbar />
      <main className="flex-1 py-20">
        <div className="mx-auto max-w-3xl px-6">
          <div className="text-center mb-12">
            <h1 className="text-3xl font-bold">有料会員プラン</h1>
            <p className="mt-3 text-muted">すべてのコース・レッスン・進捗管理機能が利用できます</p>
          </div>

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

          <div className="rounded-3xl border-2 border-accent/30 bg-white p-8 shadow-sm">
            <p className="text-sm font-semibold text-accent uppercase tracking-wide">Standard</p>
            <p className="mt-2 text-4xl font-bold">{MEMBERSHIP_PRICE_LABEL}</p>
            <p className="mt-1 text-sm text-muted">税込 · 自動更新 · いつでも解約可能</p>

            <ul className="mt-8 space-y-3">
              {MEMBERSHIP_FEATURES.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm">
                  <span className="text-accent mt-0.5">✓</span>
                  {f}
                </li>
              ))}
            </ul>

            <div className="mt-8">
              {!user ? (
                <div className="space-y-3">
                  <Link href="/register?next=/pricing" className="block w-full rounded-full bg-accent py-3.5 text-center text-sm font-semibold text-white hover:bg-emerald-700">
                    まず無料でアカウント作成
                  </Link>
                  <p className="text-xs text-center text-muted">アカウント作成後、こちらからプランに加入できます</p>
                </div>
              ) : premium ? (
                <div className="space-y-3">
                  <Link href="/courses" className="block w-full rounded-full bg-accent py-3.5 text-center text-sm font-semibold text-white hover:bg-emerald-700">
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
      </main>
      <Footer />
    </>
  )
}
