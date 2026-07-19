/**
 * SIVRCE — Programmatic SEO pages engine
 * Single source of truth for deal × type × city × district landing pages.
 * Routes are parsed by src/app/[...seo]/page.tsx; only combos with ≥1 real
 * listing are generated (thin/empty pages hurt rankings).
 */

import { filterListings, formatUSD, type DealType, type Listing, type PropType } from '@/data/listings'

/* ————— Registries ————— */

/** Locales with real server-rendered landing pages: /(ka), /en, /ru. */
export type SeoLoc = 'ka' | 'en' | 'ru'
export const SEO_LOCS: SeoLoc[] = ['ka', 'en', 'ru']
/** URL prefix per locale (ka is canonical, unprefixed). */
export const locPrefix = (loc: SeoLoc) => (loc === 'ka' ? '' : `/${loc}`)

export interface GeoLoc {
  slug: string
  ka: string // nominative: თბილისი
  loc: string // locative for H1: თბილისში
  en: string
  ru: string
}

export const DEALS: Record<
  string,
  { deal: DealType; ka: string; noun: string; en: string; enNoun: string; ru: string; ruNoun: string }
> = {
  sale: { deal: 'sale', ka: 'იყიდება', noun: 'ყიდვა', en: 'for sale', enNoun: 'sale', ru: 'на продажу', ruNoun: 'Продажа' },
  rent: { deal: 'rent', ka: 'ქირავდება', noun: 'ქირა', en: 'for rent', enNoun: 'rent', ru: 'в аренду', ruNoun: 'Аренда' },
  // "ბინები დღიურად" — top Georgian real-estate query. Listings below render
  // /daily, /daily/apartments, /daily/apartments/tbilisi(/old-tbilisi), etc.
  daily: { deal: 'daily', ka: 'დღიურად', noun: 'დღიური ქირა', en: 'for daily rent', enNoun: 'daily rent', ru: 'посуточно', ruNoun: 'Посуточная аренда' },
  pledge: { deal: 'pledge', ka: 'გირავდება', noun: 'გირავნება', en: 'for lease', enNoun: 'lease', ru: 'в лизинг', ruNoun: 'Лизинг' },
}

export const TYPES: Record<
  string,
  { type: PropType; ka: string; kaSingle: string; en: string; enSingle: string; ru: string; ruSingle: string; ruGen: string }
> = {
  apartments: { type: 'apartment', ka: 'ბინები', kaSingle: 'ბინა', en: 'Apartments', enSingle: 'apartment', ru: 'Квартиры', ruSingle: 'квартира', ruGen: 'квартир' },
  houses: { type: 'house', ka: 'სახლები და აგარაკები', kaSingle: 'სახლი', en: 'Houses & Cottages', enSingle: 'house', ru: 'Дома и дачи', ruSingle: 'дом', ruGen: 'домов и дач' },
  commercial: { type: 'commercial', ka: 'კომერციული ფართები', kaSingle: 'კომერციული ფართი', en: 'Commercial Property', enSingle: 'commercial property', ru: 'Коммерческая недвижимость', ruSingle: 'коммерческое помещение', ruGen: 'коммерческой недвижимости' },
  land: { type: 'land', ka: 'მიწის ნაკვეთები', kaSingle: 'მიწის ნაკვეთი', en: 'Land Plots', enSingle: 'land plot', ru: 'Земельные участки', ruSingle: 'участок', ruGen: 'земельных участков' },
}

/** Room-page slug pattern: /sale/apartments-2 — the "2-ოთახიანი ბინა" query family. 4 = 4+. */
export const ROOM_SLUG = /^apartments-([1-4])$/

/** Room chip label per locale: 1-ოთახიანი / 1-room / 1-комн. … 4+ (myhome convention). */
export function roomLabel(n: number, loc: SeoLoc = 'ka'): string {
  if (loc === 'en') return n === 4 ? '4+ rooms' : `${n}-room`
  if (loc === 'ru') return n === 4 ? '4+ комн.' : `${n}-комн.`
  return n === 4 ? '4+ ოთახიანი' : `${n}-ოთახიანი`
}

export const CITIES: GeoLoc[] = [
  { slug: 'tbilisi', ka: 'თბილისი', loc: 'თბილისში', en: 'Tbilisi', ru: 'Тбилиси' },
  { slug: 'batumi', ka: 'ბათუმი', loc: 'ბათუმში', en: 'Batumi', ru: 'Батуми' },
  { slug: 'kutaisi', ka: 'ქუთაისი', loc: 'ქუთაისში', en: 'Kutaisi', ru: 'Кутаиси' },
  // ponytail: registered but inventory-light cities. Programmatic deal×type
  // pages self-throttle (≥1 listing rule) so they stay dark until listings
  // arrive; the city-info fallback below gives each a unique page today.
  { slug: 'rustavi', ka: 'რუსთავი', loc: 'რუსთავში', en: 'Rustavi', ru: 'Рустави' },
  { slug: 'poti', ka: 'ფოთი', loc: 'ფოთში', en: 'Poti', ru: 'Поти' },
  { slug: 'zugdidi', ka: 'ზუგდიდი', loc: 'ზუგდიდში', en: 'Zugdidi', ru: 'Зугдиди' },
  { slug: 'telavi', ka: 'თელავი', loc: 'თელავში', en: 'Telavi', ru: 'Телави' },
  { slug: 'gori', ka: 'გორი', loc: 'გორში', en: 'Gori', ru: 'Гори' },
  { slug: 'mtskheta', ka: 'მცხეთა', loc: 'მცხეთაში', en: 'Mtskheta', ru: 'Мцхета' },
  // Resort cities (myhome/ss popular row). Full municipality list lives in georgia-locations.json.
  { slug: 'bakuriani', ka: 'ბაკურიანი', loc: 'ბაკურიანში', en: 'Bakuriani', ru: 'Бакуриани' },
  { slug: 'borjomi', ka: 'ბორჯომი', loc: 'ბორჯომში', en: 'Borjomi', ru: 'Боржоми' },
  { slug: 'gudauri', ka: 'გუდაური', loc: 'გუდაურში', en: 'Gudauri', ru: 'Гудаури' },
]

export type District = GeoLoc & { citySlug: string }

export const DISTRICTS: District[] = [
  { slug: 'vake', ka: 'ვაკე', loc: 'ვაკეში', en: 'Vake', ru: 'Ваке', citySlug: 'tbilisi' },
  { slug: 'saburtalo', ka: 'საბურთალო', loc: 'საბურთალოზე', en: 'Saburtalo', ru: 'Сабуртало', citySlug: 'tbilisi' },
  { slug: 'mtatsminda', ka: 'მთაწმინდა', loc: 'მთაწმინდაზე', en: 'Mtatsminda', ru: 'Мтацминда', citySlug: 'tbilisi' },
  { slug: 'didi-dighomi', ka: 'დიდი დიღომი', loc: 'დიდ დიღომში', en: 'Didi Dighomi', ru: 'Диди Дигоми', citySlug: 'tbilisi' },
  { slug: 'ortachala', ka: 'ორთაჭალა', loc: 'ორთაჭალაში', en: 'Ortachala', ru: 'Ортачала', citySlug: 'tbilisi' },
  { slug: 'isani', ka: 'ისანი', loc: 'ისანში', en: 'Isani', ru: 'Исани', citySlug: 'tbilisi' },
  { slug: 'gldani', ka: 'გლდანი', loc: 'გლდანში', en: 'Gldani', ru: 'Глдани', citySlug: 'tbilisi' },
  { slug: 'krtsanisi', ka: 'კრწანისი', loc: 'კრწანისში', en: 'Krtsanisi', ru: 'Крцаниси', citySlug: 'tbilisi' },
  { slug: 'avlabari', ka: 'ავლაბარი', loc: 'ავლაბარში', en: 'Avlabari', ru: 'Авлабари', citySlug: 'tbilisi' },
  { slug: 'tskneti', ka: 'წყნეთი', loc: 'წყნეთში', en: 'Tskneti', ru: 'Цкнети', citySlug: 'tbilisi' },
  { slug: 'tskhvarichamia', ka: 'ცხვარიჭამია', loc: 'ცხვარიჭამიაში', en: 'Tskhvarichamia', ru: 'Цхваричамия', citySlug: 'tbilisi' },
  // ponytail: no inventory here today — pages self-throttle (≥1 listing rule) and go
  // live free the moment real listings land (ss.ge ranks with exactly these districts).
  { slug: 'old-tbilisi', ka: 'ძველი თბილისი', loc: 'ძველ თბილისში', en: 'Old Tbilisi', ru: 'Старый Тбилиси', citySlug: 'tbilisi' },
  { slug: 'varketili', ka: 'ვარკეთილი', loc: 'ვარკეთილში', en: 'Varketili', ru: 'Варкетили', citySlug: 'tbilisi' },
  { slug: 'chughureti', ka: 'ჩუღურეთი', loc: 'ჩუღურეთში', en: 'Chughureti', ru: 'Чугурети', citySlug: 'tbilisi' },
  { slug: 'nadzaladevi', ka: 'ნაძალადევი', loc: 'ნაძალადევში', en: 'Nadzaladevi', ru: 'Надзаладеви', citySlug: 'tbilisi' },
  // Leaf ubani competitors rank on (full picker list: georgia-locations.json).
  { slug: 'didube', ka: 'დიდუბე', loc: 'დიდუბეში', en: 'Didube', ru: 'Дидубе', citySlug: 'tbilisi' },
  { slug: 'vera', ka: 'ვერა', loc: 'ვერაში', en: 'Vera', ru: 'Вера', citySlug: 'tbilisi' },
  { slug: 'digomis-masivi', ka: 'დიღმის მასივი', loc: 'დიღმის მასივში', en: 'Dighomi Massive', ru: 'Дигомский массив', citySlug: 'tbilisi' },
  { slug: 'baghebi', ka: 'ბაგები', loc: 'ბაგებში', en: 'Baghebi', ru: 'Багеби', citySlug: 'tbilisi' },
  { slug: 'nutsubidze', ka: 'ნუცუბიძის ფერდობი', loc: 'ნუცუბიძის ფერდობზე', en: 'Nutsubidze Plateau', ru: 'Плато Нуцубидзе', citySlug: 'tbilisi' },
  { slug: 'vashlijvari', ka: 'ვაშლიჯვარი', loc: 'ვაშლიჯვარში', en: 'Vashlijvari', ru: 'Вашлиджвари', citySlug: 'tbilisi' },
  { slug: 'samgori', ka: 'სამგორი', loc: 'სამგორში', en: 'Samgori', ru: 'Самгори', citySlug: 'tbilisi' },
  { slug: 'temka', ka: 'თემქა', loc: 'თემქაში', en: 'Temka', ru: 'Темка', citySlug: 'tbilisi' },
  { slug: 'mukhiani', ka: 'მუხიანი', loc: 'მუხიანში', en: 'Mukhiani', ru: 'Мухиани', citySlug: 'tbilisi' },
  { slug: 'vazisubani', ka: 'ვაზისუბანი', loc: 'ვაზისუბანში', en: 'Vazisubani', ru: 'Вазисубани', citySlug: 'tbilisi' },
  { slug: 'akhali-bulvari', ka: 'ახალი ბულვარი', loc: 'ახალ ბულვარზე', en: 'New Boulevard', ru: 'Новый бульвар', citySlug: 'batumi' },
  { slug: 'dzveli-batumi', ka: 'ძველი ბათუმი', loc: 'ძველ ბათუმში', en: 'Old Batumi', ru: 'Старый Батуми', citySlug: 'batumi' },
  { slug: 'makhinjauri', ka: 'მახინჯაური', loc: 'მახინჯაურში', en: 'Makhinjauri', ru: 'Махинджаури', citySlug: 'batumi' },
  { slug: 'rustavelis-ubani', ka: 'რუსთაველის უბანი', loc: 'რუსთაველის უბანში', en: 'Rustaveli District', ru: 'Район Руставели', citySlug: 'batumi' },
  { slug: 'airport-ubani', ka: 'აეროპორტის უბანი', loc: 'აეროპორტის უბანში', en: 'Airport District', ru: 'Район аэропорта', citySlug: 'batumi' },
  { slug: 'kutaisi-centri', ka: 'ცენტრი', loc: 'ცენტრში', en: 'Center', ru: 'Центр', citySlug: 'kutaisi' },
  { slug: 'avtokarkhana', ka: 'ავტოქარხანა', loc: 'ავტოქარხანის უბანში', en: 'Avtokarkhana', ru: 'Автокархана', citySlug: 'kutaisi' },
  { slug: 'nikea', ka: 'ნიკეა', loc: 'ნიკეაში', en: 'Nikea', ru: 'Никеа', citySlug: 'kutaisi' },
]

const cityBySlug = (s: string) => CITIES.find((c) => c.slug === s)
const districtBySlug = (s: string) => DISTRICTS.find((d) => d.slug === s)

/* ————— Listing → programmatic hub ————— */

/** Reverse-map a Listing's ka `city`/`district` + dealType/propType to a slug hub
 *  (e.g. `იყიდება ბინა ვაკეში` → `/sale/apartments/tbilisi/vake`). null = no real
 *  page (empty combo) → caller falls back to /search. ponytail: one reverse
 *  lookup beats maintaining a parallel slug map; the registry stays canonical. */
const DEAL_TO_SLUG: Record<DealType, string> = { sale: 'sale', rent: 'rent', daily: 'daily', pledge: 'pledge' }
const TYPE_TO_SLUG: Record<PropType, string> = {
  apartment: 'apartments',
  house: 'houses',
  villa: 'houses', // ponytail: no /cottages hub yet
  commercial: 'commercial',
  land: 'land',
  hotel: 'commercial', // ponytail: no /hotels hub yet
}
export function listingHubPath(l: {
  dealType: DealType
  propType: PropType
  city: string
  district: string
}): string | null {
  const dealSlug = DEAL_TO_SLUG[l.dealType]
  const typeSlug = TYPE_TO_SLUG[l.propType]
  const city = CITIES.find((c) => c.ka === l.city)
  // try deepest real page: deal/type/city/district → deal/type/city → deal/type
  const attempts: string[][] = city
    ? [
        [dealSlug, typeSlug, city.slug, DISTRICTS.find((d) => d.citySlug === city.slug && d.ka === l.district)?.slug].filter(Boolean) as string[],
        [dealSlug, typeSlug, city.slug],
        [dealSlug, typeSlug],
        [dealSlug],
      ]
    : [[dealSlug, typeSlug], [dealSlug]]
  for (const slug of attempts) {
    if (parseSeoSlug(slug)) return `/${slug.join('/')}`
  }
  return null
}

/** Keyword anchor text for the hub link: "იყიდება ბინები ვაკეში" / "For sale in Vake".
 *  Reuses h1Of so the anchor literally matches the destination page's <h1>. */
export function listingHubAnchor(l: {
  dealType: DealType
  propType: PropType
  city: string
  district: string
}): string | null {
  const path = listingHubPath(l)
  if (!path) return null
  const def = parseSeoSlug(path.slice(1).split('/'))
  return def ? h1Of(def, 'ka') : null
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
}): Listing[] {
  const out = filterListings({
    deal: d.dealSlug ? DEALS[d.dealSlug]?.deal : undefined,
    type: d.typeSlug ? TYPES[d.typeSlug]?.type : undefined,
    city: d.city?.ka,
    district: d.district?.ka,
  })
  // filterListings.rooms is a minimum; SEO pages need exact counts (4 = 4+).
  if (!d.rooms) return out
  return out.filter((l) => (d.rooms === 4 ? l.rooms >= 4 : l.rooms === d.rooms))
}

/** Parse a [...seo] slug into a page definition. null → 404. */
export function parseSeoSlug(slug: string[]): SeoPageDef | null {
  if (slug.length < 1 || slug.length > 4) return null
  const [a, b, c, d] = slug as [string, string?, string?, string?]

  // City hubs: /tbilisi, /tbilisi/vake
  const city = cityBySlug(a)
  if (city) {
    if (!b) {
      const listings = listingsFor({ city })
      // ponytail: a registered city with zero listings still gets a unique
      // city-info page instead of a 404 — every page has real prose (below).
      // When listings arrive, the ≥1-listing branch above wins automatically.
      return listings.length
        ? { kind: 'city', path: `/${a}`, city, listings }
        : cityInfoOf(city)
    }
    const dist = districtBySlug(b)
    if (!dist || dist.citySlug !== city.slug || c || d) return null
    const listings = listingsFor({ city, district: dist })
    return listings.length
      ? { kind: 'city-district', path: `/${a}/${b}`, city, district: dist, listings }
      : null
  }

  // Deal pages: /sale, /sale/apartments, /sale/tbilisi, /sale/apartments/tbilisi(/vake)
  // Room pages:  /sale/apartments-2(/tbilisi(/vake)) — type=apartments + room filter.
  const deal = DEALS[a]
  if (!deal) return null
  const base = { dealSlug: a }

  if (!b) {
    const listings = listingsFor(base)
    return listings.length ? { kind: 'deal', path: `/${a}`, ...base, listings } : null
  }

  const roomMatch = ROOM_SLUG.exec(b)
  const rooms = roomMatch ? Number(roomMatch[1]) : undefined
  const typeSlug = roomMatch ? 'apartments' : TYPES[b] ? b : undefined
  const cityB = typeSlug ? undefined : cityBySlug(b)
  if (!typeSlug && !cityB) return null

  if (cityB) {
    if (c) return null // /sale/tbilisi/x is not a route (districts need a type)
    const listings = listingsFor({ ...base, city: cityB })
    return listings.length
      ? { kind: 'deal-city', path: `/${a}/${b}`, ...base, city: cityB, listings }
      : null
  }

  if (!c) {
    const listings = listingsFor({ ...base, typeSlug, rooms })
    return listings.length
      ? { kind: 'deal-type', path: `/${a}/${b}`, ...base, typeSlug, rooms, listings }
      : null
  }

  const cityC = cityBySlug(c)
  if (!cityC) return null
  if (!d) {
    const listings = listingsFor({ ...base, typeSlug, rooms, city: cityC })
    return listings.length
      ? { kind: 'deal-type-city', path: `/${a}/${b}/${c}`, ...base, typeSlug, rooms, city: cityC, listings }
      : null
  }

  const dist = districtBySlug(d)
  if (!dist || dist.citySlug !== cityC.slug) return null
  const listings = listingsFor({ ...base, typeSlug, rooms, city: cityC, district: dist })
  return listings.length
    ? {
        kind: 'deal-type-city-district',
        path: `/${a}/${b}/${c}/${d}`,
        ...base,
        typeSlug,
        rooms,
        city: cityC,
        district: dist,
        listings,
      }
    : null
}

/** Every valid page with ≥1 listing — used by generateStaticParams + sitemap. */
export function generateAllSeoParams(): string[][] {
  const out: string[][] = []
  const push = (slug: string[]) => {
    const def = parseSeoSlug(slug)
    if (def) out.push(slug)
  }
  for (const deal of Object.keys(DEALS)) {
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
    push([city.slug])
    for (const dist of DISTRICTS.filter((x) => x.citySlug === city.slug)) push([city.slug, dist.slug])
  }
  return out
}

/* ————— Footer keyword columns ————— */

export interface FooterCol {
  id: string
  title: Record<SeoLoc, string>
  links: { href: string; label: Record<SeoLoc, string> }[]
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
  const link = (slug: string[]) => {
    const def = parseSeoSlug(slug)
    return def
      ? {
          href: def.path,
          label: { ka: footLabel(def, 'ka'), en: footLabel(def, 'en'), ru: footLabel(def, 'ru') },
        }
      : null
  }
  const cols: FooterCol[] = []
  const push = (id: string, title: FooterCol['title'], slugs: string[][]) => {
    const links = slugs.map(link).filter((x): x is FooterCol['links'][number] => x !== null)
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
    ['rent', 'houses'], ['rent', 'commercial'],
    ['rent', 'apartments', 'tbilisi'], ['rent', 'apartments', 'batumi'],
    ['rent', 'apartments', 'kutaisi'],
  ])
  push('daily', { ka: 'დღიურად', en: 'Daily rent', ru: 'Посуточно' }, [
    ['daily', 'apartments-1'], ['daily', 'apartments-2'],
    ['daily', 'apartments'], ['daily', 'houses'],
    ['daily', 'apartments', 'tbilisi'], ['daily', 'apartments', 'batumi'],
    ['daily', 'apartments', 'kutaisi'],
    ['daily', 'apartments', 'tbilisi', 'vake'],
  ])
  const tbilisiDists = DISTRICTS.filter((d) => d.citySlug === 'tbilisi').map((d) => d.slug)
  push('sale-tbilisi', { ka: 'ბინები იყიდება თბილისში', en: 'Apartments for sale in Tbilisi', ru: 'Квартиры на продажу в Тбилиси' }, [
    ['sale', 'apartments', 'tbilisi'],
    ...tbilisiDists.map((d) => ['sale', 'apartments', 'tbilisi', d]),
  ])
  push('rent-tbilisi', { ka: 'ბინები ქირავდება თბილისში', en: 'Apartments for rent in Tbilisi', ru: 'Квартиры в аренду в Тбилиси' }, [
    ['rent', 'apartments', 'tbilisi'],
    ...tbilisiDists.map((d) => ['rent', 'apartments', 'tbilisi', d]),
    ['rent', 'apartments-1', 'tbilisi'],
    ['rent', 'apartments-2', 'tbilisi'],
  ])

  footerCache = cols
  return cols
}

/* ————— City-info pages (inventory-light cities) ————— */

/**
 * Long-form prose for registered cities that don't yet carry listings.
 * Each entry must be unique 200+ word ka prose — no thin pages. When real
 * listings land, the ≥1-listing branch wins and this becomes a fallback
 * only for empty combos.
 */
export const CITY_PROSE: Record<string, { lede: string; body: string[]; coords?: { lat: number; lng: number } }> = {
  rustavi: {
    lede: 'რუსთავი — ქვემო ქართლის სამრეწველო დედაქალაქი თბილისიდან 25 კილომეტრში. საბჭოთა ინდუსტრიული მემკვიდრეობიდან გამოსული ქალაქი დღეს იზიდავს ახალგაზრდა ოჯახებს ხელმისაწვდომი ფასებით და თბილისთან საავტომობილო და სარკინიგზო კავშირით.',
    body: [
      'ქალაქის უძრავი ქონების ბაზარი იზრდება ახალი კორპუსების მშენებლობით — ძირითადად პანელური შენობების რეკონსტრუქციითა და ახალი საცხოვრებელი კომპლექსების განვითარებით. ფასები საშუალოდ 30-50%-ით დაბალია თბილისის ცენტრთან შედარებით, რაც რუსთავს პირველი ბინის მყიდველებისთვის და ინვესტორებისთვის მიმზიდველს ხდის.',
      'ტრანსპორტი: რეგულარული მარშრუტკა, რკინიგზა და საავტომობილო გზატკეცილი თბილისისკენ. მგზავრობა დედაქალაქამდე დაახლოებით 30-40 წუთი საათში. ქალაქში მოქმედებს ახალი სკოლები, საბავშვო ბაღები და სავაჭრო ცენტრები.',
      'რუსთავი არის ასევე ქართული მანქანათმშენებლობის ცენტრი, რაც აქტიურ სამუშაო ბაზარს ქმნის და ამყარებს ადგილობრივ მოთხოვნას ქირავდება ბინებზე.',
    ],
    coords: { lat: 41.5495, lng: 44.9931 },
  },
  poti: {
    lede: 'ფოთი — შავიზღვისპირა ნავსადგური ქალაქი და საქართველოს უმსხვილესი საზღვაო კარიბჭე. კოლხეთის დაბლოლანდზე, რიონის შესართავთან, ფოთი აერთიანებს ისტორიულ მემკვიდრეობას თანამედროვე ლოჯისტიკურ ეკონომიკასთან.',
    body: [
      'უძრავი ქონების ბაზარი ძირითადად მოიცავს საბჭოთა პერიოდის ბინებსა და ახალ სახლებს. ფასები ერთ-ერთი ყველაზე დაბალია სანაპირო ქალაქებს შორის, რაც იზიდავს ბიუჯეტურ მყიდველებს და საპორტო ინფრასტრუქტურასთან დაკავშირებულ ინვესტორებს.',
      'ფოთის პორტი და თავისუფალი ინდუსტრიული ზონა ქმნის მუდმივ სამუშაო ბაზარს. ქალაქიდან ბათუმი დაახლოებით 1.5 საათის სავალზეა, ქუთაისის საერთაშორისო აეროპორტი — 45 წუთის მანძილზე.',
      'კულტურული მიზანი: კოლხეთის ეროვნული პარკი, ფოთის ციხე-სიმაგრე და სვიმონ კანანელის საკათედრო ტაძარი — ერთ-ერთი უძველესი ქრისტიანული ნაგებობა საქართველოში.',
    ],
    coords: { lat: 42.1494, lng: 41.6656 },
  },
  zugdidi: {
    lede: 'ზუგდიდი — სამეგრელოს დედაქალაქი, აფხაზეთის ადმინისტრაციული მოსაზღვრე ქალაქი. დადიანების სასახლის ბაღები და მაგნოლიების ხეივანი ზუგდიდს უნიკალურ კულტურულ ხასიათს აძლევს.',
    body: [
      'უძრავი ქონების ბაზარი მოიცავს როგორც ისტორიულ ხის სახლებს, ისე ახალ ბინებს. ფასები მნიშვნელოვნად დაბალია თბილისთან შედარებით, ხოლო მიწის ნაკვეთები სოფლის მეურნეობისთვის და საცხოვრებლად ფართოდ არის ხელმისაწვდომი.',
      'ქალაქი მნიშვნელოვანი სატრანსპორტო კვანძია — რკინიგზა თბილისიდან, საავტომობილო გზა შავი ზღვისპირეთისკენ და ფოთისკენ. ახლოსაა მესტია და სვანეთი, რაც ზამთრის და ზაფხულის ტურიზმის პოტენციალს ზრდის.',
      'დადიანების სასახლის მუზეუმი, ბოტანიკური ბაღი და ნაპოლეონ ბონაპარტის დედამისის შიშველი (სამეგრელოს მთავართა კულტურული მემკვიდრეობა) ქალაქს კულტურულ ტურისტულ მიმართულებად აქცევს.',
    ],
    coords: { lat: 42.5088, lng: 41.8709 },
  },
  telavi: {
    lede: 'თელავი — კახეთის ისტორიული დედაქალაქი, გვერდით ალაზნის ველის და კავკასიონის პანორამით. ქართული ღვინის მრეწველობის გული — აქ არის სანაპიროდან მოზიდული ექსკურსიები, ღვინის სარდაფები და სამეფო ისტორია.',
    body: [
      'უძრავი ქონების ბაზარი მოიცავს ქალაქის ცენტრში ბინებს და გარეუბნებში კერძო სახლებსა და ვენახებიან ნაკვეთებს. ფასები ხელმისაწვდომია; მევენახეობის ფერმები პოპულარულია ტურისტული და ინვესტიციური მიზნებისთვის.',
      'თელავიდან თბილისისკენ — 1.5-2 საათის სავალი ავტომობილით. ახლოს მდებარეობს სიღნაღი, გრემი, ნაფარეული — ქართული ღვინის ყველაზე ცნობილი რეგიონები.',
      'ერეკლე II-ის სასახლე, ჭავჭავაძეების მამული და ალ. ჭავჭავაძის სახლ-მუზეუმი ქალაქს ღრმა ისტორიულ ხასიათს ანიჭებს. თელავი არის ერთ-ერთი უძველესი ქალაქი საქართველოში — ისტორიული წყაროები მას I საუკუნიდან იხსენიებს.',
    ],
    coords: { lat: 41.9198, lng: 45.4736 },
  },
  gori: {
    lede: 'გორი — შიდა ქართლის რეგიონალური ცენტრი, მდებარეობს თბილისსა და ბორჯომს შორის. ქალაქის ზემოთ აღმართულია შუა საუკუნეების გორის ციხე, ხოლო ახლომდებარე უფლისციხე ქვის ხანის ქალაქია.',
    body: [
      'უძრავი ქონების ბაზარი ძირითადად საბჭოთა პერიოდის ბინებსა და კერძო სახლებს მოიცავს. ფასები დაბალია, რაც იზიდავს ინვესტორებს ქირავნების სფეროში და პირველი ბინის მყიდველებს, რომლებიც თბილისთან მშვიდ გარემოს ეძებენ.',
      'ტრანსპორტი: საერთაშორისო ავტომაგისტრალი და რკინიგზა თბილისსა და ბათუმს შორის გორიზე გადის. მგზავრობა თბილისამდე დაახლოებით 1-1.5 საათი.',
      'კულტურული მიმზიდველობა: გორის ციხე, უფლისციხის ნაქალაქარი (ახლომდებარე), სტალინის მუზეუმი. ქალაქი არის ასევე ადგილობრივი სასოფლო-სამეურნეო ბაზრის ცენტრი.',
    ],
    coords: { lat: 41.9842, lng: 44.1163 },
  },
  mtskheta: {
    lede: 'მცხეთა — საქართველოს ძველი დედაქალაქი და ქრისტიანული ცენტრი. მცხეთაშია სვეტიცხოველი — ქართული სამოციქულო ეკლესიის მთავარი ტაძარი. ქალაქი შესულია იუნესკოს მსოფლიო მემკვიდრეობის სიაში.',
    body: [
      'უძრავი ქონების ბაზარი შედარებით მცირეა — ქალაქის ისტორიული სტატუსი ზღუდავს მასშტაბურ მშენებლობას. ბინები და კერძო სახლები ხელმისაწვდომია; ვენახებიანი და ბაღიანი ნაკვეთები პოპულარულია მეორე სახლის მყიდველებს შორის.',
      'მცხეთა თბილისიდან 20-30 წუთის სავალზეა — საავტომობილო და სარკინიგზო კავშირით. ეს მას პოპულარულად ხდის იმ მყიდველებისთვის, რომლებიც თბილისთან ახლოს, მშვიდ ისტორიულ გარემოში ცხოვრებას ეძებენ.',
      'კულტურული მემკვიდრეობა: სვეტიცხოველი, ჯვარის მონასტერი (მცხეთის ზემოთ, მდინარეების შესართავთან), სამთავრო, შიო-მღვიმე. ქალაქი ქართული ტურიზმის ერთ-ერთი მთავარი მიმართულებაა.',
    ],
    coords: { lat: 41.8434, lng: 44.7144 },
  },
  // Inventory-carrying cities don't need a city-info fallback, but a
  // prose entry here would enrich them too — leave undefined for now.
}

/** Build a city-info page definition (no listings; pure prose). */
function cityInfoOf(city: GeoLoc): SeoPageDef | null {
  const prose = CITY_PROSE[city.slug]
  if (!prose) return null
  return {
    kind: 'city-info',
    path: `/${city.slug}`,
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
  if (def.rooms) return roomSubject(def.rooms)[loc]
  if (def.typeSlug) {
    const t = TYPES[def.typeSlug]!
    return loc === 'ka' ? t.ka : loc === 'en' ? t.en : t.ru
  }
  return loc === 'ka' ? 'უძრავი ქონება' : loc === 'en' ? 'Real Estate' : 'Недвижимость'
}

/** Russian genitive subject for "Продажа/Аренда X в …" H1s. */
function subjectGenOf(def: SeoPageDef): string {
  if (def.rooms) return roomSubject(def.rooms).ruGen
  if (def.typeSlug) return TYPES[def.typeSlug]!.ruGen
  return 'недвижимости'
}

function placeOf(def: SeoPageDef, loc: SeoLoc = 'ka'): string {
  const g = def.district ?? def.city
  if (!g) return loc === 'ka' ? 'საქართველოში' : loc === 'en' ? 'Georgia' : 'Грузии'
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

/** H1 — matches the exact query pattern per locale:
 *  "ბინები იყიდება ვაკეში" / "Apartments for sale in Vake" / "Продажа квартир в Ваке" */
export function h1Of(def: SeoPageDef, loc: SeoLoc = 'ka'): string {
  const place = placeOf(def, loc)
  if (loc === 'en') {
    const deal = def.dealSlug ? DEALS[def.dealSlug]!.en : 'for sale and rent'
    return `${subjectOf(def, 'en')} ${deal} in ${place}`
  }
  if (loc === 'ru') {
    if (def.dealSlug === 'sale' || def.dealSlug === 'rent')
      return `${DEALS[def.dealSlug]!.ruNoun} ${subjectGenOf(def)} в ${place}`
    if (def.dealSlug === 'daily') return `${subjectOf(def, 'ru')} посуточно в ${place}`
    return `${subjectOf(def, 'ru')} в ${place}: продажа и аренда`
  }
  const dealKa = def.dealSlug ? DEALS[def.dealSlug]!.ka : 'იყიდება და ქირავდება'
  return `${subjectOf(def)} ${dealKa} ${place}`
}

export function titleOf(def: SeoPageDef, loc: SeoLoc = 'ka'): string {
  const s = statsOf(def.listings)
  if (loc === 'en') return `${h1Of(def, 'en')} — ${s.count} listing${s.count === 1 ? '' : 's'}`
  if (loc === 'ru')
    return `${h1Of(def, 'ru')} — ${s.count} ${ruPlural(s.count, 'объявление', 'объявления', 'объявлений')}`
  const suffix = def.city && def.district ? `, ${def.city.ka}` : ''
  return `${h1Of(def)}${suffix} — ${s.count} განცხადება`
}

export function descriptionOf(def: SeoPageDef, loc: SeoLoc = 'ka'): string {
  const s = statsOf(def.listings)
  if (loc === 'en') {
    const perM2 = s.avgPerM2 ? ` Average price ${formatUSD(s.avgPerM2)}/m².` : ''
    return (
      `${s.count} verified listing${s.count === 1 ? '' : 's'}: ${subjectOf(def, 'en').toLowerCase()} ` +
      `${def.dealSlug ? DEALS[def.dealSlug]!.en : 'for sale and rent'} in ${placeOf(def, 'en')} on sivrce.${perM2} ` +
      `Prices from ${formatUSD(s.minPrice)}. AI price estimate, interactive 3D map, direct owner contact.`
    )
  }
  if (loc === 'ru') {
    const perM2 = s.avgPerM2 ? ` Средняя цена ${formatUSD(s.avgPerM2)}/м².` : ''
    return (
      `${h1Of(def, 'ru')} — ${s.count} ${ruPlural(s.count, 'проверенное объявление', 'проверенных объявления', 'проверенных объявлений')} ` +
      `на sivrce.${perM2} Цены от ${formatUSD(s.minPrice)}. AI-оценка цены, 3D-карта, прямой контакт с владельцем.`
    )
  }
  const perM2 = s.avgPerM2 ? ` საშუალო ფასი ${formatUSD(s.avgPerM2)}/მ².` : ''
  const dealKa = def.dealSlug ? DEALS[def.dealSlug]!.ka : 'იყიდება და ქირავდება'
  return (
    `${subjectOf(def)} ${dealKa} ${placeOf(def)} — ${s.count} ვერიფიცირებული განცხადება ` +
    `sivrce-ზე.${perM2} ფასები ${formatUSD(s.minPrice)}-დან. AI ფასის შეფასება, 3D რუკა, პირდაპირი კონტაქტი მესაკუთრესთან.`
  )
}

/** Intro paragraph under the grid — unique per page via live stats. */
export function introOf(def: SeoPageDef, loc: SeoLoc = 'ka'): string {
  const s = statsOf(def.listings)
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
    ? `საშუალო კვადრატულის ფასი ${formatUSD(s.avgPerM2)}/მ²-ს შეადგენს, ხოლო დიაპაზონი ${formatUSD(s.minPrice)}-დან ${formatUSD(s.maxPrice)}-მდე იცვლება.`
    : `ფასები ${formatUSD(s.minPrice)}-დან იწყება.`
  return (
    `${where} ამჟამად ${s.count} აქტიური განცხადებაა: ${subjectOf(def).toLowerCase()} ${dealKa}. ` +
    `${perM2} ყველა განცხადება მოწმდება sivrce-ის ვერიფიკაციის სისტემით, ` +
    `AI კი თითოეულ ფასს ბაზრის რეალურ მაჩვენებლებთან ადარებს — ასე ათასობით მყიდველი და მოიჯარე ` +
    `ყოველდღე პოულობს საუკეთესო ვარიანტს ერთ სივრცეში.`
  )
}

export interface Faq {
  q: string
  a: string
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
      a: s.avgPerM2
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
      a: `უმეტესი მესაკუთრე ითხოვს პირველი და ბოლო თვის გადასახადს. გრძელვადიანი ქირის შემთხვევაში ფასი ხშირად მოლაპარაკებადია — დაუკავშირდით აგენტს პირდაპირ განცხადებიდან.`,
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
export function dealLabel(slug: string, loc: SeoLoc): string {
  const d = DEALS[slug]!
  if (loc === 'en') return `For ${d.enNoun}`
  if (loc === 'ru') return d.ruNoun
  return d.ka
}

export function breadcrumbsOf(def: SeoPageDef, loc: SeoLoc = 'ka', prefix: string = locPrefix(loc)): Crumb[] {
  const p = prefix
  const home = loc === 'ka' ? 'მთავარი' : loc === 'en' ? 'Home' : 'Главная'
  const crumbs: Crumb[] = [{ name: home, href: p || '/' }]
  if (def.dealSlug) {
    crumbs.push({ name: dealLabel(def.dealSlug, loc), href: `${p}/${def.dealSlug}` })
    if (def.typeSlug)
      crumbs.push({ name: TYPES[def.typeSlug]![loc], href: `${p}/${def.dealSlug}/${def.typeSlug}` })
    if (def.rooms)
      crumbs.push({ name: roomLabel(def.rooms, loc), href: `${p}/${def.dealSlug}/apartments-${def.rooms}` })
    if (def.city)
      crumbs.push({
        name: def.city[loc === 'ka' ? 'ka' : loc],
        href: def.typeSlug
          ? `${p}/${def.dealSlug}/${def.rooms ? `apartments-${def.rooms}` : def.typeSlug}/${def.city.slug}`
          : `${p}/${def.dealSlug}/${def.city.slug}`,
      })
    if (def.district)
      crumbs.push({ name: def.district[loc === 'ka' ? 'ka' : loc], href: `${p}${def.path}` })
  } else if (def.city) {
    crumbs.push({ name: def.city[loc === 'ka' ? 'ka' : loc], href: `${p}/${def.city.slug}` })
    if (def.district) crumbs.push({ name: def.district[loc === 'ka' ? 'ka' : loc], href: `${p}${def.path}` })
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
  const name = (g: GeoLoc) => (loc === 'ka' ? g.ka : loc === 'en' ? g.en : g.ru)

  const dealSwitch = def.dealSlug
    ? (() => {
        const other = def.dealSlug === 'sale' ? 'rent' : 'sale'
        const rest = [def.rooms ? `apartments-${def.rooms}` : def.typeSlug, def.city?.slug, def.district?.slug].filter(Boolean) as string[]
        return has([other, ...rest])
          ? { label: dealLabel(other, loc), href: `${p}/${[other, ...rest].join('/')}` }
          : undefined
      })()
    : undefined

  const types: LinkChips['types'] = []
  if (def.dealSlug) {
    const allTypes = loc === 'ka' ? 'ყველა ტიპი' : loc === 'en' ? 'All types' : 'Все типы'
    types.push({
      label: allTypes,
      href: def.city ? `${p}/${def.dealSlug}/${def.city.slug}` : `${p}/${def.dealSlug}`,
      active: !def.typeSlug,
    })
    for (const t of Object.keys(TYPES)) {
      const slug = [def.dealSlug, t, def.city?.slug].filter(Boolean) as string[]
      if (has(slug)) types.push({ label: TYPES[t]![loc], href: `${p}/${slug.join('/')}`, active: def.typeSlug === t && !def.rooms })
    }
  }

  const rooms: LinkChips['rooms'] = []
  if (def.dealSlug && (def.typeSlug === 'apartments' || def.rooms)) {
    for (const n of [1, 2, 3, 4] as const) {
      const typePart = `apartments-${n}`
      const slug = [def.dealSlug, typePart, def.city?.slug, def.district?.slug].filter(Boolean) as string[]
      if (has(slug)) {
        rooms.push({ label: roomLabel(n, loc), href: `${p}/${slug.join('/')}`, active: def.rooms === n })
      }
    }
  }

  const geo: LinkChips['geo'] = []
  if (def.kind === 'deal' || def.kind === 'deal-type') {
    for (const c of CITIES) {
      const slug = [def.dealSlug!, def.rooms ? `apartments-${def.rooms}` : def.typeSlug, c.slug].filter(Boolean) as string[]
      if (has(slug)) geo.push({ label: name(c), href: `${p}/${slug.join('/')}`, active: false })
    }
  } else if (def.kind === 'deal-city' || def.kind === 'deal-type-city') {
    for (const d of DISTRICTS.filter((x) => x.citySlug === def.city!.slug)) {
      const typePart = def.rooms ? `apartments-${def.rooms}` : def.typeSlug
      const slug = typePart
        ? [def.dealSlug!, typePart, def.city!.slug, d.slug]
        : undefined
      if (slug && has(slug)) geo.push({ label: name(d), href: `${p}/${slug.join('/')}`, active: false })
    }
  } else if (def.kind === 'city') {
    for (const d of DISTRICTS.filter((x) => x.citySlug === def.city!.slug)) {
      const slug = [def.city!.slug, d.slug]
      if (has(slug)) geo.push({ label: name(d), href: `${p}/${slug.join('/')}`, active: false })
    }
  }

  return { dealSwitch, types, rooms, geo }
}
