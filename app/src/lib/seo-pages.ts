/**
 * SIVRCE — Programmatic SEO pages engine
 * Single source of truth for deal × type × city × district landing pages.
 * Routes are parsed by src/app/[...seo]/page.tsx; only combos with ≥1 real
 * listing are generated (thin/empty pages hurt rankings).
 */

import { filterListings, formatUSD, type DealType, type Listing, type PropType } from '@/data/listings'

/* ————— Registries ————— */

export interface GeoLoc {
  slug: string
  ka: string // nominative: თბილისი
  loc: string // locative for H1: თბილისში
  en: string
}

export const DEALS: Record<string, { deal: DealType; ka: string; noun: string }> = {
  sale: { deal: 'sale', ka: 'იყიდება', noun: 'ყიდვა' },
  rent: { deal: 'rent', ka: 'ქირავდება', noun: 'ქირა' },
  // "ბინები დღიურად" — top Georgian real-estate query. Listings below render
  // /daily, /daily/apartments, /daily/apartments/tbilisi(/old-tbilisi), etc.
  daily: { deal: 'daily', ka: 'დღიურად', noun: 'დღიური ქირა' },
}

export const TYPES: Record<string, { type: PropType; ka: string; kaSingle: string }> = {
  apartments: { type: 'apartment', ka: 'ბინები', kaSingle: 'ბინა' },
  houses: { type: 'house', ka: 'სახლები და აგარაკები', kaSingle: 'სახლი' },
  commercial: { type: 'commercial', ka: 'კომერციული ფართები', kaSingle: 'კომერციული ფართი' },
  land: { type: 'land', ka: 'მიწის ნაკვეთები', kaSingle: 'მიწის ნაკვეთი' },
}

export const CITIES: GeoLoc[] = [
  { slug: 'tbilisi', ka: 'თბილისი', loc: 'თბილისში', en: 'Tbilisi' },
  { slug: 'batumi', ka: 'ბათუმი', loc: 'ბათუმში', en: 'Batumi' },
  { slug: 'kutaisi', ka: 'ქუთაისი', loc: 'ქუთაისში', en: 'Kutaisi' },
]

export type District = GeoLoc & { citySlug: string }

export const DISTRICTS: District[] = [
  { slug: 'vake', ka: 'ვაკე', loc: 'ვაკეში', en: 'Vake', citySlug: 'tbilisi' },
  { slug: 'saburtalo', ka: 'საბურთალო', loc: 'საბურთალოზე', en: 'Saburtalo', citySlug: 'tbilisi' },
  { slug: 'mtatsminda', ka: 'მთაწმინდა', loc: 'მთაწმინდაზე', en: 'Mtatsminda', citySlug: 'tbilisi' },
  { slug: 'didi-dighomi', ka: 'დიდი დიღომი', loc: 'დიდ დიღომში', en: 'Didi Dighomi', citySlug: 'tbilisi' },
  { slug: 'ortachala', ka: 'ორთაჭალა', loc: 'ორთაჭალაში', en: 'Ortachala', citySlug: 'tbilisi' },
  { slug: 'isani', ka: 'ისანი', loc: 'ისანში', en: 'Isani', citySlug: 'tbilisi' },
  { slug: 'gldani', ka: 'გლდანი', loc: 'გლდანში', en: 'Gldani', citySlug: 'tbilisi' },
  { slug: 'avlabari', ka: 'ავლაბარი', loc: 'ავლაბარში', en: 'Avlabari', citySlug: 'tbilisi' },
  { slug: 'tskneti', ka: 'წყნეთი', loc: 'წყნეთში', en: 'Tskneti', citySlug: 'tbilisi' },
  { slug: 'tskhvarichamia', ka: 'ცხვარიჭამია', loc: 'ცხვარიჭამიაში', en: 'Tskhvarichamia', citySlug: 'tbilisi' },
  { slug: 'akhali-bulvari', ka: 'ახალი ბულვარი', loc: 'ახალ ბულვარზე', en: 'New Boulevard', citySlug: 'batumi' },
  { slug: 'dzveli-batumi', ka: 'ძველი ბათუმი', loc: 'ძველ ბათუმში', en: 'Old Batumi', citySlug: 'batumi' },
  { slug: 'makhinjauri', ka: 'მახინჯაური', loc: 'მახინჯაურში', en: 'Makhinjauri', citySlug: 'batumi' },
  { slug: 'kutaisi-centri', ka: 'ცენტრი', loc: 'ცენტრში', en: 'Center', citySlug: 'kutaisi' },
  { slug: 'avtokarkhana', ka: 'ავტოქარხანა', loc: 'ავტოქარხანის უბანში', en: 'Avtokarkhana', citySlug: 'kutaisi' },
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
  city?: GeoLoc
  district?: District
  listings: Listing[]
}

function listingsFor(d: {
  dealSlug?: string
  typeSlug?: string
  city?: GeoLoc
  district?: District
}): Listing[] {
  return filterListings({
    deal: d.dealSlug ? DEALS[d.dealSlug]?.deal : undefined,
    type: d.typeSlug ? TYPES[d.typeSlug]?.type : undefined,
    city: d.city?.ka,
    district: d.district?.ka,
  })
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
  const deal = DEALS[a]
  if (!deal) return null
  const base = { dealSlug: a }

  if (!b) {
    const listings = listingsFor(base)
    return listings.length ? { kind: 'deal', path: `/${a}`, ...base, listings } : null
  }

  const typeSlug = TYPES[b] ? b : undefined
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
    const listings = listingsFor({ ...base, typeSlug })
    return listings.length
      ? { kind: 'deal-type', path: `/${a}/${b}`, ...base, typeSlug, listings }
      : null
  }

  const cityC = cityBySlug(c)
  if (!cityC) return null
  if (!d) {
    const listings = listingsFor({ ...base, typeSlug, city: cityC })
    return listings.length
      ? { kind: 'deal-type-city', path: `/${a}/${b}/${c}`, ...base, typeSlug, city: cityC, listings }
      : null
  }

  const dist = districtBySlug(d)
  if (!dist || dist.citySlug !== cityC.slug) return null
  const listings = listingsFor({ ...base, typeSlug, city: cityC, district: dist })
  return listings.length
    ? {
        kind: 'deal-type-city-district',
        path: `/${a}/${b}/${c}/${d}`,
        ...base,
        typeSlug,
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
  const subject = subjectOf(def).toLowerCase()
  const where = def.district ? def.district.loc : def.city ? def.city.loc : 'საქართველოში'
  const faqs: Faq[] = [
    {
      q: `რა ღირს ${subject} ${where}?`,
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
      q: `რა პირობებით ქირავდება ${subject} ${where}?`,
      a: `უმეტესი მესაკუთრე ითხოვს პირველი და ბოლო თვის გადასახადს. გრძელვადიანი ქირის შემთხვევაში ფასი ხშირად მოლაპარაკებადია — დაუკავშირდით აგენტს პირდაპირ განცხადებიდან.`,
    })
  }
  if (def.dealSlug === 'daily') {
    faqs.push({
      q: `რა ღირს ${subject} დღიურად ${where}?`,
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

  return { dealSwitch, types, geo }
}
