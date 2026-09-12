/**
 * SIVRCE — edge-safe locale auto-detection (no 'use client', no React).
 * Priority (Airbnb pattern): explicit choice (sv-lang cookie) > URL prefix >
 * browser settings (Accept-Language) > location hint (banner only, never forced).
 * IP country never forces a language — an English speaker in Berlin keeps English.
 */

import { LANGS, PREFIXED_LANGS, DEFAULT_LANG, type Lang } from './core'

/** Edge-readable explicit choice. Mirrors localStorage('sivrce:lang'). */
export const LANG_COOKIE = 'sv-lang'
export const LANG_COOKIE_MAX_AGE = 60 * 60 * 24 * 365

const BY_LOWER: Record<string, Lang> = Object.fromEntries(
  LANGS.map((l) => [l, l]),
)

/** Legacy ISO 639 code browsers still send (Android WebView Hebrew). */
const LEGACY: Record<string, Lang> = { iw: 'he' }

/**
 * Best supported Lang from an Accept-Language header, or null when unusable.
 * Handles region tags (de-DE → de), q-weights, wildcard, garbage. ka included
 * so callers can distinguish "explicitly Georgian" from "no signal".
 */
export function bestLangFromHeader(header: string | null | undefined): Lang | null {
  if (!header) return null
  const scored: { lang: Lang; q: number; i: number }[] = []
  let i = 0
  for (const part of header.split(',')) {
    i++
    const [rangeRaw, ...params] = part.trim().split(';')
    const range = (rangeRaw ?? '').trim().toLowerCase()
    if (!range || range === '*') continue
    let q = 1
    for (const p of params) {
      const m = p.trim().match(/^q\s*=\s*(0(?:\.\d{0,3})?|1(?:\.0{0,3})?)$/)
      if (m) q = Number(m[1])
    }
    if (q <= 0) continue
    const primary = range.split('-')[0]!
    const lang = BY_LOWER[range] ?? BY_LOWER[primary] ?? LEGACY[primary]
    if (lang && !scored.some((s) => s.lang === lang)) scored.push({ lang, q, i })
  }
  scored.sort((a, b) => b.q - a.q || a.i - b.i)
  return scored[0]?.lang ?? null
}

/**
 * Location → suggestion only (banner, never redirect). Tight map on purpose:
 * anything else falls back to the browser language. CH keeps browser lang
 * (de/fr/it unclear from country alone).
 */
const COUNTRY_LANG: Record<string, Lang> = {
  GE: 'ka',
  DE: 'de', AT: 'de', LI: 'de', LU: 'de',
  RU: 'ru', BY: 'ru', KZ: 'ru', KG: 'ru', TJ: 'ru', TM: 'ru', UZ: 'ru', MD: 'ru',
  UA: 'uk',
  AM: 'hy',
  AZ: 'az',
  TR: 'tr',
  IL: 'he',
  SA: 'ar', AE: 'ar', QA: 'ar', KW: 'ar', BH: 'ar', OM: 'ar',
  JO: 'ar', LB: 'ar', IQ: 'ar', SY: 'ar', YE: 'ar',
  EG: 'ar', LY: 'ar', MA: 'ar', TN: 'ar', DZ: 'ar', SD: 'ar',
}

export function suggestLangForCountry(cc: string | null | undefined): Lang | null {
  if (!cc) return null
  return COUNTRY_LANG[cc.trim().toUpperCase()] ?? null
}

/** BCP 47 tag per Lang for Intl.DisplayNames / Intl.NumberFormat. */
export const LANG_LOCALE_TAG: Record<Lang, string> = {
  ka: 'ka', en: 'en', ru: 'ru', he: 'he', ar: 'ar',
  tr: 'tr', uk: 'uk', hy: 'hy', az: 'az', de: 'de',
}

export interface AutoLocaleInput {
  pathname: string
  market: string
  /** Explicit choice (sv-lang cookie). Any value counts as "decided". */
  cookie?: string | null
  acceptLanguage?: string | null
  /** Caller-evaluated bot check (proxy owns the UA regex). */
  crawler?: boolean
  /** RSC flight / router prefetch — documents only. */
  internal?: boolean
}

/**
 * Airbnb-pattern auto-locale for unprefixed URLs (caller issues a 302, never
 * cached as canonical): explicit cookie wins on every path; Accept-Language
 * sniffs only the front door on first visit. Country markets, crawlers and
 * framework internals return null (serve ka-canonical + hreflang).
 * ponytail: pure so the edge proxy stays a thin caller (tested below).
 */
export function autoLocalePath(input: AutoLocaleInput): string | null {
  const { pathname, market, cookie, acceptLanguage, crawler, internal } = input
  if (market !== 'ge') return null
  const seg = pathname.split('/')[1] ?? ''
  if (seg === DEFAULT_LANG || (PREFIXED_LANGS as readonly string[]).includes(seg)) return null
  // Documents only — API/auth/well-known must stay unprefixed or every
  // /en user 404s (cookie would rewrite /api/search → /en/api/search).
  if (
    pathname === '/api' ||
    pathname.startsWith('/api/') ||
    pathname === '/auth' ||
    pathname.startsWith('/auth/') ||
    pathname.startsWith('/.well-known/') ||
    pathname.endsWith('.txt')
  ) {
    return null
  }
  if (crawler || internal) return null
  if (cookie && (PREFIXED_LANGS as readonly string[]).includes(cookie)) {
    return `/${cookie}${pathname === '/' ? '' : pathname}`
  }
  if (cookie || pathname !== '/') return null
  const best = bestLangFromHeader(acceptLanguage)
  return best && best !== DEFAULT_LANG ? `/${best}` : null
}
