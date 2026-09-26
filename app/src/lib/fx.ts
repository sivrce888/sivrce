/**
 * SIVRCE — server-side FX table for /valuta pages.
 * One fetch of the free open.er-api.com table (same source the client
 * currency.tsx already trusts), hourly ISR refresh, constant fallbacks so the
 * pages never 500. Cross rates pivot through USD (rates are per-USD).
 */

export const FX_CURRENCIES = [
  'USD', 'EUR', 'GEL', 'GBP', 'TRY', 'RUB', 'AED', 'ILS',
  'KZT', 'UAH', 'AMD', 'AZN', 'PLN', 'CNY',
] as const
export type FxCurrency = (typeof FX_CURRENCIES)[number]

/** Per-USD mid rates, snapshot 2026-09-26 (open.er-api.com) — shown only while the live feed is down. */
const FALLBACK: Record<FxCurrency, number> = {
  USD: 1, EUR: 0.8773, GEL: 2.6074, GBP: 0.7554, TRY: 48.92, RUB: 84.28,
  AED: 3.6725, ILS: 3.0437, KZT: 443.05, UAH: 44.88, AMD: 363.45,
  AZN: 1.6998, PLN: 3.8358, CNY: 6.7246,
}
const FALLBACK_UPDATED = '2026-09-26T00:02:32Z'

export interface FxTable {
  rates: Record<FxCurrency, number>
  /** Feed timestamp (ISO) — rendered as "updated N" on the pages. */
  updatedISO: string
  live: boolean
}

/** Hourly is fresher than every bank site's editorial cadence and 24× cheaper than per-request. */
const fetchFx = async (): Promise<FxTable> => {
  try {
    const res = await fetch('https://open.er-api.com/v6/latest/USD', {
      next: { revalidate: 3600 },
      signal: AbortSignal.timeout(4000),
    })
    if (!res.ok) throw new Error(`fx ${res.status}`)
    const data = (await res.json()) as { time_last_update_unix?: number; rates?: Record<string, number> }
    const src = data.rates
    if (!src) throw new Error('fx empty')
    const rates = {} as Record<FxCurrency, number>
    for (const c of FX_CURRENCIES) {
      const r = src[c]
      if (typeof r !== 'number' || r <= 0 || !Number.isFinite(r)) throw new Error(`fx ${c}`)
      rates[c] = r
    }
    return {
      rates,
      updatedISO: typeof data.time_last_update_unix === 'number'
        ? new Date(data.time_last_update_unix * 1000).toISOString()
        : FALLBACK_UPDATED,
      live: true,
    }
  } catch {
    return { rates: { ...FALLBACK }, updatedISO: FALLBACK_UPDATED, live: false }
  }
}

/** React cache dedupes hub + metadata + sibling lookups into one upstream hit per render. */
import { cache } from 'react'
export const getFx = cache(fetchFx)

/** Cross conversion through the USD base. Inputs are lib-validated; never raw user text. */
export function fxConvert(amount: number, from: FxCurrency, to: FxCurrency, rates: Record<FxCurrency, number>): number {
  return (amount / rates[from]) * rates[to]
}

/* ————— Pairs: the slugs with real search volume ————— */

export const FX_PAIRS: readonly (readonly [FxCurrency, FxCurrency])[] = [
  ['USD', 'GEL'], ['EUR', 'GEL'], ['GBP', 'GEL'], ['TRY', 'GEL'], ['RUB', 'GEL'],
  ['AED', 'GEL'], ['ILS', 'GEL'], ['KZT', 'GEL'], ['UAH', 'GEL'], ['AMD', 'GEL'],
  ['AZN', 'GEL'], ['PLN', 'GEL'], ['CNY', 'GEL'],
  ['GEL', 'USD'], ['GEL', 'EUR'],
  ['USD', 'EUR'], ['EUR', 'USD'],
]

export const pairSlug = (from: FxCurrency, to: FxCurrency) => `${from.toLowerCase()}-${to.toLowerCase()}`

const PAIR_MAP = new Map<string, readonly [FxCurrency, FxCurrency]>(FX_PAIRS.map((p) => [pairSlug(p[0], p[1]), p]))

/** Whitelist parse — unknown slugs 404, nothing user-controlled reaches the page. */
export function parsePairSlug(slug: string): readonly [FxCurrency, FxCurrency] | null {
  return PAIR_MAP.get(slug.toLowerCase()) ?? null
}

/* ————— Locale formatting: Intl carries all 10 languages, zero data tables ————— */

const LOC_TAG: Record<string, string> = {
  ka: 'ka', en: 'en', ru: 'ru', de: 'de', tr: 'tr', ar: 'ar', uk: 'uk', he: 'he', hy: 'hy', az: 'az',
}
export const fxLocaleTag = (lang: string) => LOC_TAG[lang] ?? 'en'

const nfCache = new Map<string, Intl.NumberFormat>()
function nf(tag: string, opts: Intl.NumberFormatOptions): Intl.NumberFormat {
  const key = tag + JSON.stringify(opts)
  let f = nfCache.get(key)
  if (!f) { f = new Intl.NumberFormat(tag, opts); nfCache.set(key, f) }
  return f
}

/** 2 607,40-style amount in the locale's digits, always the target currency's symbol. */
export function fxFormat(amount: number, currency: FxCurrency, lang: string): string {
  return nf(fxLocaleTag(lang), { style: 'currency', currency, maximumFractionDigits: 2 }).format(amount)
}

/** 4-decimals precision for sub-unit rates (1 USD → 2.6074 GEL). */
export function fxRate(rate: number, lang: string): string {
  return nf(fxLocaleTag(lang), { maximumFractionDigits: 4 }).format(rate)
}

/** Localized long currency name via ICU — "აშშ დოლარი", "US Dollar", "Доллар США"… */
const dnCache = new Map<string, Intl.DisplayNames>()
export function fxName(currency: FxCurrency, lang: string): string {
  let dn = dnCache.get(lang)
  if (!dn) { dn = new Intl.DisplayNames(fxLocaleTag(lang), { type: 'currency' }); dnCache.set(lang, dn) }
  try { return dn.of(currency) ?? currency } catch { return currency }
}

/** Grouped whole number in the locale's digits — the FROM side of a conversion line. */
export function fxWhole(amount: number, lang: string): string {
  return nf(fxLocaleTag(lang), { maximumFractionDigits: 0 }).format(amount)
}

export function fxUpdated(iso: string, lang: string): string {
  return new Intl.DateTimeFormat(fxLocaleTag(lang), {
    dateStyle: 'medium', timeStyle: 'short', timeZone: 'UTC',
  }).format(new Date(iso)) + ' UTC'
}
