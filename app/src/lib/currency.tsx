'use client'

/**
 * SIVRCE — Currency context, hook and formatter.
 * Pattern: identical to I18nProvider (useSyncExternalStore, localStorage, cross-tab sync).
 * Default: USD ($). Live USD→GEL + EUR→GEL rates fetched from open.er-api.com (free, no key).
 * Falls back to hardcoded constants.
 */

import { createContext, useContext, useEffect, useState, useSyncExternalStore } from 'react'
import { COUNTRY_LOCALE_PREFIXES, isPathCountry } from '@/lib/markets'

export type Currency = 'GEL' | 'USD' | 'EUR' | 'AED'

/** Hardcoded fallback when live API is unreachable */
export const USD_GEL_FALLBACK = 2.7
/** EUR→GEL cross fallback (≈3.03–3.05, Sept 2026) — live rate overwrites in seconds. */
export const EUR_GEL_FALLBACK = 3.04
/** AED is hard-pegged to USD (3.6725 since 1997) — no rate feed needed. */
export const AED_PER_USD = 3.6725
/** Currencies a listing can be *quoted* in. Superset of `Currency`, the
 *  display preference: AE inventory is quoted in AED but shown in GEL/USD/EUR. */
export type ListingCurrency = Currency | 'AED'

const RATE_CACHE_KEY = 'sivrce:rate'
const RATE_TTL = 6 * 60 * 60 * 1000 // 6 hours

const CURRENCIES: readonly Currency[] = ['GEL', 'USD', 'EUR', 'AED']

/** Chip order per market: local quote first. Georgia keeps the ₾ toggle.
 *  Accepts both cases — path ids are lowercase ('ae'), listing rows are ISO ('AE'). */
export function marketCurrencyOptions(country: string | null | undefined): Currency[] {
  const c = country?.toLowerCase()
  if (c === 'ae') return ['AED', 'USD']
  if (c === 'de') return ['EUR', 'USD']
  if (c && c !== 'ge') return ['EUR', 'USD']
  return ['USD', 'EUR', 'GEL']
}

/** Market country from the URL only — never a guess. `de` counts as a market
 *  on sivrce.com; elsewhere it must be locale-prefixed (`/en/de`). */
export function marketCountryFromPath(pathname: string, host?: string): string | null {
  const segs = pathname.split('/').filter(Boolean)
  if (!segs.length) return null
  const com = host === 'sivrce.com' || host === 'www.sivrce.com'
  if (com && isPathCountry(segs[0])) return segs[0]
  if (segs.length >= 2 && (COUNTRY_LOCALE_PREFIXES as readonly string[]).includes(segs[0]) && isPathCountry(segs[1])) return segs[1]
  return null
}

function defaultMarketCurrency(): Currency {
  // raw pathname — marketCountryFromPath does its own locale-prefix sniffing
  const country = marketCountryFromPath(window.location.pathname, window.location.hostname)
  if (country === 'ae') return 'AED'
  if (country && country !== 'ge') return 'EUR'
  return 'USD'
}

/** Toggle chips on a listing. GEL is Georgia-only; euro markets never offer Lari. */
export function listingToggleCurrencies(opts: {
  country?: string | null
  currencyOriginal?: ListingCurrency | null
}): Currency[] {
  if (opts.country === 'AE') return ['AED', 'USD']
  if (opts.currencyOriginal === 'EUR' || opts.country === 'DE') return ['EUR', 'USD']
  if (opts.country && opts.country !== 'GE') return ['EUR', 'USD']
  return ['GEL', 'USD']
}
const STORAGE_KEY = 'sivrce:currency'
const CURRENCY_EVENT = 'sivrce:currency-changed'

export interface CurrencyContextValue {
  currency: Currency
  setCurrency: (c: Currency) => void
  /** Format a GEL amount in the active currency. */
  format: (gel: number) => string
  /** Raw converted number (no formatting). */
  convert: (gel: number) => number
  /** Current USD→GEL rate */
  rate: number
  /** Current EUR→GEL rate */
  eurRate: number
}

export const CurrencyContext = createContext<CurrencyContextValue | null>(null)

export function readStoredCurrency(): Currency {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (CURRENCIES.includes(raw as Currency)) return raw as Currency
  } catch { /* noop */ }
  // No explicit choice yet — quote in the market's own money.
  try {
    return defaultMarketCurrency()
  } catch {
    return 'USD'
  }
}

export function persistCurrency(c: Currency) {
  try { localStorage.setItem(STORAGE_KEY, c) } catch { /* noop */ }
}

export function getServerCurrency(): Currency {
  return 'USD'
}

export function subscribeCurrency(onChange: () => void): () => void {
  window.addEventListener(CURRENCY_EVENT, onChange)
  window.addEventListener('storage', onChange)
  return () => {
    window.removeEventListener(CURRENCY_EVENT, onChange)
    window.removeEventListener('storage', onChange)
  }
}

export function emitCurrencyChange() {
  window.dispatchEvent(new CustomEvent(CURRENCY_EVENT))
}

/** Read cached rates from localStorage, return null if expired or missing */
function readCachedRates(): { usd: number; eur: number } | null {
  try {
    const raw = localStorage.getItem(RATE_CACHE_KEY)
    if (!raw) return null
    const { rate, eurRate, usd, eur, ts } = JSON.parse(raw)
    if (Date.now() - ts > RATE_TTL) return null
    // ponytail: pre-EUR cache rows carry only {rate} — eur falls back, never blocks.
    const u = typeof usd === 'number' && usd > 0 ? usd : typeof rate === 'number' && rate > 0 ? rate : null
    const e = typeof eur === 'number' && eur > 0 ? eur : typeof eurRate === 'number' && eurRate > 0 ? eurRate : null
    if (u == null && e == null) return null
    return { usd: u ?? USD_GEL_FALLBACK, eur: e ?? EUR_GEL_FALLBACK }
  } catch {
    return null
  }
}

function writeCachedRates(usd: number, eur: number) {
  try { localStorage.setItem(RATE_CACHE_KEY, JSON.stringify({ usd, eur, ts: Date.now() })) } catch { /* noop */ }
}

/**
 * Fetch live USD→GEL + EUR→GEL rates from open.er-api.com (free, no API key).
 * One response carries the whole table — EUR→GEL is the GEL/EUR cross.
 * Cached in localStorage for 6 hours. Falls back to *_FALLBACK constants.
 * ponytail: global fetch + cache; per-account rate sources if multi-currency matters.
 */
export function useLiveRates(): { usd: number; eur: number } {
  // ponytail: always init from fallback — reading localStorage in useState makes
  // the first client render differ from SSR HTML (hydration mismatch on every price).
  const [rates, setRates] = useState({ usd: USD_GEL_FALLBACK, eur: EUR_GEL_FALLBACK })

  useEffect(() => {
    // Fresh cached value wins post-hydration — no fetch needed
    const cached = readCachedRates()
    // ponytail: microtask defer — a synchronous setState in the effect body trips
    // react-hooks/set-state-in-effect (cascading render); visible timing unchanged.
    if (cached) { queueMicrotask(() => setRates(cached)); return }
    // Fetch live rates once, off the boot critical path (fallback rates show until then)
    const run = () =>
      fetch('https://open.er-api.com/v6/latest/USD')
        .then((r) => r.json())
        .then((d) => {
          const gel = d?.rates?.GEL
          const eur = d?.rates?.EUR
          if (typeof gel === 'number' && gel > 0) {
            const next = {
              usd: gel,
              eur: typeof eur === 'number' && eur > 0 ? gel / eur : EUR_GEL_FALLBACK,
            }
            setRates(next)
            writeCachedRates(next.usd, next.eur)
          }
        })
        .catch(() => {}) // silent fallback — next mount retries
    const ric: Window['requestIdleCallback'] | undefined = window.requestIdleCallback
    if (ric) {
      const id = ric.call(window, run, { timeout: 3000 })
      return () => window.cancelIdleCallback(id)
    }
    const id = window.setTimeout(run, 2000)
    return () => window.clearTimeout(id)
  }, [])

  return rates
}

/** Compat: USD→GEL only. Prefer useLiveRates. */
export function useLiveRate(): number {
  return useLiveRates().usd
}

/**
 * Georgian number formatting: groups of 3 with (non-breaking) space, ₾ or $ prefix.
 * ponytail: manual grouping — Intl 'ka' grouping differs between Node (space) and
 * some browsers (comma), which hydration-mismatched every price on the site.
 */
const group3 = (n: number): string => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')

export function formatMoney(gel: number, currency: Currency, rate: number = USD_GEL_FALLBACK, eurRate: number = EUR_GEL_FALLBACK): string {
  const value =
    currency === 'USD' ? Math.round(gel / rate)
    : currency === 'EUR' ? Math.round(gel / eurRate)
    : currency === 'AED' ? Math.round((gel * AED_PER_USD) / rate)
    : Math.round(gel)
  const formatted = group3(value)
  return currency === 'USD' ? `$${formatted}` : currency === 'EUR' ? `€${formatted}` : currency === 'AED' ? `AED ${formatted}` : `${formatted}₾`
}

/** Compact map pin — dense labels beat full formatMoney. */
export function formatMapPin(gel: number, currency: Currency = 'GEL', rate: number = USD_GEL_FALLBACK, eurRate: number = EUR_GEL_FALLBACK, lang = 'ka'): string {
  const n =
    currency === 'USD' ? Math.round(gel / rate)
    : currency === 'EUR' ? Math.round(gel / eurRate)
    : currency === 'AED' ? Math.round((gel * AED_PER_USD) / rate)
    : Math.round(gel)
  const sym = currency === 'USD' ? '$' : currency === 'EUR' ? '€' : currency === 'AED' ? 'AED ' : null
  if (!Number.isFinite(n) || n <= 0) return ''
  if (n >= 1_000_000) {
    const m = n / 1_000_000
    const s = m >= 10 ? String(Math.round(m)) : String(Math.round(m * 10) / 10)
    return sym ? `${sym}${s}M` : `${s}${lang === 'ka' ? 'მლნ₾' : 'M₾'}`
  }
  if (n >= 10_000) {
    return sym ? `${sym}${Math.round(n / 1000)}k` : `${Math.round(n / 1000)}${lang === 'ka' ? 'კ₾' : 'k₾'}`
  }
  return sym ? `${sym}${n}` : `${n}₾`
}

export function convertGel(gel: number, currency: Currency, rate: number = USD_GEL_FALLBACK, eurRate: number = EUR_GEL_FALLBACK): number {
  return currency === 'USD' ? Math.round(gel / rate) : currency === 'EUR' ? Math.round(gel / eurRate) : currency === 'AED' ? Math.round((gel * AED_PER_USD) / rate) : Math.round(gel)
}

export interface FormattedListingPrice {
  primary: string
  secondary: string
  /** Primary ÷ area, same currency + grouping — undefined without an area. */
  perM2?: string
}

/**
 * Currency locking engine:
 * Preserves the listing's original nominal currency & price without drift.
 * - GEL base (e.g. 800 ₾): GEL price stays locked at 800 ₾; USD is dynamically converted.
 * - USD base (e.g. $800): USD price stays locked at $800; GEL is dynamically converted.
 * - EUR base (e.g. €800, DE market): EUR stays locked; GEL/USD convert through GEL.
 */
export function formatListingPrice({
  priceUSD,
  priceGEL,
  priceOriginal,
  currencyOriginal,
  currencyPreference,
  country,
  rate = USD_GEL_FALLBACK,
  eurRate = EUR_GEL_FALLBACK,
  area = 0,
}: {
  priceUSD: number
  priceGEL: number
  priceOriginal?: number | null
  currencyOriginal?: ListingCurrency | null
  currencyPreference: Currency
  /** Market context — picks the ≈ cross: ₾ on Georgia, € in Europe, AED in the Gulf. */
  country?: string | null
  rate?: number
  eurRate?: number
  /** m² — when > 0, adds `perM2` derived from the displayed primary figure. */
  area?: number
}): FormattedListingPrice {
  const orig: ListingCurrency = currencyOriginal ?? 'USD'
  const locked = priceOriginal ?? (orig === 'GEL' ? priceGEL : priceUSD)
  const mkt = country?.toLowerCase()
  const perM2 = (v: number, fmt: (n: number) => string) =>
    area > 0 ? { perM2: fmt(Math.round(v / area)) } : {}
  // Each native currency pivots to USD/GEL exactly once — no double-conversion drift.
  const baseUsd =
    orig === 'USD' ? locked
    : orig === 'AED' ? Math.round(locked / AED_PER_USD)
    : orig === 'EUR' ? Math.round((locked * eurRate) / rate)
    : Math.round(priceGEL / rate)
  const baseGel =
    orig === 'GEL' ? locked
    : orig === 'EUR' ? Math.round(locked * eurRate)
    : Math.round(baseUsd * rate)

  if (currencyPreference === 'EUR') {
    const primaryValue = orig === 'EUR' ? locked : Math.round(baseGel / eurRate)
    // Secondary shows the listing's native locked figure — never a double conversion.
    // EUR-native listings have no other locked figure, so they fall back to USD.
    const secondaryFormatted = orig === 'GEL' ? `${group3(baseGel)}₾` : `$${group3(baseUsd)}`
    const eur = (n: number) => `€${group3(n)}`
    return { primary: eur(primaryValue), secondary: `≈ ${secondaryFormatted}`, ...perM2(primaryValue, eur) }
  }

  if (currencyPreference === 'AED') {
    // AED is USD-pegged — native AED quotes stay locked, the rest pivot once.
    const primaryValue = orig === 'AED' ? locked : Math.round(baseUsd * AED_PER_USD)
    const secondaryFormatted = orig === 'GEL' ? `${group3(baseGel)}₾` : `$${group3(baseUsd)}`
    const aed = (n: number) => `AED ${group3(n)}`
    return { primary: aed(primaryValue), secondary: `≈ ${secondaryFormatted}`, ...perM2(primaryValue, aed) }
  }

  const primaryValue = currencyPreference === 'GEL' ? baseGel : baseUsd

  let secondaryFormatted: string
  if (currencyPreference === 'GEL') {
    secondaryFormatted = `$${group3(baseUsd)}`
  } else if (mkt === 'ae' && orig === 'AED') {
    secondaryFormatted = `$${group3(baseUsd)}`
  } else if (mkt === 'ae') {
    secondaryFormatted = `AED ${group3(Math.round(baseUsd * AED_PER_USD))}`
  } else if (mkt && mkt !== 'ge') {
    secondaryFormatted = orig === 'EUR' ? `€${group3(locked)}` : `€${group3(Math.round(baseGel / eurRate))}`
  } else {
    secondaryFormatted = `${group3(baseGel)}₾`
  }

  // EUR/AED preferences returned above — only GEL/USD reach here.
  const fmt = (n: number) => (currencyPreference === 'GEL' ? `${group3(n)}₾` : `$${group3(n)}`)

  return {
    primary: fmt(primaryValue),
    secondary: `≈ ${secondaryFormatted}`,
    ...perM2(primaryValue, fmt),
  }
}

/** Per-consumer hydration gate — parent CurrencyProvider can already hold a live
 *  rate before Suspense children hydrate; reading that rate on first paint
 *  mismatches SSR HTML that used USD_GEL_FALLBACK. */
const hydrateSubscribe = () => () => {}
function useHydrated(): boolean {
  return useSyncExternalStore(hydrateSubscribe, () => true, () => false)
}

export function useCurrency(): CurrencyContextValue {
  const ctx = useContext(CurrencyContext)
  if (!ctx) throw new Error('useCurrency must be used within <CurrencyProvider>')
  // ponytail: gate at consumer, not provider — streaming below-fold hydrates after rate fetch.
  const hydrated = useHydrated()
  if (!hydrated) {
    const currency = getServerCurrency()
    const rate = USD_GEL_FALLBACK
    const eurRate = EUR_GEL_FALLBACK
    return {
      ...ctx,
      currency,
      rate,
      eurRate,
      format: (gel: number) => formatMoney(gel, currency, rate, eurRate),
      convert: (gel: number) => convertGel(gel, currency, rate, eurRate),
    }
  }
  return ctx
}
