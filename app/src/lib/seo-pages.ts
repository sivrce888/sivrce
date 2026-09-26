/**
 * SIVRCE — Programmatic SEO pages engine
 * Single source of truth for deal × type × city × district landing pages.
 * Routes are parsed by src/app/[...seo]/page.tsx; only combos with ≥1 real
 * listing are generated (thin/empty pages hurt rankings).
 */

import { filterListings, formatUSD, type DealType, type Listing, type PropType } from '@/data/listings'
import { hubProseOf } from '@/lib/seo-hub-prose'

export { hubProseOf } from '@/lib/seo-hub-prose'
export type { HubProse, HubSection } from '@/lib/seo-hub-prose'

/* ————— Registries ————— */

/** Locales with real server-rendered landing pages. */
export type SeoLoc = 'ka' | 'en' | 'ru' | 'de' | 'tr' | 'ar' | 'uk' | 'he' | 'hy' | 'az'
export const SEO_LOCS: SeoLoc[] = ['ka', 'en', 'ru', 'de', 'tr', 'ar', 'uk', 'he', 'hy', 'az']
/** URL prefix per locale (ka is canonical, unprefixed). */
export const locPrefix = (loc: SeoLoc) => (loc === 'ka' ? '' : `/${loc}`)

export function seoLocOf(lang: string): SeoLoc {
  return (SEO_LOCS as readonly string[]).includes(lang) ? (lang as SeoLoc) : 'en'
}

// Geo registry lives in the client-safe leaf module (client components import it
// without pulling this file's data/listings graph).
export {
  CITIES,
  DISTRICTS,
  type GeoLoc,
  type District,
  cityMarket,
  DEALS,
  TYPES,
  DEAL_ALIASES,
  TYPE_ALIASES,
  DEAL_TO_KA,
  TYPE_TO_KA,
  toOrganicKaUrl,
} from './directory-seo-lite'
import {
  CITIES,
  DISTRICTS,
  type GeoLoc,
  type District,
  cityMarket,
  DEALS,
  TYPES,
  DEAL_ALIASES,
  TYPE_ALIASES,
  DEAL_TO_KA,
  TYPE_TO_KA,
  toOrganicKaUrl,
} from './directory-seo-lite'

/** Room-page slug pattern: /sale/apartments-2 — the "2-ოთახიანი ბინა" query family. 4 = 4+. */
export const ROOM_SLUG = /^apartments-([1-4])$/

/** Room chip label per locale: 1-ოთახიანი / 1-room / 1-комн. … 4+ (myhome convention). */
export function roomLabel(n: number, loc: SeoLoc = 'ka'): string {
  if (loc === 'de') return n === 4 ? '4+ Zimmer' : `${n}-Zimmer`
  if (loc === 'en') return n === 4 ? '4+ rooms' : `${n}-room`
  if (loc === 'ru') return n === 4 ? '4+ комн.' : `${n}-комн.`
  return n === 4 ? '4+ ოთახიანი' : `${n}-ოთახიანი`
}

/* ————— O(1) Token Lookup Maps for Instant Fast Parsing ————— */

const CITY_TOKEN_MAP = new Map<string, GeoLoc>()
for (const c of CITIES) {
  CITY_TOKEN_MAP.set(c.slug.toLowerCase(), c)
  CITY_TOKEN_MAP.set(c.ka.toLowerCase(), c)
  CITY_TOKEN_MAP.set(c.loc.toLowerCase(), c)
  CITY_TOKEN_MAP.set(c.en.toLowerCase(), c)
  CITY_TOKEN_MAP.set(c.ru.toLowerCase(), c)
  if (c.slug === 'tbilisi') {
    CITY_TOKEN_MAP.set('თბილისში', c)
    CITY_TOKEN_MAP.set('tbilisshi', c)
    CITY_TOKEN_MAP.set('tbilisi', c)
  }
  if (c.slug === 'batumi') {
    CITY_TOKEN_MAP.set('ბათუმში', c)
    CITY_TOKEN_MAP.set('batumshi', c)
    CITY_TOKEN_MAP.set('batumi', c)
  }
  if (c.slug === 'kutaisi') {
    CITY_TOKEN_MAP.set('ქუთაისში', c)
    CITY_TOKEN_MAP.set('kutaisshi', c)
    CITY_TOKEN_MAP.set('kutaisi', c)
  }
}

const DISTRICT_TOKEN_MAP = new Map<string, District>()
for (const d of DISTRICTS) {
  const k = (s: string) => `${d.citySlug}:${s.toLowerCase()}`
  DISTRICT_TOKEN_MAP.set(k(d.slug), d)
  DISTRICT_TOKEN_MAP.set(k(d.ka), d)
  DISTRICT_TOKEN_MAP.set(k(d.loc), d)
  DISTRICT_TOKEN_MAP.set(k(d.en), d)
  DISTRICT_TOKEN_MAP.set(k(d.ru), d)
}

function resolveCityToken(token?: string): GeoLoc | undefined {
  if (!token) return undefined
  return CITY_TOKEN_MAP.get(token.toLowerCase().trim())
}

function resolveDistrictToken(token: string | undefined, citySlug: string): District | undefined {
  if (!token) return undefined
  return DISTRICT_TOKEN_MAP.get(`${citySlug}:${token.toLowerCase().trim()}`)
}

const ROOM_SLUG_RE = /^(?:apartments-([1-4])|([1-4])-otakhiani-binebi|([1-4])-otaxiani-binebi|([1-4])-ოთახიანი-ბინები|([1-4])-ოთახიანი)$/i

function parseRoomToken(token: string): { rooms: number; typeSlug: string } | null {
  const m = token.match(ROOM_SLUG_RE)
  if (!m) return null
  const num = Number(m[1] || m[2] || m[3] || m[4] || m[5])
  return { rooms: num, typeSlug: 'apartments' }
}

function parseCompoundToken(token: string): { typeSlug: string; rooms?: number; city: GeoLoc } | null {
  if (!token.includes('-')) return null
  const lastDash = token.lastIndexOf('-')
  const typePart = token.slice(0, lastDash)
  const cityPart = token.slice(lastDash + 1)
  const city = resolveCityToken(cityPart)
  if (!city) return null

  const room = parseRoomToken(typePart)
  if (room) {
    return { typeSlug: room.typeSlug, rooms: room.rooms, city }
  }
  const type = TYPE_ALIASES[typePart]
  if (type) {
    return { typeSlug: type, city }
  }
  return null
}

function derivePaths(d: {
  kind: SeoKind
  dealSlug?: string
  typeSlug?: string
  rooms?: number
  city?: GeoLoc
  district?: District
}): { kaPath: string; asciiPath: string; compoundPath?: string } {
  const dealKa = d.dealSlug ? (DEAL_TO_KA[d.dealSlug] || d.dealSlug) : ''
  const typeKa = d.rooms ? `${d.rooms}-ოთახიანი-ბინები` : d.typeSlug ? (TYPE_TO_KA[d.typeSlug] || d.typeSlug) : ''
  const typeAscii = d.rooms ? `apartments-${d.rooms}` : (d.typeSlug || '')

  switch (d.kind) {
    case 'city':
      return {
        kaPath: `/${d.city!.ka}`,
        asciiPath: `/${d.city!.slug}`,
      }
    case 'city-district':
      return {
        kaPath: `/${d.city!.ka}/${d.district!.ka}`,
        asciiPath: `/${d.city!.slug}/${d.district!.slug}`,
      }
    case 'deal':
      return {
        kaPath: `/${dealKa}`,
        asciiPath: `/${d.dealSlug}`,
      }
    case 'deal-type':
      if (d.dealSlug === 'lease') {
        return {
          kaPath: `/${dealKa}`,
          asciiPath: `/${d.dealSlug}`,
        }
      }
      return {
        kaPath: `/${dealKa}/${typeKa}`,
        asciiPath: `/${d.dealSlug}/${typeAscii}`,
      }
    case 'deal-city':
      return {
        kaPath: `/${dealKa}/${d.city!.ka}`,
        asciiPath: `/${d.dealSlug}/${d.city!.slug}`,
      }
    case 'deal-type-city': {
      if (d.dealSlug === 'lease') {
        return {
          kaPath: `/${dealKa}/${d.city!.ka}`,
          asciiPath: `/${d.dealSlug}/${d.city!.slug}`,
        }
      }
      const typeCompound = d.rooms ? `${d.rooms}-ოთახიანი-ბინები` : (d.typeSlug === 'apartments' ? 'ბინები' : typeKa)
      return {
        kaPath: `/${dealKa}/${typeKa}/${d.city!.ka}`,
        asciiPath: `/${d.dealSlug}/${typeAscii}/${d.city!.slug}`,
        compoundPath: `/${dealKa}/${typeCompound}-${d.city!.loc}`,
      }
    }
    case 'deal-type-city-district':
      if (d.dealSlug === 'lease') {
        return {
          kaPath: `/${dealKa}/${d.city!.ka}/${d.district!.ka}`,
          asciiPath: `/${d.dealSlug}/${d.city!.slug}/${d.district!.slug}`,
        }
      }
      return {
        kaPath: `/${dealKa}/${typeKa}/${d.city!.ka}/${d.district!.ka}`,
        asciiPath: `/${d.dealSlug}/${typeAscii}/${d.city!.slug}/${d.district!.slug}`,
      }
    default:
      return {
        kaPath: `/${d.dealSlug || d.city?.ka || ''}`,
        asciiPath: `/${d.dealSlug || d.city?.slug || ''}`,
      }
  }
}

/* ————— Listing → programmatic hub ————— */

const DEAL_TO_SLUG: Record<DealType, string> = { sale: 'sale', rent: 'rent', daily: 'daily', pledge: 'pledge' }
const TYPE_TO_SLUG: Record<PropType, string> = {
  apartment: 'apartments',
  house: 'houses',
  villa: 'houses',
  commercial: 'commercial',
  land: 'land',
  hotel: 'commercial',
}

export function listingHubPath(
  l: {
    dealType: DealType
    propType: PropType
    city: string
    district: string
  },
  loc: SeoLoc = 'en',
): string | null {
  const dealSlug = l.dealType === 'rent' && l.propType === 'land' ? 'lease' : DEAL_TO_SLUG[l.dealType]
  const typeSlug = dealSlug === 'lease' ? undefined : TYPE_TO_SLUG[l.propType]
  const city = CITIES.find((c) => c.ka === l.city)
  const distSlug = city
    ? DISTRICTS.find((d) => d.citySlug === city.slug && d.ka === l.district)?.slug
    : undefined
  const attempts: string[][] = dealSlug === 'lease'
    ? city
      ? [[dealSlug, city.slug, distSlug].filter(Boolean) as string[], [dealSlug, city.slug], [dealSlug]]
      : [[dealSlug]]
    : city
      ? [
          [dealSlug, typeSlug!, city.slug, distSlug].filter(Boolean) as string[],
          [dealSlug, typeSlug!, city.slug],
          [dealSlug, typeSlug!],
          [dealSlug],
        ]
      : [[dealSlug, typeSlug!], [dealSlug]]
  for (const slug of attempts) {
    const def = parseSeoSlug(slug)
    if (def) return loc === 'ka' ? def.kaPath : def.asciiPath
  }
  return null
}

export function listingHubAnchor(l: {
  dealType: DealType
  propType: PropType
  city: string
  district: string
}, loc: SeoLoc = 'ka'): string | null {
  const path = listingHubPath(l, 'ka')
  if (!path) return null
  const def = parseSeoSlug(path.slice(1).split('/'))
  return def ? h1Of(def, loc) : null
}

/* ————— Page model ————— */

export type SeoKind =
  | 'deal'
  | 'deal-type'
  | 'deal-city'
  | 'deal-type-city'
  | 'deal-type-city-district'
  | 'city'
  | 'city-district'
  | 'city-info'

export interface SeoPageDef {
  kind: SeoKind
  path: string
  kaPath: string
  asciiPath: string
  compoundPath?: string
  dealSlug?: string
  typeSlug?: string
  /** Apartment room filter: 1-3 exact, 4 = 4+ ("2-ოთახიანი ბინები" pages) */
  rooms?: number
  city?: GeoLoc
  district?: District
  listings: Listing[]
}

function listingsFor(d: {
  dealSlug?: string
  typeSlug?: string
  rooms?: number
  city?: GeoLoc
  district?: District
  country?: string
}): Listing[] {
  const lease = d.dealSlug === 'lease'
  const out = filterListings({
    deal: d.dealSlug ? DEALS[d.dealSlug]?.deal : undefined,
    type: lease ? 'land' : d.typeSlug ? TYPES[d.typeSlug]?.type : undefined,
    city: d.city?.ka ?? d.city?.en,
    district: d.district?.ka ?? d.district?.en,
    country: d.country,
  })
  if (!d.rooms) return out
  return out.filter((l) => (d.rooms === 4 ? l.rooms >= 4 : l.rooms === d.rooms))
}

/** Parse a [...seo] slug into an organic or standard page definition. null → 404. */
export function parseSeoSlug(slug: string[], countryIso = 'GE'): SeoPageDef | null {
  if (slug.length < 1 || slug.length > 4) return null

  const decoded = slug.map((s) => {
    try {
      return decodeURIComponent(s)
    } catch {
      return s
    }
  })

  const isOrganicRequested = decoded.some((s) => /[\u10A0-\u10FF]/.test(s) || s.includes('-თბილის') || s.includes('-ბათუმ'))

  // 1. Single-segment compound check: e.g. "იყიდება-ბინები-თბილისში"
  if (decoded.length === 1 && decoded[0].includes('-')) {
    const single = decoded[0]
    for (const [dealKey, dealVal] of Object.entries(DEAL_ALIASES)) {
      if (single.startsWith(`${dealKey}-`)) {
        const rest = single.slice(dealKey.length + 1)
        const compound = parseCompoundToken(rest)
        if (compound) {
          const listings = listingsFor({
            dealSlug: dealVal,
            typeSlug: compound.typeSlug,
            rooms: compound.rooms,
            city: compound.city,
            country: countryIso,
          })
          if (!listings.length) return null
          const kind = 'deal-type-city'
          const paths = derivePaths({ kind, dealSlug: dealVal, typeSlug: compound.typeSlug, rooms: compound.rooms, city: compound.city })
          return {
            kind,
            path: isOrganicRequested ? paths.kaPath : paths.asciiPath,
            ...paths,
            dealSlug: dealVal,
            typeSlug: compound.typeSlug,
            rooms: compound.rooms,
            city: compound.city,
            listings,
          }
        }
      }
    }
  }

  // 2. City hubs: /tbilisi, /თბილისი, /tbilisi/vake, /თბილისი/ვაკე
  const cityA = resolveCityToken(decoded[0])
  if (cityA) {
    if (decoded.length === 1) {
      const listings = listingsFor({ city: cityA, country: countryIso })
      const paths = derivePaths({ kind: 'city', city: cityA })
      return listings.length
        ? { kind: 'city', path: isOrganicRequested ? paths.kaPath : paths.asciiPath, ...paths, city: cityA, listings }
        : cityInfoOf(cityA)
    }
    const dist = resolveDistrictToken(decoded[1], cityA.slug)
    if (!dist || dist.citySlug !== cityA.slug || decoded[2] || decoded[3]) return null
    const listings = listingsFor({ city: cityA, district: dist, country: countryIso })
    const paths = derivePaths({ kind: 'city-district', city: cityA, district: dist })
    return listings.length
      ? { kind: 'city-district', path: isOrganicRequested ? paths.kaPath : paths.asciiPath, ...paths, city: cityA, district: dist, listings }
      : null
  }

  // 3. Deal hubs: /sale, /იყიდება, etc.
  const dealSlug = DEAL_ALIASES[decoded[0]]
  if (!dealSlug) return null

  // /lease special case
  if (dealSlug === 'lease') {
    const typeSlug = 'land'
    const leaseBase = { dealSlug: 'lease' as const, typeSlug, country: countryIso }
    if (decoded.length === 1) {
      const listings = listingsFor(leaseBase)
      const paths = derivePaths({ kind: 'deal-type', ...leaseBase })
      return listings.length
        ? { kind: 'deal-type', path: isOrganicRequested ? paths.kaPath : paths.asciiPath, ...paths, ...leaseBase, listings }
        : null
    }
    const cityB = resolveCityToken(decoded[1])
    if (!cityB || decoded[3]) return null
    if (!decoded[2]) {
      const listings = listingsFor({ ...leaseBase, city: cityB, country: countryIso })
      const paths = derivePaths({ kind: 'deal-type-city', ...leaseBase, city: cityB })
      return listings.length
        ? { kind: 'deal-type-city', path: isOrganicRequested ? paths.kaPath : paths.asciiPath, ...paths, ...leaseBase, city: cityB, listings }
        : null
    }
    const dist = resolveDistrictToken(decoded[2], cityB.slug)
    if (!dist || dist.citySlug !== cityB.slug) return null
    const listings = listingsFor({ ...leaseBase, city: cityB, district: dist, country: countryIso })
    const paths = derivePaths({ kind: 'deal-type-city-district', ...leaseBase, city: cityB, district: dist })
    return listings.length
      ? { kind: 'deal-type-city-district', path: isOrganicRequested ? paths.kaPath : paths.asciiPath, ...paths, ...leaseBase, city: cityB, district: dist, listings }
      : null
  }

  const base = { dealSlug, country: countryIso }

  if (decoded.length === 1) {
    const listings = listingsFor(base)
    const paths = derivePaths({ kind: 'deal', ...base })
    return listings.length
      ? { kind: 'deal', path: isOrganicRequested ? paths.kaPath : paths.asciiPath, ...paths, ...base, listings }
      : null
  }

  // Deal + compound: ["იყიდება", "ბინები-თბილისში"] or ["იყიდება", "ბინები-თბილისში", "ვაკე"]
  const compound = parseCompoundToken(decoded[1])
  if (compound) {
    if (decoded.length === 2) {
      const listings = listingsFor({ ...base, typeSlug: compound.typeSlug, rooms: compound.rooms, city: compound.city })
      const paths = derivePaths({ kind: 'deal-type-city', ...base, typeSlug: compound.typeSlug, rooms: compound.rooms, city: compound.city })
      return listings.length
        ? { kind: 'deal-type-city', path: isOrganicRequested ? paths.kaPath : paths.asciiPath, ...paths, ...base, typeSlug: compound.typeSlug, rooms: compound.rooms, city: compound.city, listings }
        : null
    }
    if (decoded.length === 3) {
      const dist = resolveDistrictToken(decoded[2], compound.city.slug)
      if (!dist) return null
      const listings = listingsFor({ ...base, typeSlug: compound.typeSlug, rooms: compound.rooms, city: compound.city, district: dist })
      const paths = derivePaths({ kind: 'deal-type-city-district', ...base, typeSlug: compound.typeSlug, rooms: compound.rooms, city: compound.city, district: dist })
      return listings.length
        ? { kind: 'deal-type-city-district', path: isOrganicRequested ? paths.kaPath : paths.asciiPath, ...paths, ...base, typeSlug: compound.typeSlug, rooms: compound.rooms, city: compound.city, district: dist, listings }
        : null
    }
    return null
  }

  // Deal + City: ["sale", "tbilisi"] or ["იყიდება", "თბილისი"]
  const cityB = resolveCityToken(decoded[1])
  const roomB = parseRoomToken(decoded[1])
  const typeB = roomB ? roomB.typeSlug : TYPE_ALIASES[decoded[1]]

  if (cityB && !typeB && !roomB) {
    if (decoded[2]) return null // /sale/tbilisi/x is not a route (districts need a type)
    const listings = listingsFor({ ...base, city: cityB, country: countryIso })
    const paths = derivePaths({ kind: 'deal-city', ...base, city: cityB })
    return listings.length
      ? { kind: 'deal-city', path: isOrganicRequested ? paths.kaPath : paths.asciiPath, ...paths, ...base, city: cityB, listings }
      : null
  }

  if (!typeB && !roomB) return null
  const rooms = roomB?.rooms

  if (!decoded[2]) {
    const listings = listingsFor({ ...base, typeSlug: typeB, rooms })
    const paths = derivePaths({ kind: 'deal-type', ...base, typeSlug: typeB, rooms })
    return listings.length
      ? { kind: 'deal-type', path: isOrganicRequested ? paths.kaPath : paths.asciiPath, ...paths, ...base, typeSlug: typeB, rooms, listings }
      : null
  }

  const cityC = resolveCityToken(decoded[2])
  if (!cityC) return null
  if (!decoded[3]) {
    const listings = listingsFor({ ...base, typeSlug: typeB, rooms, city: cityC })
    const paths = derivePaths({ kind: 'deal-type-city', ...base, typeSlug: typeB, rooms, city: cityC })
    return listings.length
      ? { kind: 'deal-type-city', path: isOrganicRequested ? paths.kaPath : paths.asciiPath, ...paths, ...base, typeSlug: typeB, rooms, city: cityC, listings }
      : null
  }

  const distD = resolveDistrictToken(decoded[3], cityC.slug)
  if (!distD || distD.citySlug !== cityC.slug) return null
  const listings = listingsFor({ ...base, typeSlug: typeB, rooms, city: cityC, district: distD })
  const paths = derivePaths({ kind: 'deal-type-city-district', ...base, typeSlug: typeB, rooms, city: cityC, district: distD })
  return listings.length
    ? {
        kind: 'deal-type-city-district',
        path: isOrganicRequested ? paths.kaPath : paths.asciiPath,
        ...paths,
        ...base,
        typeSlug: typeB,
        rooms,
        city: cityC,
        district: distD,
        listings,
      }
    : null
}

/** Full SEO URL set for the sitemap. Do not SSG this at build — see generateSeoBuildParams. */
export function generateAllSeoParams(): string[][] {
  const out: string[][] = []
  const push = (slug: string[]) => {
    const def = parseSeoSlug(slug)
    if (def) out.push(slug)
  }
  for (const deal of Object.keys(DEALS)) {
    if (deal === 'lease') {
      push(['lease'])
      for (const city of CITIES) {
        push(['lease', city.slug])
        for (const dist of DISTRICTS.filter((x) => x.citySlug === city.slug)) {
          push(['lease', city.slug, dist.slug])
        }
      }
      continue
    }
    push([deal])
    for (const type of Object.keys(TYPES)) {
      push([deal, type])
      for (const city of CITIES) {
        push([deal, type, city.slug])
        for (const dist of DISTRICTS.filter((x) => x.citySlug === city.slug)) {
          push([deal, type, city.slug, dist.slug])
        }
      }
    }
    for (const city of CITIES) push([deal, city.slug])
    // Room pages: /deal/apartments-N(/city(/district)) — self-throttled by ≥1 listing.
    for (let n = 1; n <= 4; n++) {
      const rt = `apartments-${n}`
      push([deal, rt])
      for (const city of CITIES) {
        push([deal, rt, city.slug])
        for (const dist of DISTRICTS.filter((x) => x.citySlug === city.slug)) {
          push([deal, rt, city.slug, dist.slug])
        }
      }
    }
  }
  for (const city of CITIES) {
    if (cityMarket(city) !== 'ge') continue
    push([city.slug])
    for (const dist of DISTRICTS.filter((x) => x.citySlug === city.slug)) push([city.slug, dist.slug])
  }
  return out
}

/** Build-time SSG hubs only (ka). Long-tail ISR on first crawl — sitemap still lists every URL. */
export function generateSeoBuildParams(): string[][] {
  const hubs = ['tbilisi', 'batumi']
  const out: string[][] = []
  const push = (slug: string[]) => {
    if (parseSeoSlug(slug)) out.push(slug)
  }
  for (const deal of Object.keys(DEALS)) {
    if (deal === 'lease') {
      push(['lease'])
      for (const city of hubs) push(['lease', city])
      continue
    }
    push([deal])
    for (const type of Object.keys(TYPES)) {
      push([deal, type])
      for (const city of hubs) push([deal, type, city])
    }
    for (const city of hubs) push([deal, city])
  }
  for (const city of hubs) push([city])
  return out
}

/* ————— Footer keyword columns ————— */

export interface FooterCol {
  id: string
  title: Record<string, string>
  links: { href: string; label: Record<string, string> }[]
}

/**
 * ss.ge/myhome-style footer: exact-query anchor columns (იყიდება 2-ოთახიანი
 * ბინა, ბინები ქირავდება ვაკეში). Every link passes parseSeoSlug, so only pages
 * with real inventory get footer juice — anchors literally match the target
 * page's <h1>. Cached: static catalog makes this deterministic.
 */
let footerCache: FooterCol[] | null = null
export function footerKeywordCols(): FooterCol[] {
  if (footerCache) return footerCache

  // ponytail: drop national place so 5-col footer stays 1 line / link (h1 keeps full form)
  const footLabel = (def: NonNullable<ReturnType<typeof parseSeoSlug>>, loc: SeoLoc) => {
    const h = h1Of(def, loc)
    if (loc === 'ka') return h.replace(/ საქართველოში$/, '')
    if (loc === 'en') return h.replace(/ in Georgia$/, '')
    return h.replace(/ в Грузии$/, '')
  }
  const link = (slug: string[]): FooterCol['links'][number] | null => {
    const def = parseSeoSlug(slug)
    return def
      ? {
          href: def.path,
          label: { ka: footLabel(def, 'ka'), en: footLabel(def, 'en'), ru: footLabel(def, 'ru') },
        }
      : null
  }
  const geoLink = (slug: string[]): FooterCol['links'][number] | null => {
    const def = parseSeoSlug(slug)
    if (!def) return null
    const label: Record<string, string> = def.district
      ? { ka: def.district.ka, en: def.district.en, ru: def.district.ru }
      : def.city && !def.rooms
        ? { ka: def.city.ka, en: def.city.en, ru: def.city.ru }
        : { ka: footLabel(def, 'ka'), en: footLabel(def, 'en'), ru: footLabel(def, 'ru') }
    return { href: def.path, label }
  }
  const cols: FooterCol[] = []
  const push = (id: string, title: FooterCol['title'], slugs: string[][]) => {
    const links = slugs.map(link).filter((x): x is FooterCol['links'][number] => x !== null)
    if (links.length) cols.push({ id, title, links })
  }
  const pushGeo = (id: string, title: FooterCol['title'], slugs: string[][]) => {
    const links = slugs.map(geoLink).filter((x): x is FooterCol['links'][number] => x !== null)
    if (links.length) cols.push({ id, title, links })
  }

  // Target ~8 inventory-backed links per column (nulls drop silently).
  push('sale', { ka: 'იყიდება', en: 'For sale', ru: 'Продажа' }, [
    ...[1, 2, 3, 4].map((n) => ['sale', `apartments-${n}`]),
    ['sale', 'houses'], ['sale', 'land'], ['sale', 'commercial'],
    ['sale', 'apartments', 'tbilisi'],
  ])
  push('rent', { ka: 'ქირავდება', en: 'For rent', ru: 'Аренда' }, [
    ...[1, 2, 3, 4].map((n) => ['rent', `apartments-${n}`]),
    ['rent', 'houses'], ['rent', 'commercial'], ['lease'],
    ['rent', 'apartments', 'tbilisi'], ['rent', 'apartments', 'batumi'],
    ['rent', 'apartments', 'kutaisi'],
  ])
  push('daily', { ka: 'დღიურად', en: 'Daily rent', ru: 'Посуточно' }, [
    ['daily', 'apartments-1'], ['daily', 'apartments-2'],
    ['daily', 'apartments'], ['daily', 'houses'],
    ['daily', 'apartments', 'tbilisi'], ['daily', 'apartments', 'batumi'],
    ['daily', 'apartments', 'tbilisi', 'saburtalo'],
    ['daily', 'apartments', 'tbilisi', 'vake'],
    ['daily', 'apartments', 'tbilisi', 'old-tbilisi'],
  ])
  // Live GDS hotels hub — also in Navbar + footer real-estate col + home tile.
  {
    const dailyCol = cols.find((c) => c.id === 'daily')
    if (dailyCol) {
      dailyCol.links.push({
        href: '/hotels',
        label: {
          ka: 'სასტუმროები ცოცხალი ფასებით',
          en: 'Hotels with live rates',
          ru: 'Отели с живыми ценами',
        },
      })
    }
  }
  const tbilisiDists = DISTRICTS.filter((d) => d.citySlug === 'tbilisi').map((d) => d.slug)
  pushGeo('sale-tbilisi', { ka: 'ბინები იყიდება თბილისში', en: 'Apartments for sale in Tbilisi', ru: 'Квартиры на продажу в Тбилиси' }, [
    ['sale', 'apartments', 'tbilisi'],
    ...tbilisiDists.map((d) => ['sale', 'apartments', 'tbilisi', d]),
  ])
  pushGeo('rent-tbilisi', { ka: 'ბინები ქირავდება თბილისში', en: 'Apartments for rent in Tbilisi', ru: 'Квартиры в аренду в Тбилиси' }, [
    ['rent', 'apartments', 'tbilisi'],
    ...tbilisiDists.map((d) => ['rent', 'apartments', 'tbilisi', d]),
    ['rent', 'apartments-1', 'tbilisi'],
    ['rent', 'apartments-2', 'tbilisi'],
  ])
  // 6th column (korter "პოპულარული" pattern): hot long-tail queries the five
  // query columns above don't cover — pledge deal, house/commercial/land × geo,
  // Batumi/Kutaisi sale. Nulls drop, so it self-throttles with inventory.
  push('popular', { ka: 'პოპულარული ძებნები', en: 'Popular searches', ru: 'Популярные запросы' }, [
    ['pledge', 'apartments'],
    ['rent', 'houses', 'tbilisi'], ['sale', 'houses', 'tbilisi'], ['sale', 'houses', 'batumi'],
    ['rent', 'commercial', 'tbilisi'], ['sale', 'commercial', 'tbilisi'],
    ['sale', 'land', 'tbilisi'],
    ['sale', 'apartments', 'batumi'], ['sale', 'apartments', 'kutaisi'],
    ['rent', 'apartments-3', 'tbilisi'],
  ])
  // ponytail: nominative geo names — heading carries the query; Footer cities = one HScroll strip.
  pushGeo('cities', { ka: 'ქალაქები', en: 'Cities', ru: 'Города' }, CITIES.filter((c) => cityMarket(c) === 'ge').map((c) => [c.slug]))

  footerCache = cols
  return cols
}

/* ————— City-info pages (inventory-light cities) ————— */

export interface Faq {
  q: string
  a: string
}

/**
 * Long-form prose for registered cities that don't yet carry listings.
 * Each entry must be unique 200+ word ka prose — no thin pages. When real
 * listings land, the ≥1-listing branch wins and this becomes a fallback
 * only for empty combos.
 */
export type CityProse = {
  lede: string
  body: string[]
  coords?: { lat: number; lng: number }
  faqs: Faq[]
}

export const CITY_PROSE: Record<string, CityProse> = {
  rustavi: {
    lede: 'რუსთავი — ქვემო ქართლის სამრეწველო დედაქალაქი თბილისიდან 25 კილომეტრში. საბჭოთა ინდუსტრიული მემკვიდრეობიდან გამოსული ქალაქი დღეს იზიდავს ახალგაზრდა ოჯახებს ხელმისაწვდომი ფასებით და თბილისთან საავტომობილო და სარკინიგზო კავშირით.',
    body: [
      'ქალაქის უძრავი ქონების ბაზარი იზრდება ახალი კორპუსების მშენებლობით — ძირითადად პანელური შენობების რეკონსტრუქციითა და ახალი საცხოვრებელი კომპლექსების განვითარებით. ფასები საშუალოდ 30-50%-ით დაბალია თბილისის ცენტრთან შედარებით, რაც რუსთავს პირველი ბინის მყიდველებისთვის და ინვესტორებისთვის მიმზიდველს ხდის.',
      'ტრანსპორტი: რეგულარული მარშრუტკა, რკინიგზა და საავტომობილო გზატკეცილი თბილისისკენ. მგზავრობა დედაქალაქამდე დაახლოებით 30-40 წუთი საათში. ქალაქში მოქმედებს ახალი სკოლები, საბავშვო ბაღები და სავაჭრო ცენტრები.',
      'რუსთავი არის ასევე ქართული მანქანათმშენებლობის ცენტრი, რაც აქტიურ სამუშაო ბაზარს ქმნის და ამყარებს ადგილობრივ მოთხოვნას ქირავდება ბინებზე.',
    ],
    coords: { lat: 41.5495, lng: 44.9931 },
    faqs: [
      { q: 'რა ღირს ბინა რუსთავში თბილისთან შედარებით?', a: 'რუსთავში კვადრატული მეტრი ჩვეულებრივ 30–50%-ით იაფია თბილისის ცენტრთან შედარებით. ზუსტი დიაპაზონი იცვლება უბნისა და შენობის ასაკის მიხედვით — sivrce-ზე თითოეულ განცხადებას აქვს AI ფასის შეფასება.' },
      { q: 'რამდენი ხანია თბილისამდე რუსთავიდან?', a: 'საავტომობილო გზით დაახლოებით 30–40 წუთი, რკინიგზით — ერთი რეგიონული მატარებლის გაჩერება. ბევრი მყიდველი ყიდულობს რუსთავში და მუშაობს თბილისში.' },
    ],
  },
  poti: {
    lede: 'ფოთი — შავიზღვისპირა ნავსადგური ქალაქი და საქართველოს უმსხვილესი საზღვაო კარიბჭე. კოლხეთის დაბლობზე, რიონის შესართავთან, ფოთი აერთიანებს ისტორიულ მემკვიდრეობას თანამედროვე ლოჯისტიკურ ეკონომიკასთან.',
    body: [
      'უძრავი ქონების ბაზარი ძირითადად მოიცავს საბჭოთა პერიოდის ბინებსა და ახალ სახლებს. ფასები ერთ-ერთი ყველაზე დაბალია სანაპირო ქალაქებს შორის, რაც იზიდავს ბიუჯეტურ მყიდველებს და საპორტო ინფრასტრუქტურასთან დაკავშირებულ ინვესტორებს.',
      'ფოთის პორტი და თავისუფალი ინდუსტრიული ზონა ქმნის მუდმივ სამუშაო ბაზარს. ქალაქიდან ბათუმი დაახლოებით 1.5 საათის სავალზეა, ქუთაისის საერთაშორისო აეროპორტი — 45 წუთის მანძილზე.',
      'კულტურული მიზანი: კოლხეთის ეროვნული პარკი, ფოთის ციხე-სიმაგრე და სვიმონ კანანელის საკათედრო ტაძარი — ერთ-ერთი უძველესი ქრისტიანული ნაგებობა საქართველოში.',
    ],
    coords: { lat: 42.1494, lng: 41.6656 },
    faqs: [
      { q: 'ღირს თუ არა ბინის ყიდვა ფოთში ინვესტიციად?', a: 'ფოთი იაფია სანაპირო ქალაქებს შორის და პორტი ქმნის სტაბილურ ქირის მოთხოვნას. სპეკულაციური ზრდა ბათუმივით არ არის — აქ ყიდულობენ საცხოვრებლად ან პორტთან სამუშაოდ.' },
      { q: 'როგორ მივიდე ფოთში თბილისიდან?', a: 'რკინიგზით ან ავტომაგისტრალით დასავლეთის მიმართულებით. ქუთაისის აეროპორტი დაახლოებით 45 წუთია; ბათუმი — დაახლოებით 1.5 საათი.' },
    ],
  },
  zugdidi: {
    lede: 'ზუგდიდი — სამეგრელოს დედაქალაქი, აფხაზეთის ადმინისტრაციული მოსაზღვრე ქალაქი. დადიანების სასახლის ბაღები და მაგნოლიების ხეივანი ზუგდიდს უნიკალურ კულტურულ ხასიათს აძლევს.',
    body: [
      'უძრავი ქონების ბაზარი მოიცავს როგორც ისტორიულ ხის სახლებს, ისე ახალ ბინებს. ფასები მნიშვნელოვნად დაბალია თბილისთან შედარებით, ხოლო მიწის ნაკვეთები სოფლის მეურნეობისთვის და საცხოვრებლად ფართოდ არის ხელმისაწვდომი.',
      'ქალაქი მნიშვნელოვანი სატრანსპორტო კვანძია — რკინიგზა თბილისიდან, საავტომობილო გზა შავი ზღვისპირეთისკენ და ფოთისკენ. ახლოსაა მესტია და სვანეთი, რაც ზამთრის და ზაფხულის ტურიზმის პოტენციალს ზრდის.',
      'დადიანების სასახლის მუზეუმი და ბოტანიკური ბაღი ქალაქს კულტურულ ტურისტულ მიმართულებად აქცევს. სამეგრელოს სამზარეულო და მაგნოლიების ხეივანი ზუგდიდს განასხვავებს სხვა რეგიონული ცენტრებისგან.',
    ],
    coords: { lat: 42.5088, lng: 41.8709 },
    faqs: [
      { q: 'რა ტიპის ქონება იყიდება ზუგდიდში?', a: 'ძირითადად კერძო სახლები, მიწის ნაკვეთები და საბჭოთა/ახალი ბინები. ტურისტული ქირა იზრდება სვანეთის სეზონზე — მესტია ახლოსაა.' },
      { q: 'არის თუ არა ზუგდიდი კარგი ბაზა სვანეთისთვის?', a: 'დიახ. ზუგდიდი არის ბოლო დიდი ქალაქი მესტიამდე; ბევრი სტუმარი აქ ჩერდება ერთი ღამით ან ქირაობს ბინას სეზონზე.' },
    ],
  },
  telavi: {
    lede: 'თელავი — კახეთის ისტორიული დედაქალაქი, ალაზნის ველისა და კავკასიონის პანორამით. ქართული ღვინის მრეწველობის გული — აქ არის ღვინის სარდაფები, სამეფო ისტორია და სტუმრების ნაკადი მთელი წლის განმავლობაში.',
    body: [
      'უძრავი ქონების ბაზარი მოიცავს ქალაქის ცენტრში ბინებს და გარეუბნებში კერძო სახლებსა და ვენახებიან ნაკვეთებს. ფასები ხელმისაწვდომია; მევენახეობის ფერმები პოპულარულია ტურისტული და ინვესტიციური მიზნებისთვის.',
      'თელავიდან თბილისისკენ — 1.5-2 საათის სავალი ავტომობილით. ახლოს მდებარეობს სიღნაღი, გრემი, ნაფარეული — ქართული ღვინის ყველაზე ცნობილი რეგიონები.',
      'ერეკლე II-ის სასახლე, ჭავჭავაძეების მამული და ალ. ჭავჭავაძის სახლ-მუზეუმი ქალაქს ღრმა ისტორიულ ხასიათს ანიჭებს. თელავი ერთ-ერთი უძველესი ქალაქია საქართველოში — წყაროები მას I საუკუნიდან იხსენიებს.',
    ],
    coords: { lat: 41.9198, lng: 45.4736 },
    faqs: [
      { q: 'შეიძლება თუ არა ვენახიანი სახლის ყიდვა თელავთან?', a: 'დიახ — ალაზნის ველზე მიწა და სახლები რეგულარულად იყიდება. გადაამოწმეთ საკადასტრო საზღვარი და სარწყავი უფლება ყიდვამდე.' },
      { q: 'რამდენი ხანია თბილისიდან თელავამდე?', a: 'დაახლოებით 1.5–2 საათი ავტომობილით გომბორის უღელტეხილით ან ალაზნის გზით. პირდაპირი რკინიგზა არ არის.' },
    ],
  },
  gori: {
    lede: 'გორი — შიდა ქართლის რეგიონალური ცენტრი, მდებარეობს თბილისსა და ბორჯომს შორის. ქალაქის ზემოთ აღმართულია შუა საუკუნეების გორის ციხე, ხოლო ახლომდებარე უფლისციხე კლდეში ნაკვეთი ქალაქია.',
    body: [
      'უძრავი ქონების ბაზარი ძირითადად საბჭოთა პერიოდის ბინებსა და კერძო სახლებს მოიცავს. ფასები დაბალია, რაც იზიდავს ინვესტორებს ქირავნების სფეროში და პირველი ბინის მყიდველებს, რომლებიც თბილისთან მშვიდ გარემოს ეძებენ.',
      'ტრანსპორტი: საერთაშორისო ავტომაგისტრალი და რკინიგზა თბილისსა და ბათუმს შორის გორიზე გადის. მგზავრობა თბილისამდე დაახლოებით 1–1.5 საათი.',
      'კულტურული მიმზიდველობა: გორის ციხე, უფლისციხის ნაქალაქარი, სტალინის მუზეუმი. ქალაქი ადგილობრივი სასოფლო-სამეურნეო ბაზრის ცენტრიცაა.',
    ],
    coords: { lat: 41.9842, lng: 44.1163 },
    faqs: [
      { q: 'რატომ ყიდულობენ ბინას გორში თბილისის ნაცვლად?', a: 'ფასი დაბალია, მაგისტრალი და რკინიგზა პირდაპირ გადის, ხოლო უფლისციხე და ბორჯომის მიმართულება ახლოსაა. კომპრომისი: ნაკლები ახალი პროექტი, ვიდრე დედაქალაქში.' },
      { q: 'რამდენი ხანია გორიდან თბილისამდე?', a: 'დაახლოებით 1–1.5 საათი ავტომობილით ან მატარებლით. ეს არის მთავარი აღმოსავლეთ–დასავლეთის დერეფანი.' },
    ],
  },
  mtskheta: {
    lede: 'მცხეთა — საქართველოს ძველი დედაქალაქი და ქრისტიანული ცენტრი. მცხეთაშია სვეტიცხოველი — ქართული სამოციქულო ეკლესიის მთავარი ტაძარი. ქალაქი შესულია იუნესკოს მსოფლიო მემკვიდრეობის სიაში.',
    body: [
      'უძრავი ქონების ბაზარი შედარებით მცირეა — ქალაქის ისტორიული სტატუსი ზღუდავს მასშტაბურ მშენებლობას. ბინები და კერძო სახლები ხელმისაწვდომია; ვენახებიანი და ბაღიანი ნაკვეთები პოპულარულია მეორე სახლის მყიდველებს შორის.',
      'მცხეთა თბილისიდან 20–30 წუთის სავალზეა — საავტომობილო და სარკინიგზო კავშირით. ეს მას პოპულარულად ხდის იმ მყიდველებისთვის, რომლებიც თბილისთან ახლოს, მშვიდ ისტორიულ გარემოში ცხოვრებას ეძებენ.',
      'კულტურული მემკვიდრეობა: სვეტიცხოველი, ჯვარის მონასტერი (მდინარეების შესართავთან), სამთავრო, შიო-მღვიმე. ქალაქი ქართული ტურიზმის ერთ-ერთი მთავარი მიმართულებაა.',
    ],
    coords: { lat: 41.8434, lng: 44.7144 },
    faqs: [
      { q: 'შეიძლება თუ არა ახალი კორპუსის აშენება მცხეთაში?', a: 'ისტორიულ ბირთვში მკაცრი შეზღუდვებია. ახალი სახლები ძირითადად ქალაქის პერიფერიაზე და მცხეთის მუნიციპალიტეტის სოფლებში ჩნდება.' },
      { q: 'რატომ ყიდულობენ სახლს მცხეთაში თბილისის ნაცვლად?', a: '20–30 წუთი დედაქალაქამდე, იუნესკოს სტატუსი და უფრო მშვიდი ქუჩები. ინვენტარი მცირეა — კარგი ობიექტი სწრაფად იყიდება.' },
    ],
  },
  bakuriani: {
    lede: 'ბაკურიანი — საქართველოს მთავარი სათხილამურო კურორტი ბორჯომის ხეობის თავზე, დაახლოებით 1 700 მეტრზე. ზამთარში ტრასები და სასტუმროები ივსება, ზაფხულში კი იგივე ბინები ქირავდება ოჯახურ დასვენებაზე — ორსეზონიანი ბაზარი, რომელიც სხვა მთის დასახლებებს არ აქვთ.',
    body: [
      'უძრავი ქონება აქ ძირითადად კერძო სახლები, კოტეჯები და მცირე აპარტ-სასტუმროებია. ბინის ყიდვა ბაკურიანში ხშირად ნიშნავს დღიურ ქირას ზამთრის სეზონზე და საკუთარ დასვენებას დანარჩენ წელს. ფასი დამოკიდებულია ტრასებთან სიახლოვეზე და გათბობის ტიპზე — გაზი და ცენტრალური გათბობა აქ პრემიუმია.',
      'თბილისიდან დაახლოებით 3 საათი ავტომობილით, ბორჯომიდან — 30 წუთი. რკინიგზა ბორჯომამდე მიდის; ზამთარში გზა საბურავებს და ზოგჯერ ჯაჭვებს ითხოვს. ახლოსაა ბაკურიანის დიდრონი, კოხტას ტრასები და ბორჯომ-ხარაგაულის ეროვნული პარკი.',
      'ყიდვამდე შეამოწმეთ ზამთრის წვდომა, სახურავის დატვირთვა თოვლზე და ქირის ისტორია. sivrce-ზე ბაკურიანის განცხადებები იგივე ვერიფიკაციას გადიან, რაც თბილისის ბინები — მესაკუთრეს პირდაპირ უკავშირდებით.',
    ],
    coords: { lat: 41.751, lng: 43.5292 },
    faqs: [
      { q: 'ღირს თუ არა ბინის ყიდვა ბაკურიანში ქირაზე გასაშვებად?', a: 'დიახ, თუ ობიექტი ტრასებთან ახლოსაა და გათბობა საიმედოა. შემოსავალი კონცენტრირებულია დეკემბერ–მარტში; ზაფხული უფრო რბილია. დათვალეთ სეზონური შევსება, არა წლიური საშუალო თბილისის ქირასავით.' },
      { q: 'რამდენი ხანია თბილისიდან ბაკურიანამდე?', a: 'დაახლოებით 3 საათი ავტომობილით. ზამთარში დაამატეთ დრო უღელტეხილზე. ალტერნატივა: მატარებელი ბორჯომამდე და ტაქსი კურორტამდე.' },
    ],
  },
  kobuleti: {
    lede: 'ქობულეთი — აჭარის სანაპირო კურორტი ბათუმსა და ჩაქვს შორის. უფრო მშვიდი და ხელმისაწვდომია, ვიდრე ბათუმის ბულვარი, ამიტომ ზაფხულის დღიური ქირა და საოჯახო ბინები აქ ცალკე ბაზარს ქმნის.',
    body: [
      'უძრავი ქონება: საბჭოთა პანელები, 2000-იანების კორპუსები ზღვასთან და ახალი დაბალი სახლები პირველ ხაზზე. ფასი ბათუმის ცენტრზე დაბალია; პირველი ხაზის კვადრატი მაინც პრემიუმია. ზამთარში ქირა ეცემა — ბევრი მესაკუთრე მხოლოდ ივნის–სექტემბერს ითვლის.',
      'ბათუმამდე 20–25 წუთი, ქუთაისის აეროპორტამდე დაახლოებით 1.5 საათი, თბილისამდე — რკინიგზა პირდაპირ შედის. ახლოსაა ციხისძირი, კინტრიში და ჩაქვის ჩაის პლანტაციები.',
      'ყიდვისას ნახეთ ნაპირთან ეროზია, პარკირება სეზონზე და შენობის სეისმური მდგომარეობა. sivrce-ზე ქობულეთის განცხადებები იგივე ფილტრებით იძებნება, რაც ბათუმის ბინები.',
    ],
    coords: { lat: 41.8214, lng: 41.7753 },
    faqs: [
      { q: 'რით განსხვავდება ქობულეთი ბათუმისგან უძრავ ქონებაში?', a: 'ქობულეთი უფრო იაფია და სეზონურია. ბათუმი მთელი წლის ქირას იძლევა (ოფისები, სტუდენტები); ქობულეთში შემოსავალი ზაფხულზეა მიბმული.' },
      { q: 'შეიძლება თუ არა ზღვასთან ბინის ყიდვა ქობულეთში?', a: 'პირველი ხაზი არსებობს, მაგრამ გადაამოწმეთ ნაპირის ზოლი და სამშენებლო ნებართვა. ზოგი ძველი კორპუსი ზღვასთან ახლოსაა, მაგრამ სართულები და ლიფტი შეზღუდულია.' },
    ],
  },
  borjomi: {
    lede: 'ბორჯომი — მინერალური წყლისა და ეროვნული პარკის ქალაქი თბილისსა და ბაკურიანს შორის. აქ ყიდულობენ არა ცათამბჯენს, არამედ სახლს ტყესთან, პანსიონატს ან ბინას პარკის შესასვლელთან.',
    body: [
      'ბაზარი მცირეა და ნელი. საბჭოთა პანსიონატების კონვერსია, კერძო სახლები ბაღით და ცენტრის ძველი ბინები. ფასი თბილისზე დაბალია, მაგრამ „ხედი პარკზე“ პრემიუმს ჰქმნის. ზამთარში ტურისტები ბაკურიანისკენ მიდიან; ბორჯომი მთელი წლის სასეირნო კურორტია.',
      'თბილისიდან დაახლოებით 2.5 საათი, რკინიგზა პირდაპირ შედის. ბაკურიანი 30 წუთია. ახლოსაა ლიკანი, ბაკურიანის ვიწროლიანდაგიანი რკინიგზა და ბორჯომ-ხარაგაულის ბილიკები.',
      'ყიდვამდე ნახეთ ტენიანობა (ხეობა), გათბობა და ტყის საზღვარი — ზოგი ნაკვეთი პარკის ბუფერშია. sivrce-ზე ბორჯომის ობიექტები რუკაზე ჩანს თბილისის განცხადებებთან ერთად.',
    ],
    coords: { lat: 41.8375, lng: 43.3944 },
    faqs: [
      { q: 'არის თუ არა ბორჯომი კარგი ადგილი მეორე სახლისთვის?', a: 'დიახ, თუ გინდათ ტყე და მინერალური წყალი, არა ღამის ცხოვრება. ზაფხული და შაბათ-კვირა ივსება; სამუშაო დღეები მშვიდია.' },
      { q: 'შეიძლება თუ არა სახლის ქირაზე გაშვება ბორჯომში?', a: 'შეიძლება, განსაკუთრებით პარკთან და ცენტრთან. შევსება უფრო სტაბილურია, ვიდრე სუფთა სათხილამურო კურორტზე, მაგრამ ღამის ფასი უფრო დაბალია, ვიდრე ბაკურიანში სეზონზე.' },
    ],
  },
  gudauri: {
    lede: 'გუდაური — საქართველოს უმაღლესი სათხილამურო კურორტი სამხედრო გზაზე, დაახლოებით 2 200 მეტრზე. აქ ბინა ნიშნავს სეზონურ ქირას, არა მუდმივ საცხოვრებელს: ზამთარი სავსეა, მაისი–ოქტომბერი — თითქმის ცარიელი.',
    body: [
      'ინვენტარი: აპარტ-სასტუმროები, ახალი კორპუსები ტრასის ხედით და კერძო შალეები. კვადრატის ფასი თბილისის პრემიუმ უბნებს უახლოვდება, რადგან მიწა მწირია და სეზონური ქირა მაღალია. გათბობა, წყალი და ზამთრის წვდომა აქ უფრო მნიშვნელოვანია, ვიდრე სამზარეულოს ზომა.',
      'თბილისიდან 2–2.5 საათი ჯვრის უღელტეხილით. ზამთარში გზა იხურება ქარბუქზე — ეს პირდაპირ აისახება ქირის გაუქმებაზე. ახლოსაა ყაზბეგი/სტეფანწმინდა, რაც ზაფხულის ჰაიკინგის ნაკადს მცირედ ამატებს.',
      'ყიდვამდე მოითხოვეთ სახლის წესები (Airbnb-ის აკრძალვა ზოგ კორპუსში), თოვლის დატვირთვა და პარკინგი. sivrce-ზე გუდაურის განცხადებები დღიური ქირის ფილტრითაც იძებნება.',
    ],
    coords: { lat: 42.475, lng: 44.4769 },
    faqs: [
      { q: 'რა განსხვავებაა გუდაურსა და ბაკურიანს შორის ინვესტიციაში?', a: 'გუდაური უფრო მაღალია, უფრო მოკლე სეზონი, უფრო მაღალი ღამის ფასი. ბაკურიანი ორსეზონიანია და ოჯახურია. გუდაურში კაპიტალი უფრო სწრაფად ბრუნდება კარგ სეზონზე და უფრო ცარიელია ზაფხულში.' },
      { q: 'შეიძლება თუ არა მუდმივად ცხოვრება გუდაურში?', a: 'ტექნიკურად კი, პრაქტიკულად იშვიათად. სერვისები სეზონზეა მორგებული; სკოლა, აფთიაქი და ზამთრის იზოლაცია სერიოზული შეზღუდვაა.' },
    ],
  },
  mestia: {
    lede: 'მესტია — ზემო სვანეთის ცენტრი, იუნესკოს კოშკებითა და უშგულის გზით. უძრავი ქონება აქ არის გესთჰაუსი, ხის სახლი და იშვიათი ახალი კორპუსი — არა თბილისური ბინა.',
    body: [
      'ყიდულობენ ტურისტულ ქირაზე (ჰაიკი, თხილამურები ჰაწვალში, უშგული) ან სვანური ფესვის დასაბრუნებლად. ფასები გაიზარდა გზის გაუმჯობესების შემდეგ, მაგრამ კვადრატი მაინც იაფია კურორტ გუდაურზე. ზამთარი გრძელია; გათბობა და წყალი გადამწყვეტია.',
      'ზუგდიდიდან დაახლოებით 3–4 საათი მთის გზით, თბილისიდან — სრული დღე. აეროდრომი მესტიაში სეზონურად მუშაობს. ახლოსაა უშგული, ლატალი, ჰაწვალი.',
      'ყიდვისას გადაამოწმეთ საკადასტრო და მემკვიდრეობითი საკითხები — სვანეთში მიწა ხშირად ოჯახურია. sivrce-ზე მესტიის ობიექტები რუკაზე ცალკე ქალაქად ჩანს.',
    ],
    coords: { lat: 43.0456, lng: 42.7278 },
    faqs: [
      { q: 'შეიძლება თუ არა გესთჰაუსის ყიდვა მესტიაში უცხოელმა?', a: 'საქართველოში უცხოელს შეუძლია ბინისა და სახლის ყიდვა; სასოფლო-სამეურნეო მიწაზე შეზღუდვებია. მესტიაში ხშირია სახლი ეზოთი — იურისტი გადაამოწმოს კატეგორია ყიდვამდე.' },
      { q: 'როდის არის სეზონი მესტიაში?', a: 'ზაფხული (უშგული, ჰაიკი) და ზამთარი (ჰაწვალი). ოქტომბერ–ნოემბერი და აპრილი უფრო ცარიელია. ქირის კალკულაცია ამ ორ პიკზე ააგეთ.' },
    ],
  },
  sighnaghi: {
    lede: 'სიღნაღი — კახეთის კედლებიანი ქალაქი ალაზნის ველის ხედით. აქ ყიდულობენ არა მეტრო-ბინას, არამედ სახლს აივნით, ღვინის სარდაფით ან პატარა სასტუმროს ძველ ქუჩაზე.',
    body: [
      'ინვენტარი მცირეა: რესტავრირებული აგურის სახლები, ახალი კოტეჯები კედლის გარეთ და იშვიათი ბინები. ტურისტული ქირა შაბათ-კვირას და რთველზე ივსება. ფასი თელავზე მაღალია კვადრატზე, რადგან ხედი და კედელი პრემიუმია.',
      'თბილისიდან დაახლოებით 2 საათი. ახლოსაა ბოდბე, თელავი, ყვარელი. წყალი და პარკირება ძველ ქალაქში შეზღუდულია — ეს რეალური ჭერია, არა დეტალი.',
      'ყიდვამდე ნახეთ კონსერვაციის წესები ისტორიულ ზონაში. sivrce-ზე სიღნაღის განცხადებები კახეთის სხვა ქალაქებთან ერთად იძებნება.',
    ],
    coords: { lat: 41.6103, lng: 45.9219 },
    faqs: [
      { q: 'ღირს თუ არა სასტუმროს ყიდვა სიღნაღში?', a: 'მცირე გესთჰაუსი კედლის მიმდებარედ მუშაობს შაბათ-კვირას. დიდი სასტუმრო სწრაფად აჭარბებს მოთხოვნას — ქალაქი პატარაა. დაითვალეთ ოთახების რაოდენობა ტურისტულ ნაკადზე, არა თბილისის მოდელზე.' },
      { q: 'შეიძლება თუ არა მუდმივად ცხოვრება სიღნაღში?', a: 'დიახ. ზამთარი მშვიდია, სერვისები შეზღუდული. ბევრი მესაკუთრე თბილისში მუშაობს და აქ შაბათ-კვირას ჩამოდის.' },
    ],
  },
  // DE soft launch (sivrce.de). Inventory-light: prose first, listings later —
  // the same self-throttling pattern as the regional GE cities above.
  berlin: {
    lede: 'ბერლინი — გერმანიის დედაქალაქი და უდიდესი ქალაქი, ევროპის ერთ-ერთი ყველაზე დინამიური უძრავი ქონების ბაზარი. sivrce აქ საერთაშორისო გაფართოებას იწყებს — ჯერ ქალაქის გზამკვლევით, განცხადებები კი ინვენტარის შემოსვლასთან ერთად დაემატება.',
    body: [
      'ბერლინის ბაზარი ძირითადად ქირისკენადიანია — მოსახლეობის უდიდესი ნაწილი ქირაობს, ამიტომ ინვესტიციის მთავარი მიმართულება საცხოვრებელი ფართების ქირაზე გაშვებაა. ქალაქი მუდმივად იზრდება სტუდენტების, საერთაშორისო კომპანიებისა და კულტურული ინდუსტრიების გამო, რაც ქირის მოთხოვნას გრძელვადიან ხდის სტაბილურს.',
      'გარიგება გერმანიაში ნოტარიული წესით მიდის: დამოუკიდებელი ნოტარიუსი აფორმებს ხელშეკრულებას, საკუთრება ირიცხება საკუთრების წიგნში (Grundbuch), ხოლო შესყიდვაზე დგას ქონების გადასახადი — ბერლინში ის ფასის დაახლოებით 6%-ია. დამატებითი ხარჯებია ნოტარიუსისა და რეგისტრაციის საფასური.',
      'sivrce-ზე ბერლინის 12-ვე ბეცირკი რეგისტრირებულია — მიტედან შპანდაუმდე და პანკოვიდან ტრეპტოვ-კეპენიკამდე — თითოეულს ცალკე გზამკვლევი აქვს. გერმანიის 15 უმსხვილესი ქალაქიც (ჰამბურგი, მიუნხენი, კელნი, ფრანკფურტი და სხვ.) რეესტრშია და განცხადებების ინვენტარი აგენტებთან პირდაპირი თანამშრომლობით ივსება თბილისის იმავე ვერიფიკაციის სტანდარტით.',
    ],
    coords: { lat: 52.52, lng: 13.405 },
    faqs: [
      { q: 'შეიძლება თუ არა ბერლინში ბინის ყიდვა უცხოელისთვის?', a: 'დიახ — გერმანიაში უძრავი ქონების ყიდვა უცხოელებისთვის შეზღუდვის გარეშეა, ნოტარიუსის მეშვეობით. გაითვალისწინეთ ქონების გადასახადი (ბერლინში დაახლოებით 6%), ნოტარიუსისა და რეგისტრაციის საფასური და, საჭიროების შემთხვევაში, ადგილობრივი საფინანსო პარტნიორი.' },
      { q: 'როდის დაემატება ბერლინის განცხადებები sivrce-ზე?', a: 'ქალაქი ახლა საცდელ რეჟიმშია — უბნების რეესტრი და ბაზრის მიმოხილვა ხელმისაწვდომია, ხოლო განცხადებები თანდათან დაემატება ადგილობრივ აგენტებთან თანამშრომლობის გაფართოებასთან ერთად.' },
    ],
  },
  // DE market (sivrce.de) — top metros. Same inventory-light pattern as GE
  // regions: unique prose now, listings light up the hubs when they land.
  hamburg: {
    lede: 'ჰამბურგი — გერმანიის მეორე ქალაქი და ევროპის უმსხვილესი ნავსადგურებიდან ერთ-ერთი ელბის შესართავთან. წყლისპირა HafenCity-დან ალტონას ქუჩებამდე ბაზარი სტაბილურია პორტის, მედიისა და აეროკოსმოსური ინდუსტრიის სამუშაო ადგილებით.',
    body: [
      'უძრავი ქონება ჰამბურგში ბერლინზე ძვირია, მიუნხენზე კი იაფი: პრემიუმია წყლის ხედი (HafenCity, Blankenese), ხოლო ოჯახები Eimsbüttel-სა და Wandsbek-ში ყიდულობენ. ქირის მოთხოვნა მაღალია სტუდენტებისა და პორტთან დაკავშირებული სპეციალისტების გამო.',
      'გარიგება სტანდარტული გერმანული წესით მიდის — ნოტარიუსი, საკუთრების წიგნი (Grundbuch) და ფედერალური მიწის ქონების გადასახადი. sivrce-ზე ჰამბურგის განცხადებები ბერლინის შემდეგ, ინვენტარის შემოსვლასთან ერთად დაემატება.',
    ],
    coords: { lat: 53.5511, lng: 9.9937 },
    faqs: [
      { q: 'შეუძლია თუ არა უცხოელს ბინის ყიდვა ჰამბურგში?', a: 'დიახ — გერმანიაში მოქალაქეობრივი შეზღუდვა არ არის. დაგჭირდებათ ნოტარიუსი, საბანკო ანგარიში და ქონების გადასახადის ბიუჯეტი, რომელიც ფედერალური მიწის მიხედვით იცვლება.' },
      { q: 'რომელი უბანია პოპულარული ჰამბურგში საცხოვრებლად?', a: 'HafenCity და Blankenese — წყლისპირა პრემიუმი; Eimsbüttel და Altona — ოჯახური ბალანსი ცენტრთან სიახლოვით. ქირაზე გაშვებისთვის U-Bahn-თან სიახლოვეა გადამწყვეტი.' },
    ],
  },
  munich: {
    lede: 'მიუნხენი — ბავარიის დედაქალაქი მდინარე იზარზე, გერმანიის ყველაზე ძვირი უძრავი ქონების ბაზრით. BMW-ს, Siemens-ისა და ტექნოლოგიური კამპუსების თანამშრომლები ქირის მოთხოვნას ათწლეულებია სტაბილურად მაღალს ხდიან.',
    body: [
      'კვადრატის ფასი მიუნხენში ქვეყნის პიკია — ცენტრი (Altstadt-Lehel, Maxvorstadt) პრემიუმია, ხოლო Schwabing და Glockenbachviertel ახალგაზრდული მოთხოვნით ივსება. ოქტომბერფესტი დღიურ ქირას სეზონურ პიკს აძლევს.',
      'ყიდვისას გაითვალისწინეთ ბავარიის ქონების გადასახადი და ნოტარიუსის ხარჯი; იპოთეკა არარეზიდენტისთვის მაღალი პირველი შენატანითაა შესაძლებელი. sivrce-ზე მიუნხენის ინვენტარი ბერლინის შემდეგ ეტაპზე დაემატება.',
    ],
    coords: { lat: 48.1351, lng: 11.582 },
    faqs: [
      { q: 'რატომ არის მიუნხენი ყველაზე ძვირი გერმანიაში?', a: 'მაღალი ხელფასები (ტექნოლოგიები, ავტო, ფინანსები), შეზღუდული მიწა ცენტრში და მუდმივი მიგრაცია ქალაქში. ვაკანსია მინიმალურია, ამიტომ ქირის შემოსავალი პროგნოზირებადია.' },
      { q: 'ღირს თუ არა მიუნხენში ყიდვა ქირაზე გასაშვებად?', a: 'შემოსავლის პროცენტი დაბალია ფასის გამო, მაგრამ ვაკანსიის რისკი თითქმის ნულოვანია. გაითვალეთ გრძელ ჰორიზონტზე და U-Bahn-თან სიახლოვეზე.' },
    ],
  },
  cologne: {
    lede: 'კელნი — რაინის მილიონიანი ქალაქი ტაძრით, კარნავალითა და მედია-ინდუსტრიით. ფასები მიუნხენისა და ფრანკფურტის ქვემოთაა, ხოლო სტუდენტური და კულტურული ნაკადი ქირის ბაზარს ცოცხალს ხდის.',
    body: [
      'პოპულარულია Belgisches Viertel და Ehrenfeld — ახალგაზრდული ქირა; Lindenthal და Marienburg — ოჯახური პრემიუმი. დიუსელდორფამდე 40 წუთია, ამიტომ რაინის ორივე ნაპირი ერთ აგლომერაციად მუშაობს.',
      'sivrce-ზე კელნის გზამკვლევი რეესტრშია; განცხადებები ინვენტარის შემოსვლასთან ერთად, ბერლინის ვერიფიკაციის იმავე სტანდარტით დაემატება.',
    ],
    coords: { lat: 50.9375, lng: 6.9603 },
    faqs: [
      { q: 'შეუძლია თუ არა ქართველს ბინის ყიდვა კელნში?', a: 'დიახ — გერმანიაში ყიდვა მოქალაქეობას არ უკავშირდება. საჭიროა ნოტარიუსი, საბანკო ანგარიში და ქონების გადასახადის ბიუჯეტი.' },
      { q: 'რომელი უბანი უხდება ინვესტორს კელნში?', a: 'Ehrenfeld და Nippes — ხელმისაწვდომი შესვლა და სტუდენტური ქირა; Deutz — მესის სტუმრები და საქმიანი ქირა.' },
    ],
  },
  frankfurt: {
    lede: 'ფრანკფურტი — ევროპის ფინანსური ცენტრი მაინზე, ევროპის ცენტრალური ბანკითა და ქვეყნის უდიდესი აეროპორტით. ექსპატების ნაკადი ქირის ბაზარს წლის ნებისმიერ სეზონზე ავსებს.',
    body: [
      'Westend და Sachsenhausen — ბანკირების პრემიუმი; Bornheim და Nordend — ოჯახური ბალანსი; Bahnhofsviertel — იაფი, მაგრამ ხმაურიანი. აეროპორტთან სიახლოვე დღიურ ქირასაც კვებავს.',
      'ფასები მიუნხენზე დაბალია, ქირა კი მაღალი — ამიტომ ფრანკფურტი შემოსავლის პროცენტით რაინის სამხრეთის ლიდერია. sivrce-ზე ინვენტარი ბერლინის შემდეგ დაემატება.',
    ],
    coords: { lat: 50.1109, lng: 8.6821 },
    faqs: [
      { q: 'არის თუ არა ფრანკფურტი კარგი ქალაქი ქირის ინვესტიციისთვის?', a: 'დიახ — ექსპატების მუდმივი ნაკადი და ფინანსური სექტორის ხელფასები ქირას მაღალს ხდის. აირჩიეთ S-Bahn-თან ახლოს, აეროპორტის მიმართულებით.' },
      { q: 'რა დოკუმენტები სჭირდება ყიდვას ფრანკფურტში?', a: 'პასპორტი, საბანკო ანგარიში, საგადასახადო ნომერი და ნოტარიუსი. გარიგება იდება საკუთრების წიგნში (Grundbuch).' },
    ],
  },
  stuttgart: {
    lede: 'შტუტგარტი — ბადენ-ვიურტემბერგის დედაქალაქი ნეკარზე, ავტომშენებლობის (Porsche, Mercedes-Benz) გული. მაღალი ხელფასები და ბორცვიანი რელიეფი ბაზარს კომპაქტურსა და ძვირს ხდის.',
    body: [
      'ცენტრი ვიწროა, ამიტომ მოთხოვნა Feuerbach-ში, Vaihingen-სა და Bad Cannstatt-ში იღვრება. უნივერსიტეტი და ტექნოლოგიური პარკები სტუდენტურ ქირას ამყარებს.',
      'sivrce-ზე შტუტგარტის გზამკვლევი უკვე რეესტრშია; განცხადებები ინვენტარის შემოსვლასთან ერთად დაემატება.',
    ],
    coords: { lat: 48.7758, lng: 9.1829 },
    faqs: [
      { q: 'შეუძლია თუ არა უცხოელს ყიდვა შტუტგარტში?', a: 'დიახ — შეზღუდვა არ არის. გაითვალისწინეთ ფედერალური მიწის ქონების გადასახადი, ნოტარიუსისა და რეგისტრაციის ხარჯი.' },
      { q: 'სად ყიდულობენ ოჯახები შტუტგარტში?', a: 'Vaihingen, Möhringen და Degerloch — სკოლები, პარკები და S-Bahn ცენტრამდე 15-20 წუთში.' },
    ],
  },
  duesseldorf: {
    lede: 'დიუსელდორფი — რაინის მოდისა და რეკლამის დედაქალაქი Königsallee-თი და იაპონური კვარტლით. კომპაქტური ცენტრი და მაღალი მსყიდველუნარიანობა ფასებს სტაბილურად მაღალს ხდის.',
    body: [
      'Oberkassel — პრემიუმი მარცხენა ნაპირზე; Pempelfort და Flingern — ახალგაზრდული ქირა; MedienHafen — ახალი აშენებები წყალთან. კელნამდე 40 წუთია — ორი ქალაქი ერთ შრომის ბაზარს იზიარებს.',
      'sivrce-ზე დიუსელდორფის გზამკვლევი რეესტრშია; ინვენტარი ბერლინის შემდეგ ეტაპზე დაემატება.',
    ],
    coords: { lat: 51.2277, lng: 6.7735 },
    faqs: [
      { q: 'შეუძლია თუ არა ქართველს ყიდვა დიუსელდორფში?', a: 'დიახ — მოქალაქეობრივი ბარიერი არ არსებობს. საჭიროა ნოტარიუსი, ანგარიში და ქონების გადასახადის ბიუჯეტი.' },
      { q: 'რომელი უბანია პრესტიჟული დიუსელდორფში?', a: 'Oberkassel და Niederkassel — რაინის ხედები და ძველი ფული; ცენტრში — Carlstadt-ის ალტბაუ.' },
    ],
  },
  leipzig: {
    lede: 'ლაიფციგი — საქსონიის მზარდი ქალაქი, აღმოსავლეთის ყველაზე დინამიური ბაზარი. „Hypezig“-ის კულტურული ტალღა და ხელმისაწვდომი შესვლა მას ახალგაზრდა მყიდველებისა და ინვესტორების ფავორიტად აქცევს.',
    body: [
      'Plagwitz და Südvorstadt — შემოქმედებითი ქირა; Gohlis და Schleußig — ოჯახური ალტბაუ. ფასები ჯერ კიდევ დასავლეთის ნახევარია, ზრდის დინამიკა კი ქვეყნის ტოპში.',
      'BMW-სა და Porsche-ს ქარხნები, ლოჯისტიკა და უნივერსიტეტი სამუშაო ბაზარს აფართოებს. sivrce-ზე ლაიფციგის ინვენტარი ბერლინის შემდეგ დაემატება.',
    ],
    coords: { lat: 51.3397, lng: 12.3731 },
    faqs: [
      { q: 'რატომ იზრდება ლაიფციგი ასე სწრაფად?', a: 'იაფი შესვლა, უნივერსიტეტი, ინდუსტრია და ბერლინიდან გადმოსული შემოქმედებითი კლასი. ქირის მოთხოვნა მიწოდებას უსწრებს.' },
      { q: 'შეუძლია თუ არა უცხოელს ყიდვა ლაიფციგში?', a: 'დიახ — პროცედურა სტანდარტულია: ნოტარიუსი, Grundbuch და ფედერალური მიწის გადასახადი.' },
    ],
  },
  dortmund: {
    lede: 'დორტმუნდი — რურის უდიდესი ქალაქი, ქვანახშირის წარსულიდან ტექნოლოგიებისა და Phoenix-See-ს ტბის კვარტალამდე. შესვლა იაფია, ქირის მოთხოვნა კი უნივერსიტეტისა და ტექნოპარკის გამო სტაბილურია.',
    body: [
      'Phoenix-See — ახალი წყლისპირა პრემიუმი; Kreuzviertel — ალტბაუს ქირა; Hörde — რენოვაციის ზონა. Signal Iduna Park-ის გარშემო დღიური ქირა მატჩების დღეებში პიკავს.',
      'sivrce-ზე დორტმუნდის გზამკვლევი რეესტრშია; განცხადებები ინვენტარის შემოსვლასთან ერთად დაემატება.',
    ],
    coords: { lat: 51.5136, lng: 7.4653 },
    faqs: [
      { q: 'არის თუ არა დორტმუნდი იაფი შესვლა ინვესტორისთვის?', a: 'დიახ — რურის ფასები დასავლეთის დაბალია, ქირა კი სტუდენტებისა და სპეციალისტების გამო ივსება. გაითვალეთ U-Bahn-თან სიახლოვე.' },
      { q: 'რა სჭირდება ყიდვას დორტმუნდში?', a: 'სტანდარტული გერმანული პაკეტი: ნოტარიუსი, საკუთრების წიგნი და ქონების გადასახადის ბიუჯეტი.' },
    ],
  },
  essen: {
    lede: 'ესენი — რურის გული Zollverein-ის ქვანახშირის მუზეუმით (იუნესკო) და ენერგოგიგანტების შტაბებით. ოჯახური სახლები ბაღით აქ დასავლეთის ერთ-ერთ ხელმისაწვდომ ფასად იყიდება.',
    body: [
      'Rüttenscheid — კაფეების ქირა; Werden — ტბასთან პრემიუმი; Altenessen — რენოვაციის ზონა დაბალი შესვლით. Messe Essen გამოფენები დღიურ ქირას კვებავს.',
      'sivrce-ზე ესენის გზამკვლევი რეესტრშია; ინვენტარი ბერლინის შემდეგ დაემატება.',
    ],
    coords: { lat: 51.4556, lng: 7.0116 },
    faqs: [
      { q: 'შეუძლია თუ არა ქართველს სახლის ყიდვა ესენში?', a: 'დიახ — სახლი და ბინა ერთნაირად იყიდება ნოტარიუსის მეშვეობით, მოქალაქეობის მოთხოვნის გარეშე.' },
      { q: 'სად ვიყიდო ოჯახური სახლი ესენში?', a: 'Werden, Kettwig და Heisingen — ტბა, ტყე და სკოლები; ცენტრთან S-Bahn 15-20 წუთია.' },
    ],
  },
  bremen: {
    lede: 'ბრემენი — ჰანზის პორტი ვეზერზე მუსიკოსების ქანდაკებითა და Airbus-ის ქარხნით. კომპაქტური, მწვანე და დასავლეთზე იაფი — მშვიდი ალტერნატივა ჰამბურგის ფასებს.',
    body: [
      'Schnoor და Viertel — ისტორიული ქირა; Überseestadt — წყლისპირა Neubau პორტის ადგილას; Schwachhausen — ოჯახური პრემიუმი. უნივერსიტეტი სტუდენტურ ქირას ამყარებს.',
      'sivrce-ზე ბრემენის გზამკვლევი რეესტრშია; განცხადებები ინვენტარის შემოსვლასთან ერთად დაემატება.',
    ],
    coords: { lat: 53.0793, lng: 8.8017 },
    faqs: [
      { q: 'შეუძლია თუ არა უცხოელს ყიდვა ბრემენში?', a: 'დიახ — პროცესი სტანდარტულია მთელ გერმანიაში: ნოტარიუსი, Grundbuch, ფედერალური მიწის გადასახადი.' },
      { q: 'რომელი უბანია საინტერესო ბრემენში?', a: 'Überseestadt — ახალი წყლისპირა კვარტალი; Viertel — კულტურული ქირა ცენტრთან.' },
    ],
  },
  dresden: {
    lede: 'დრეზდენი — საქსონიის დედაქალაქი ელბაზე, Frauenkirche-თი და „Silicon Saxony“-ის ჩიპების ქარხნებით. ბაროკოს ცენტრი და Neustadt-ის ალტერნატიული სცენა ორ განსხვავებულ მყიდველს იზიდავს.',
    body: [
      'Neustadt — ახალგაზრდული ქირა; Blasewitz და Loschwitz — ელბის ხედიანი პრემიუმი; Prohlis — ხელმისაწვდომი შესვლა. TSMC-Infineon-ის გაფართოება ინჟინრების ნაკადს ზრდის.',
      'sivrce-ზე დრეზდენის გზამკვლევი რეესტრშია; ინვენტარი ბერლინის შემდეგ დაემატება.',
    ],
    coords: { lat: 51.0504, lng: 13.7373 },
    faqs: [
      { q: 'არის თუ არა დრეზდენი კარგი ინვესტიცია?', a: 'დიახ ზრდის ფაზაში: ჩიპების ინდუსტრია სამუშაო ადგილებს ქმნის, ფასები კი ბერლინის ნახევარია. აირჩიეთ Elbe-თან და S-Bahn-თან ახლოს.' },
      { q: 'რა დოკუმენტებია საჭირო ყიდვისას?', a: 'პასპორტი, ანგარიში, საგადასახადო ნომერი და ნოტარიუსი — გარიგება ირიცხება Grundbuch-ში.' },
    ],
  },
  hanover: {
    lede: 'ჰანოვერი — ქვემო საქსონიის დედაქალაქი, მსოფლიოს უდიდესი საგამოფენო ცენტრით (Messe) და Maschsee-ს ტბით. სტაბილური საშუალო ფასები და გამოფენების დღიური ქირა.',
    body: [
      'List და Linden — ოჯახური და შემოქმედებითი ქირა; Zoo-viertel — პრემიუმი; Messe-ს გარშემო აპარტამენტები გამოფენების სეზონზე ივსება. ბერლინამდე ჩქაროსნული მატარებელი 1.5 საათია.',
      'sivrce-ზე ჰანოვერის გზამკვლევი რეესტრშია; განცხადებები ინვენტარის შემოსვლასთან ერთად დაემატება.',
    ],
    coords: { lat: 52.3759, lng: 9.732 },
    faqs: [
      { q: 'შეუძლია თუ არა უცხოელს ყიდვა ჰანოვერში?', a: 'დიახ — შეზღუდვა არ არის; სტანდარტული ნოტარიული გარიგება Grundbuch-ში რეგისტრაციით.' },
      { q: 'მუშაობს თუ არა დღიური ქირა ჰანოვერში?', a: 'დიახ გამოფენების (CeBIT-ის მემკვიდრეობა, Agritechnica) დროს — Messe-სთან ახლოს აპარტამენტი სეზონურად მაღალ ფასს იჭერს.' },
    ],
  },
  nuremberg: {
    lede: 'ნიურნბერგი — ბავარიის მეორე ქალაქი ციხითა და საშობაო ბაზრით, Siemens-ისა და ბაზრობების ეკონომიკით. მიუნხენზე საგრძნობლად იაფი, ქირის მოთხოვნა კი მუდმივია.',
    body: [
      'Gostenhof — შემოქმედებითი ქირა; St. Johannis — ოჯახური ალტბაუ; Langwasser — ხელმისაწვდომი Neubau. სათამაშოების ბაზრობა და კლასიკური კონცერტები ტურისტულ ქირას კვებავს.',
      'sivrce-ზე ნიურნბერგის გზამკვლევი რეესტრშია; ინვენტარი ბერლინის შემდეგ დაემატება.',
    ],
    coords: { lat: 49.4521, lng: 11.0767 },
    faqs: [
      { q: 'შეუძლია თუ არა ქართველს ყიდვა ნიურნბერგში?', a: 'დიახ — ბავარიაში ყიდვის წესი იგივეა: ნოტარიუსი, Grundbuch და მიწის გადასახადი.' },
      { q: 'სად ვიყიდო ნიურნბერგში ქირაზე გასაშვებად?', a: 'Gostenhof და Südstadt — U-Bahn-თან ახლოს, უნივერსიტეტისა და ცენტრის მიმართულებით.' },
    ],
  },
  duisburg: {
    lede: 'დუისბურგი — რაინის მეტროპოლია მსოფლიოს უდიდესი შიდა პორტით. გერმანიის ყველაზე ხელმისაწვდომი შესვლა მილიონიან აგლომერაციაში — დიუსელდორფამდე 20 წუთია.',
    body: [
      'Duissern და Neudorf — სტუდენტური ქირა უნივერსიტეტთან; Huckingen — ოჯახური სახლები; Innenhafen — წყლისპირა Neubau. ლოჯისტიკის ჰაბი სამუშაო ადგილებს მატებს.',
      'sivrce-ზე დუისბურგის გზამკვლევი რეესტრშია; განცხადებები ინვენტარის შემოსვლასთან ერთად დაემატება.',
    ],
    coords: { lat: 51.4344, lng: 6.7623 },
    faqs: [
      { q: 'რატომ არის დუისბურგი ასე იაფი?', a: 'ინდუსტრიული წარსული და დიდი მიწოდება ფასს დაბალს ხდის; პორტი და უნივერსიტეტი კი ქირის მოთხოვნას ქმნის — შემოსავლის პროცენტი მაღალია.' },
      { q: 'რა სჭირდება ყიდვას დუისბურგში?', a: 'სტანდარტული პაკეტი: ნოტარიუსი, Grundbuch-რეგისტრაცია და ქონების გადასახადის ბიუჯეტი.' },
    ],
  },
  bochum: {
    lede: 'ბოხუმი — რურის საუნივერსიტეტო ქალაქი Vonovia-ს შტაბითა და Bermudadreieck-ის ღამის ცხოვრებით. სტუდენტური ქირა და ხელმისაწვდომი ფასები მას შემოსავალზე ორიენტირებული მყიდველის არჩევნად აქცევს.',
    body: [
      'Ehrenfeld და Querenburg — უნივერსიტეტთან ქირა; Stiepel — ტბასთან ოჯახური პრემიუმი; Hamme — რენოვაციის ზონა. Starlight Express-ი ტურისტულ ნაკადსაც მატებს.',
      'sivrce-ზე ბოხუმის გზამკვლევი რეესტრშია; ინვენტარი ბერლინის შემდეგ დაემატება.',
    ],
    coords: { lat: 51.4818, lng: 7.2162 },
    faqs: [
      { q: 'მუშაობს თუ არა სტუდენტური ქირა ბოხუმში?', a: 'დიახ — 40-ათასიანი უნივერსიტეტი Querenburg-სა და Ehrenfeld-ში მოთხოვნას მუდმივს ხდის; U35 ხაზთან სიახლოვეა მთავარი.' },
      { q: 'შეუძლია თუ არა უცხოელს ყიდვა ბოხუმში?', a: 'დიახ — მოქალაქეობრივი ბარიერი არ არის; გარიგება ნოტარიუსით იდება Grundbuch-ში.' },
    ],
  },
  tskaltubo: {
    lede: 'წყალტუბო — საბჭოთა სპა-ქალაქი ქუთაისის გვერდით, რადონის წყლებითა და დიდი სანატორიუმებით. უძრავი ქონება აქ იაფია: პანსიონატის ბინები, კერძო სახლები და იშვიათი ახალი კორპუსი.',
    body: [
      'ბაზარი ჯერ კიდევ აღდგენის ფაზაშია. ზოგი სანატორიუმი რესტავრირებულია, ზოგი ცარიელი. კვადრატის ფასი დასავლეთ საქართველოს ერთ-ერთი ყველაზე დაბალია. ქირა მოდის სპა-სტუმრებზე და ქუთაისის აეროპორტის მგზავრებზე — აეროპორტი 15–20 წუთია.',
      'ქუთაისი ახლოსაა, თბილისი — დაახლოებით 3.5–4 საათი. პრომეთეს მღვიმე და სათაფლია რეგიონის ტურისტული წყვილია.',
      'ყიდვისას შეამოწმეთ შენობის კონსტრუქცია (ბევრი სანატორიუმი ათწლეულებია უვლელი) და საკუთრების გაწმენდა. sivrce-ზე წყალტუბოს ობიექტები ქუთაისის ძიებასთან ერთად ჩანს.',
    ],
    coords: { lat: 42.3267, lng: 42.5975 },
    faqs: [
      { q: 'არის თუ არა წყალტუბო იაფი ინვესტიცია?', a: 'შესასვლელი ფასი დაბალია, ლიკვიდურობა ნელი. ეს არ არის ბათუმის სწრაფი ქირა — ყიდულობენ საცხოვრებლად, სპა-ბიზნესისთვის ან გრძელ ჰორიზონტზე.' },
      { q: 'რამდენი ხანია ქუთაისის აეროპორტიდან წყალტუბომდე?', a: 'დაახლოებით 15–20 წუთი ავტომობილით. ეს არის ქალაქის მთავარი ლოჯისტიკური უპირატესობა.' },
    ],
  },
  kazbegi: {
    lede: 'ყაზბეგი (სტეფანწმინდა) — მყინვარწვერის ძირას მდებარე დასახლება გერგეტის სამების ხედით. აქ ყიდულობენ გესთჰაუსს და ხედიან სახლს, არა ქალაქის ბინას.',
    body: [
      'ინვენტარი: ოჯახური სასტუმროები, ახალი კოტეჯები პანორამით და ძველი სახლები ცენტრში. ფასი ხედზეა მიბმული — გერგეტი პრემიუმია. სეზონი: ზაფხულის ჰაიკი და ზამთრის გუდაურის გადმოსვლა. გზა ჯვრის უღელტეხილით ზამთარში იხურება.',
      'თბილისიდან 3–3.5 საათი, გუდაურიდან — 45 წუთი კარგ ამინდში. რუსეთის საზღვარი ახლოსაა; ეს მოძრაობასაც მატებს და რისკსაც.',
      'ყიდვამდე ნახეთ ზამთრის იზოლაცია, წყალი და თუ სახლი ტურისტულ ზონაშია. sivrce-ზე ყაზბეგის განცხადებები გუდაურის კურორტთან ერთად იძებნება.',
    ],
    coords: { lat: 42.6575, lng: 44.6411 },
    faqs: [
      { q: 'რა განსხვავებაა ყაზბეგსა და გუდაურს შორის?', a: 'გუდაური სათხილამურო კურორტია აპარტ-სასტუმროებით; ყაზბეგი სოფელია მთის ხედით და გესთჰაუსებით. გუდაური ზამთარში უფრო ივსება, ყაზბეგი — ზაფხულში.' },
      { q: 'შეიძლება თუ არა სახლის ქირაზე გაშვება ყაზბეგში მთელი წელი?', a: 'ზაფხული და შაბათ-კვირა მუშაობს. ზამთარი დამოკიდებულია უღელტეხილზე. წლიური შევსება გუდაურის აპარტ-სასტუმროზე დაბალია.' },
    ],
  },
  chakvi: {
    lede: 'ჩაქვი — აჭარის სანაპირო დასახლება ქობულეთსა და მწვანე კონცხს შორის, ბათუმიდან დაახლოებით 20 წუთით. ქართული ჩაის სამშობლო დღეს ზღვის მშვიდობიანი კურორტია — ყველაზე ხელმისაწვდომი შესასვლელი ფასით მთელ სანაპიროზე.',
    body: [
      'ბაზარი: ახალი საკურორტო კომპლექსები და სოფლის ძველი სახლები ეზოთი. ახალი ფართი $700–900/მ²-იდან იწყება — ყველაზე დაბალი ზღვისპირა ბაზარი საქართველოში, რადგან მშენებლობა ადრეულ ეტაპზეა და მოთხოვნა ბათუმზე ნაკლები. ჩაბარების ვადები შეამოწმეთ ყოველთვის — ზოგი კორპუსი 2027-ზეა გადაწეული.',
      'ლოკაცია: პლაჟი ფეხით მისადგომია, მწვანე კონცხი და ჩაის პლანტაციები ახლოსაა; ბათუმთან კავშირი მაგისტრალით მუდმივია. ზაფხულში ოჯახების ნაკადია, ზამთარში ქალაქი ცარიელდება — ქირის მოდელი სეზონურია, ბათუმივით წლიური არა.',
      'ყიდვამდე გადაამოწმეთ სამშენებლო ნებართვა და ზღვის დისტანცია კადასტრის მიხედვით — სანაპირო ზოლში წესები იცვლება. sivrce-ზე ჩაქვის განცხადებები ქობულეთის ფილტრთან ერთად ჩანს.',
    ],
    coords: { lat: 41.7185, lng: 41.7351 },
    faqs: [
      { q: 'ღირს თუ არა ჩაქვში ინვესტიცია ბათუმის ნაცვლად?', a: 'ჩაქვში შესვლა ბევრად იაფია ($700/მ²-დან) და ზრდის პოტენციალი აქვს, მაგრამ ქირა მხოლოდ სეზონზე მუშაობს და ინფრასტრუქტურა ჩამოუვარდება ბათუმს. ეს მაღალრისკიანი, მაღალპოტენციურიანი არჩევანია — ბათუმი წლიური ქირის ბაზარია.' },
      { q: 'რა შენდება ჩაქვში ახლა?', a: 'საკურორტო კომპლექსები ზღვასთან ახლოს — მათ შორის 15-სართულიანი აპარტ-კომპლექსი 2027 Q2-ზე. განცხადებებს შორის არის როგორც მწვანე კარკასი, ისე turnkey ფართები.' },
    ],
  },
  shekvetili: {
    lede: 'შეკვეთილი — გურიის ზღვისპირა კურორტი ურეკსა და ქობულეთს შორის: ფიჭვის ტყე პირდაპირ პლაჟამდე და მაგნიტური ქვიშა. დიდი სასტუმროს ანქორითა და ეტაპობრივი კომპლექსებით ეს ყველაზე სწრაფად მზარდი საოჯახო ბაზარია სანაპიროზე.',
    body: [
      'ბაზარი: ეტაპობრივად მშენებარე საკურორტო კომპლექსები დომინირებს — $1 500–1 800/მ² ახალ ფართზე, პირადი პლაჟისა და ფიჭვის ზოლის პირობით. გაყიდვები ეტაპებად მიდის, ამიტომ ფასი ერთსა და იმავე კომპლექსშიც კი იცვლება — შეადარეთ ეტაპები sivrce-ს AI ფასის შეფასებით.',
      'ლოკაცია: ბათუმის აეროპორტამდე დაახლოებით 25 წუთი, ქუთაისისამდე — 45; მაგისტრალი სოფლის გვერდით გადის. ურეკი და ქობულეთი მეზობლადაა, ამიტომ ინფრასტრუქტურა (მაღაზიები, კლინიკა) ორი ქალაქიდან იმსახურებს.',
      'სეზონი: ივნისი–სექტემბერი ოჯახებით არის სავსე, ზამთარში შენობები ცარიელდება. ქირის შემოსავალი ზაფხულზეა მიბმული — წლიური დაქირავება მხოლოდ მუდმივ მაცხოვრებლებზე მუშაობს.',
    ],
    coords: { lat: 41.9345, lng: 41.7674 },
    faqs: [
      { q: 'რა განსხვავებაა შეკვეთილსა და ურეკს შორის?', a: 'ორივი მაგნიტური ქვიშის ზოლია გურიაში. ურეკი უფრო ჩამოყალიბებული და ცოცხალია მთელი წლის, შეკვეთილში კი ახალი კომპლექსები და დიდი სასტუმროა — ახალი ფართის არჩევანი იქ უფრო დიდია.' },
      { q: 'მუშაობს თუ არა შეკვეთილის ბინა ზამთარში ქირაზე?', a: 'ძირითადად არა — მოთხოვნა ზაფხულშია. ზამთრის შემვსებელია ხანგრძლივი დაქირავება ადგილობრივებზე ან მაგისტრალთან მომუშავეებზე; ამას გათვალისწინებული უნდა იყოს შემოსავლის კალკულაციაში.' },
    ],
  },
  bakhmaro: {
    lede: 'ბახმარო — გურიის მთის კლიმატური კურორტი დაახლოებით 2 000 მეტრზე, საქართველოს უმაღლესი მთის საკურორტო დასახლება. ხის სახლები, ნაძვის ტყე და ალპური ჰაერი — ახლა პირველი დიდი აპარტ-სასტუმროც შენდება.',
    body: [
      'ბაზარი: ტრადიციულად ოჯახური ხის სახლები და ნაკვეთები. პირველი მასშტაბური პროექტი — 350-ერთეულიანი აპარტ-სასტუმრო სპა-პულით, $1 500/მ²-იდან, ჩაბარება 2026 Q4 — ბაზარს მთელი წლის ფორმატს უმატებს. მცირე ინვენტარი ნიშნავს ფასები მყარია და არჩევანი შეზღუდული.',
      'ლოკაცია: ჩოხატაურიდან დაახლოებით 50–60 კმ მთის გზით (1.5–2 საათი); ზამთარში გზა თოვლს ექვემდებარება. ზაფხულის სეზონი ივნისიდან სექტემბრამდეა — ჰაერისა და სიმშვიდის მაძიებლებით, ბავშვების დასასვენებელი ბანაკებით.',
      'ყიდვამდე შეამოწმეთ ზამთრის ხელმისაწვდომობა, წყალი და გათბობა — მთის სახლში ეს ღირებულების მთავარი ფაქტორია. sivrce-ზე ბახმარო ცალკე ქალაქად ჩანს გურიის ფილტრში.',
    ],
    coords: { lat: 41.8513, lng: 42.3245 },
    faqs: [
      { q: 'რით განსხვავდება ბახმარო ბაკურიანისგან ინვესტიციაში?', a: 'ბაკურიანი ორსეზონიანია სათხილამურო ტრასებითა და ჩამოყალიბებული ინფრასტრუქტურით; ბახმარო უფრო მაღალი და სეზონურია — ჰაერი, სიმშვიდი და ზაფხულის ქირა. შემოსავალი ბახმაროში მოკლე, მაგრამ შესვლა ჯერ იაფია.' },
      { q: 'შეიძლება თუ არა ბახმაროში ზამთარში ცხოვრება?', a: 'შესაძლებელია მომზადებულ სახლში, მაგრამ ეს იშვიათია: გზა ქარბუქზე იხურება და სერვისები ზაფხულის სეზონზეა მორგებული. აპარტ-სასტუმროები წელიწადში პირველად გთავაზობენ მთელი წლის ფორმატს.' },
    ],
  },
  goderdzi: {
    lede: 'გოდერძი — აჭარის ახალგაზრდა სათხილამურო კურორტი გოდერძის უღელტეხილზე, დაახლოებით 2 000 მეტრზე, ქობულეთი–ხულოს გზაზე. თოვლის ხანგრძლივი სეზონი, ფრირაიდის ტერენი და ჯერ კიდევ ჩამოუყალიბებელი ბაზარი.',
    body: [
      'ბაზარი: გესთჰაუსები, სასტუმროების პირველი თაობა და მიწის ნაკვეთები — აპარტ-კორპუსები ჯერ არ არის. ფასები გუდაურსა და ბაკურიანზე მნიშვნელოვნად დაბალია, რადგან კურორტი განვითარების ადრეულ ეტაპზეა; ზრდა გზისა და ლიფტების გაფართოებას მიჰყვება.',
      'ლოკაცია: ბათუმიდან ხულოს გავლით დაახლოებით 2.5–3 საათი; ზამთარში უღელტეხილი თოვლქვეშ ან გახსნილია ტექნიკით. ზაფხულში ახლოსაა მთის ტბები და ისტორიული ციხე-სიმაგრეები — ორსეზონიანი ტურიზმის პოტენციალი.',
      'ყიდვამდე გადაამოწმეთ მიწის კატეგორია და საკადასტრო აღრიცხვა — მთის სოფლებში ხშირია სასოფლო მიწა საცხოვრებელი დანიშნულების გარეშე. sivrce-ზე გოდერძი აჭარის მთის ფილტრში ჩანს.',
    ],
    coords: { lat: 41.6382, lng: 42.4912 },
    faqs: [
      { q: 'როდის არის სათხილამურო სეზონი გოდერძში?', a: 'ტრასები ძირითადად დეკემბრიდან აპრილამდე მუშაობს — თოვლი უღელტეხილზე გვიან დეკემბრამდე დგას. ზაფხულში კურორტი ჰაიკისა და მთის ტურების ბაზაა; სეზონებს შორის ნაკადი მცირეა.' },
      { q: 'ღირს თუ არა გოდერძში გესთჰაუსის ყიდვა?', a: 'შესვლის ფასი დაბალია და კურორტი იზრდება, მაგრამ შემოსავალი ჯერ სეზონური და არასტაბილურია — ეს გრძელვადიანი ფსონია ინფრასტრუქტურის განვითარებაზე, არა სწრაფი ქირის ბაზარი.' },
    ],
  },
  akhaltsikhe: {
    lede: 'ახალციხე — სამცხე-ჯავახეთის ადმინისტრაციული ცენტრი მდინარე ფოცხოვისწყალზე, აღდგენილი რაბათის ციხე-კომპლექსით. მრავალსაუკუნოვანი მრავალეროვანი ისტორია დღესაც ჩანს: სინაგოგა, მეჩეთი და სომხურ-კათოლიკური ტაძრები ერთმანეთის რამდენიმე ნაბიჯშია.',
    body: [
      'ბაზარი: საბჭოთა პერიოდის ბინები, კერძო ეზო-სახლები და ფერდობზე მიწის ნაკვეთები. ფასები რეგიონულ ცენტრებს შორის ერთ-ერთი ყველაზე ხელმისაწვდომია; მოთხოვნას ადგილობრივი საჯარო სექტორი, ჯავახეთიდან და ბორჯომის მიმართულებიდან ჩამოსულები და რაბათის ტურიზმზე მომუშავეები ქმნიან. ახალი მშენებლობა მცირეა — ძირითადად ინდივიდუალური სახლები.',
      'ლოკაცია: თბილისიდან ხაშური–ბორჯომის გზით დაახლოებით 2–2.5 საათი; ადიგენის გავლით გოდერძის უღელტეხილი ბათუმისკენ ზამთარში შეზღუდულად მუშაობს. ვარძია, საფარა და ბორჯომ-ხარაგაულის პარკი ახლო ექსკურსიებია.',
      'ყიდვამდე შეამოწმეთ გათბობა და სახურავის მდგომარეობა — ზამთარი ცივია და ძველი ფონდი ხშირად რეაბილიტაციას საჭიროებს. sivrce-ზე ახალციხე სამცხე-ჯავახეთის ფილტრში ჩანს.',
    ],
    coords: { lat: 41.6369, lng: 42.9825 },
    faqs: [
      { q: 'ღირს თუ არა ახალციხეში ბინის ყიდვა?', a: 'შესვლა ძალიან იაფია და რეგიონული ცენტრის სტატუსი სტაბილურ ადგილობრივ მოთხოვნას იძლევა, მაგრამ ქირის ბაზარი პატარაა და ზრდა ნელი — ეს საცხოვრებლის ან გრძელვადიანი არჩევანია, არა სწრაფი ინვესტიცია.' },
      { q: 'როგორ მივიდე ახალციხეში თბილისიდან?', a: 'ხაშური–ბორჯომის მაგისტრალით დაახლოებით 2–2.5 საათი. ბათუმისკენ გოდერძის უღელტეხილი ზამთარში ხშირად იკეტება — გზის სეზონურობა გაითვალისწინეთ.' },
    ],
  },
  ozurgeti: {
    lede: 'ოზურგეთი — გურიის ცენტრი ჩაის პლანტაციებსა და ხეობებს შორის: ქალაქიდან 15–20 წუთში ურეკის ქვიშა და შეკვეთილის ფიჭვნარია, მთისკენ კი ბახმარო.',
    body: [
      'ბაზარი: კერძო სახლები ეზოთი, მცირე ახალი კორპუსები და იაფი მიწის ნაკვეთები. ფასები თბილისსა და ბათუმზე მნიშვნელოვნად დაბალია; მოთხოვნას ადგილობრივებთან ერთად ზღვაზე მომუშავეები და სეზონური დამქირავებლები ქმნიან.',
      'ლოკაცია: ქუთაისიდან დაახლოებით 1.5 საათი, ბათუმისკენ მაგისტრალი სამტრედია–ფოთის დერეფნით მიდის. გურია კომპაქტურია — ზღვა, მთა და ჩაის ხეობები ერთი დღით მოივლის.',
      'გურიის სოფლებში მიწა ხშირად მემკვიდრეობითია — ყიდვამდე გადაამოწმეთ საკადასტრო აღრიცხვა და მემკვიდრეთა თანხმობა. sivrce-ზე ოზურგეთი გურიის ფილტრში ჩანს.',
    ],
    coords: { lat: 41.9247, lng: 42.0064 },
    faqs: [
      { q: 'უფრო მომგებიანია ოზურგეთში სახლის ყიდვა თუ ზღვისპირა ბინის?', a: 'ქალაქში ცხოვრების ხარჯი და ფასი მცირეა და მიწა იაფია; ზღვისპირა ბინა (ურეკი/შეკვეთილი) კი სეზონურ ქირაზე მუშაობს. საცხოვრებლად ოზურგეთი, ქირის შემოსავლისთვის ზღვა.' },
      { q: 'რამდენია ოზურგეთიდან ზღვამდე?', a: 'ურეკამდე და შეკვეთილამდე დაახლოებით 15–20 წუთია მანქანით; გრიგოლეთი ჩრდილოეთით მეზობლადაა.' },
    ],
  },
  ambrolauri: {
    lede: 'ამბროლაური — რაჭა-ლეჩხუმის დედაქალაქი რიონისა და წხენისწყლის შესართავთან: ხვანჭკარას ღვინის სამშობლო, საცავებითა და კავკასიონის პანორამით.',
    body: [
      'ბაზარი: ხისა და ქვის სახლები, ვენახებიანი ნაკვეთები და იაფი მიწა — შესვლის ერთ-ერთი ყველაზე დაბალი ფასი რეგიონულ ცენტრებს შორის. მოთხოვნას ღვინის ტურიზმი ზრდის: ხვანჭკარა, ტვიში და ალპანა ახლოსაა.',
      'ლოკაცია: ქუთაისიდან ნაკერალას უღელტეხილით დაახლოებით 1.5–2 საათი; მცირე აეროპორტს თბილისთან პერიოდული ფრენები აქვს. ზამთარში უღელტეხილები ზოგჯერ იკეტება.',
      'ყიდვამდე გადაამოწმეთ მიწის კატეგორია (სასოფლო/საცხოვრებელი) და სარწყავი წყალი — ვენახის ნაკვეთზე ეს ფასის მთავარი ფაქტორია. sivrce-ზე ამბროლაური რაჭა-ლეჩხუმის ფილტრში ჩანს.',
    ],
    coords: { lat: 42.3819, lng: 43.0483 },
    faqs: [
      { q: 'ღირს თუ არა ვენახიანი ნაკვეთის ყიდვა რაჭაში?', a: 'შესვლა იაფია და ხვანჭკარას სახელი ღვინის ტურიზმს იზიდავს, მაგრამ შემოსავალი სეზონურია და გზის სეზონურობა შეზღუდვაა — გრძელვადიანი, დაბალბიუჯეტიანი ფსონი.' },
      { q: 'მუშაობს თუ არა ამბროლაურის აეროპორტი?', a: 'მცირე ასაფრენი ზოლია თბილისთან პერიოდული ფრენებით — განრიგი იცვლება, ყიდვამდე შეამოწმეთ მიმდინარე სტატუსი.' },
    ],
  },
  marneuli: {
    lede: 'მარნეული — ქვემო ქართლის უდიდესი ქალაქი რუსთავის შემდეგ, თბილისიდან 20 კმ-ში: სამხრეთ კავკასიის ერთ-ერთი უდიდესი სასოფლო-სამეურნეო ბაზრისა და მრავალეროვანი კულტურის კერა.',
    body: [
      'ბაზარი: კვადრატული მეტრი ერთ-ერთი ყველაზე იაფია დედაქალაქის აგლომერაციაში — ეზო-სახლები, მცირე ახალი კორპუსები და საბაღე ნაკვეთები. მოთხოვნას ბაზრის ეკონომიკა და თბილისში მომუშავე ჩამსვლელები ქმნიან.',
      'ლოკაცია: თბილისამდე 30–40 წუთი; რკინიგზა და თრიალეთის გზა ქალაქზე გადის. ბოლნისი, დმანისი და გარდაბანი მეზობელი ცენტრებია.',
      'სოფლის მიწა ხშირად საკუთრების რეგისტრაციის გარეშეა — ყიდვამდე აუცილებლად გადაამოწმეთ საკადასტრო აღრიცხვა და საზღვრები. sivrce-ზე მარნეული ქვემო ქართლის ფილტრში ჩანს.',
    ],
    coords: { lat: 41.4753, lng: 44.845 },
    faqs: [
      { q: 'რამდენად იაფია ბინა მარნეულში თბილისთან შედარებით?', a: 'რამდენჯერმე იაფია, განსაკუთრებით ეზო-სახლებსა და მიწაზე; ზუსტი დიაპაზონი უბნის მიხედვით იცვლება — sivrce-ს AI ფასის შეფასება თითოეულ განცხადებას ადარებს.' },
      { q: 'ღირს თუ არა მარნეულში ინვესტიცია?', a: 'სწრაფი ზრდა არ არის, მაგრამ აგლომერაციის გაფართოებასთან ერთად ხანგრძლივი პოტენციალი აქვს. ქირის ბაზარი მცირეა — მიწა/სახლი ბინაზე უმჯობესი არჩევანია.' },
    ],
  },
  zestafoni: {
    lede: 'ზესტაფონი — იმერეთის მეორე ქალაქი ქუთაისიდან 30 კმ-ში: მთავარი რკინიგზისა და მაგისტრალის კვანძი და შავი მეტალურგიის დიდი ქარხნის ცენტრი.',
    body: [
      'ბაზარი: საბჭოთა ბინები და ეზო-სახლები ჭარბობს, ახალი მშენებლობა მცირეა. ფასები ხელმისაწვდომია; ქირის სტაბილურ მოთხოვნას ქარხნის თანამშრომლები და ტრანზიტი ქმნის.',
      'ლოკაცია: თბილისი–ბათუმის რკინიგზა და ავტომაგისტრალი პირდაპირ გადის — ქუთაისამდე 30–40 წუთი, თბილისამდე დაახლოებით 2.5 საათი. ჭიათურა და საჩხერე ახლოსაა.',
      'ბინის არჩევისას ყურადღება მიაქციეთ ქარხნიდან დისტანციასა და უბნის მდგომარეობას — ეს ქირის ღირებულებასა და გადაყიდბაზე მოქმედებს. sivrce-ზე ზესტაფონი იმერეთის ფილტრში ჩანს.',
    ],
    coords: { lat: 42.0992, lng: 43.0503 },
    faqs: [
      { q: 'ღირს თუ არა ზესტაფონში ბინის ქირაზე გაშვება?', a: 'ქარხნისა და ტრანზიტის მოთხოვნა სტაბილურია, მაგრამ ქირის განაკვეთი დაბალი — სტაბილური, დაბალშემოსავლიანი ბაზარია.' },
      { q: 'როგორ მივიდე ზესტაფონში თბილისიდან?', a: 'მატარებლით ან ავტომაგისტრალით დასავლეთის მიმართულებით, დაახლოებით 2.5 საათში.' },
    ],
  },
  khashuri: {
    lede: 'ხაშური — აღმოსავლეთ-დასავლეთის მთავარი რკინიგზისა და ავტომაგისტრალის კვანძი და ბორჯომის ხეობის კარიბჭე; სურამის უღელტეხილი პირდაპირ ქალაქის თავზეა.',
    body: [
      'ბაზარი: საბჭოთა ბინები, ეზო-სახლები და სურამის მხარეს აგარაკები. ფასები დაბალია; მოთხოვნას ტრანზიტი, ბორჯომისკენ მომუშავეები და დედაქალაქთან სიახლოვე ქმნის.',
      'ლოკაცია: თბილისიდან 1.5–2 საათი მატარებლით ან ავტომობილით; ბორჯომამდე 20–25 წუთი. ბაკურიანისკენ გზა ასევე აქედან გადის — რიკოთის უღელტეხილით.',
      'ყიდვამდე შეამოწმეთ გათბობა და კორპუსის მდგომარეობა — ზამთარი ცივია და ძველი ფონდი ენერგოეფექტურობას ხშირად საჭიროებს. sivrce-ზე ხაშური შიდა ქართლის ფილტრში ჩანს.',
    ],
    coords: { lat: 41.9972, lng: 43.5811 },
    faqs: [
      { q: 'რატომ ირჩევენ ხაშურს ბორჯომის ნაცვლად?', a: 'ფასი მკვეთრად დაბალია, ხოლო ბორჯომამდე 20–25 წუთია — ვინც ხეობაში მუშაობს ან რეგულარულად მოგზაურობს, ხაშურში უფრო იაფად შედის.' },
      { q: 'მუშაობს თუ არა ხაშურში აგარაკი ზამთარში?', a: 'სურამის მხარეს მრავალი აგარაკი წლიური საცხოვრებლისთვისაა მორგებული, მაგრამ გათბობისა და წყლის გარეშე ზამთარი რთულია — ყიდვამდე შეამოწმეთ.' },
    ],
  },
  gurjaani: {
    lede: 'გურჯაანი — კახეთის ღვინის ქალაქი ალაზნის ველზე: ვაჟა-ფშაველას სახლ-მუზეუმი, ორგუმბათიანი ყველაწმინდა და ვენახები ქალაქის გარშემო.',
    body: [
      'ბაზარი: ეზო-სახლები, ვენახებიანი ნაკვეთები და სასტუმროებად გადაკეთებული სახლები. ფასები ხელმისაწვდომია; ღვინის ტურიზმი სეზონურ ქირას ამარაგებს.',
      'ლოკაცია: თბილისიდან 1.5–2 საათი; თელავამდე 30 წუთი, სიღნაღამდე 20. ალაზნის ველის მთავარი დასახლებები ერთ გზაზეა.',
      'ყიდვამდე გადაამოწმეთ ვენახის ჯიში და სარწყავი უფლება — ალაზნის ველზე ეს ნაკვეთის ღირებულების მთავარი ფაქტორია. sivrce-ზე გურჯაანი კახეთის ფილტრში ჩანს.',
    ],
    coords: { lat: 41.8472, lng: 45.8061 },
    faqs: [
      { q: 'ღირს თუ არა სასტუმროს ყიდვა გურჯაანში?', a: 'ღვინის ტურიზმი იზრდება და შესვლა იაფია, მაგრამ შემოსავალი სეზონურია — რთველის შემოდგომა პიკია. მასპინძლობის კომპეტენციით მუშაობს.' },
      { q: 'რა განსხვავებაა გურჯაანსა და სიღნაღს შორის?', a: 'სიღნაღი ტურისტული ცენტრია მაღალი ფასებით; გურჯაანი უფრო საცხოვრებელი და სამეურნეო ქალაქია იაფი მიწით — სასტუმროსთვის სიღნაღი, ბინადრობისთვის გურჯაანი.' },
    ],
  },
  kvareli: {
    lede: 'ყვარელი — კავკასიონის ძირში მდებარე ღვინის ქალაქი: კინძმარაულის სამშობლო, ილიას ტბის კურორტი და ღვინის ქარანები.',
    body: [
      'ბაზარი: სასტუმრო-სახლები, ვენახები, აგარაკები და ტბის მიმდებარე ნაკვეთები. ფასები თბილისზე ბევრად დაბალია; ტურიზმი იზრდება — ქარანი, ილიას ტბა და გრემი მთავარი მაგნიტებია.',
      'ლოკაცია: თბილისიდან დაახლოებით 2 საათი; თელავამდე 40 წუთი, ლაგოდეხის ნაკრძალამდე 30. ალაზნის ველის ჩრდილოეთი კიდეა.',
      'ყიდვამდე გადაამოწმეთ წყალი და სარწყავი უფლება ნაკვეთზე — ღვინის ბიზნესისთვის ეს გადამწყვეტია. sivrce-ზე ყვარელი კახეთის ფილტრში ჩანს.',
    ],
    coords: { lat: 41.9489, lng: 45.8206 },
    faqs: [
      { q: 'ღირს თუ არა ყვარელში გესთჰაუსის ყიდვა?', a: 'დიახ, თუ სეზონურ რიტმს ესმით: შემოდგომა რთველზე პიკია, ზაფხული — ტბაზე. შესვლის ფასი დაბალია, ამორტიზაცია რეალისტურად შეაფასეთ.' },
      { q: 'რა არის ილიას ტბა?', a: 'ყვარელის მახლობლად მთის ტბის კურორტი საცურაო ზონითა და განთავსებით — ზაფხულში რეგიონის მთავარი საგასტროლო წერტილი.' },
    ],
  },
  dusheti: {
    lede: 'დუშეთი — მცხეთა-მთიანეთის მთიანი ცენტრი არაგვის ხეობის კართან: ჟინვალის წყალსაცავი, ანანური და ფშავ-ხევსურეთისკენ მიმავალი გზის სათავე.',
    body: [
      'ბაზარი: აგარაკები, ეზო-სახლები და წყალსაცავის მიმდებარე ნაკვეთები. დედაქალაქელთა შაბათ-კვირის მოთხოვნა ძლიერია, ფასები ჯერ დაბალია — ანანური–ბარისახოს ღერძზე ზრდა ჩანს.',
      'ლოკაცია: თბილისიდან 1–1.5 საათი ჟინვალის გზით; სამხედრო გზა გუდაურამდე და ყაზბეგამდე იქიდან გრძელდება. ზამთარში მთის განშტოებები შეზღუდულია.',
      'ყიდვამდე გადაამოწმეთ ნაკვეთის კატეგორია და საკადასტრო საზღვარი — წყალსაცავის ზოლში შეზღუდვებია. sivrce-ზე დუშეთი მცხეთა-მთიანეთის ფილტრში ჩანს.',
    ],
    coords: { lat: 42.0897, lng: 44.7197 },
    faqs: [
      { q: 'ღირს თუ არა აგარაკის ყიდვა ჟინვალთან?', a: 'დედაქალაქამდე სიახლოვე და ტბის ხედები ღირებულებაა; შეამოწმეთ ზონირება და ზამთრის წვდომა. შაბათ-კვირის ქირაზეც მუშაობს.' },
      { q: 'როგორ მივიდე დუშეთში?', a: 'თბილისიდან ჟინვალის წყალსაცავის გზით 1–1.5 საათში; ანანურის ციხე გზაზევეა.' },
    ],
  },
  abastumani: {
    lede: 'აბასთუმანი — ზღვის დონიდან დაახლოებით 1 250 მეტრზე მდებარე მთის კლიმატური კურორტი ოცხის ხეობაში: ფიჭვის ჰაერი, ისტორიული სანატორიუმები და საქართველოს ასტრონომიული ობსერვატორია.',
    body: [
      'ბაზარი: ისტორიული ხის სანატორიუმები, სახლები და ნაკვეთები — შესვლა იაფია, მაგრამ ბევრი შენობა რეაბილიტაციას ესაჭიროება. ასტროტურიზმი და კლიმატური დასვენება ახალ მოთხოვნას ქმნის.',
      'ლოკაცია: ახალციხემდე დაახლოებით 30–40 წუთი, ბორჯომამდე დაახლოებით 1 საათი; ზეკარის უღელტეხილი ადიგენისკენ ზამთარში იკეტება. ზაფხულში ჰაერის მაძიებლებით სავსეა.',
      'ყიდვამდე შეამოწმეთ სახურავი, ნიადაგი და ზამთრის წვდომა — მთის ისტორიულ შენობაში ეს ღირებულების მთავარი ფაქტორებია. sivrce-ზე აბასთუმანი სამცხე-ჯავახეთის ფილტრში ჩანს.',
    ],
    coords: { lat: 41.7514, lng: 42.8083 },
    faqs: [
      { q: 'რატომ არის ცნობილი აბასთუმანი?', a: 'კლიმატური კურორტობით — ფიჭვის ჰაერი და ისტორიული სანატორიუმები — და ასტრონომიული ობსერვატორიით: ღამის ცის ტურები სეზონის მთავარი ატრაქციონია.' },
      { q: 'ღირს თუ არა ისტორიული სანატორიუმის ყიდვა?', a: 'დიდი პოტენციალი დიდი რემონტის ფასად — კონსტრუქცია და ბიუჯეტი წინასწარ შეაფასეთ; წარმატებული რეაბილიტაცია ბაზარზე იშვიათია და გამოირჩევა.' },
    ],
  },
  surami: {
    lede: 'სურამი — ლიხის ქედის კარიბჭესთან მდებარე კლიმატური კურორტი: ფიჭვის ტყე, სურამის ციხე და ბორჯომ-ხარაგაულის პარკის მიმდებარე ბორცვები.',
    body: [
      'ბაზარი: აგარაკები და ეზო-სახლები ფიჭვნარში — დედაქალაქიდან კვირა-დღის დასვენების ერთ-ერთი ყველაზე ხელმისაწვდომი ვარიანტი. ფასები დაბალი და შედარებით სტაბილურია.',
      'ლოკაცია: ხაშურიდან რამდენიმე კილომეტრი; მაგისტრალი და რკინიგზა ახლოსაა, თბილისამდე 1.5 საათი. ბორჯომის ხეობასთან სიახლოვე დასვენების რეჟიმს ავსებს.',
      'ყიდვამდე შეამოწმეთ წყალი და გათბობა აგარაკზე — ზამთრის გამოსაყენებლად ეს გადამწყვეტია. sivrce-ზე სურამი შიდა ქართლის ფილტრში ჩანს.',
    ],
    coords: { lat: 41.9953, lng: 43.5311 },
    faqs: [
      { q: 'რატომ არის პოპულარული სურამის აგარაკები?', a: 'ფიჭვის ტყის კლიმატი, დედაქალაქამდე 1.5 საათი და დაბალი ფასი — კვირა-დღის დასვენების კლასიკური კომბინაცია.' },
      { q: 'შეიძლება თუ არა სურამში მუდმივი ცხოვრება?', a: 'დიახ — ქალაქის ინფრასტრუქტურაა და ხაშური რამდენიმე კილომეტრში; ზამთრისთვის სახლი გათბობას მოითხოვს.' },
    ],
  },
  ureki: {
    lede: 'ურეკი — გურიის შავიზღვისპირა კურორტი მაგნიტური ქვიშით და ფიჭვის ზოლით, შეკვეთილსა და გრიგოლეთს შორის: ოჯახური, მშვიდი და სწრაფად მზარდი სანაპირო.',
    body: [
      'ბაზარი: სასტუმრო-სახლები, პატარა სასტუმროები და პირველი აპარტ-კომპლექსები. ფასები ჯერ ქობულეთსა და ბათუმზე დაბალია, მაგრამ ზრდა სწრაფია — ადრეული შესვლა უკეთეს ფასს იძლევა.',
      'ლოკაცია: ბათუმის აეროპორტამდე დაახლოებით 25–30 წუთი, ფოთამდე 20; მაგისტრალი სოფლის გვერდით გადის. ზაფხულში ოჯახების ნაკადია, ზამთარში მშვიდდება — სეზონური მოდელი.',
      'ყიდვამდე გადაამოწმეთ ზღვამდე რეალური დისტანცია კადასტრის მიხედვით — ქვიშის „მაგნიტურობა“ მარკეტინგიცაა, მაგრამ მოთხოვნა რეალურია და ფასებს ამარაგებს. sivrce-ზე ურეკი გურიის ფილტრში ჩანს.',
    ],
    coords: { lat: 41.9772, lng: 41.7528 },
    faqs: [
      { q: 'მართლა მაგნიტურია ურეკის ქვიშა?', a: 'ქვიშა მაგნეტიტის მცირე შემცველობით გამოირჩევა და სანატორიუმის ტრადიცია აქვს; სამედიცინო ეფექტი დისკუსიურია, მაგრამ ტურისტული მოთხოვნა და ფასები ამას ამართლებს.' },
      { q: 'ურეკი თუ შეკვეთილი — სად შევიდე?', a: 'ორივე ერთი ქვიშიანი ზოლია; ურეკი უფრო ცოცხალი და ჩამოყალიბებულია, შეკვეთილში ახალი დიდი კომპლექსებია. ადრეული ფასი ურეკშიც იძებნება.' },
    ],
  },
  gonio: {
    lede: 'გონიო — ბათუმიდან 15 წუთით სამხრეთით მდებარე სანაპირო დასახლება აფსაროსის რომაული ციხის გარშემო: ბათუმის ყველაზე სწრაფად მზარდი საცხოვრებელი სანაპირო ხელვაჩაურის მუნიციპალიტეტში.',
    body: [
      'ბაზარი: ახალი საკურორტო-საცხოვრებელი კომპლექსები და ვილები; ფასები ბათუმის ახალ ბულვართან შედარებით კონკურენტუნარიანია — სიმშვიდითა და უფრო ფართო პლაჟით. მოთხოვნას ბათუმის გადმონასხმა და უცხოელი მყიდველები ამარაგებს.',
      'ლოკაცია: ბათუმის ცენტრამდე 15–20 წუთი, აეროპორტამდე დაახლოებით 10–15; სარფის საზღვრამდე რამდენიმე კილომეტრი. სეზონი ბათუმზე წელიწადის დიდ ნაწილს მოიცავს.',
      'ყიდვამდე გადაამოწმეთ სამშენებლო ნებართვა და ზღვამდე დისტანცია — სანაპირო ზოლის წესები იცვლება და კომპლექსების ჩაბარების ვადები განსხვავებულია. sivrce-ზე გონიო ცალკე ქალაქად ჩანს აჭარის ფილტრში.',
    ],
    coords: { lat: 41.5986, lng: 41.6402 },
    faqs: [
      { q: 'გონიო თუ ბათუმი — სად ვიყიდო?', a: 'ბათუმი წლიური ქირისა და ინფრასტრუქტურის ბაზარია; გონიო — სიმშვიდის, პლაჟისა და ზრდის ბაზარი: სეზონური ქირა და კაპიტალის ზრდა უფრო სწრაფია, რისკი კი სეზონთან კონცენტრაციას მოჰყვება.' },
      { q: 'რა შენდება გონიოში?', a: 'ძირითადად საშუალო სართულიანი საკურორტო კომპლექსები აუზებითა და ვილის რიგებით — განცხადებებში როგორც მწვანე კარკასი, ისე turnkey ვარიანტებია.' },
    ],
  },
  kvariati: {
    lede: 'კვარიათი — გონიოს მიღმა მდებარე ყურე ბათუმიდან 20 წუთით: გამჭვირვალე წყალი, დაივინგი და მწვანე ფერდობზე აღმართული ბუტიკური სასტუმროები.',
    body: [
      'ბაზარი: ბუტიკური სასტუმროები, აპარტამენტები და ფერდობზე აშენებული ვილები — მიწა მწირია, ამიტომ მეტრზე ფასი ხშირად გონიოს ცენტრზე მაღალია. შესვლა პრემიუმის მიმართულებითაა.',
      'ლოკაცია: სარფის საზღვრამდე 5 წუთი, ბათუმამდე 20–25; აეროპორტი ახლოსაა. ზაფხულში დაივინგის ბაზაა, სეზონს გარეთ მშვიდია.',
      'ფერდობზე ყიდვამდე გადაამოწმეთ შესასვლელი გზა, საყრდენი კედლები და წყალი — მთიან რელიეფზე ეს ღირებულების გადამწყვეტი ფაქტორებია. sivrce-ზე კვარიათი აჭარის ფილტრში ჩანს.',
    ],
    coords: { lat: 41.5836, lng: 41.6317 },
    faqs: [
      { q: 'რატომ არის კვარიათი გონიოზე ძვირადღირებული?', a: 'მიწა მწირია და ყურე დაცულია — ხედი, წყალი და სიმშვიდე პრემიას იმსახურებს; ქირის ბიზნესისთვის ხშირად გონიო უფრო მოქნილია.' },
      { q: 'მუშაობს თუ არა კვარიათში ქირა ზამთარში?', a: 'ძირითადად არა — მოთხოვნა ზაფხულ-შემოდგომაზეა; წლიურ შემვსებლად ბათუმთან ან საზღვრის მიმართულებით მომუშავეები გამოდიან.' },
    ],
  },
  tsikhisdziri: {
    lede: 'ციხისძირი — ქობულეთის ჩრდილოეთ კიდე ბათუმიდან 20 წუთით: პეტრის ბიზანტიური ციხე, კლდოვანი ყურეები და მწვანე ბორცვები — სანაპიროს ყველაზე მშვიდი ნაწილი.',
    body: [
      'ბაზარი: პატარა სასტუმროები, საოჯახო კოტეჯები და ცალკეული ახალი კომპლექსები; ფასები ქობულეთის ცენტრზე დაბალია, აუდიტორია კი სიმშვიდეს ეძებს.',
      'ლოკაცია: ქობულეთამდე 10 წუთი, ბათუმამდე 20–25; ჩაქვი და მწვანე კონცხი მეზობლადაა. მაგისტრალი სოფლის ზემოთ გადის — პლაჟი მშვიდი რჩება.',
      'ყიდვამდე გადაამოწმეთ ზღვამდე დისტანცია და კლდოვან ზოლზე პლაჟამდე წვდომა — რელიეფი განსხვავებულია და ფასები სწორედ ამაზეა დამოკიდებული. sivrce-ზე ციხისძირი აჭარის ფილტრში ჩანს.',
    ],
    coords: { lat: 41.78, lng: 41.7353 },
    faqs: [
      { q: 'ციხისძირი თუ ქობულეთი?', a: 'ქობულეთი ცოცხალი, გრძელი ქვიშიანი ბულვარია მეტი ქირით; ციხისძირი — მშვიდი, კლდოვანი და იაფი. ოჯახს ციხისძირი, ქირის ბიზნესს ქობულეთი.' },
      { q: 'რა არის პეტრის ციხე?', a: 'VI საუკუნის ბიზანტიური ციხე-ქალაქი კლდოვან კონცხზე — მუზეუმ-ნაკრძალი ერთ-ერთი საუკეთესო ხედებით სანაპიროზე.' },
    ],
  },
  anaklia: {
    lede: 'ანაკლია — ზუგდიდიდან 30 კმ-ში ენგურის შესართავთან მდებარე ზღვისპირა დასახლება: ღრმაწყლოვანი პორტის მრავალწლიანი პროექტის კერა და ქვიშიანი პლაჟი განმუხურთან ერთად.',
    body: [
      'ბაზარი: მიწაზე ორიენტირებული — ნაკვეთები, პატარა სასტუმრო-სახლები და მოლოდინის სპეკულაცია. ფასები დაბალია, მაგრამ ციკლი პოლიტიკურ-ინფრასტრუქტურულ მოვლენებზეა მიბმული — გრძელი, მაღალრისკიანი ფსონი.',
      'ლოკაცია: ზუგდიდამდე 30–40 წუთი, ფოთამდე დაახლოებით 1 საათი; აფხაზეთის საზღვრის სიახლოვე რეგიონის კონტექსტს განსაზღვრავს. ზაფხულში პლაჟი ცოცხალია, ზამთარში ცარიელდება.',
      'ყიდვამდე აუცილებლად გადაამოწმეთ მიწის კატეგორია და საკადასტრო აღრიცხვა — სანაპირო ზოლში შეზღუდვებია და არარეგისტრირებული ნაკვეთი ვერ გაიყიდება. sivrce-ზე ანაკლია სამეგრელოს ფილტრში ჩანს.',
    ],
    coords: { lat: 42.3947, lng: 41.5644 },
    faqs: [
      { q: 'ღირს თუ არა ანაკლიაში მიწის ყიდვა?', a: 'მხოლოდ გრძელვადიანი, რისკის ტოლერანტული ფსონით: პორტის რეალიზაცია ფასს ამოძრავებს, გადადება კი წლებით აყოვნებს — არასოდეს მთელი ბიუჯეტი ერთ ნაკვეთზე.' },
      { q: 'რა მდგომარეობაშია ანაკლიის პორტი?', a: 'პროექტი რამდენჯერმე გადაიდო და კვლავ აქტუალურია კონცესიის ფორმატში — ყიდვამდე შეამოწმეთ მიმდინარე სტატუსი და გეგმები.' },
    ],
  },
}

/** Build a city-info page definition (no listings; pure prose). */
function cityInfoOf(city: GeoLoc): SeoPageDef | null {
  const prose = CITY_PROSE[city.slug]
  if (!prose) return null
  // Same URL surface as the city hub — this is its no-listings fallback body.
  const paths = derivePaths({ kind: 'city', city })
  return {
    kind: 'city-info',
    path: `/${city.slug}`,
    ...paths,
    city,
    listings: [],
  }
}

/** Public accessor for the prose registry — used by SeoLanding to render. */
export function cityProseOf(slug: string) {
  return CITY_PROSE[slug] ?? null
}

/* ————— Copy ————— */

export interface SeoStats {
  count: number
  avgPerM2: number
  minPrice: number
  maxPrice: number
}

export function statsOf(listings: Listing[]): SeoStats {
  // ponytail: Math.min(...[]) returns Infinity, which would render as "∞" in
  // formatUSD. Empty-listing guards now apply to city-info pages + any future
  // no-inventory combo. The ≥1-listing rule protects the rest of the engine.
  if (listings.length === 0) return { count: 0, avgPerM2: 0, minPrice: 0, maxPrice: 0 }
  const withPerM2 = listings.filter((l) => l.perM2USD > 0)
  const avgPerM2 = withPerM2.length
    ? Math.round(withPerM2.reduce((s, l) => s + l.perM2USD, 0) / withPerM2.length)
    : 0
  return {
    count: listings.length,
    avgPerM2,
    minPrice: Math.min(...listings.map((l) => l.priceUSD)),
    maxPrice: Math.max(...listings.map((l) => l.priceUSD)),
  }
}

/** Full subject for room pages per locale; ruGen feeds "Продажа X" H1s. */
function roomSubject(n: number): { ka: string; en: string; ru: string; ruGen: string } {
  const t = TYPES.apartments!
  if (n === 4)
    return {
      ka: `4+ ოთახიანი ${t.ka}`,
      en: `4+ Room ${t.en}`,
      ru: `Квартиры с 4+ комнатами`,
      ruGen: `квартир с 4+ комнатами`,
    }
  return {
    ka: `${n}-ოთახიანი ${t.ka}`,
    en: `${n}-Room ${t.en}`,
    ru: `${n}-комнатные квартиры`,
    ruGen: `${n}-комнатных квартир`,
  }
}

function subjectOf(def: SeoPageDef, loc: SeoLoc = 'ka'): string {
  if (def.rooms) {
    if (loc === 'de') return `${def.rooms}-Zimmer-Wohnungen`
    return roomSubject(def.rooms)[loc === 'ru' ? 'ru' : loc === 'ka' ? 'ka' : 'en']
  }
  if (def.typeSlug) {
    const t = TYPES[def.typeSlug]!
    return loc === 'ka' ? t.ka : loc === 'de' ? (t.de ?? t.en) : loc === 'en' ? t.en : t.ru
  }
  return loc === 'ka' ? 'უძრავი ქონება' : loc === 'de' ? 'Immobilien' : loc === 'en' ? 'Real Estate' : 'Недвижимость'
}

/** Russian genitive subject for "Продажа/Аренда X в …" H1s. */
function subjectGenOf(def: SeoPageDef): string {
  if (def.rooms) return roomSubject(def.rooms).ruGen
  if (def.typeSlug) return TYPES[def.typeSlug]!.ruGen
  return 'недвижимости'
}

export function countryNameOf(cc: string = 'GE', loc: SeoLoc = 'ka'): string {
  const code = (cc || 'GE').toUpperCase()
  if (code === 'DE') {
    if (loc === 'de') return 'Deutschland'
    if (loc === 'ka') return 'გერმანიაში'
    if (loc === 'ru') return 'Германии'
    if (loc === 'tr') return "Almanya'da"
    if (loc === 'ar') return 'ألمانيا'
    return 'Germany'
  }
  if (code === 'GE') {
    if (loc === 'de') return 'Georgien'
    if (loc === 'ka') return 'საქართველოში'
    if (loc === 'ru') return 'Грузии'
    if (loc === 'tr') return "Gürcistan'da"
    if (loc === 'ar') return 'جورجيا'
    return 'Georgia'
  }
  if (code === 'AE') {
    if (loc === 'de') return 'den VAE'
    if (loc === 'ka') return 'არაბთა გაერთიანებულ საამიროებში'
    if (loc === 'ru') return 'ОАЭ'
    if (loc === 'tr') return "BAE'de"
    if (loc === 'ar') return 'الإمارات'
    return 'the UAE'
  }
  if (code === 'US') {
    if (loc === 'de') return 'den USA'
    if (loc === 'ka') return 'აშშ-ში'
    if (loc === 'ru') return 'США'
    if (loc === 'tr') return "ABD'de"
    if (loc === 'ar') return 'الولايات المتحدة'
    return 'the USA'
  }
  if (code === 'GB') {
    if (loc === 'de') return 'Großbritannien'
    if (loc === 'ka') return 'დიდ ბრიტანეთში'
    if (loc === 'ru') return 'Великобритании'
    return 'the UK'
  }
  if (code === 'FR') {
    if (loc === 'de') return 'Frankreich'
    if (loc === 'ka') return 'საფრანგეთში'
    if (loc === 'ru') return 'Франции'
    return 'France'
  }
  if (code === 'ES') {
    if (loc === 'de') return 'Spanien'
    if (loc === 'ka') return 'ესპანეთში'
    if (loc === 'ru') return 'Испании'
    return 'Spain'
  }
  if (code === 'IT') {
    if (loc === 'de') return 'Italien'
    if (loc === 'ka') return 'იტალიაში'
    if (loc === 'ru') return 'Италии'
    return 'Italy'
  }
  return loc === 'ka' ? 'მსოფლიოში' : loc === 'de' ? 'weltweit' : loc === 'ru' ? 'по всему миру' : 'Worldwide'
}

export function placeOf(def: SeoPageDef, loc: SeoLoc = 'ka', marketIso = 'GE'): string {
  const g = def.district ?? def.city
  if (!g) return countryNameOf(marketIso, loc)
  if (loc === 'de' && g.de) return g.de
  return loc === 'ka' ? g.loc : loc === 'en' ? g.en : g.ru
}

/** Russian 1/few/many plural — объявление/объявления/объявлений. */
function ruPlural(n: number, one: string, few: string, many: string): string {
  const m10 = n % 10
  const m100 = n % 100
  if (m10 === 1 && m100 !== 11) return one
  if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return few
  return many
}

function dealCopy(def: SeoPageDef) {
  if (def.dealSlug === 'rent' && def.typeSlug === 'land') return DEALS.lease
  return def.dealSlug ? DEALS[def.dealSlug] : undefined
}

/** H1 — matches the exact query pattern per locale:
 *  "ბინები იყიდება ვაკეში" / "Apartments for sale in Vake" / "Продажа квартир в Ваке" */
export function h1Of(def: SeoPageDef, loc: SeoLoc = 'ka', marketIso = 'GE'): string {
  const place = placeOf(def, loc, marketIso)
  const copy = dealCopy(def)
  if (loc === 'de') {
    const subject = subjectOf(def, 'de')
    if (def.dealSlug === 'sale') return `${subject} zum Verkauf in ${place}`
    if (def.dealSlug === 'rent') return `${subject} zur Miete in ${place}`
    if (def.dealSlug === 'daily') return `${subject} auf Tagesbasis in ${place}`
    if (def.dealSlug === 'pledge') return `${subject} auf Pfand in ${place}`
    return `${subject} in ${place}`
  }
  if (loc === 'en') {
    const deal = copy?.en ?? 'for sale and rent'
    return `${subjectOf(def, 'en')} ${deal} in ${place}`
  }
  if (loc === 'ru') {
    if (def.dealSlug === 'sale' || def.dealSlug === 'rent' || def.dealSlug === 'lease')
      return `${copy!.ruNoun} ${subjectGenOf(def)} в ${place}`
    if (def.dealSlug === 'daily') return `${subjectOf(def, 'ru')} посуточно в ${place}`
    if (def.dealSlug === 'pledge') return `${subjectOf(def, 'ru')} под залог в ${place}`
    return `${subjectOf(def, 'ru')} в ${place}: продажа и аренда`
  }
  const dealKa = copy?.ka ?? 'იყიდება და ქირავდება'
  return `${subjectOf(def)} ${dealKa} ${place}`
}

export function titleOf(def: SeoPageDef, loc: SeoLoc = 'ka', marketIso = 'GE'): string {
  const s = statsOf(def.listings)
  if (s.count === 0) return h1Of(def, loc, marketIso)
  if (loc === 'de') return `${h1Of(def, 'de', marketIso)} — ${s.count} Inserat${s.count === 1 ? '' : 'e'}`
  if (loc === 'en') return `${h1Of(def, 'en', marketIso)} — ${s.count} listing${s.count === 1 ? '' : 's'}`
  if (loc === 'ru')
    return `${h1Of(def, 'ru', marketIso)} — ${s.count} ${ruPlural(s.count, 'объявление', 'объявления', 'объявлений')}`
  const suffix = def.city && def.district ? `, ${def.city.ka}` : ''
  return `${h1Of(def, 'ka', marketIso)}${suffix} — ${s.count} განცხადება`
}

export function descriptionOf(def: SeoPageDef, loc: SeoLoc = 'ka', marketIso = 'GE'): string {
  // National category hubs: curated lede ranks better than the stats template.
  if (loc === 'ka' && def.kind === 'deal-type') {
    const hub = hubProseOf(def.dealSlug, def.typeSlug)
    if (hub && hub.lede.length > 160) {
      const cut = hub.lede.slice(0, 157)
      const sp = cut.lastIndexOf(' ')
      return `${sp > 0 ? cut.slice(0, sp) : cut}…`
    }
    if (hub) return hub.lede
  }
  const s = statsOf(def.listings)
  const place = placeOf(def, loc, marketIso)
  if (s.count === 0) {
    if (loc === 'de') {
      return `${subjectOf(def, 'de')} ${def.dealSlug === 'rent' ? 'zur Miete' : 'zum Verkauf'} in ${place} auf sivrce. AI-Preisschätzung, 3D-Karte, direkter Eigentümerkontakt.`
    }
    if (loc === 'en') {
      return `${subjectOf(def, 'en')} ${def.dealSlug ? DEALS[def.dealSlug]!.en : 'for sale and rent'} in ${place} on sivrce. AI price estimate, 3D map, direct owner contact.`
    }
    if (loc === 'ru') {
      return `${h1Of(def, 'ru', marketIso)} на sivrce. AI-оценка цены, 3D-карта, прямой контакт с владельцем.`
    }
    const dealKa = def.dealSlug ? DEALS[def.dealSlug]!.ka : 'იყიდება და ქირავდება'
    return `${subjectOf(def)} ${dealKa} ${place} — sivrce. AI ფასის შეფასება, 3D რუკა, პირდაპირი კონტაქტი მესაკუთრესთან.`
  }
  if (loc === 'de') {
    const perM2 = s.avgPerM2 ? ` Durchschnittspreis ${formatUSD(s.avgPerM2)}/m².` : ''
    return (
      `${s.count} verifizierte Inserate: ${subjectOf(def, 'de')} ` +
      `${def.dealSlug === 'rent' ? 'zur Miete' : 'zum Verkauf'} in ${place} auf sivrce.${perM2} ` +
      `Preise ab ${formatUSD(s.minPrice)}. AI-Preisschätzung, interaktive 3D-Karte, direkter Eigentümerkontakt.`
    )
  }
  if (loc === 'en') {
    const perM2 = s.avgPerM2 ? ` Average price ${formatUSD(s.avgPerM2)}/m².` : ''
    return (
      `${s.count} verified listing${s.count === 1 ? '' : 's'}: ${subjectOf(def, 'en').toLowerCase()} ` +
      `${def.dealSlug ? DEALS[def.dealSlug]!.en : 'for sale and rent'} in ${place} on sivrce.${perM2} ` +
      `Prices from ${formatUSD(s.minPrice)}. AI price estimate, interactive 3D map, direct owner contact.`
    )
  }
  if (loc === 'ru') {
    const perM2 = s.avgPerM2 ? ` Средняя цена ${formatUSD(s.avgPerM2)}/м².` : ''
    return (
      `${h1Of(def, 'ru', marketIso)} — ${s.count} ${ruPlural(s.count, 'проверенное объявление', 'проверенных объявления', 'проверенных объявлений')} ` +
      `на sivrce.${perM2} Цены от ${formatUSD(s.minPrice)}. AI-оценка цены, 3D-карта, прямой контакт с владельцем.`
    )
  }
  const perM2 = s.avgPerM2 ? ` საშუალო ფასი ${formatUSD(s.avgPerM2)}/მ².` : ''
  const dealKa = def.dealSlug ? DEALS[def.dealSlug]!.ka : 'იყიდება და ქირავდება'
  return (
    `${subjectOf(def)} ${dealKa} ${place} — ${s.count} ვერიფიცირებული განცხადება ` +
    `sivrce-ზე.${perM2} ფასები ${formatUSD(s.minPrice)}-დან. AI ფასის შეფასება, 3D რუკა, პირდაპირი კონტაქტი მესაკუთრესთან.`
  )
}

/** Intro paragraph under the grid — unique per page via live stats. */
export function introOf(def: SeoPageDef, loc: SeoLoc = 'ka'): string {
  const s = statsOf(def.listings)
  if (s.count === 0) {
    if (loc === 'en') return `No active listings in this search yet. Post for free or save the search.`
    if (loc === 'ru') return `Пока нет активных объявлений. Разместите бесплатно или сохраните поиск.`
    return `ამჟამად აქტიური განცხადება არ არის. დაამატეთ უფასოდ ან შეინახეთ ძიება.`
  }
  if (loc === 'en') {
    const where = def.district
      ? `${def.district.en}, ${def.city!.en}`
      : def.city
        ? def.city.en
        : 'Georgia'
    const perM2 = s.avgPerM2
      ? `The average price is ${formatUSD(s.avgPerM2)}/m², ranging from ${formatUSD(s.minPrice)} to ${formatUSD(s.maxPrice)}.`
      : `Prices start at ${formatUSD(s.minPrice)}.`
    return (
      `There ${s.count === 1 ? 'is' : 'are'} currently ${s.count} active listing${s.count === 1 ? '' : 's'} in ${where}: ` +
      `${subjectOf(def, 'en').toLowerCase()} ${def.dealSlug ? DEALS[def.dealSlug]!.en : 'for sale and rent'}. ${perM2} ` +
      `Every listing passes sivrce verification, and AI compares each price against real market data — ` +
      `so thousands of buyers and tenants find the best option in one place every day.`
    )
  }
  if (loc === 'ru') {
    const perM2 = s.avgPerM2
      ? `Средняя цена квадратного метра — ${formatUSD(s.avgPerM2)}/м², диапазон от ${formatUSD(s.minPrice)} до ${formatUSD(s.maxPrice)}.`
      : `Цены начинаются от ${formatUSD(s.minPrice)}.`
    return (
      `${h1Of(def, 'ru')}: сейчас доступно ${s.count} ${ruPlural(s.count, 'активное объявление', 'активных объявления', 'активных объявлений')}. ` +
      `${perM2} Каждое объявление проходит проверку sivrce, а AI сравнивает цену с реальными рыночными данными — ` +
      `поэтому тысячи покупателей и арендаторов каждый день находят лучший вариант в одном месте.`
    )
  }
  const dealKa = def.dealSlug ? DEALS[def.dealSlug]!.ka : 'იყიდება და ქირავდება'
  const where = def.district
    ? `${def.district.loc} (${def.city!.ka})`
    : def.city
      ? def.city.loc
      : 'მთელ საქართველოში'
  const perM2 = s.avgPerM2
    ? `საშუალო ფასი კვადრატულ მეტრზე ${formatUSD(s.avgPerM2)}/მ²-ს შეადგენს, ხოლო დიაპაზონი ${formatUSD(s.minPrice)}-დან ${formatUSD(s.maxPrice)}-მდე იცვლება.`
    : `ფასები ${formatUSD(s.minPrice)}-დან იწყება.`
  return (
    `${where} ამჟამად ${s.count} აქტიური განცხადებაა: ${subjectOf(def).toLowerCase()} ${dealKa}. ` +
    `${perM2} ყველა განცხადება მოწმდება sivrce-ის ვერიფიკაციის სისტემით, ` +
    `AI კი თითოეულ ფასს ბაზრის რეალურ მაჩვენებლებთან ადარებს — ასე ათასობით მყიდველი და მოიჯარე ` +
    `ყოველდღე პოულობს საუკეთესო ვარიანტს ერთ სივრცეში.`
  )
}

export function faqsOf(def: SeoPageDef, loc: SeoLoc = 'ka'): Faq[] {
  const s = statsOf(def.listings)
  if (loc === 'en') return faqsEn(def, s)
  if (loc === 'ru') return faqsRu(def, s)
  return faqsKa(def, s)
}

function faqsKa(def: SeoPageDef, s: SeoStats): Faq[] {
  // Singular subject — Georgians ask "რა ღირს ბინა ვაკეში?", not plural.
  const single = def.rooms
    ? `${roomLabel(def.rooms)} ${TYPES.apartments!.kaSingle}`
    : def.typeSlug
      ? TYPES[def.typeSlug]!.kaSingle
      : 'უძრავი ქონება'
  const where = def.district ? def.district.loc : def.city ? def.city.loc : 'საქართველოში'
  const faqs: Faq[] = [
    {
      q: `რა ღირს ${single} ${where}?`,
      a: s.count === 0
        ? `ამჟამად აქტიური განცხადება არ არის. დაამატეთ განცხადება უფასოდ ან შეინახეთ ძიება.`
        : s.avgPerM2
        ? `ამჟამად საშუალო ფასი ${formatUSD(s.avgPerM2)}/მ²-ია. ყველაზე ხელმისაწვდომი ვარიანტი ${formatUSD(s.minPrice)} ღირს, პრემიუმ სეგმენტი კი ${formatUSD(s.maxPrice)}-მდე აღწევს. AI ფასის შეფასება თითოეული განცხადების ბარათზე ჩანს.`
        : `ფასები ${formatUSD(s.minPrice)}-დან იწყება და ${formatUSD(s.maxPrice)}-მდე იცვლება. AI ფასის შეფასება თითოეული განცხადების ბარათზე ჩანს.`,
    },
    {
      q: `როგორ ვიპოვო ვერიფიცირებული განცხადებები ${where}?`,
      a: `sivrce-ზე ყველა განცხადება გადის მონაცემთა შემოწმებას: მესაკუთრის ვერიფიკაცია, ფოტოების ავთენტურობა და ფასის ბაზრის შედარება. გამოიყენეთ ფილტრები ტიპის, ფასისა და ფართის მიხედვით — ან ჩაწერეთ მოთხოვნა AI ძიებაში.`,
    },
    {
      q: `შემიძლია თუ არა უფასოდ განცხადების დამატება?`,
      a: `დიახ — sivrce-ზე განცხადების დამატება უფასოა. VIP პაკეტები (VIP, VIP+, SUPER VIP) განცხადებას ძიების თავში აჩვენებს და საშუალოდ 5-ჯერ მეტ ნახვას იძლევა.`,
    },
  ]
  if (def.dealSlug === 'rent') {
    faqs.push({
      q: `რა პირობებით ქირავდება ${single} ${where}?`,
      a: `უმეტესი მესაკუთრე ითხოვს პირველი და ბოლო თვის ქირას. გრძელვადიანი ქირის შემთხვევაში ფასი ხშირად მოლაპარაკებადია — დაუკავშირდით აგენტს პირდაპირ განცხადებიდან.`,
    })
  }
  if (def.dealSlug === 'daily') {
    faqs.push({
      q: `რა ღირს ${single} დღიურად ${where}?`,
      a: `ფასი მოცემულია ერთ ღამეზე (დღეზე) და ${formatUSD(s.minPrice)}-დან იწყება. საბაზრო საშუალო ${s.avgPerM2 ? formatUSD(s.avgPerM2) : formatUSD(Math.round((s.minPrice + s.maxPrice) / 2))}-ს შეადგენს. შაბათ-კვირასა და სეზონში ფასი იზრდება — ზუსტი თარიღისთვის მიმართეთ მესაკუთრეს განცხადებიდან.`,
    })
    faqs.push({
      q: `როგორ დავჯავშნოთ ბინა დღიურად?`,
      a: `აირჩიეთ განცხადება, შეარჩიეთ თარიღები და დაუკავშირდით მესაკუთრეს პირდაპირ sivrce-ის ჩატით. გადახდა ხდება ადგილზე ან ონლაინ — მესაკუთრის პირობის მიხედვით. უსაფრთხოებისთვის გადახდამდე შეამოწმეთ განცხადების ვერიფიკაციის სტატუსი.`,
    })
  }
  return faqs
}

function faqsEn(def: SeoPageDef, s: SeoStats): Faq[] {
  const single = def.typeSlug ? TYPES[def.typeSlug]!.enSingle : 'property'
  const subject = subjectOf(def, 'en').toLowerCase()
  const where = placeOf(def, 'en')
  const faqs: Faq[] = [
    {
      q: `How much does ${def.typeSlug || def.rooms ? `a ${single}` : 'real estate'} cost in ${where}?`,
      a: s.avgPerM2
        ? `The current average price is ${formatUSD(s.avgPerM2)}/m². The most affordable option costs ${formatUSD(s.minPrice)}, while the premium segment reaches ${formatUSD(s.maxPrice)}. Every listing card shows the AI price estimate.`
        : `Prices range from ${formatUSD(s.minPrice)} to ${formatUSD(s.maxPrice)}. Every listing card shows the AI price estimate.`,
    },
    {
      q: `How do I find verified listings in ${where}?`,
      a: `Every listing on sivrce passes data checks: owner verification, photo authenticity and a market price comparison. Use the filters for type, price and area — or describe what you need in AI search.`,
    },
    {
      q: `Can I post a listing for free?`,
      a: `Yes — posting on sivrce is free. VIP packages (VIP, VIP+, SUPER VIP) place your listing at the top of search results and bring 5× more views on average.`,
    },
  ]
  if (def.dealSlug === 'rent') {
    faqs.push({
      q: `What are the usual rental terms for ${subject} in ${where}?`,
      a: `Most owners ask for the first and last month upfront. Long-term rent is often negotiable — message the agent directly from the listing.`,
    })
  }
  if (def.dealSlug === 'daily') {
    faqs.push({
      q: `How much does a daily rental cost in ${where}?`,
      a: `Prices are per night and start from ${formatUSD(s.minPrice)}. Weekends and high season cost more — ask the owner for exact dates via the listing.`,
    })
    faqs.push({
      q: `How do I book a daily-rent apartment?`,
      a: `Pick a listing, choose your dates and message the owner in sivrce chat. Payment is on arrival or online, depending on the owner. For safety, check the listing's verification status before paying.`,
    })
  }
  return faqs
}

function faqsRu(def: SeoPageDef, s: SeoStats): Faq[] {
  const subject = subjectOf(def, 'ru').toLowerCase()
  const where = placeOf(def, 'ru')
  const faqs: Faq[] = [
    {
      q: `Какие цены на ${subject} в ${where}?`,
      a: s.avgPerM2
        ? `Сейчас средняя цена — ${formatUSD(s.avgPerM2)}/м². Самый доступный вариант стоит ${formatUSD(s.minPrice)}, премиум-сегмент достигает ${formatUSD(s.maxPrice)}. AI-оценка цены показана на карточке каждого объявления.`
        : `Цены варьируются от ${formatUSD(s.minPrice)} до ${formatUSD(s.maxPrice)}. AI-оценка цены показана на карточке каждого объявления.`,
    },
    {
      q: `Как найти проверенные объявления в ${where}?`,
      a: `Каждое объявление на sivrce проходит проверку данных: верификация владельца, подлинность фото и сравнение цены с рынком. Используйте фильтры по типу, цене и площади — или опишите запрос в AI-поиске.`,
    },
    {
      q: `Можно ли разместить объявление бесплатно?`,
      a: `Да — размещение на sivrce бесплатное. VIP-пакеты (VIP, VIP+, SUPER VIP) поднимают объявление в топ выдачи и дают в среднем в 5 раз больше просмотров.`,
    },
  ]
  if (def.dealSlug === 'rent') {
    faqs.push({
      q: `На каких условиях сдают ${subject} в ${where}?`,
      a: `Большинство владельцев просят оплату за первый и последний месяц. При долгосрочной аренде цена часто обсуждается — напишите агенту прямо из объявления.`,
    })
  }
  if (def.dealSlug === 'daily') {
    faqs.push({
      q: `Сколько стоит посуточная аренда в ${where}?`,
      a: `Цена указана за ночь и начинается от ${formatUSD(s.minPrice)}. В выходные и высокий сезон цена растёт — уточняйте точные даты у владельца через объявление.`,
    })
    faqs.push({
      q: `Как забронировать квартиру посуточно?`,
      a: `Выберите объявление, укажите даты и напишите владельцу в чате sivrce. Оплата — на месте или онлайн, по условиям владельца. Для безопасности проверьте статус верификации объявления перед оплатой.`,
    })
  }
  return faqs
}

/* ————— Internal linking ————— */

export interface Crumb {
  name: string
  href: string
}

/** Deal label for crumbs/chips: იყიდება / For sale / Продажа. */
function geoName(g: GeoLoc | District, loc: SeoLoc): string {
  if (loc === 'ka') return g.ka
  if (loc === 'de') return g.de ?? g.en
  if (loc === 'ru') return g.ru
  return g.en
}

function typeName(typeSlug: string, loc: SeoLoc): string {
  const t = TYPES[typeSlug]
  if (!t) return typeSlug
  if (loc === 'ka') return t.ka
  if (loc === 'de') return t.de ?? t.en
  if (loc === 'ru') return t.ru
  return t.en
}

export function dealLabel(slug: string, loc: SeoLoc): string {
  const d = DEALS[slug]
  if (!d) return slug
  if (loc === 'ka') return d.ka
  if (loc === 'de') return d.deNoun ?? `Für ${d.enNoun}`
  if (loc === 'ru') return d.ruNoun
  return `For ${d.enNoun}`
}

export function breadcrumbsOf(def: SeoPageDef, loc: SeoLoc = 'ka', prefix: string = locPrefix(loc)): Crumb[] {
  const p = prefix
  const home = loc === 'ka' ? 'მთავარი' : loc === 'de' ? 'Startseite' : loc === 'en' ? 'Home' : 'Главная'
  const crumbs: Crumb[] = [{ name: home, href: p || '/' }]
  if (loc === 'ka') {
    if (def.dealSlug) {
      const kaDeal = DEAL_TO_KA[def.dealSlug] || def.dealSlug
      crumbs.push({ name: dealLabel(def.dealSlug, loc), href: `${p}/${kaDeal}` })
      if (def.typeSlug) {
        const kaType = TYPE_TO_KA[def.typeSlug] || def.typeSlug
        crumbs.push({ name: typeName(def.typeSlug, loc), href: `${p}/${kaDeal}/${kaType}` })
      }
      if (def.rooms) {
        crumbs.push({ name: roomLabel(def.rooms, loc), href: `${p}/${kaDeal}/${def.rooms}-ოთახიანი-ბინები` })
      }
      if (def.city) {
        const typeToken = def.rooms ? `${def.rooms}-ოთახიანი-ბინები` : def.typeSlug ? (TYPE_TO_KA[def.typeSlug] || def.typeSlug) : null
        crumbs.push({
          name: geoName(def.city, loc),
          href: typeToken ? `${p}/${kaDeal}/${typeToken}/${def.city.ka}` : `${p}/${kaDeal}/${def.city.ka}`,
        })
      }
      if (def.district) {
        crumbs.push({ name: geoName(def.district, loc), href: `${p}${def.kaPath || def.path}` })
      }
    } else if (def.city) {
      crumbs.push({ name: geoName(def.city, loc), href: `${p}/${def.city.ka}` })
      if (def.district) crumbs.push({ name: geoName(def.district, loc), href: `${p}${def.kaPath || def.path}` })
    }
    return crumbs
  }

  if (def.dealSlug) {
    crumbs.push({ name: dealLabel(def.dealSlug, loc), href: `${p}/${def.dealSlug}` })
    if (def.typeSlug)
      crumbs.push({ name: typeName(def.typeSlug, loc), href: `${p}/${def.dealSlug}/${def.typeSlug}` })
    if (def.rooms)
      crumbs.push({ name: roomLabel(def.rooms, loc), href: `${p}/${def.dealSlug}/apartments-${def.rooms}` })
    if (def.city)
      crumbs.push({
        name: geoName(def.city, loc),
        href: def.typeSlug
          ? `${p}/${def.dealSlug}/${def.rooms ? `apartments-${def.rooms}` : def.typeSlug}/${def.city.slug}`
          : `${p}/${def.dealSlug}/${def.city.slug}`,
      })
    if (def.district)
      crumbs.push({ name: geoName(def.district, loc), href: `${p}${def.asciiPath || def.path}` })
  } else if (def.city) {
    crumbs.push({ name: geoName(def.city, loc), href: `${p}/${def.city.slug}` })
    if (def.district) crumbs.push({ name: geoName(def.district, loc), href: `${p}${def.asciiPath || def.path}` })
  }
  return crumbs
}

export interface LinkChips {
  /** Same page, other deal type (იყიდება ↔ ქირავდება) */
  dealSwitch?: { label: string; href: string }
  /** Property-type chips for current deal/geo scope (active one marked) */
  types: { label: string; href: string; active: boolean }[]
  /** Room chips on apartment pages (1–4+) */
  rooms: { label: string; href: string; active: boolean }[]
  /** Geo children: cities on deal/type pages, districts on city pages */
  geo: { label: string; href: string; active: boolean }[]
}

export function linkChipsOf(def: SeoPageDef, loc: SeoLoc = 'ka', prefix: string = locPrefix(loc)): LinkChips {
  const has = (slug: string[]) => parseSeoSlug(slug) !== null
  const p = prefix
  const name = (g: GeoLoc) => geoName(g, loc)
  const resolveHref = (slug: string[]) => {
    if (loc === 'ka') {
      const pageDef = parseSeoSlug(slug)
      if (pageDef) return `${p}${pageDef.kaPath}`
    }
    return `${p}/${slug.join('/')}`
  }

  const dealSwitch = def.dealSlug
    ? (() => {
        const other = def.dealSlug === 'sale' ? 'rent' : 'sale'
        const rest = [def.rooms ? `apartments-${def.rooms}` : def.typeSlug, def.city?.slug, def.district?.slug].filter(Boolean) as string[]
        return has([other, ...rest])
          ? { label: dealLabel(other, loc), href: resolveHref([other, ...rest]) }
          : undefined
      })()
    : undefined

  const types: LinkChips['types'] = []
  if (def.dealSlug === 'lease') {
    types.push({
      label: typeName('land', loc),
      href: resolveHref(def.city ? ['lease', def.city.slug] : ['lease']),
      active: true,
    })
  } else if (def.dealSlug) {
    const allTypes = loc === 'ka' ? 'ყველა ტიპი' : loc === 'de' ? 'Alle Typen' : loc === 'en' ? 'All types' : 'Все типы'
    types.push({
      label: allTypes,
      href: resolveHref(def.city ? [def.dealSlug, def.city.slug] : [def.dealSlug]),
      active: !def.typeSlug,
    })
    for (const t of Object.keys(TYPES)) {
      const slug = [def.dealSlug, t, def.city?.slug].filter(Boolean) as string[]
      if (has(slug)) types.push({ label: typeName(t, loc), href: resolveHref(slug), active: def.typeSlug === t && !def.rooms })
    }
  }

  const rooms: LinkChips['rooms'] = []
  if (def.dealSlug && (def.typeSlug === 'apartments' || def.rooms)) {
    for (const n of [1, 2, 3, 4] as const) {
      const typePart = `apartments-${n}`
      const slug = [def.dealSlug, typePart, def.city?.slug, def.district?.slug].filter(Boolean) as string[]
      if (has(slug)) {
        rooms.push({ label: roomLabel(n, loc), href: resolveHref(slug), active: def.rooms === n })
      }
    }
  }

  const geo: LinkChips['geo'] = []
  if (def.kind === 'deal' || def.kind === 'deal-type') {
    for (const c of CITIES) {
      const slug = [def.dealSlug!, def.rooms ? `apartments-${def.rooms}` : def.typeSlug, c.slug].filter(Boolean) as string[]
      if (has(slug)) geo.push({ label: name(c), href: resolveHref(slug), active: false })
    }
  } else if (def.kind === 'deal-city' || def.kind === 'deal-type-city') {
    for (const d of DISTRICTS.filter((x) => x.citySlug === def.city!.slug)) {
      const typePart = def.rooms ? `apartments-${def.rooms}` : def.typeSlug
      const slug = typePart
        ? [def.dealSlug!, typePart, def.city!.slug, d.slug]
        : undefined
      if (slug && has(slug)) geo.push({ label: name(d), href: resolveHref(slug), active: false })
    }
  } else if (def.kind === 'city') {
    for (const d of DISTRICTS.filter((x) => x.citySlug === def.city!.slug)) {
      const slug = [def.city!.slug, d.slug]
      if (has(slug)) geo.push({ label: name(d), href: resolveHref(slug), active: false })
    }
  } else if (def.kind === 'city-info') {
    for (const c of CITIES) {
      if (cityMarket(c) !== cityMarket(def.city!)) continue
      if (has([c.slug])) geo.push({ label: name(c), href: resolveHref([c.slug]), active: c.slug === def.city?.slug })
    }
  }

  return { dealSwitch, types, rooms, geo }
}
