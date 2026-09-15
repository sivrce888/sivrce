/**
 * Self-check: SSR-stable listing prices (hydration contract).
 * Run: npx tsx src/lib/currency.check.ts
 */
import { AED_PER_USD, EUR_GEL_FALLBACK, USD_GEL_FALLBACK, convertGel, formatMapPin, formatMoney, formatListingPrice, listingToggleCurrencies, marketCurrencyOptions } from './currency'

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

// EUR-native listing (DE market): the euro figure is LOCKED — never re-read as USD.
const eurNative = {
  priceUSD: 520_000,
  priceGEL: 1_404_000,
  priceOriginal: 480_000,
  currencyOriginal: 'EUR' as const,
  rate: USD_GEL_FALLBACK,
  eurRate: EUR_GEL_FALLBACK,
}
const eurEur = formatListingPrice({ ...eurNative, currencyPreference: 'EUR' as const })
if (eurEur.primary !== '€480 000') throw new Error(`EUR-native primary drifted: ${eurEur.primary}`)
// €480 000 × (3.04/2.7) — NOT the $480 000 the old GEL|USD-only engine emitted.
const eurInUsd = formatListingPrice({ ...eurNative, currencyPreference: 'USD' as const })
if (eurInUsd.primary !== '$540 444') throw new Error(`EUR→USD conversion wrong: ${eurInUsd.primary}`)
if (eurInUsd.secondary !== '≈ 1 459 200₾') throw new Error(`EUR→GEL conversion wrong: ${eurInUsd.secondary}`)

// AED-native listing (AE market): AED is pegged to USD, so the peg — not a rate
// feed — drives the conversion. 2 385 000 AED is NOT $2 385 000.
const aedNative = {
  priceUSD: 650_000,
  priceGEL: 1_755_000,
  priceOriginal: 2_385_000,
  currencyOriginal: 'AED' as const,
  rate: USD_GEL_FALLBACK,
  eurRate: EUR_GEL_FALLBACK,
}
const aedUsd = formatListingPrice({ ...aedNative, currencyPreference: 'USD' as const })
const expectUsd = Math.round(2_385_000 / AED_PER_USD)
if (expectUsd !== 649_421) throw new Error(`peg drifted: ${expectUsd}`)
if (aedUsd.primary !== `$649 421`) throw new Error(`AED→USD wrong: ${aedUsd.primary}`)
if (aedUsd.secondary !== `≈ 1 753 437₾`) throw new Error(`AED→GEL wrong: ${aedUsd.secondary}`)

// EUR unit helpers mirror the USD contract.
if (formatMoney(3040, 'EUR', USD_GEL_FALLBACK, EUR_GEL_FALLBACK) !== '€1 000') throw new Error('formatMoney EUR')
if (convertGel(3040, 'EUR', USD_GEL_FALLBACK, EUR_GEL_FALLBACK) !== 1000) throw new Error('convertGel EUR')
if (formatMapPin(3_040_000, 'EUR', USD_GEL_FALLBACK, EUR_GEL_FALLBACK) !== '€1M') throw new Error('formatMapPin EUR M')
if (formatMapPin(91_200, 'EUR', USD_GEL_FALLBACK, EUR_GEL_FALLBACK) !== '€30k') throw new Error('formatMapPin EUR k')
// USD/GEL behaviour unchanged (positional defaults still hold).
if (formatMapPin(185_000, 'GEL') !== '185კ₾') throw new Error('formatMapPin GEL')
if (formatMapPin(85_000, 'USD', 2.7) !== '$31k') throw new Error('formatMapPin USD')

// Market cross: on the UAE market the approx quote is dirhams, in Europe euros -
// the GEL cross belongs to Georgia only.
const aedOnAe = formatListingPrice({ ...aedNative, currencyPreference: 'USD' as const, country: 'AE' })
if (aedOnAe.secondary !== '≈ $649 421') throw new Error(`AED market cross: ${aedOnAe.secondary}`)
const aedPref = formatListingPrice({ ...aedNative, currencyPreference: 'AED' as const })
if (aedPref.primary !== 'AED 2 385 000') throw new Error(`AED pref must stay locked: ${aedPref.primary}`)
if (aedPref.secondary !== '≈ $649 421') throw new Error(`AED pref secondary: ${aedPref.secondary}`)
const eurOnDe = formatListingPrice({ ...usdListing, country: 'DE' })
if (eurOnDe.secondary !== '≈ €1 534 737') throw new Error(`DE market cross: ${eurOnDe.secondary}`)

// AED unit helpers mirror the EUR contract.
if (formatMoney(3040, 'AED', USD_GEL_FALLBACK) !== 'AED 4 135') throw new Error('formatMoney AED')
if (formatMapPin(3_040_000, 'AED', USD_GEL_FALLBACK) !== 'AED 4.1M') throw new Error('formatMapPin AED M')

if (listingToggleCurrencies({ country: 'DE' }).join() !== 'EUR,USD') throw new Error('DE toggle')
if (listingToggleCurrencies({ currencyOriginal: 'EUR' }).join() !== 'EUR,USD') throw new Error('EUR-native toggle')
if (listingToggleCurrencies({ country: 'GE' }).join() !== 'GEL,USD') throw new Error('GE toggle')
if (listingToggleCurrencies({ country: 'AE' }).join() !== 'AED,USD') throw new Error('AE toggle')
if (marketCurrencyOptions('AE').join() !== 'AED,USD') throw new Error('AE options')
if (marketCurrencyOptions(null).join() !== 'USD,EUR,GEL') throw new Error('GE options')

console.log('currency.check.ts: ok')
