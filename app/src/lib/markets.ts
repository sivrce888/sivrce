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
  /** Cities that actually have buy/rent copy pages (cityPack extras). */
  intentCities: readonly string[]
  intents: readonly ('buy' | 'rent')[]
}

function pathMarket(
  id: PathCountryId,
  countryCode: Exclude<Market['countryCode'], 'GE' | null>,
  currency: MarketCurrency,
  locale: string,
  defaultCitySlug: string,
  citySlugs: readonly string[],
  /** Cities with live buy/rent copy pages — others must not link intent URLs (404). */
  intentCities: readonly string[] = [],
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
    intentCities,
    intents: ['buy', 'rent'],
  }
}

/** Locales that prefix country routes on preview (`/en/de`) and sivrce.com (`/de/de`). */
const COUNTRY_LOCALE_PREFIXES = ['en', 'de', 'ar'] as const

/** Country root for this request: `/en/de` on preview, `/de` on sivrce.com. */
export function countryBasePath(country: PathCountryId, pathname: string): string {
  const base = MARKETS[country].pathPrefix
  for (const loc of COUNTRY_LOCALE_PREFIXES) {
    const p = `/${loc}${base}`
    if (pathname === p || pathname.startsWith(`${p}/`)) return p
  }
  return base
}

/** Intent page if the city has one, else the city hub — never a dead URL. German locale keeps the /de/de variant. */
export function intentHref(
  country: PathCountryId,
  citySlug: string,
  intent: 'buy' | 'rent',
  lang: Lang = 'en',
  pathname?: string,
): string {
  const m = MARKETS[country]
  const city = m.citySlugs.includes(citySlug) ? citySlug : m.defaultCitySlug
  const prefix = pathname
    ? countryBasePath(country, pathname)
    : country === 'de' && lang === 'de'
      ? `/de${m.pathPrefix}`
      : m.pathPrefix
  if (!m.intentCities.includes(city)) return `${prefix}/${city}`
  return `${prefix}/${city}/${intent}`
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
    intentCities: [],
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
  ], ['berlin']),
  ae: pathMarket('ae', 'AE', 'AED', 'en-AE', 'dubai', ['dubai', 'abu-dhabi', 'sharjah', 'ras-al-khaimah'], ['dubai']),
  fr: pathMarket('fr', 'FR', 'EUR', 'en-FR', 'paris', [
    'paris',
    'lyon',
    'marseille',
    'bordeaux',
    'nice',
    'toulouse',
  ]),
  es: pathMarket('es', 'ES', 'EUR', 'en-ES', 'madrid', [
    'madrid',
    'barcelona',
    'valencia',
    'malaga',
    'seville',
    'alicante',
  ]),
  it: pathMarket('it', 'IT', 'EUR', 'en-IT', 'rome', [
    'rome',
    'milan',
    'florence',
    'turin',
    'naples',
    'bologna',
  ]),
  gb: pathMarket('gb', 'GB', 'GBP', 'en-GB', 'london', [
    'london',
    'manchester',
    'birmingham',
    'edinburgh',
    'glasgow',
    'leeds',
  ]),
  us: pathMarket('us', 'US', 'USD', 'en-US', 'new-york', [
    'new-york',
    'miami',
    'los-angeles',
    'chicago',
    'austin',
    'seattle',
  ]),
  ca: pathMarket('ca', 'CA', 'CAD', 'en-CA', 'toronto', [
    'toronto',
    'vancouver',
    'montreal',
    'calgary',
    'ottawa',
    'edmonton',
  ]),
  tr: pathMarket('tr', 'TR', 'TRY', 'en-TR', 'istanbul', [
    'istanbul',
    'antalya',
    'ankara',
    'izmir',
    'bodrum',
    'bursa',
  ]),
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

/** ISO market scope for data fetches. `global` = worldwide, no filter — everything else is explicit. */
export function countryIsoForMarket(market: MarketId): string | undefined {
  if (market === 'global') return undefined
  return MARKETS[market].countryCode ?? undefined
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

/** Country market path after locale strip (`/de/berlin/buy`) or raw (`/en/de/berlin`). */
export function parseCountryPath(pathname: string): {
  country: PathCountryId
  city?: string
  intent?: 'buy' | 'rent'
} | null {
  const segs = pathname.split('/').filter(Boolean)
  const start = segs[0] === 'en' || segs[0] === 'ar' ? 1 : 0
  const cc = segs[start]
  if (!cc || !isPathCountry(cc)) return null
  const next = segs[start + 1]
  const city = next && isCountryCity(cc, next) ? next : undefined
  const intentRaw = city ? segs[start + 2] : undefined
  const intent = intentRaw ? canonicalIntent(intentRaw) ?? undefined : undefined
  return { country: cc, city, intent }
}
