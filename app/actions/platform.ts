'use server'

import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { getCurrentUser } from '@/lib/auth'
import { syncSubscriptionFromStripeObject, syncUserSubscriptionFromStripe } from '@/lib/billing-sync'
import { ensureStripeCustomer } from '@/lib/stripe-customer'
import { assertStripeCheckoutConfigured } from '@/lib/stripe-config'
import { getStripe, PREMIUM_PRICE_ID, getStripeIfConfigured } from '@/lib/stripe'
import { markLessonComplete } from '@/lib/courses'

async function getBaseUrl(): Promise<string> {
  const h = await headers()
  const host = h.get('x-forwarded-host') ?? h.get('host')
  const proto = h.get('x-forwarded-proto') ?? 'https'
  return `${proto}://${host}`
}

export async function syncCheckoutSessionAction(sessionId: string): Promise<void> {
  if (!sessionId) return
  const user = await getCurrentUser()
  if (!user) return

  const stripe = getStripeIfConfigured()
  if (!stripe) return

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId, { expand: ['subscription'] })
    if (session.metadata?.userId !== user.id || session.payment_status !== 'paid') return

    const customerId = typeof session.customer === 'string' ? session.customer : session.customer?.id
    if (customerId) {
      await ensureStripeCustomer(stripe, { ...user, stripe_customer_id: customerId })
    }

    const subscription = session.subscription
    if (!subscription) return
    const sub = typeof subscription === 'string'
      ? await stripe.subscriptions.retrieve(subscription)
      : subscription
    await syncSubscriptionFromStripeObject(sub)
  } catch {
    await syncUserSubscriptionFromStripe(user.id)
  }
}

export async function startCheckoutAction(): Promise<{ error?: string }> {
  const user = await getCurrentUser()
  if (!user) redirect('/login?next=/pricing')

  try {
    assertStripeCheckoutConfigured()
  } catch (err) {
    return { error: err instanceof Error ? err.message : '決済の設定が未完了です' }
  }

  const stripe = getStripe()
  const customerId = await ensureStripeCustomer(stripe, user)
  const baseUrl = await getBaseUrl()

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customerId,
      line_items: [{ price: PREMIUM_PRICE_ID, quantity: 1 }],
      success_url: `${baseUrl}/pricing?success=1&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/pricing?canceled=1`,
      locale: 'ja',
      billing_address_collection: 'auto',
      allow_promotion_codes: true,
      client_reference_id: user.id,
      metadata: { userId: user.id },
      subscription_data: { metadata: { userId: user.id } },
    })
    if (!session.url) return { error: '決済ページの作成に失敗しました。' }
    redirect(session.url)
  } catch (err) {
    return { error: err instanceof Error ? err.message : '決済ページの作成に失敗しました' }
  }
}

export async function openPortalAction(): Promise<{ error?: string }> {
  const user = await getCurrentUser()
  if (!user) redirect('/login?next=/pricing')

  const stripe = getStripe()
  const customerId = await ensureStripeCustomer(stripe, user)
  const baseUrl = await getBaseUrl()

  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${baseUrl}/dashboard`,
      locale: 'ja',
    })
    redirect(session.url)
  } catch (err) {
    return { error: err instanceof Error ? err.message : '管理ページを開けませんでした' }
  }
}

export async function completeLessonAction(lessonId: string, courseId: string): Promise<void> {
  const user = await getCurrentUser()
  if (!user) redirect(`/login?next=/courses/${courseId}`)

  await markLessonComplete(user.id, lessonId)
  revalidatePath(`/courses/${courseId}`)
  revalidatePath(`/courses/${courseId}/lessons/${lessonId}`)
  revalidatePath('/dashboard')
}
