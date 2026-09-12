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
export type MarketCurrency =
  | 'GEL' | 'USD' | 'EUR' | 'AED' | 'GBP' | 'CAD' | 'TRY' | 'CHF'
  | 'JPY' | 'CNY' | 'AUD' | 'BRL' | 'MXN' | 'SGD' | 'HKD' | 'KRW'
  | 'INR' | 'THB' | 'IDR' | 'PHP' | 'VND' | 'MYR' | 'SAR' | 'NGN'
  | 'EGP' | 'ZAR' | 'KES' | 'MAD' | 'PLN' | 'CZK' | 'HUF' | 'RON'
  | 'BGN' | 'RSD' | 'HRK' | 'SEK' | 'NOK' | 'DKK' | 'ISK' | 'MTL'
  | 'LUF' | 'NZD' | 'COP' | 'CLP' | 'ARS' | 'PEN' | 'PKR' | 'BDT'
  | 'LKR' | 'NPR' | 'KHR' | 'MMK' | 'LAK' | 'UZS' | 'KZT' | 'AMD'
  | 'AZN' | 'UAH' | 'EEK' | 'LTL' | 'LVL' | 'SKK' | 'SIT'

export const COM_ORIGIN = 'https://sivrce.com'
export const GE_ORIGIN = 'https://sivrce.ge'

/** Live ISO-3166 path prefixes on sivrce.com. */
export const COUNTRY_IDS = [
  'de', 'ae', 'fr', 'es', 'it', 'gb', 'us', 'ca', 'tr', 'gr', 'cy', 'nl', 'pt', 'ch',
  'jp', 'cn', 'au', 'br', 'mx', 'sg', 'hk', 'kr', 'in', 'th', 'id', 'ph', 'vn', 'my',
  'sa', 'ng', 'eg', 'za', 'ke', 'ma', 'pl', 'cz', 'hu', 'ro', 'bg', 'rs', 'hr', 'se',
  'no', 'dk', 'fi', 'at', 'be', 'ie', 'nz', 'co', 'cl', 'ar', 'pe', 'ec', 'pk', 'bd',
  'lk', 'np', 'kh', 'mm', 'la', 'uz', 'kz', 'am', 'az', 'ua', 'ee', 'lt', 'lv', 'is',
  'mt', 'lu', 'sk', 'si',
] as const

export const COUNTRY_PREFIX_RE = new RegExp(`^/(${COUNTRY_IDS.join('|')})(?=/|$)`)

/** Human aliases → canonical ISO path. */
export const COUNTRY_ALIAS = { uae: 'ae', uk: 'gb' } as const
export type CountryAlias = keyof typeof COUNTRY_ALIAS

/** Company pages that stay on sivrce.com (not Georgia catalog). `search` = the
 * worldwide /search; `listing` = listing detail — inventory is worldwide, so
 * world listings serve (and canonicalize) on sivrce.com/en. */
export const COM_PAGE_SEGS = [
  'about',
  'advertise',
  'blog',
  'careers',
  'contact',
  'countries',
  'faq',
  'listing',
  'privacy',
  'search',
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
  countryCode: 'GE' | 'DE' | 'AE' | 'FR' | 'ES' | 'IT' | 'GB' | 'US' | 'CA' | 'TR' | 'GR' | 'CY' | 'NL' | 'PT' | 'CH'
    | 'JP' | 'CN' | 'AU' | 'BR' | 'MX' | 'SG' | 'HK' | 'KR' | 'IN' | 'TH' | 'ID' | 'PH' | 'VN' | 'MY'
    | 'SA' | 'NG' | 'EG' | 'ZA' | 'KE' | 'MA' | 'PL' | 'CZ' | 'HU' | 'RO' | 'BG' | 'RS' | 'HR' | 'SE'
    | 'NO' | 'DK' | 'FI' | 'AT' | 'BE' | 'IE' | 'NZ' | 'CO' | 'CL' | 'AR' | 'PE' | 'EC' | 'PK' | 'BD'
    | 'LK' | 'NP' | 'KH' | 'MM' | 'LA' | 'UZ' | 'KZ' | 'AM' | 'AZ' | 'UA' | 'EE' | 'LT' | 'LV' | 'IS'
    | 'MT' | 'LU' | 'SK' | 'SI' | null
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
    'wuppertal',
    'bielefeld',
    'bonn',
    'muenster',
    'mannheim',
    'karlsruhe',
    'augsburg',
    'wiesbaden',
    'moenchengladbach',
    'gelsenkirchen',
    'aachen',
    'braunschweig',
    'chemnitz',
    'kiel',
    'halle',
    'magdeburg',
    'freiburg',
    'krefeld',
    'mainz',
    'luebeck',
    'erfurt',
    'oberhausen',
    'rostock',
    'kassel',
    'potsdam',
    'saarbruecken',
    'hamm',
    'ludwigshafen',
    'oldenburg',
    'osnabrueck',
    'leverkusen',
    'heidelberg',
    'darmstadt',
    'solingen',
    'herne',
    'regensburg',
    'neuss',
    'ingolstadt',
    'wuerzburg',
    'wolfsburg',
    'ulm',
    'paderborn',
    'pforzheim',
    'offenbach',
    'bottrop',
    'fuerth',
    'recklinghausen',
    'bremerhaven',
    'reutlingen',
    'remscheid',
    'koblenz',
    'bergisch-gladbach',
    'erlangen',
    'trier',
    'salzgitter',
    'jena',
    'cottbus',
    'hildesheim',
    'moers',
    'siegen',
    'gera',
    'kaiserslautern',
    'goettingen',
    'hagen',
    'heilbronn',
    'muelheim',
  ], ['berlin']),
  ae: pathMarket('ae', 'AE', 'AED', 'en-AE', 'dubai', ['dubai', 'abu-dhabi', 'sharjah', 'ras-al-khaimah'], ['dubai']),
  fr: pathMarket('fr', 'FR', 'EUR', 'en-FR', 'paris', [
    'paris',
    'lyon',
    'marseille',
    'bordeaux',
    'nice',
    'toulouse',
  ], ['paris']),
  es: pathMarket('es', 'ES', 'EUR', 'en-ES', 'madrid', [
    'madrid',
    'barcelona',
    'valencia',
    'malaga',
    'seville',
    'alicante',
  ], ['madrid']),
  it: pathMarket('it', 'IT', 'EUR', 'en-IT', 'rome', [
    'rome',
    'milan',
    'florence',
    'turin',
    'naples',
    'bologna',
  ], ['rome']),
  gb: pathMarket('gb', 'GB', 'GBP', 'en-GB', 'london', [
    'london',
    'manchester',
    'birmingham',
    'edinburgh',
    'glasgow',
    'leeds',
  ], ['london']),
  us: pathMarket('us', 'US', 'USD', 'en-US', 'new-york', [
    'new-york',
    'miami',
    'los-angeles',
    'chicago',
    'austin',
    'seattle',
  ], ['new-york']),
  ca: pathMarket('ca', 'CA', 'CAD', 'en-CA', 'toronto', [
    'toronto',
    'vancouver',
    'montreal',
    'calgary',
    'ottawa',
    'edmonton',
  ], ['toronto']),
  tr: pathMarket('tr', 'TR', 'TRY', 'en-TR', 'istanbul', [
    'istanbul',
    'antalya',
    'ankara',
    'izmir',
    'bodrum',
    'bursa',
  ], ['istanbul']),
  gr: pathMarket('gr', 'GR', 'EUR', 'en-GR', 'athens', ['athens', 'thessaloniki'], ['athens']),
  cy: pathMarket('cy', 'CY', 'EUR', 'en-CY', 'nicosia', ['nicosia', 'limassol'], ['nicosia']),
  nl: pathMarket('nl', 'NL', 'EUR', 'en-NL', 'amsterdam', ['amsterdam', 'rotterdam'], ['amsterdam']),
  pt: pathMarket('pt', 'PT', 'EUR', 'en-PT', 'lisbon', ['lisbon', 'porto'], ['lisbon']),
  ch: pathMarket('ch', 'CH', 'CHF', 'en-CH', 'zurich', ['zurich', 'geneva'], ['zurich']),
  // Asia — East
  jp: pathMarket('jp', 'JP', 'JPY', 'ja-JP', 'tokyo', ['tokyo', 'osaka', 'yokohama', 'nagoya', 'fukuoka', 'kyoto']),
  cn: pathMarket('cn', 'CN', 'CNY', 'zh-CN', 'shanghai', ['shanghai', 'beijing', 'guangzhou', 'shenzhen', 'chengdu', 'hangzhou']),
  kr: pathMarket('kr', 'KR', 'KRW', 'ko-KR', 'seoul', ['seoul', 'busan', 'incheon', 'daegu', 'daejeon']),
  hk: pathMarket('hk', 'HK', 'HKD', 'en-HK', 'hong-kong', ['hong-kong']),
  // Asia — Southeast
  sg: pathMarket('sg', 'SG', 'SGD', 'en-SG', 'singapore', ['singapore']),
  th: pathMarket('th', 'TH', 'THB', 'th-TH', 'bangkok', ['bangkok', 'chiang-mai', 'phuket', 'pattaya']),
  id: pathMarket('id', 'ID', 'IDR', 'id-ID', 'jakarta', ['jakarta', 'surabaya', 'bandung', 'medan', 'bali']),
  ph: pathMarket('ph', 'PH', 'PHP', 'en-PH', 'manila', ['manila', 'cebu', 'davao', 'quezon-city']),
  vn: pathMarket('vn', 'VN', 'VND', 'vi-VN', 'ho-chi-minh-city', ['ho-chi-minh-city', 'hanoi', 'da-nang', 'nha-trang']),
  my: pathMarket('my', 'MY', 'MYR', 'ms-MY', 'kuala-lumpur', ['kuala-lumpur', 'george-town', 'johor-bahru', 'kota-kinabalu']),
  mm: pathMarket('mm', 'MM', 'MMK', 'my-MM', 'yangon', ['yangon', 'mandalay', 'naypyidaw']),
  la: pathMarket('la', 'LA', 'LAK', 'lo-LA', 'vientiane', ['vientiane', 'luang-prabang']),
  kh: pathMarket('kh', 'KH', 'KHR', 'km-KH', 'phnom-penh', ['phnom-penh', 'siem-reap']),
  // Asia — South
  in: pathMarket('in', 'IN', 'INR', 'en-IN', 'mumbai', ['mumbai', 'delhi', 'bangalore', 'chennai', 'kolkata', 'hyderabad']),
  pk: pathMarket('pk', 'PK', 'PKR', 'en-PK', 'karachi', ['karachi', 'lahore', 'islamabad', 'rawalpindi']),
  bd: pathMarket('bd', 'BD', 'BDT', 'en-BD', 'dhaka', ['dhaka', 'chittagong', 'sylhet']),
  lk: pathMarket('lk', 'LK', 'LKR', 'si-LK', 'colombo', ['colombo', 'kandy', 'galle']),
  np: pathMarket('np', 'NP', 'NPR', 'ne-NP', 'kathmandu', ['kathmandu', 'pokhara', 'lalitpur']),
  // Asia — Central
  uz: pathMarket('uz', 'UZ', 'UZS', 'uz-UZ', 'tashkent', ['tashkent', 'samarkand', 'bukhara']),
  kz: pathMarket('kz', 'KZ', 'KZT', 'kk-KZ', 'almaty', ['almaty', 'astana', 'shymkent']),
  am: pathMarket('am', 'AM', 'AMD', 'hy-AM', 'yerevan', ['yerevan', 'gyumri']),
  az: pathMarket('az', 'AZ', 'AZN', 'az-AZ', 'baku', ['baku', 'ganja', 'sumqayit']),
  // Asia — Middle East
  sa: pathMarket('sa', 'SA', 'SAR', 'ar-SA', 'riyadh', ['riyadh', 'jeddah', 'dammam']),
  // Oceania
  au: pathMarket('au', 'AU', 'AUD', 'en-AU', 'sydney', ['sydney', 'melbourne', 'brisbane', 'perth', 'adelaide']),
  nz: pathMarket('nz', 'NZ', 'NZD', 'en-NZ', 'auckland', ['auckland', 'wellington', 'christchurch']),
  // Americas — South
  br: pathMarket('br', 'BR', 'BRL', 'pt-BR', 'sao-paulo', ['sao-paulo', 'rio-de-janeiro', 'brasilia', 'curitiba', 'belo-horizonte']),
  mx: pathMarket('mx', 'MX', 'MXN', 'es-MX', 'mexico-city', ['mexico-city', 'guadalajara', 'monterrey', 'cancun', 'playa-del-carmen']),
  co: pathMarket('co', 'CO', 'COP', 'es-CO', 'bogota', ['bogota', 'medellin', 'cali', 'cartagena', 'barranquilla']),
  cl: pathMarket('cl', 'CL', 'CLP', 'es-CL', 'santiago', ['santiago', 'valparaiso', 'vina-del-mar', 'concepcion']),
  ar: pathMarket('ar', 'AR', 'ARS', 'es-AR', 'buenos-aires', ['buenos-aires', 'cordoba', 'rosario', 'mendoza']),
  pe: pathMarket('pe', 'PE', 'PEN', 'es-PE', 'lima', ['lima', 'arequipa', 'cusco', 'trujillo']),
  ec: pathMarket('ec', 'EC', 'USD', 'es-EC', 'quito', ['quito', 'guayaquil', 'cuenca']),
  // Africa
  ng: pathMarket('ng', 'NG', 'NGN', 'en-NG', 'lagos', ['lagos', 'abuja', 'kano', 'port-harcourt']),
  eg: pathMarket('eg', 'EG', 'EGP', 'ar-EG', 'cairo', ['cairo', 'alexandria', 'giza', 'sharm-el-sheikh']),
  za: pathMarket('za', 'ZA', 'ZAR', 'en-ZA', 'johannesburg', ['johannesburg', 'cape-town', 'durban', 'pretoria']),
  ke: pathMarket('ke', 'KE', 'KES', 'en-KE', 'nairobi', ['nairobi', 'mombasa', 'kisumu']),
  ma: pathMarket('ma', 'MA', 'MAD', 'ar-MA', 'casablanca', ['casablanca', 'marrakech', 'rabat', 'tangier']),
  // Europe — Central & Eastern
  pl: pathMarket('pl', 'PL', 'PLN', 'pl-PL', 'warsaw', ['warsaw', 'krakow', 'wroclaw', 'poznan', 'gdansk']),
  cz: pathMarket('cz', 'CZ', 'CZK', 'cs-CZ', 'prague', ['prague', 'brno', 'ostrava', 'plzen']),
  hu: pathMarket('hu', 'HU', 'HUF', 'hu-HU', 'budapest', ['budapest', 'debrecen', 'szeged', 'pecs']),
  ro: pathMarket('ro', 'RO', 'RON', 'ro-RO', 'bucharest', ['bucharest', 'cluj-napoca', 'timisoara', 'iasi', 'brasov']),
  bg: pathMarket('bg', 'BG', 'BGN', 'bg-BG', 'sofia', ['sofia', 'plovdiv', 'varna', 'burgas']),
  rs: pathMarket('rs', 'RS', 'RSD', 'sr-RS', 'belgrade', ['belgrade', 'novi-sad', 'nis']),
  hr: pathMarket('hr', 'HR', 'EUR', 'hr-HR', 'zagreb', ['zagreb', 'split', 'rijeka', 'zadar']),
  ua: pathMarket('ua', 'UA', 'UAH', 'uk-UA', 'kyiv', ['kyiv', 'kharkiv', 'odesa', 'lviv', 'dnipro']),
  // Europe — Nordic
  se: pathMarket('se', 'SE', 'SEK', 'sv-SE', 'stockholm', ['stockholm', 'goteborg', 'malmo']),
  no: pathMarket('no', 'NO', 'NOK', 'nb-NO', 'oslo', ['oslo', 'bergen', 'trondheim', 'stavanger']),
  dk: pathMarket('dk', 'DK', 'DKK', 'da-DK', 'copenhagen', ['copenhagen', 'aarhus', 'odense']),
  fi: pathMarket('fi', 'FI', 'EUR', 'fi-FI', 'helsinki', ['helsinki', 'espoo', 'tampere', 'vantaa']),
  is: pathMarket('is', 'IS', 'ISK', 'is-IS', 'reykjavik', ['reykjavik']),
  // Europe — Western
  at: pathMarket('at', 'AT', 'EUR', 'de-AT', 'vienna', ['vienna', 'graz', 'salzburg', 'innsbruck']),
  be: pathMarket('be', 'BE', 'EUR', 'nl-BE', 'brussels', ['brussels', 'antwerp', 'ghent', 'bruges']),
  ie: pathMarket('ie', 'IE', 'EUR', 'en-IE', 'dublin', ['dublin', 'cork', 'galway', 'limerick']),
  lu: pathMarket('lu', 'LU', 'EUR', 'lb-LU', 'luxembourg', ['luxembourg']),
  // Europe — Baltics & Malta
  ee: pathMarket('ee', 'EE', 'EUR', 'et-EE', 'tallinn', ['tallinn', 'tartu']),
  lt: pathMarket('lt', 'LT', 'EUR', 'lt-LT', 'vilnius', ['vilnius', 'kaunas']),
  lv: pathMarket('lv', 'LV', 'EUR', 'lv-LV', 'riga', ['riga', 'daugavpils']),
  mt: pathMarket('mt', 'MT', 'EUR', 'mt-MT', 'valletta', ['valletta', 'sliema', 'st-julians']),
  // Europe — Other
  sk: pathMarket('sk', 'SK', 'EUR', 'sk-SK', 'bratislava', ['bratislava', 'kosice']),
  si: pathMarket('si', 'SI', 'EUR', 'sl-SI', 'ljubljana', ['ljubljana', 'maribor']),
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

/** Canonical web origin for a listing — GE listings on sivrce.ge, world listings on sivrce.com. */
export function listingOrigin(country?: string): string {
  return country && country !== 'GE' ? COM_ORIGIN : GE_ORIGIN
}

/** Public listing path on its canonical origin — world listings publish under /en. */
export function listingCanonicalPath(path: string, country?: string): string {
  return country && country !== 'GE' ? `/en${path}` : path
}

/** Every scorable listing-market ISO (GE + all path markets). Search accepts these. */
export const MARKET_COUNTRY_ISOS: ReadonlySet<string> = new Set(
  Object.values(MARKETS)
    .map((m) => m.countryCode)
    .filter((c): c is NonNullable<typeof c> => c != null),
)

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
