/**
 * Self-check: SSR-stable listing prices (hydration contract).
 * Run: npx tsx src/lib/currency.check.ts
 */
import { EUR_GEL_FALLBACK, USD_GEL_FALLBACK, convertGel, formatMapPin, formatMoney, formatListingPrice } from './currency'

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

// EUR: primary in €, secondary keeps the listing's native locked figure.
const eurUsd = formatListingPrice({ ...usdListing, currencyPreference: 'EUR' as const, eurRate: EUR_GEL_FALLBACK })
if (eurUsd.primary !== '€1 534 737') throw new Error(`unexpected EUR primary: ${eurUsd.primary}`)
if (eurUsd.secondary !== '≈ $1 728 000') throw new Error(`unexpected EUR secondary: ${eurUsd.secondary}`)
const eurGel = formatListingPrice({
  priceUSD: 1000,
  priceGEL: 2700,
  priceOriginal: 2700,
  currencyOriginal: 'GEL' as const,
  currencyPreference: 'EUR' as const,
  eurRate: EUR_GEL_FALLBACK,
})
if (eurGel.primary !== '€888') throw new Error(`unexpected EUR primary: ${eurGel.primary}`)
if (eurGel.secondary !== '≈ 2 700₾') throw new Error(`unexpected EUR secondary: ${eurGel.secondary}`)

// EUR unit helpers mirror the USD contract.
if (formatMoney(3040, 'EUR', USD_GEL_FALLBACK, EUR_GEL_FALLBACK) !== '€1 000') throw new Error('formatMoney EUR')
if (convertGel(3040, 'EUR', USD_GEL_FALLBACK, EUR_GEL_FALLBACK) !== 1000) throw new Error('convertGel EUR')
if (formatMapPin(3_040_000, 'EUR', USD_GEL_FALLBACK, EUR_GEL_FALLBACK) !== '€1M') throw new Error('formatMapPin EUR M')
if (formatMapPin(91_200, 'EUR', USD_GEL_FALLBACK, EUR_GEL_FALLBACK) !== '€30k') throw new Error('formatMapPin EUR k')
// USD/GEL behaviour unchanged (positional defaults still hold).
if (formatMapPin(185_000, 'GEL') !== '185კ₾') throw new Error('formatMapPin GEL')
if (formatMapPin(85_000, 'USD', 2.7) !== '$31k') throw new Error('formatMapPin USD')

console.log('currency.check.ts: ok')
