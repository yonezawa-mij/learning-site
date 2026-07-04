import 'server-only'

export type StripeMode = 'live' | 'test'

export function getStripeMode(): StripeMode {
  const key = process.env.STRIPE_SECRET_KEY ?? ''
  if (key.startsWith('sk_live_')) return 'live'
  return 'test'
}

export function isStripeLive(): boolean {
  return getStripeMode() === 'live'
}

export function getPremiumPriceId(): string {
  return process.env.STRIPE_PRICE_ID ?? ''
}

export function getStripeConfigStatus() {
  const errors: string[] = []
  const key = process.env.STRIPE_SECRET_KEY ?? ''
  const priceId = getPremiumPriceId()

  if (!key) errors.push('STRIPE_SECRET_KEY が未設定です')
  if (!priceId) errors.push('STRIPE_PRICE_ID が未設定です')

  return {
    configured: errors.length === 0,
    mode: getStripeMode(),
    errors,
  }
}

export function assertStripeSecretKey(): void {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY is not set.')
  }
}

export function assertStripeCheckoutConfigured(): void {
  const status = getStripeConfigStatus()
  if (!status.configured) {
    throw new Error(status.errors.join(' / '))
  }
}
