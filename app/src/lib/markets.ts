/**
 * Country / market registry — language, currency, units and URL prefix
 * are independent. Path prefixes that collide with LANGS (`de`, `tr`) are
 * host-disambiguated: sivrce.ge/de = German locale, sivrce.com/de = Germany.
 *
 * Aliases (not in COUNTRY_IDS): /uae → /ae, /uk → /gb.
 *
 * ponytail: table only. Listing FX stays off the GEL/USD converter until
 * that market has inventory — upgrade: extend Currency.
 */

import type { Lang } from '@/lib/i18n/core'

export type PathCountryId = (typeof COUNTRY_IDS)[number]
export type MarketId = 'ge' | 'global' | PathCountryId
export type CountryId = 'ge' | PathCountryId
export type MarketCurrency = 'GEL' | 'USD' | 'EUR' | 'AED' | 'GBP' | 'CAD' | 'TRY'

export const COM_ORIGIN = 'https://sivrce.com'
export const GE_ORIGIN = 'https://sivrce.ge'

/** Live ISO-3166 path prefixes on sivrce.com. */
export const COUNTRY_IDS = ['de', 'ae', 'fr', 'es', 'it', 'gb', 'us', 'ca', 'tr'] as const

export const COUNTRY_PREFIX_RE = new RegExp(`^/(${COUNTRY_IDS.join('|')})(?=/|$)`)

/** Human aliases → canonical ISO path. */
export const COUNTRY_ALIAS = { uae: 'ae', uk: 'gb' } as const
export type CountryAlias = keyof typeof COUNTRY_ALIAS

/** Company pages that stay on sivrce.com (not Georgia catalog). */
export const COM_PAGE_SEGS = [
  'about',
  'advertise',
  'blog',
  'careers',
  'contact',
  'faq',
  'privacy',
  'terms',
] as const

export function isCountryPath(path: string): boolean {
  return COUNTRY_PREFIX_RE.test(path)
}

export function countryFromPath(pathname: string): PathCountryId | null {
  const m = pathname.match(COUNTRY_PREFIX_RE)
  return m ? (m[1] as PathCountryId) : null
}

export function isCountryAlias(seg: string): seg is CountryAlias {
  return seg === 'uae' || seg === 'uk'
}

export function isComPageSeg(seg: string): boolean {
  return (COM_PAGE_SEGS as readonly string[]).includes(seg)
}

export interface Market {
  id: MarketId
  countryCode: 'GE' | 'DE' | 'AE' | 'FR' | 'ES' | 'IT' | 'GB' | 'US' | 'CA' | 'TR' | null
  currency: MarketCurrency
  /** BCP 47 for dates/numbers — not the UI language. */
  locale: string
  defaultLang: Lang
  units: 'metric'
  /** Public path on the canonical origin. Empty = site root. */
  pathPrefix: string
  canonicalOrigin: string
  defaultCitySlug: string
  citySlugs: readonly string[]
  intents: readonly ('buy' | 'rent')[]
}

function pathMarket(
  id: PathCountryId,
  countryCode: Exclude<Market['countryCode'], 'GE' | null>,
  currency: MarketCurrency,
  locale: string,
  defaultCitySlug: string,
  citySlugs: readonly string[],
): Market {
  return {
    id,
    countryCode,
    currency,
    locale,
    defaultLang: 'en',
    units: 'metric',
    pathPrefix: `/${id}`,
    canonicalOrigin: COM_ORIGIN,
    defaultCitySlug,
    citySlugs,
    intents: ['buy', 'rent'],
  }
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
  de: pathMarket('de', 'DE', 'EUR', 'en-DE', 'berlin', [
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
  ]),
  ae: pathMarket('ae', 'AE', 'AED', 'en-AE', 'dubai', ['dubai', 'abu-dhabi']),
  fr: pathMarket('fr', 'FR', 'EUR', 'en-FR', 'paris', ['paris', 'lyon']),
  es: pathMarket('es', 'ES', 'EUR', 'en-ES', 'madrid', ['madrid', 'barcelona']),
  it: pathMarket('it', 'IT', 'EUR', 'en-IT', 'rome', ['rome', 'milan']),
  gb: pathMarket('gb', 'GB', 'GBP', 'en-GB', 'london', ['london', 'manchester']),
  us: pathMarket('us', 'US', 'USD', 'en-US', 'new-york', ['new-york', 'miami']),
  ca: pathMarket('ca', 'CA', 'CAD', 'en-CA', 'toronto', ['toronto', 'vancouver']),
  tr: pathMarket('tr', 'TR', 'TRY', 'en-TR', 'istanbul', ['istanbul', 'antalya']),
}

export const GLOBAL_MARKET: Pick<
  Market,
  'id' | 'currency' | 'locale' | 'defaultLang' | 'canonicalOrigin' | 'pathPrefix'
> = {
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
