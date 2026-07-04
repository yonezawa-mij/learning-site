import 'server-only'
import { sql } from './db'
import { resetInvalidStripeCustomer } from './stripe-customer'
import { getStripe, ACTIVE_STATUSES } from './stripe'

async function applySubscriptionToUser(
  userId: string,
  customerId: string,
  subscriptionId: string | null,
  status: string | null,
  periodEnd: string | null,
) {
  await sql`
    UPDATE users
    SET stripe_customer_id = COALESCE(stripe_customer_id, ${customerId}),
        subscription_status = ${status},
        stripe_subscription_id = ${subscriptionId},
        current_period_end = ${periodEnd}
    WHERE id = ${userId}
  `
}

export async function syncUserSubscriptionFromStripe(userId: string): Promise<string | null> {
  if (!process.env.STRIPE_SECRET_KEY) return null

  const rows = (await sql`
    SELECT stripe_customer_id FROM users WHERE id = ${userId}
  `) as { stripe_customer_id: string | null }[]
  const customerId = rows[0]?.stripe_customer_id
  if (!customerId) return null

  const stripe = getStripe()
  try {
    await stripe.customers.retrieve(customerId)
  } catch {
    await resetInvalidStripeCustomer(userId)
    return null
  }

  const subs = await stripe.subscriptions.list({ customer: customerId, status: 'all', limit: 10 })
  const activeSub = subs.data.find((s) => ACTIVE_STATUSES.includes(s.status))
  const sub = activeSub ?? subs.data.sort((a, b) => b.created - a.created)[0]

  if (!sub) {
    await sql`
      UPDATE users
      SET subscription_status = NULL, stripe_subscription_id = NULL, current_period_end = NULL
      WHERE id = ${userId}
    `
    return null
  }

  const periodEndUnix = sub.items.data[0]?.current_period_end
  const periodEnd = periodEndUnix ? new Date(periodEndUnix * 1000).toISOString() : null
  await applySubscriptionToUser(userId, customerId, sub.id, sub.status, periodEnd)
  return sub.status
}

export async function syncSubscriptionFromStripeObject(subscription: {
  id: string
  customer: string | { id: string }
  status: string
  metadata?: { userId?: string }
  items: { data: Array<{ current_period_end?: number }> }
}) {
  const customerId =
    typeof subscription.customer === 'string' ? subscription.customer : subscription.customer.id
  const periodEndUnix = subscription.items.data[0]?.current_period_end
  const periodEnd = periodEndUnix ? new Date(periodEndUnix * 1000).toISOString() : null

  await sql`
    UPDATE users
    SET subscription_status = ${subscription.status},
        stripe_subscription_id = ${subscription.id},
        current_period_end = ${periodEnd}
    WHERE stripe_customer_id = ${customerId}
  `

  if (subscription.metadata?.userId) {
    await applySubscriptionToUser(
      subscription.metadata.userId,
      customerId,
      subscription.id,
      subscription.status,
      periodEnd,
    )
  }
}
