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
  { slug: 'avlabari', ka: 'ავლაბარი', loc: 'ავლაბარში', en: 'Avlabari', ru: 'Авлабари', citySlug: 'tbilisi' },
  { slug: 'tskneti', ka: 'წყნეთი', loc: 'წყნეთში', en: 'Tskneti', ru: 'Цкнети', citySlug: 'tbilisi' },
  { slug: 'tskhvarichamia', ka: 'ცხვარიჭამია', loc: 'ცხვარიჭამიაში', en: 'Tskhvarichamia', ru: 'Цхваричамия', citySlug: 'tbilisi' },
  // ponytail: no inventory here today — pages self-throttle (≥1 listing rule) and go
  // live free the moment real listings land (ss.ge ranks with exactly these districts).
  { slug: 'old-tbilisi', ka: 'ძველი თბილისი', loc: 'ძველ თბილისში', en: 'Old Tbilisi', ru: 'Старый Тбилиси', citySlug: 'tbilisi' },
  { slug: 'varketili', ka: 'ვარკეთილი', loc: 'ვარკეთილში', en: 'Varketili', ru: 'Варкетили', citySlug: 'tbilisi' },
  { slug: 'chughureti', ka: 'ჩუღურეთი', loc: 'ჩუღურეთში', en: 'Chughureti', ru: 'Чугурети', citySlug: 'tbilisi' },
  { slug: 'nadzaladevi', ka: 'ნაძალადევი', loc: 'ნაძალადევში', en: 'Nadzaladevi', ru: 'Надзаладеви', citySlug: 'tbilisi' },
  { slug: 'akhali-bulvari', ka: 'ახალი ბულვარი', loc: 'ახალ ბულვარზე', en: 'New Boulevard', ru: 'Новый бульвар', citySlug: 'batumi' },
  { slug: 'dzveli-batumi', ka: 'ძველი ბათუმი', loc: 'ძველ ბათუმში', en: 'Old Batumi', ru: 'Старый Батуми', citySlug: 'batumi' },
  { slug: 'makhinjauri', ka: 'მახინჯაური', loc: 'მახინჯაურში', en: 'Makhinjauri', ru: 'Махинджаури', citySlug: 'batumi' },
  { slug: 'kutaisi-centri', ka: 'ცენტრი', loc: 'ცენტრში', en: 'Center', ru: 'Центр', citySlug: 'kutaisi' },
  { slug: 'avtokarkhana', ka: 'ავტოქარხანა', loc: 'ავტოქარხანის უბანში', en: 'Avtokarkhana', ru: 'Автокархана', citySlug: 'kutaisi' },
]

const cityBySlug = (s: string) => CITIES.find((c) => c.slug === s)
const districtBySlug = (s: string) => DISTRICTS.find((d) => d.slug === s)

/* ————— Page model ————— */

export type SeoKind =
  | 'deal'
  | 'deal-type'
  | 'deal-city'
  | 'deal-type-city'
  | 'deal-type-city-district'
  | 'city'
  | 'city-district'

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
      return listings.length ? { kind: 'city', path: `/${a}`, city, listings } : null
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

/* ————— Copy ————— */

export interface SeoStats {
  count: number
  avgPerM2: number
  minPrice: number
  maxPrice: number
}

export function statsOf(listings: Listing[]): SeoStats {
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

function subjectOf(def: SeoPageDef): string {
  if (def.rooms) return `${roomLabel(def.rooms)} ${TYPES.apartments.ka}`
  if (def.typeSlug) return TYPES[def.typeSlug]!.ka
  return 'უძრავი ქონება'
}

function placeOf(def: SeoPageDef): string {
  if (def.district) return def.district.loc
  if (def.city) return def.city.loc
  return 'საქართველოში'
}

/** H1 — matches the exact Georgian query pattern, e.g. "ბინები იყიდება ვაკეში" */
export function h1Of(def: SeoPageDef): string {
  const dealKa = def.dealSlug ? DEALS[def.dealSlug]!.ka : 'იყიდება და ქირავდება'
  return `${subjectOf(def)} ${dealKa} ${placeOf(def)}`
}

export function titleOf(def: SeoPageDef): string {
  const s = statsOf(def.listings)
  const suffix = def.city && def.district ? `, ${def.city.ka}` : ''
  return `${h1Of(def)}${suffix} — ${s.count} განცხადება`
}

export function descriptionOf(def: SeoPageDef): string {
  const s = statsOf(def.listings)
  const perM2 = s.avgPerM2 ? ` საშუალო ფასი ${formatUSD(s.avgPerM2)}/მ².` : ''
  const dealKa = def.dealSlug ? DEALS[def.dealSlug]!.ka : 'იყიდება და ქირავდება'
  return (
    `${subjectOf(def)} ${dealKa} ${placeOf(def)} — ${s.count} ვერიფიცირებული განცხადება ` +
    `sivrce-ზე.${perM2} ფასები ${formatUSD(s.minPrice)}-დან. AI ფასის შეფასება, 3D რუკა, პირდაპირი კონტაქტი მესაკუთრესთან.`
  )
}

/** Intro paragraph under the grid — unique per page via live stats. */
export function introOf(def: SeoPageDef): string {
  const s = statsOf(def.listings)
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

export function faqsOf(def: SeoPageDef): Faq[] {
  const s = statsOf(def.listings)
  // Singular subject — Georgians ask "რა ღირს ბინა ვაკეში?", not plural.
  const single = def.rooms
    ? `${roomLabel(def.rooms)} ${TYPES.apartments.kaSingle}`
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

/* ————— Internal linking ————— */

export interface Crumb {
  name: string
  href: string
}

export function breadcrumbsOf(def: SeoPageDef): Crumb[] {
  const crumbs: Crumb[] = [{ name: 'მთავარი', href: '/' }]
  if (def.dealSlug) {
    crumbs.push({ name: DEALS[def.dealSlug]!.ka, href: `/${def.dealSlug}` })
    if (def.typeSlug)
      crumbs.push({ name: TYPES[def.typeSlug]!.ka, href: `/${def.dealSlug}/${def.typeSlug}` })
    if (def.city)
      crumbs.push({
        name: def.city.ka,
        href: def.typeSlug
          ? `/${def.dealSlug}/${def.typeSlug}/${def.city.slug}`
          : `/${def.dealSlug}/${def.city.slug}`,
      })
    if (def.district)
      crumbs.push({ name: def.district.ka, href: def.path })
  } else if (def.city) {
    crumbs.push({ name: def.city.ka, href: `/${def.city.slug}` })
    if (def.district) crumbs.push({ name: def.district.ka, href: def.path })
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

export function linkChipsOf(def: SeoPageDef): LinkChips {
  const has = (slug: string[]) => parseSeoSlug(slug) !== null

  const dealSwitch = def.dealSlug
    ? (() => {
        const other = def.dealSlug === 'sale' ? 'rent' : 'sale'
        const rest = [def.typeSlug, def.city?.slug, def.district?.slug].filter(Boolean) as string[]
        return has([other, ...rest])
          ? { label: DEALS[other]!.ka, href: `/${[other, ...rest].join('/')}` }
          : undefined
      })()
    : undefined

  const types: LinkChips['types'] = []
  if (def.dealSlug) {
    types.push({
      label: 'ყველა ტიპი',
      href: def.city ? `/${def.dealSlug}/${def.city.slug}` : `/${def.dealSlug}`,
      active: !def.typeSlug,
    })
    for (const t of Object.keys(TYPES)) {
      const slug = [def.dealSlug, t, def.city?.slug].filter(Boolean) as string[]
      if (has(slug)) types.push({ label: TYPES[t]!.ka, href: `/${slug.join('/')}`, active: def.typeSlug === t })
    }
  }

  const rooms: LinkChips['rooms'] = []
  if (def.dealSlug && (def.typeSlug === 'apartments' || def.rooms)) {
    for (const n of [1, 2, 3, 4] as const) {
      const typePart = `apartments-${n}`
      const slug = [def.dealSlug, typePart, def.city?.slug, def.district?.slug].filter(Boolean) as string[]
      if (has(slug)) {
        rooms.push({ label: roomLabel(n), href: `/${slug.join('/')}`, active: def.rooms === n })
      }
    }
  }

  const geo: LinkChips['geo'] = []
  if (def.kind === 'deal' || def.kind === 'deal-type') {
    for (const c of CITIES) {
      const slug = [def.dealSlug!, def.typeSlug, c.slug].filter(Boolean) as string[]
      if (has(slug)) geo.push({ label: c.ka, href: `/${slug.join('/')}`, active: false })
    }
  } else if (def.kind === 'deal-city' || def.kind === 'deal-type-city') {
    for (const d of DISTRICTS.filter((x) => x.citySlug === def.city!.slug)) {
      const slug = def.typeSlug
        ? [def.dealSlug!, def.typeSlug, def.city!.slug, d.slug]
        : undefined
      if (slug && has(slug)) geo.push({ label: d.ka, href: `/${slug.join('/')}`, active: false })
    }
  } else if (def.kind === 'city') {
    for (const d of DISTRICTS.filter((x) => x.citySlug === def.city!.slug)) {
      const slug = [def.city!.slug, d.slug]
      if (has(slug)) geo.push({ label: d.ka, href: `/${slug.join('/')}`, active: false })
    }
  }

  return { dealSwitch, types, rooms, geo }
}
