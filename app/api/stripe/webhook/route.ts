import { NextResponse } from 'next/server'
import type Stripe from 'stripe'
import { syncSubscriptionFromStripeObject } from '@/lib/billing-sync'
import { getStripe } from '@/lib/stripe'
import { sql } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET
  if (!secret) {
    return NextResponse.json({ error: 'STRIPE_WEBHOOK_SECRET is not set' }, { status: 500 })
  }

  const stripe = getStripe()
  const body = await request.text()
  const signature = request.headers.get('stripe-signature') ?? ''

  let event: Stripe.Event
  try {
    event = await stripe.webhooks.constructEventAsync(body, signature, secret)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Invalid signature'
    return NextResponse.json({ error: message }, { status: 400 })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const customerId = typeof session.customer === 'string' ? session.customer : session.customer?.id
        if (customerId && session.metadata?.userId) {
          await sql`
            UPDATE users SET stripe_customer_id = ${customerId}
            WHERE id = ${session.metadata.userId} AND stripe_customer_id IS NULL
          `
        }
        if (session.subscription) {
          const subId = typeof session.subscription === 'string' ? session.subscription : session.subscription.id
          const subscription = await stripe.subscriptions.retrieve(subId)
          await syncSubscriptionFromStripeObject(subscription)
        }
        break
      }
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted':
        await syncSubscriptionFromStripeObject(event.data.object as Stripe.Subscription)
        break
      default:
        break
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'handler error'
    return NextResponse.json({ error: message }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
