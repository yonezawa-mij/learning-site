import 'server-only'
import Stripe from 'stripe'
import { assertStripeSecretKey, getPremiumPriceId } from './stripe-config'

let _stripe: Stripe | null = null

export function getStripe(): Stripe {
  assertStripeSecretKey()
  if (!_stripe) {
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2026-06-24.dahlia' })
  }
  return _stripe
}

export function getStripeIfConfigured(): Stripe | null {
  try {
    return getStripe()
  } catch {
    return null
  }
}

export const PREMIUM_PRICE_ID = getPremiumPriceId()
export const ACTIVE_STATUSES = ['active', 'trialing']

export { getStripeMode, isStripeLive, getStripeConfigStatus } from './stripe-config'
