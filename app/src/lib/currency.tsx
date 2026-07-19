'use client'

/**
 * SIVRCE — Currency context, hook and formatter.
 * Pattern: identical to I18nProvider (useSyncExternalStore, localStorage, cross-tab sync).
 * Default: USD ($). Live USD→GEL rate fetched from open.er-api.com (free, no key).
 * Falls back to hardcoded 2.7.
 */

import { createContext, useContext, useEffect, useState } from 'react'

export type Currency = 'GEL' | 'USD'

/** Hardcoded fallback when live API is unreachable */
export const USD_GEL_FALLBACK = 2.7

const RATE_CACHE_KEY = 'sivrce:rate'
const RATE_TTL = 6 * 60 * 60 * 1000 // 6 hours

const CURRENCIES: readonly Currency[] = ['GEL', 'USD']
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

/** Read cached rate from localStorage, return null if expired or missing */
function readCachedRate(): number | null {
  try {
    const raw = localStorage.getItem(RATE_CACHE_KEY)
    if (!raw) return null
    const { rate, ts } = JSON.parse(raw)
    if (typeof rate !== 'number' || rate <= 0) return null
    if (Date.now() - ts > RATE_TTL) return null
    return rate
  } catch {
    return null
  }
}

function writeCachedRate(rate: number) {
  try { localStorage.setItem(RATE_CACHE_KEY, JSON.stringify({ rate, ts: Date.now() })) } catch { /* noop */ }
}

/**
 * Fetch live USD→GEL rate from open.er-api.com (free, no API key).
 * Cached in localStorage for 6 hours. Falls back to USD_GEL_FALLBACK.
 * ponytail: global fetch + cache; per-account rate sources if multi-currency matters.
 */
export function useLiveRate(): number {
  // ponytail: always init from fallback — reading localStorage in useState makes
  // the first client render differ from SSR HTML (hydration mismatch on every price).
  const [rate, setRate] = useState(USD_GEL_FALLBACK)

  useEffect(() => {
    // Fresh cached value wins post-hydration — no fetch needed
    const cached = readCachedRate()
    // ponytail: microtask defer — a synchronous setState in the effect body trips
    // react-hooks/set-state-in-effect (cascading render); visible timing unchanged.
    if (cached) { queueMicrotask(() => setRate(cached)); return }
    // Fetch live rate once, off the boot critical path (fallback rate shows until then)
    const run = () =>
      fetch('https://open.er-api.com/v6/latest/USD')
        .then((r) => r.json())
        .then((d) => {
          const live = d?.rates?.GEL
          if (typeof live === 'number' && live > 0) {
            setRate(live)
            writeCachedRate(live)
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

  return rate
}

/**
 * Georgian number formatting: groups of 3 with (non-breaking) space, ₾ or $ prefix.
 * ponytail: manual grouping — Intl 'ka' grouping differs between Node (space) and
 * some browsers (comma), which hydration-mismatched every price on the site.
 */
const group3 = (n: number): string => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')

export function formatMoney(gel: number, currency: Currency, rate: number = USD_GEL_FALLBACK): string {
  const value = currency === 'USD' ? Math.round(gel / rate) : Math.round(gel)
  const formatted = group3(value)
  return currency === 'USD' ? `$${formatted}` : `${formatted}₾`
}

/** Compact map pin — dense labels beat full formatMoney. */
export function formatMapPin(gel: number, currency: Currency = 'GEL', rate: number = USD_GEL_FALLBACK): string {
  const n = currency === 'USD' ? Math.round(gel / rate) : Math.round(gel)
  if (!Number.isFinite(n) || n <= 0) return ''
  if (n >= 1_000_000) {
    const m = n / 1_000_000
    const s = m >= 10 ? String(Math.round(m)) : String(Math.round(m * 10) / 10)
    return currency === 'USD' ? `$${s}M` : `${s}მლნ₾`
  }
  if (n >= 10_000) {
    return currency === 'USD' ? `$${Math.round(n / 1000)}k` : `${Math.round(n / 1000)}კ₾`
  }
  return currency === 'USD' ? `$${n}` : `${n}₾`
}

export function convertGel(gel: number, currency: Currency, rate: number = USD_GEL_FALLBACK): number {
  return currency === 'USD' ? Math.round(gel / rate) : Math.round(gel)
}

export function useCurrency(): CurrencyContextValue {
  const ctx = useContext(CurrencyContext)
  if (!ctx) throw new Error('useCurrency must be used within <CurrencyProvider>')
  return ctx
}
