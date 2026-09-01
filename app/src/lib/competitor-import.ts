/**
 * Import competitor listing URLs (ss.ge, myhome.ge, livo.ge, korter.ge) → normalized text card.
 * ponytail: __NEXT_DATA__ + TNET API + korter INITIAL_STATE — no Playwright, no new deps.
 * Upgrade path: Playwright fallback if CF blocks API/HTML fetch.
 */

import type { DealType, PropType } from '@/data/listings'
import { canonicalizeDistrict } from '@/lib/district-canon'
import { extractState } from '@/lib/directory/sync-korter'
import type { DictKey } from '@/lib/i18n/context'
import { splitStreetHouse } from '@/lib/map/geocode'

/** Same key as AddListingClient — keep in sync. */
export const ADD_LISTING_DRAFT_KEY = 'sivrce.add-listing.v1'

export type CompetitorSource = 'ss.ge' | 'myhome.ge' | 'korter.ge'

export type ImportedListing = {
  source: CompetitorSource
  sourceId: string
  sourceUrl: string
  title: string
  deal: 'sale' | 'rent' | 'daily' | 'pledge' | 'unknown'
  propType: string
  priceUsd: number | null
  priceGel: number | null
  pricePerM2Usd: number | null
  city: string
  district: string
  subdistrict: string | null
  street: string | null
  address: string
  area: number | null
  rooms: number | null
  bedrooms: number | null
  floor: number | null
  totalFloors: number | null
  condition: string | null
  status: string | null
  description: string
  features: string[]
  phone: string | null
  lat: number | null
  lng: number | null
  metro: string | null
  agency: string | null
  views: number | null
  score: number
  scoreNotes: string[]
  /** Extra fields for add-listing draft (korter / future sources). */
  bathroomCount?: number | null
  kitchenArea?: number | null
  videoUrl?: string | null
  contactName?: string | null
}

const UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36'

const BASE_M2: Record<string, number> = {
  apartment: 1150,
  house: 720,
  villa: 680,
  commercial: 1350,
  land: 95,
  hotel: 1100,
  ბინა: 1150,
  სახლი: 720,
  კომერციული: 1350,
  მიწა: 95,
}

const SS_BOOL_FEATURES: [keyof SsApp, string][] = [
  ['airConditioning', 'კონდიციონერი'],
  ['balcony', 'აივანი'],
  ['elevator', 'ლიფტი'],
  ['furniture', 'ავეჯი'],
  ['garage', 'გარაჟი'],
  ['heating', 'გათბობა'],
  ['internet', 'ინტერნეტი'],
  ['naturalGas', 'ბუნებრივი აირი'],
  ['wiFi', 'Wi‑Fi'],
  ['withPool', 'აუზი'],
  ['viewOnYard', 'ეზოსკენი'],
  ['viewOnStreet', 'ქუჩისკენი'],
  ['securityAlarm', 'სიგნალიზაცია'],
  ['ironDoor', 'რკინის კარი'],
  ['isPetFriendly', 'შინაური'],
]

type SsApp = Record<string, unknown> & {
  applicationId?: number
  title?: string
  address?: {
    cityTitle?: string
    districtTitle?: string
    subdistrictTitle?: string
    streetTitle?: string
    streetNumber?: string
  }
  price?: { priceUsd?: number; priceGeo?: number; unitPriceUsd?: number }
  description?: { ka?: string; en?: string; allLanguageTogather?: string }
  realEstateDealType?: string
  realEstateType?: string
  rooms?: string
  bedrooms?: number
  floor?: string
  floors?: string
  totalArea?: string
  state?: string
  realEstateStatus?: string
  applicationPhones?: { phoneNumber?: string }[]
  locationLatitude?: number
  locationLongitude?: number
  mapInfo?: { subway_station?: string }
  agencyName?: string
  contactPerson?: string
  viewCount?: number
}

type MyStatement = Record<string, unknown> & {
  id?: number
  dynamic_title?: string
  deal_type_id?: number
  real_estate_type_id?: number
  city_name?: string
  district_name?: string
  urban_name?: string
  address?: string
  area?: number
  floor?: number
  total_floors?: number
  total_price?: number
  currency_id?: number
  price?: Record<string, { price_total?: number; price_square?: number }>
  condition?: string
  comment?: string
  user_phone_number?: string
  owner_name?: string
  lat?: number
  lng?: number
  views?: number
  parameters?: { display_name?: string; key?: string }[]
  room_type_id?: number
  bedroom_type_id?: number
}

export function detectCompetitorSource(url: string): CompetitorSource | null {
  const u = url.toLowerCase()
  if (/ss\.ge|home\.ss\.ge/.test(u)) return 'ss.ge'
  if (/myhome\.ge|livo\.ge/.test(u)) return 'myhome.ge'
  if (/korter\.ge/.test(u)) return 'korter.ge'
  return null
}

export function extractCompetitorId(url: string): string | null {
  const pr = url.match(/\/pr\/(?:[\w-]*-)?(\d{5,})(?:[/?#]|$)/i)
  if (pr) return pr[1]!
  if (/korter\.ge/i.test(url)) {
    const ko = url.match(/\/(\d{5,})(?:[/?#]|$)/)
    if (ko) return ko[1]!
  }
  const tail = url.match(/-(\d{6,})(?:[/?#]|$)/)
  if (tail) return tail[1]!
  const q = url.match(/[?&](?:id|applicationId|statementId)=(\d+)/i)
  if (q) return q[1]!
  return null
}

function normalizeKorterUrl(url: string): string {
  const raw = url.startsWith('http') ? url : `https://korter.ge${url.startsWith('/') ? '' : '/'}${url}`
  const u = new URL(raw)
  u.pathname = u.pathname.replace(/^\/(ka|en|ru)(?=\/)/, '')
  return u.toString().replace(/\/$/, '') || u.toString()
}

function num(v: unknown): number | null {
  if (v == null || v === '') return null
  const n = Number(String(v).replace(',', '.'))
  return Number.isFinite(n) ? n : null
}

function stripHtml(s: string): string {
  return s.replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, '').replace(/\s+\n/g, '\n').trim()
}

function roomsFromTitle(title?: string): number | null {
  if (!title) return null
  const ka = title.match(/(\d+)\s*[- ]?\s*ოთახ/i)
  if (ka) return num(ka[1])
  const en = title.match(/(\d+)\s*[- ]?\s*room/i)
  if (en) return num(en[1])
  return null
}

function dealFromSs(text?: string): ImportedListing['deal'] {
  const t = (text ?? '').toLowerCase()
  if (/იყიდებ|iyideb|for sale|прода/i.test(t)) return 'sale'
  if (/ქირავ|qirav|for rent|сда/i.test(t)) return 'rent'
  if (/დღიურ|daily/i.test(t)) return 'daily'
  if (/გირავ|pledge|залог/i.test(t)) return 'pledge'
  return 'unknown'
}

function dealFromMyhome(id?: number, title?: string): ImportedListing['deal'] {
  if (id === 1) return 'sale'
  if (id === 2) return 'rent'
  if (id === 3) return 'daily'
  if (id === 4) return 'pledge'
  return dealFromSs(title)
}

function ssFeatures(app: SsApp): string[] {
  const out: string[] = []
  for (const [k, label] of SS_BOOL_FEATURES) {
    if (app[k] === true) out.push(label)
  }
  if (app.balcony_Loggia) out.push(`ლოჯია/აივანი ${app.balcony_Loggia}`)
  if (app.project) out.push(String(app.project))
  return out
}

function myhomeFeatures(st: MyStatement): string[] {
  return (st.parameters ?? []).map((p) => p.display_name).filter(Boolean) as string[]
}

function scoreListing(row: Omit<ImportedListing, 'score' | 'scoreNotes'>): { score: number; scoreNotes: string[] } {
  const notes: string[] = []
  let score = 100

  const must: (keyof typeof row)[] = ['title', 'address', 'description']
  for (const k of must) {
    if (!row[k] || String(row[k]).trim().length < 2) {
      score -= 15
      notes.push(`ნაკლული: ${String(k)}`)
    }
  }
  if (row.priceUsd == null && row.priceGel == null) {
    score -= 20
    notes.push('ფასი არ არის')
  }
  if (row.area == null) {
    score -= 10
    notes.push('ფართი არ არის')
  }
  if (row.lat == null || row.lng == null) {
    score -= 5
    notes.push('კოორდინატები არ არის')
  }

  const baseline = BASE_M2[row.propType.toLowerCase()] ?? BASE_M2.apartment
  if (row.pricePerM2Usd != null && baseline) {
    const ratio = row.pricePerM2Usd / baseline
    if (ratio <= 0.85) {
      score += 8
      notes.push('$/მ² ბაზარზე დაბალი')
    } else if (ratio >= 1.25) {
      score -= 8
      notes.push('$/მ² ბაზარზე მაღალი')
    }
  }

  if (row.metro) {
    score += 5
    notes.push(`მეტრო: ${row.metro}`)
  }
  if (row.features.length >= 6) {
    score += 5
    notes.push('მდიდარი აღჭურვილობა')
  }
  if ((row.description?.length ?? 0) > 120) {
    score += 3
    notes.push('სრული აღწერა')
  }
  if ((row.views ?? 0) > 500) {
    score += 2
    notes.push('მაღალი ნახვები')
  }

  score = Math.max(0, Math.min(100, Math.round(score)))
  if (!notes.length) notes.push('სრული ბარათი')
  return { score, scoreNotes: notes }
}

async function fetchText(url: string, referer: string): Promise<string> {
  const res = await fetch(url, {
    headers: {
      'User-Agent': UA,
      Accept: 'text/html,application/xhtml+xml',
      'Accept-Language': 'ka-GE,ka;q=0.9,en;q=0.8',
      Referer: referer,
    },
    redirect: 'follow',
    signal: AbortSignal.timeout(25_000),
  })
  if (!res.ok) throw new Error(`HTTP ${res.status} ${url}`)
  return res.text()
}

function parseSsNext(html: string): SsApp {
  const m = html.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/)
  if (!m) throw new Error('ss.ge: __NEXT_DATA__ missing (CF or layout change)')
  const app = JSON.parse(m[1]!).props?.pageProps?.applicationData as SsApp | undefined
  if (!app?.applicationId) throw new Error('ss.ge: applicationData missing')
  return app
}

async function importSs(url: string, id: string): Promise<ImportedListing> {
  const canonical = url.startsWith('http') ? url : `https://ss.ge${url.startsWith('/') ? '' : '/'}${url}`
  const html = await fetchText(canonical, 'https://ss.ge/')
  const app = parseSsNext(html)
  const addr = app.address ?? {}
  const street = [addr.streetTitle, addr.streetNumber].filter(Boolean).join(' ').trim() || null
  const address = [addr.cityTitle, addr.districtTitle, addr.subdistrictTitle, street].filter(Boolean).join(', ')
  const desc =
    app.description?.ka?.trim() ||
    app.description?.en?.trim() ||
    stripHtml(String(app.description?.allLanguageTogather ?? ''))
  const phone = app.applicationPhones?.[0]?.phoneNumber
    ? `+995 ${app.applicationPhones[0].phoneNumber}`
    : null
  const area = num(app.totalArea)
  const priceUsd = num(app.price?.priceUsd)
  const priceGel = num(app.price?.priceGeo)
  const pricePerM2Usd = num(app.price?.unitPriceUsd) ?? (priceUsd && area ? Math.round(priceUsd / area) : null)

  const base: Omit<ImportedListing, 'score' | 'scoreNotes'> = {
    source: 'ss.ge',
    sourceId: String(app.applicationId ?? id),
    sourceUrl: canonical,
    title: app.title ?? '',
    deal: dealFromSs(app.realEstateDealType),
    propType: app.realEstateType ?? 'ბინა',
    priceUsd,
    priceGel,
    pricePerM2Usd,
    city: addr.cityTitle ?? '',
    district: addr.districtTitle ?? '',
    subdistrict: addr.subdistrictTitle ?? null,
    street,
    address,
    area,
    rooms: num(app.rooms),
    bedrooms: num(app.bedrooms),
    floor: num(app.floor),
    totalFloors: num(app.floors),
    condition: app.state ?? null,
    status: app.realEstateStatus ?? null,
    description: desc,
    features: ssFeatures(app),
    phone,
    lat: num(app.locationLatitude),
    lng: num(app.locationLongitude),
    metro: app.mapInfo?.subway_station ?? null,
    agency: app.agencyName ?? app.contactPerson ?? null,
    views: num(app.viewCount),
  }
  const { score, scoreNotes } = scoreListing(base)
  return { ...base, score, scoreNotes }
}

async function importMyhome(url: string, id: string): Promise<ImportedListing> {
  const res = await fetch(`https://api-statements.tnet.ge/v1/statements/${id}`, {
    headers: {
      'User-Agent': UA,
      Origin: 'https://www.myhome.ge',
      Referer: 'https://www.myhome.ge/',
      'X-Website-Key': 'myhome',
    },
    signal: AbortSignal.timeout(20_000),
  })
  if (!res.ok) throw new Error(`myhome API HTTP ${res.status}`)
  const json = (await res.json()) as { result?: boolean; data?: { statement?: MyStatement } }
  const st = json.data?.statement
  if (!st?.id) throw new Error('myhome: statement not found')

  const usd = st.price?.['2']
  const gel = st.price?.['1']
  const priceUsd = num(st.total_price) ?? num(usd?.price_total)
  const priceGel = num(gel?.price_total)
  const area = num(st.area)
  const pricePerM2Usd = num(usd?.price_square) ?? (priceUsd && area ? Math.round(priceUsd / area) : null)
  const propTypes: Record<number, string> = { 1: 'ბინა', 2: 'სახლი', 3: 'კომერციული', 4: 'მიწა', 5: 'აგარაკი' }
  const canonical =
    url.startsWith('http') ? url : `https://www.myhome.ge/ka/pr/${st.id}/`

  const base: Omit<ImportedListing, 'score' | 'scoreNotes'> = {
    source: 'myhome.ge',
    sourceId: String(st.id),
    sourceUrl: canonical,
    title: st.dynamic_title ?? '',
    deal: dealFromMyhome(st.deal_type_id, st.dynamic_title),
    propType: propTypes[st.real_estate_type_id ?? 1] ?? 'ბინა',
    priceUsd,
    priceGel,
    pricePerM2Usd,
    city: st.city_name ?? '',
    district: st.district_name ?? '',
    subdistrict: st.urban_name ?? null,
    street: st.address?.trim() || null,
    address: [st.city_name, st.district_name, st.urban_name, st.address?.trim()].filter(Boolean).join(', '),
    area,
    rooms: roomsFromTitle(st.dynamic_title),
    bedrooms: null,
    floor: num(st.floor),
    totalFloors: num(st.total_floors),
    condition: st.condition ?? null,
    status: null,
    description: stripHtml(st.comment ?? ''),
    features: myhomeFeatures(st),
    phone: st.user_phone_number?.includes('*') ? null : st.user_phone_number ?? null,
    lat: num(st.lat),
    lng: num(st.lng),
    metro: null,
    agency: st.owner_name ?? null,
    views: num(st.views),
  }
  const { score, scoreNotes } = scoreListing(base)
  return { ...base, score, scoreNotes }
}

type KorterLayout = {
  price?: number
  area?: number
  description?: string
  address?: string
  currency?: string
  roomCount?: number
  bedroomCount?: number
  bathroomCount?: number
  ceilingHeight?: number
  livingArea?: number
  kitchenArea?: number
  builtYear?: number
  videoLink?: string | null
  section?: string
  hasBalcony?: boolean
  hasTerrace?: boolean
  isOpenPlan?: boolean
  isMultilevel?: boolean
  isFacade?: boolean
  parking?: unknown
  propertyType?: { type?: string; name?: string; propertyTypeRoomCountLabel?: string }
  floorsByHouse?: { floorCount?: number; floorNumbers?: (string | number)[] }[]
  houses?: { floorCount?: number; constructionStatus?: string; endYear?: number }[]
}

type KorterLandingState = {
  layoutId?: number | null
  objectId?: number
  layout?: KorterLayout
  building?: {
    city?: string
    name?: string
    address?: string
    geoObjects?: { nominative?: string; isMain?: boolean }[]
  }
  constructionState?: { lat?: number; lng?: number }[] | null
  seller?: {
    name?: string
    phones?: { displayNumber?: string; hasWhatsapp?: boolean }[]
    agency?: { name?: string } | null
  }
}

type KorterPageState = {
  layoutLandingStore?: KorterLandingState
  seoStore?: { title?: string; description?: string }
  currencyStore?: { rate?: number }
}

const KORTER_PROP: Record<string, string> = {
  flat: 'ბინა',
  house: 'სახლი',
  cottage: 'აგარაკი',
  land: 'მიწა',
  commercial: 'კომერციული',
  parking: 'კომერციული',
  warehouse: 'კომერციული',
  office: 'კომერციული',
  hotel: 'სასტუმრო',
}

const KORTER_DEAL: Record<string, ImportedListing['deal']> = {
  sale: 'sale',
  rent: 'rent',
  daily: 'daily',
  daily_rent: 'daily',
}

const FEAT_LABEL_TO_DICT: Record<string, DictKey> = {
  'აივანი': 'add.f.balcony',
  'ტერასა': 'add.f.terrace',
  'პარკინგი': 'add.f.parking',
  'კონდიციონერი': 'add.f.ac',
  'ლიფტი': 'add.f.elevator',
  'ავეჯი': 'add.f.furniture',
  'გარაჟი': 'add.f.garage',
  'ინტერნეტი': 'add.f.internet',
  'ბუნებრივი აირი': 'add.f.gas',
  'სიგნალიზაცია': 'add.f.security',
  'რკინის კარი': 'add.f.ironDoor',
}

function featureLabelKeys(features: string[]): DictKey[] {
  const keys = new Set<DictKey>()
  for (const f of features) {
    const k = FEAT_LABEL_TO_DICT[f]
    if (k) keys.add(k)
  }
  return [...keys]
}

function korterLatLng(store: KorterLandingState): { lat: number; lng: number } | null {
  const cs = store.constructionState?.[0]
  if (cs?.lat != null && cs?.lng != null) return { lat: cs.lat, lng: cs.lng }
  return null
}

function korterDistrict(building?: KorterLandingState['building']): string {
  const geo = building?.geoObjects ?? []
  const sub = geo.find((g) => g.isMain === false)?.nominative ?? ''
  return canonicalizeDistrict(sub.replace(/\s*რაიონი\s*$/i, '').trim(), building?.city ?? '') || sub
}

function korterFeatures(layout: KorterLayout): string[] {
  const out: string[] = []
  if (layout.hasBalcony) out.push('აივანი')
  if (layout.hasTerrace) out.push('ტერასა')
  if (layout.isOpenPlan) out.push('გახსნილი გეგმარება')
  if (layout.isMultilevel) out.push('ორდონიანი')
  if (layout.isFacade) out.push('ფასადი')
  if (layout.parking) out.push('პარკინგი')
  if (layout.ceilingHeight) out.push(`ჭერის სიმაღლე ${layout.ceilingHeight} მ`)
  return out
}

function korterDescription(
  layout: KorterLayout,
  building: KorterLandingState['building'],
  seo?: { title?: string; description?: string },
): string {
  const direct = layout.description?.trim() ?? ''
  if (direct.length > 20) return direct
  const parts = [
    seo?.title?.trim(),
    layout.propertyType?.propertyTypeRoomCountLabel,
    building?.name ? `კომპლექსი: ${building.name}` : null,
    layout.address?.trim(),
    layout.bedroomCount != null ? `${layout.bedroomCount} საძინებელი` : null,
    layout.bathroomCount != null ? `${layout.bathroomCount} საპირფერო` : null,
    layout.kitchenArea != null ? `${layout.kitchenArea} მ² სამზარეული` : null,
    layout.builtYear ? `აშენების წელი: ${layout.builtYear}` : null,
    ...korterFeatures(layout),
  ].filter(Boolean)
  const built = parts.join('. ').replace(/\.\s*\./g, '.').trim()
  if (built.length > 20) return built.endsWith('.') ? built : `${built}.`
  const seoDesc = seo?.description?.trim() ?? ''
  return seoDesc.length > 20 ? seoDesc : built || seo?.title?.trim() || 'Korter.ge განცხადება'
}

function korterStatus(layout: KorterLayout): string | null {
  const house = layout.houses?.[0]
  if (house?.constructionStatus === 'construction') return 'add.status.construction'
  const year = layout.builtYear ?? house?.endYear
  if (year != null && year >= new Date().getFullYear() - 1) return 'add.status.new'
  if (year != null) return 'add.status.old'
  return null
}

function korterCondition(desc: string): string | null {
  const t = desc.toLowerCase()
  if (/ახალი გარემონტ|newly renovated|გარემონტებ/i.test(t)) return 'add.cond.newReno'
  if (/თეთრი კარკას|white frame|თეთრი ჩარჩ/i.test(t)) return 'add.cond.whiteFrame'
  if (/შავი კარკას|black frame|შავი ჩარჩ/i.test(t)) return 'add.cond.blackFrame'
  if (/მწვანე|green frame/i.test(t)) return 'add.cond.greenFrame'
  if (/სარემონტ|needs reno|renovation/i.test(t)) return 'add.cond.needsReno'
  return null
}

async function importKorter(url: string, id: string): Promise<ImportedListing> {
  const canonical = normalizeKorterUrl(url)
  const html = await fetchText(canonical, 'https://korter.ge/')
  const state = extractState(html) as KorterPageState | null
  const store = state?.layoutLandingStore
  if (!store?.layout) throw new Error('korter.ge: layoutLandingStore missing (404 or layout change)')
  const layout = store.layout
  const objectId = store.objectId ?? id

  const building = store.building
  const seo = state?.seoStore
  const coords = korterLatLng(store)
  const desc = korterDescription(layout, building, seo)
  const feats = korterFeatures(layout)
  const floorBlock = layout.floorsByHouse?.[0]
  const floorRaw = floorBlock?.floorNumbers?.[0]
  const totalFloors = num(floorBlock?.floorCount) ?? num(layout.houses?.[0]?.floorCount)
  const propKey = layout.propertyType?.type ?? 'flat'
  const currency = (layout.currency ?? 'USD').toUpperCase()
  const price = num(layout.price)
  const area = num(layout.area)
  const rate = num(state?.currencyStore?.rate) ?? 2.65
  const useUsd = currency === 'USD'
  const priceUsd = useUsd ? price : price != null ? Math.round(price / rate) : null
  const priceGel = !useUsd ? price : priceUsd != null ? Math.round(priceUsd * rate) : null
  const pricePerM2Usd = priceUsd && area ? Math.round(priceUsd / area) : null
  const phone = store.seller?.phones?.find((p) => p.displayNumber)?.displayNumber ?? null
  const title =
    seo?.title?.trim() ||
    layout.propertyType?.propertyTypeRoomCountLabel ||
    `${layout.roomCount ?? ''} ოთახიანი ${layout.propertyType?.name ?? 'ბინა'}`
  const district = korterDistrict(building)
  const street = layout.address?.trim() || building?.address?.trim() || null
  const address = [building?.city, district, street].filter(Boolean).join(', ')

  const base: Omit<ImportedListing, 'score' | 'scoreNotes'> = {
    source: 'korter.ge',
    sourceId: String(objectId),
    sourceUrl: canonical,
    title,
    deal: KORTER_DEAL[layout.section ?? ''] ?? 'unknown',
    propType: KORTER_PROP[propKey] ?? layout.propertyType?.name ?? 'ბინა',
    priceUsd,
    priceGel,
    pricePerM2Usd,
    city: building?.city ?? 'თბილისი',
    district,
    subdistrict: district || null,
    street,
    address,
    area,
    rooms: num(layout.roomCount),
    bedrooms: num(layout.bedroomCount),
    floor: num(floorRaw),
    totalFloors,
    condition: korterCondition(desc),
    status: korterStatus(layout),
    description: desc,
    features: feats,
    phone,
    lat: coords?.lat ?? null,
    lng: coords?.lng ?? null,
    metro: null,
    agency: store.seller?.agency?.name ?? store.seller?.name ?? null,
    views: null,
  }
  const { score, scoreNotes } = scoreListing(base)
  return {
    ...base,
    score,
    scoreNotes,
    bathroomCount: num(layout.bathroomCount),
    kitchenArea: num(layout.kitchenArea),
    videoUrl: layout.videoLink?.trim() || null,
    contactName: store.seller?.name ?? null,
  }
}

export async function importCompetitorListing(url: string): Promise<ImportedListing> {
  const trimmed = url.trim()
  const source = detectCompetitorSource(trimmed)
  if (!source) throw new Error('მხოლოდ ss.ge / myhome.ge / livo.ge / korter.ge ლინკები')
  const id = extractCompetitorId(trimmed)
  if (!id) throw new Error('ID ვერ ამოვიღე URL-დან')
  if (source === 'ss.ge') return importSs(trimmed, id)
  if (source === 'korter.ge') return importKorter(trimmed, id)
  return importMyhome(trimmed, id)
}

export async function importCompetitorListings(urls: string[]): Promise<{
  listings: ImportedListing[]
  best: ImportedListing | null
}> {
  const listings: ImportedListing[] = []
  const errors: string[] = []
  for (const url of urls) {
    try {
      listings.push(await importCompetitorListing(url))
    } catch (e) {
      errors.push(`${url}: ${e instanceof Error ? e.message : String(e)}`)
    }
  }
  if (!listings.length && errors.length) throw new Error(errors.join('; '))
  const best = listings.length
    ? [...listings].sort((a, b) => b.score - a.score || (b.pricePerM2Usd ?? 99999) - (a.pricePerM2Usd ?? 99999))[0]!
    : null
  return { listings, best }
}

/** Agent-facing one-liner card — no photos. */
export function formatImportedListing(l: ImportedListing): string {
  const price =
    l.priceUsd != null ? `$${l.priceUsd.toLocaleString()}${l.pricePerM2Usd ? ` · $${l.pricePerM2Usd}/m²` : ''}` :
    l.priceGel != null ? `₾${l.priceGel.toLocaleString()}` : '—'
  const specs = [
    l.area != null ? `${l.area} მ²` : null,
    l.rooms != null ? `${l.rooms} ოთახი` : null,
    l.floor != null && l.totalFloors != null ? `${l.floor}/${l.totalFloors} სართ.` : null,
    l.condition,
    l.status,
  ].filter(Boolean).join(' · ')
  const feats = l.features.slice(0, 12).join(', ')
  return [
    `[${l.score}/100] ${l.title}`,
    `${l.source} #${l.sourceId} · ${l.deal} · ${price}`,
    l.address,
    specs,
    feats ? `მახასიათებლები: ${feats}` : null,
    l.metro ? `მეტრო: ${l.metro}` : null,
    l.agency ? `კონტაქტი: ${l.agency}${l.phone ? ` · ${l.phone}` : ''}` : l.phone,
    `შეფასება: ${l.scoreNotes.join('; ')}`,
    l.description.slice(0, 600) + (l.description.length > 600 ? '…' : ''),
    l.sourceUrl,
  ].filter(Boolean).join('\n')
}

const DEAL_MAP: Record<string, DealType> = {
  sale: 'sale',
  rent: 'rent',
  daily: 'daily',
  pledge: 'pledge',
}

const PROP_MAP: Record<string, PropType> = {
  apartment: 'apartment',
  house: 'house',
  villa: 'villa',
  commercial: 'commercial',
  land: 'land',
  hotel: 'hotel',
  ბინა: 'apartment',
  სახლი: 'house',
  აგარაკი: 'villa',
  კომერციული: 'commercial',
  მიწა: 'land',
  სასტუმრო: 'hotel',
}

/** Map import → add-listing localStorage draft (no photos). */
export function toAddListingDraft(l: ImportedListing): Record<string, unknown> {
  const rawStreet = l.street?.trim() || l.address.split(',')[0]?.trim() || ''
  const { street, houseNo } = splitStreetHouse(rawStreet)
  const deal = DEAL_MAP[l.deal] ?? null
  const propType = PROP_MAP[l.propType.toLowerCase()] ?? PROP_MAP[l.propType] ?? 'apartment'
  const useUsd = l.priceUsd != null
  const priceVal = useUsd ? l.priceUsd : l.priceGel
  const phoneRaw = l.phone && !l.phone.includes('*') ? l.phone : ''
  let phone = ''
  if (phoneRaw) {
    let d = phoneRaw.replace(/\D/g, '')
    if (d.startsWith('995')) d = d.slice(3)
    d = d.slice(0, 9)
    if (d.length === 9) phone = `+995 ${d.slice(0, 3)} ${d.slice(3, 5)} ${d.slice(5, 7)} ${d.slice(7, 9)}`
  }

  return {
    v: 1,
    deal,
    propType,
    city: l.city,
    district: canonicalizeDistrict(l.subdistrict ?? l.district, l.city) || l.district,
    street,
    houseNo,
    coords: l.lat != null && l.lng != null ? { lat: l.lat, lng: l.lng } : null,
    area: l.area != null ? String(l.area) : '',
    areaUnit: 'm2',
    rooms: l.rooms ?? 0,
    beds: l.bedrooms ?? l.rooms ?? 0,
    baths: l.bathroomCount ?? 0,
    floor: l.floor != null ? String(l.floor) : '',
    totalFloors: l.totalFloors != null ? String(l.totalFloors) : '',
    condition: l.condition ?? '',
    status: l.status ?? '',
    kitchenArea: l.kitchenArea != null ? String(l.kitchenArea) : '',
    features: featureLabelKeys(l.features),
    price: priceVal != null ? String(Math.round(priceVal)) : '',
    priceCur: useUsd ? 'USD' : 'GEL',
    priceMode: 'total',
    description: l.description,
    name: l.contactName ?? l.agency ?? '',
    video: l.videoUrl ?? '',
    phone,
    messengers: ['WhatsApp', 'Viber'],
    terms: false,
    importSource: l.sourceUrl,
  }
}

export function saveAddListingDraft(l: ImportedListing): void {
  localStorage.setItem(ADD_LISTING_DRAFT_KEY, JSON.stringify(toAddListingDraft(l)))
}
