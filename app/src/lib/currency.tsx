'use client'

/**
 * SIVRCE — Currency context, hook and formatter.
 * Pattern: identical to I18nProvider (useSyncExternalStore, localStorage, cross-tab sync).
 * Default: USD ($). Live USD→GEL + EUR→GEL rates fetched from open.er-api.com (free, no key).
 * Falls back to hardcoded constants.
 */

import { createContext, useContext, useEffect, useState, useSyncExternalStore } from 'react'

export type Currency = 'GEL' | 'USD' | 'EUR'

/** Hardcoded fallback when live API is unreachable */
export const USD_GEL_FALLBACK = 2.7
/** EUR→GEL cross fallback (≈3.03–3.05, Sept 2026) — live rate overwrites in seconds. */
export const EUR_GEL_FALLBACK = 3.04

const RATE_CACHE_KEY = 'sivrce:rate'
const RATE_TTL = 6 * 60 * 60 * 1000 // 6 hours

const CURRENCIES: readonly Currency[] = ['GEL', 'USD', 'EUR']
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
    return CURRENCIES.includes(raw as Currency) ? (raw as Currency) : 'USD'
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
  const value = currency === 'USD' ? Math.round(gel / rate) : currency === 'EUR' ? Math.round(gel / eurRate) : Math.round(gel)
  const formatted = group3(value)
  return currency === 'USD' ? `$${formatted}` : currency === 'EUR' ? `€${formatted}` : `${formatted}₾`
}

/** Compact map pin — dense labels beat full formatMoney. */
export function formatMapPin(gel: number, currency: Currency = 'GEL', rate: number = USD_GEL_FALLBACK, eurRate: number = EUR_GEL_FALLBACK): string {
  const n = currency === 'USD' ? Math.round(gel / rate) : currency === 'EUR' ? Math.round(gel / eurRate) : Math.round(gel)
  const sym = currency === 'USD' ? '$' : currency === 'EUR' ? '€' : null
  if (!Number.isFinite(n) || n <= 0) return ''
  if (n >= 1_000_000) {
    const m = n / 1_000_000
    const s = m >= 10 ? String(Math.round(m)) : String(Math.round(m * 10) / 10)
    return sym ? `${sym}${s}M` : `${s}მლნ₾`
  }
  if (n >= 10_000) {
    return sym ? `${sym}${Math.round(n / 1000)}k` : `${Math.round(n / 1000)}კ₾`
  }
  return sym ? `${sym}${n}` : `${n}₾`
}

export function convertGel(gel: number, currency: Currency, rate: number = USD_GEL_FALLBACK, eurRate: number = EUR_GEL_FALLBACK): number {
  return currency === 'USD' ? Math.round(gel / rate) : currency === 'EUR' ? Math.round(gel / eurRate) : Math.round(gel)
}

export interface FormattedListingPrice {
  primary: string
  secondary: string
}

/**
 * Currency locking engine:
 * Preserves the listing's original nominal currency & price without drift.
 * - GEL base (e.g. 800 ₾): GEL price stays locked at 800 ₾; USD is dynamically converted.
 * - USD base (e.g. $800): USD price stays locked at $800; GEL is dynamically converted.
 */
export function formatListingPrice({
  priceUSD,
  priceGEL,
  priceOriginal,
  currencyOriginal,
  currencyPreference,
  rate = USD_GEL_FALLBACK,
  eurRate = EUR_GEL_FALLBACK,
}: {
  priceUSD: number
  priceGEL: number
  priceOriginal?: number | null
  currencyOriginal?: 'GEL' | 'USD' | null
  currencyPreference: Currency
  rate?: number
  eurRate?: number
}): FormattedListingPrice {
  const isOrigGel = currencyOriginal === 'GEL'
  const baseGel = isOrigGel ? (priceOriginal ?? priceGEL) : Math.round(priceUSD * rate)
  const baseUsd = !isOrigGel ? (priceOriginal ?? priceUSD) : Math.round(priceGEL / rate)

  if (currencyPreference === 'EUR') {
    const primaryValue = Math.round(baseGel / eurRate)
    // Secondary shows the listing's native locked figure — never a double conversion.
    const secondaryFormatted = isOrigGel ? `${group3(baseGel)}₾` : `$${group3(baseUsd)}`
    return { primary: `€${group3(primaryValue)}`, secondary: `≈ ${secondaryFormatted}` }
  }

  const primaryValue = currencyPreference === 'GEL' ? baseGel : baseUsd
  const secondaryValue = currencyPreference === 'GEL' ? baseUsd : baseGel

  const primaryFormatted = currencyPreference === 'GEL' ? `${group3(primaryValue)}₾` : `$${group3(primaryValue)}`
  const secondaryFormatted = currencyPreference === 'GEL' ? `$${group3(secondaryValue)}` : `${group3(secondaryValue)}₾`

  return {
    primary: primaryFormatted,
    secondary: `≈ ${secondaryFormatted}`,
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
