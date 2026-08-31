/**
 * Self-check: SSR-stable listing prices (hydration contract).
 * Run: npx tsx src/lib/currency.check.ts
 */
import { USD_GEL_FALLBACK, formatListingPrice } from './currency'

const usdListing = {
  priceUSD: 1_728_000,
  priceGEL: 4_665_600,
  priceOriginal: 1_728_000,
  currencyOriginal: 'USD' as const,
  currencyPreference: 'USD' as const,
  rate: USD_GEL_FALLBACK,
}

const a = formatListingPrice(usdListing)
const b = formatListingPrice(usdListing)
if (a.secondary !== b.secondary) throw new Error('same inputs must match')
if (a.secondary !== '≈ 4 665 600₾') throw new Error(`unexpected secondary: ${a.secondary}`)

// Live rate must NOT be used for the hydration pass — only FALLBACK.
const live = formatListingPrice({ ...usdListing, rate: 2.608 })
if (live.secondary === a.secondary) throw new Error('live rate should change secondary after hydrate')

console.log('currency.check.ts: ok')
