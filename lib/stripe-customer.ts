import 'server-only'
import type Stripe from 'stripe'
import { sql } from './db'
import type { SessionUser } from './auth'

export async function ensureStripeCustomer(
  stripe: Stripe,
  user: Pick<SessionUser, 'id' | 'email' | 'name' | 'stripe_customer_id'>,
): Promise<string> {
  let customerId = user.stripe_customer_id

  if (customerId) {
    try {
      await stripe.customers.retrieve(customerId)
      await stripe.customers.update(customerId, {
        email: user.email,
        name: user.name,
        metadata: { userId: user.id },
      })
      return customerId
    } catch {
      await sql`
        UPDATE users
        SET stripe_customer_id = NULL, stripe_subscription_id = NULL,
            subscription_status = NULL, current_period_end = NULL
        WHERE id = ${user.id}
      `
      customerId = null
    }
  }

  const customer = await stripe.customers.create({
    email: user.email,
    name: user.name,
    metadata: { userId: user.id },
    preferred_locales: ['ja'],
  })
  await sql`UPDATE users SET stripe_customer_id = ${customer.id} WHERE id = ${user.id}`
  return customer.id
}

export async function resetInvalidStripeCustomer(userId: string): Promise<void> {
  await sql`
    UPDATE users
    SET stripe_customer_id = NULL, stripe_subscription_id = NULL,
        subscription_status = NULL, current_period_end = NULL
    WHERE id = ${userId}
  `
}
