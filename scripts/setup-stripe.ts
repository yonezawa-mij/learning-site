/**
 * learning-site 用 Stripe 月額プラン（¥1,980）を作成
 */
import { config } from 'dotenv'
import { resolve } from 'path'
import { readFileSync, writeFileSync, existsSync } from 'fs'
import Stripe from 'stripe'

const ROOT = resolve(import.meta.dirname, '..')
const LEARN_ENV = resolve(ROOT, '.env.local')

config({ path: LEARN_ENV })
config({ path: resolve(ROOT, '../park-ai-latest/.env.local') })

const key = process.env.STRIPE_SECRET_KEY
if (!key) {
  console.error('STRIPE_SECRET_KEY が未設定です')
  process.exit(1)
}

const stripe = new Stripe(key, { apiVersion: '2026-06-24.dahlia' })

function parseEnv(path: string): Record<string, string> {
  if (!existsSync(path)) return {}
  const out: Record<string, string> = {}
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    const m = line.match(/^([A-Z_]+)="(.*)"/)
    if (m) out[m[1]] = m[2]
  }
  return out
}

async function ensureWebhook() {
  const env = parseEnv(LEARN_ENV)
  const siteUrl = env.NEXT_PUBLIC_SITE_URL || 'https://learning-site-nu.vercel.app'
  const endpoint = `${siteUrl}/api/stripe/webhook`

  const existing = await stripe.webhookEndpoints.list({ limit: 100 })
  const found = existing.data.find((w) => w.url === endpoint)
  if (found) {
    console.log(`✓ webhook endpoint exists: ${found.id}`)
    if (!env.STRIPE_WEBHOOK_SECRET?.startsWith('whsec_')) {
      console.warn('Webhook secret not in .env.local — copy whsec_... from Stripe Dashboard for this endpoint')
    }
    return
  }

  const hook = await stripe.webhookEndpoints.create({
    url: endpoint,
    enabled_events: [
      'checkout.session.completed',
      'customer.subscription.created',
      'customer.subscription.updated',
      'customer.subscription.deleted',
    ],
    metadata: { project: 'learning-site' },
  })

  if (hook.secret) {
    env.STRIPE_WEBHOOK_SECRET = hook.secret
    writeEnv(env)
    console.log(`✓ webhook created with secret`)
  } else {
    console.log(`✓ webhook created: ${hook.id}`)
  }
}

function writeEnv(env: Record<string, string>) {
  writeFileSync(
    LEARN_ENV,
    Object.entries(env)
      .map(([k, v]) => `${k}="${v}"`)
      .join('\n') + '\n',
  )
}

async function ensurePrice() {
  const env = parseEnv(LEARN_ENV)
  const prices = await stripe.prices.list({ active: true, limit: 100, expand: ['data.product'] })
  const match = prices.data.find((p) => {
    const product = p.product as Stripe.Product
    return product.metadata?.project === 'learning-site' && p.unit_amount === 1980
  })
  if (match) {
    env.STRIPE_PRICE_ID = match.id
    writeEnv(env)
    console.log(`✓ learning-site price: ${match.id}`)
    return
  }

  const product = await stripe.products.create({
    name: 'EnglishLearn 有料会員',
    description: '全コース・全レッスンへのアクセス（月額 ¥1,980）',
    metadata: { project: 'learning-site' },
  })

  const price = await stripe.prices.create({
    product: product.id,
    unit_amount: 1980,
    currency: 'jpy',
    recurring: { interval: 'month' },
    metadata: { project: 'learning-site' },
  })

  env.STRIPE_PRICE_ID = price.id
  writeEnv(env)
  console.log(`✓ price created: ${price.id}`)
}

async function main() {
  const env = parseEnv(LEARN_ENV)
  if (!env.STRIPE_SECRET_KEY) {
    env.STRIPE_SECRET_KEY = key!
    writeEnv(env)
  }

  await ensurePrice()
  await ensureWebhook()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
