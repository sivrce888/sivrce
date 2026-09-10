/**
 * Country / market registry — language, currency, units and URL prefix
 * are independent. Add a row + copy + `app/[lang]/<cc>/[[...slug]]` to launch
 * FR/ES/IT/UK/US/CA/TR. Do not pick a prefix that collides with LANGS unless
 * you host-disambiguate like `de` (sivrce.ge/de = German locale).
 *
 * ponytail: table only. Listing FX (EUR/AED) stays off the GEL/USD
 * converter until DE/AE inventory exists — upgrade: extend Currency.
 */

import type { Lang } from '@/lib/i18n/core'

export type MarketId = 'ge' | 'de' | 'ae' | 'global'
export type CountryId = 'ge' | 'de' | 'ae'
export type MarketCurrency = 'GEL' | 'USD' | 'EUR' | 'AED'

export const COM_ORIGIN = 'https://sivrce.com'
export const GE_ORIGIN = 'https://sivrce.ge'

/** Live ISO-3166 path prefixes on sivrce.com. Must stay out of LANGS except `de`. */
export const COUNTRY_IDS = ['de', 'ae'] as const
export type PathCountryId = (typeof COUNTRY_IDS)[number]

export const COUNTRY_PREFIX_RE = /^\/(de|ae)(?=\/|$)/

export function isCountryPath(path: string): boolean {
  return COUNTRY_PREFIX_RE.test(path)
}

export function countryFromPath(pathname: string): PathCountryId | null {
  const m = pathname.match(COUNTRY_PREFIX_RE)
  return m ? (m[1] as PathCountryId) : null
}

export interface Market {
  id: MarketId
  countryCode: 'GE' | 'DE' | 'AE' | null
  currency: MarketCurrency
  /** BCP 47 for dates/numbers — not the UI language. */
  locale: string
  defaultLang: Lang
  units: 'metric'
  /** Public path on the canonical origin. Empty = site root. */
  pathPrefix: '' | '/de' | '/ae'
  canonicalOrigin: string
  defaultCitySlug: string
  citySlugs: readonly string[]
  intents: readonly ('buy' | 'rent')[]
}

export const MARKETS: Record<CountryId, Market> = {
  ge: {
    id: 'ge',
    countryCode: 'GE',
    currency: 'GEL',
    locale: 'ka-GE',
    defaultLang: 'ka',
    units: 'metric',
    pathPrefix: '',
    canonicalOrigin: GE_ORIGIN,
    defaultCitySlug: 'tbilisi',
    citySlugs: [],
    intents: ['buy', 'rent'],
  },
  de: {
    id: 'de',
    countryCode: 'DE',
    currency: 'EUR',
    locale: 'en-DE',
    defaultLang: 'en',
    units: 'metric',
    pathPrefix: '/de',
    canonicalOrigin: COM_ORIGIN,
    defaultCitySlug: 'berlin',
    citySlugs: [
      'berlin',
      'hamburg',
      'munich',
      'cologne',
      'frankfurt',
      'stuttgart',
      'duesseldorf',
      'leipzig',
      'dortmund',
      'essen',
      'bremen',
      'dresden',
      'hanover',
      'nuremberg',
      'duisburg',
      'bochum',
    ],
    intents: ['buy', 'rent'],
  },
  ae: {
    id: 'ae',
    countryCode: 'AE',
    currency: 'AED',
    locale: 'en-AE',
    defaultLang: 'en',
    units: 'metric',
    pathPrefix: '/ae',
    canonicalOrigin: COM_ORIGIN,
    defaultCitySlug: 'dubai',
    citySlugs: ['dubai', 'abu-dhabi'],
    intents: ['buy', 'rent'],
  },
}

export const GLOBAL_MARKET: Pick<Market, 'id' | 'currency' | 'locale' | 'defaultLang' | 'canonicalOrigin' | 'pathPrefix'> = {
  id: 'global',
  currency: 'USD',
  locale: 'en',
  defaultLang: 'en',
  canonicalOrigin: COM_ORIGIN,
  pathPrefix: '',
}

export function isPathCountry(seg: string): seg is PathCountryId {
  return (COUNTRY_IDS as readonly string[]).includes(seg)
}

/** Reverse lookup: city slugs are globally unique across live markets. */
export function findCountryByCity(slug: string): PathCountryId | null {
  for (const id of COUNTRY_IDS) {
    if (MARKETS[id].citySlugs.includes(slug)) return id
  }
  return null
}

export function countryCitySet(id: PathCountryId): Set<string> {
  return new Set(MARKETS[id].citySlugs)
}

export function isCountryCity(id: PathCountryId, slug: string): boolean {
  return MARKETS[id].citySlugs.includes(slug)
}

export function countryHref(id: PathCountryId, rest = ''): string {
  const prefix = MARKETS[id].pathPrefix
  if (!rest || rest === '/') return prefix
  return `${prefix}${rest.startsWith('/') ? rest : `/${rest}`}`
}

export function intentToDeal(intent: string): 'sale' | 'rent' | null {
  if (intent === 'buy' || intent === 'sale') return 'sale'
  if (intent === 'rent') return 'rent'
  return null
}

export function canonicalIntent(intent: string): 'buy' | 'rent' | null {
  if (intent === 'buy' || intent === 'sale') return 'buy'
  if (intent === 'rent') return 'rent'
  return null
}
