/**
 * SIVRCE — hotel search: Amadeus GDS when keys+DNS work, else OSM directory
 * with Xotelo OTA mins (no key). Wikidata P3134 → TripAdvisor hotel_key.
 *
 * Zero new deps. On-card number = OTA min + HOTEL_MARGIN_PCT (clamped 0–30).
 * Partner checkout confirms the live OTA; sivrce fee is the quote markup.
 * Affiliate IDs on book links are the cash path until we are merchant of record.
 */

import { WORLD_PLACES } from "@/data/world-places"
import { getFx, type FxRates } from "./fx-server"

export type HotelMode = "live" | "browse" | "unconfigured" | "error"

export interface HotelResult {
  hotelId: string
  /** Amadeus offer id — the room-row key on detail pages. */
  offerId?: string
  name: string
  distanceKm: number | null
  address: string | null
  refundable: boolean
  roomType: string | null
  /** Provider grand total converted to GEL (no margin). */
  providerGel: number
  /** What the guest pays: provider total + our fee, whole ₾. */
  totalGel: number
  /** Our margin portion, whole ₾. */
  feeGel: number
  providerCurrency: string
  providerTotal: number
}

export interface HotelSearch {
  mode: HotelMode
  marginPct: number
  fx: "live" | "fallback"
  hotels: HotelResult[]
  /** Populated only in browse mode — OSM directory, no live prices. */
  browse?: BrowseHotel[]
}

/** OSM directory. Price fields set only after a real Xotelo OTA min. */
export interface BrowseHotel {
  id: string
  name: string
  stars: number | null
  distanceKm: number | null
  address: string | null
  phone: string | null
  website: string | null
  /** OSM/Wikimedia photo when the hotel actually has one — never a stock stand-in. */
  image: string | null
  taKey?: string | null
  providerGel?: number
  totalGel?: number
  feeGel?: number
}

export { FX_FALLBACK, getFx, type FxRates } from "./fx-server"

export function marginPct(): number {
  const raw = Number.parseFloat(process.env.HOTEL_MARGIN_PCT ?? "")
  return Number.isFinite(raw) ? Math.min(Math.max(raw, 0), 30) : 8
}

/** Margin math, pure. Fee rounds to whole ₾ so totals never show decimals. */
export function withMargin(providerGel: number, pct: number): { totalGel: number; feeGel: number } {
  const fee = Math.round((providerGel * pct) / 100)
  return { totalGel: Math.round(providerGel) + fee, feeGel: fee }
}

/** Currency → GEL, pure — inject rates so the check file needs no network. */
export function gelFrom(amount: number, currency: string, fx: FxRates): number {
  const rate = currency === "EUR" ? fx.eurGel : currency === "USD" ? fx.usdGel : currency === "GEL" ? 1 : 0
  return Math.round(amount * rate)
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/

/** Stay window validation: ISO dates, 1–30 nights, check-in not in the past. */
export function parseStay(checkIn: string, checkOut: string): { nights: number } | null {
  if (!ISO_DATE.test(checkIn) || !ISO_DATE.test(checkOut)) return null
  const from = Date.parse(`${checkIn}T00:00:00Z`)
  const to = Date.parse(`${checkOut}T00:00:00Z`)
  if (!Number.isFinite(from) || !Number.isFinite(to)) return null
  const nights = Math.round((to - from) / 86_400_000)
  if (nights < 1 || nights > 30) return null
  const today = Date.parse(new Date().toISOString().slice(0, 10))
  if (from < today) return null
  return { nights }
}

/** City slug → place row (WORLD_PLACES is the single source of truth). */
export function placeBySlug(slug: string) {
  const row = WORLD_PLACES.find((p) => p.slug === slug)
  return row ?? null
}

const amadeusBase = () =>
  process.env.AMADEUS_BASE ?? (process.env.AMADEUS_ENV === "prod" ? "https://api.amadeus.com" : "https://test.api.amadeus.com")

let tokenCache: { token: string; exp: number } | null = null

async function amadeusToken(): Promise<string | null> {
  const id = process.env.AMADEUS_CLIENT_ID
  const secret = process.env.AMADEUS_CLIENT_SECRET
  if (!id || !secret) return null
  if (tokenCache && tokenCache.exp > Date.now() + 60_000) return tokenCache.token
  const res = await fetch(`${amadeusBase()}/v1/security/oauth2/token`, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "client_credentials", client_id: id, client_secret: secret }),
  })
  if (!res.ok) throw new Error(`amadeus token ${res.status}`)
  const json = (await res.json()) as { access_token?: string; expires_in?: number }
  if (!json.access_token) throw new Error("amadeus token missing")
  tokenCache = { token: json.access_token, exp: Date.now() + (json.expires_in ?? 1700) * 1000 }
  return tokenCache.token
}

async function amadeusGet(path: string, token: string, revalidate: number): Promise<unknown> {
  const res = await fetch(`${amadeusBase()}${path}`, {
    headers: { authorization: `Bearer ${token}` },
    next: { revalidate },
  })
  if (!res.ok) throw new Error(`amadeus ${path.split("?")[0]} ${res.status}`)
  return res.json()
}

interface RawOffer {
  id?: string
  price?: { currency?: string; total?: string; base?: string }
  room?: {
    typeEstimated?: { category?: string; beds?: number; bedType?: string }
    description?: { text?: string }
  }
  policies?: { cancellation?: { type?: string; description?: string } }
}

interface RawHotelEntry {
  hotel?: { hotelId?: string; name?: string; distance?: number; units?: string; address?: { lines?: string[] } }
  offers?: RawOffer[]
}

export function normalizeAmadeusOffers(
  data: RawHotelEntry[],
  fx: FxRates,
  pct: number,
): HotelResult[] {
  const out: HotelResult[] = []
  for (const entry of data) {
    const hotel = entry.hotel
    const best = entry.offers?.[0]
    const total = Number.parseFloat(best?.price?.total ?? "")
    const currency = best?.price?.currency ?? ""
    const name = hotel?.name
    const hotelId = hotel?.hotelId
    if (!hotelId || !name || !Number.isFinite(total) || !total || !currency) continue
    const providerGel = gelFrom(total, currency, fx)
    if (providerGel <= 0) continue
    const { totalGel, feeGel } = withMargin(providerGel, pct)
    const cancel = best?.policies?.cancellation
    out.push({
      hotelId,
      offerId: best?.id,
      name,
      distanceKm: hotel.units === "KM" && typeof hotel.distance === "number" ? hotel.distance : null,
      address: hotel.address?.lines?.[0] ?? null,
      refundable: Boolean(
        cancel && (/free/i.test(cancel.description ?? "") || cancel.type?.includes("FULL_STAY_BEFORE")),
      ),
      roomType: best?.room?.typeEstimated?.category ?? null,
      providerGel,
      totalGel,
      feeGel,
      providerCurrency: currency,
      providerTotal: Math.round(total * 100) / 100,
    })
  }
  return out.sort((a, b) => a.totalGel - b.totalGel).slice(0, 24)
}

export function normalizeHotelRooms(entry: RawHotelEntry, fx: FxRates, pct: number): HotelResult[] {
  const hotel = entry.hotel
  if (!hotel?.hotelId || !hotel.name) return []
  const out: HotelResult[] = []
  for (const offer of entry.offers ?? []) {
    const total = Number.parseFloat(offer?.price?.total ?? "")
    const currency = offer?.price?.currency ?? ""
    if (!Number.isFinite(total) || !total || !currency) continue
    const providerGel = gelFrom(total, currency, fx)
    if (providerGel <= 0) continue
    const { totalGel, feeGel } = withMargin(providerGel, pct)
    const cancel = offer?.policies?.cancellation
    out.push({
      hotelId: hotel.hotelId,
      offerId: offer?.id,
      name: hotel.name,
      distanceKm: null,
      address: hotel.address?.lines?.[0] ?? null,
      refundable: Boolean(
        cancel && (/free/i.test(cancel.description ?? "") || cancel.type?.includes("FULL_STAY_BEFORE")),
      ),
      roomType: offer?.room?.typeEstimated?.category ?? null,
      providerGel,
      totalGel,
      feeGel,
      providerCurrency: currency,
      providerTotal: Math.round(total * 100) / 100,
    })
  }
  return out.sort((a, b) => a.totalGel - b.totalGel)
}

export interface HotelView {
  sort: "price" | "distance"
  refundOnly: boolean
  maxGel: number | null
}

export function parseView(sort?: string, refund?: string, max?: string): HotelView {
  const maxGel = Number.parseInt(max ?? "", 10)
  return {
    sort: sort === "distance" ? "distance" : "price",
    refundOnly: refund === "1",
    maxGel: Number.isFinite(maxGel) && maxGel > 0 ? Math.min(maxGel, 10_000) : null,
  }
}

export function applyView(hotels: HotelResult[], view: HotelView, nights: number): HotelResult[] {
  let rows = view.refundOnly ? hotels.filter((h) => h.refundable) : hotels.slice()
  if (view.maxGel !== null) rows = rows.filter((h) => h.totalGel <= view.maxGel! * Math.max(nights, 1))
  if (view.sort === "distance") {
    rows.sort((a, b) => (a.distanceKm ?? 999) - (b.distanceKm ?? 999))
  } else {
    rows.sort((a, b) => a.totalGel - b.totalGel)
  }
  return rows
}

export function compareLinks(
  cityEn: string,
  checkIn: string,
  checkOut: string,
  adults: number,
): { name: string; url: string }[] {
  const c = encodeURIComponent(cityEn)
  const nights = Math.max(1, Math.round((Date.parse(`${checkOut}T00:00:00Z`) - Date.parse(`${checkIn}T00:00:00Z`)) / 86_400_000))
  const google =
    `https://www.google.com/travel/hotels?q=${c}&start_date=${checkIn}&end_date=${checkOut}&num_adults=${adults}`
  const booking =
    `https://www.booking.com/searchresults.en-gb.html?ss=${c}&checkin=${checkIn}&checkout=${checkOut}` +
    `&group_adults=${adults}&no_rooms=1&selected_currency=EUR`
  const kayak = `https://www.kayak.com/hotels/${c}/${checkIn}/${checkOut}/${adults}adults`
  const expedia =
    `https://www.expedia.com/Hotel-Search?destination=${c}&d1=${checkIn}&d2=${checkOut}&adults=${adults}`
  const agoda =
    `https://www.agoda.com/search?text=${c}&checkIn=${checkIn}&checkout=${checkOut}&los=${nights}&rooms=1&adults=${adults}&currency=EUR`
  const hotelsCom =
    `https://www.hotels.com/Hotel-Search?destination=${c}&startDate=${checkIn}&endDate=${checkOut}&d1=${checkIn}&d2=${checkOut}&adults=${adults}`
  const aid = process.env.HOTEL_BOOKING_AID
  const afflid = process.env.HOTEL_EXPEDIA_AFFLID
  return [
    { name: "Google Hotels", url: google },
    { name: "Booking.com", url: aid ? `${booking}&aid=${encodeURIComponent(aid)}` : booking },
    { name: "Kayak", url: kayak },
    { name: "Expedia", url: afflid ? `${expedia}&afflid=${encodeURIComponent(afflid)}` : expedia },
    { name: "Agoda", url: agoda },
    { name: "Hotels.com", url: hotelsCom },
  ]
}

const UA = "sivrce-maps/1.0 (sivrce888@gmail.com)"

/** Mirrors that actually answer; DE/kumi 504/timeout in 2026-09. */
const OVERPASS_UPSTREAMS = [
  "https://maps.mail.ru/osm/tools/overpass/api/interpreter",
  "https://overpass.private.coffee/api/interpreter",
  "https://overpass-api.de/api/interpreter",
]

export function browseQuery(lat: number, lng: number, radiusM = 10_000): string {
  const t = '["tourism"~"^(hotel|hostel|guest_house)$"]'
  return (
    `[out:json][timeout:20];(node${t}(around:${radiusM},${lat},${lng});` +
    `way${t}(around:${radiusM},${lat},${lng}););out center tags 60;`
  )
}

export function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const r = Math.PI / 180
  const dLat = (lat2 - lat1) * r
  const dLng = (lng2 - lng1) * r
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * r) * Math.cos(lat2 * r) * Math.sin(dLng / 2) ** 2
  return Math.round(6371 * 2 * Math.asin(Math.sqrt(a)) * 10) / 10
}

interface RawOsmElement {
  type: "node" | "way"
  id: number
  lat?: number
  lon?: number
  center?: { lat?: number; lon?: number }
  tags?: Record<string, string>
}

/** Drop OSM stubs that are just the amenity word — useless on a results card. */
export function keepHotelName(name: string): boolean {
  const n = name.trim()
  return n.length >= 3 && !/^(hotel|hostel|guest\s*house|motel|apartment)$/i.test(n)
}

/** Real photo only: Wikimedia File:… (resized) or a short https jpg/webp/png. Skip Category: and SVG. */
export function osmImage(tags?: Record<string, string> | null): string | null {
  if (!tags) return null
  const wm = (tags.wikimedia_commons ?? tags.wikimedia ?? "").trim()
  if (wm && !/^Category:/i.test(wm) && !wm.includes("/")) {
    const file = wm.replace(/^File:/i, "").trim()
    if (file) return `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(file)}?width=640`
  }
  const img = tags.image ?? ""
  if (/^https:\/\//i.test(img) && img.length < 300 && /\.(jpe?g|webp|png)(\?|$)/i.test(img)) return img
  return null
}

function starsOf(raw: string | undefined): number | null {
  const n = Number.parseInt(raw ?? "", 10)
  return n >= 1 && n <= 5 ? n : null
}

/** TripAdvisor g{geo}-d{id} from a URL, OSM tag, or already-formed key. */
export function parseTaKey(raw: string | null | undefined): string | null {
  const m = raw?.match(/g(\d{3,8})-d(\d{3,12})/i)
  return m ? `g${m[1]}-d${m[2]}` : null
}

export function hotelTaKey(geo: string, d: string): string | null {
  const g = geo.replace(/^g/i, "")
  const id = d.replace(/^d/i, "")
  if (!/^\d{3,8}$/.test(g) || !/^\d{3,12}$/.test(id)) return null
  return `g${g}-d${id}`
}

function tagsTa(tags?: Record<string, string> | null): string | null {
  if (!tags) return null
  return parseTaKey(tags.tripadvisor ?? tags["contact:tripadvisor"] ?? tags["tripadvisor:url"])
}

export function normalizeOverpassHotels(
  elements: RawOsmElement[],
  lat: number,
  lng: number,
  cap = 24,
): BrowseHotel[] {
  const out: BrowseHotel[] = []
  for (const el of elements) {
    const tags = el.tags ?? {}
    const name = (tags["name:en"] ?? tags.name ?? "").trim()
    if (!keepHotelName(name)) continue
    const plat = el.lat ?? el.center?.lat
    const plng = el.lon ?? el.center?.lon
    const addrStreet = tags["addr:street"]
    const addrNum = tags["addr:housenumber"]
    out.push({
      id: `${el.id}`,
      name,
      stars: starsOf(tags.stars),
      distanceKm: typeof plat === "number" && typeof plng === "number" ? haversineKm(lat, lng, plat, plng) : null,
      address: addrStreet ? (addrNum ? `${addrStreet} ${addrNum}` : addrStreet) : null,
      phone: tags.phone ?? tags["contact:phone"] ?? null,
      website: tags.website ?? tags["contact:website"] ?? null,
      image: osmImage(tags),
      taKey: tagsTa(tags),
    })
  }
  return out.sort((a, b) => (a.distanceKm ?? 999) - (b.distanceKm ?? 999)).slice(0, cap)
}

interface NominatimHit {
  osm_id?: number
  lat?: string
  lon?: string
  name?: string
  type?: string
  address?: { road?: string; house_number?: string }
  extratags?: Record<string, string>
}

const NOMINATIM_TYPES = new Set(["hotel", "hostel", "guest_house", "motel", "chalet", "apartment"])

export function normalizeNominatimHotels(
  hits: NominatimHit[],
  lat: number,
  lng: number,
  cap = 24,
): BrowseHotel[] {
  const out: BrowseHotel[] = []
  for (const h of hits) {
    const name = (h.name ?? "").trim()
    if (!keepHotelName(name) || (h.type && !NOMINATIM_TYPES.has(h.type))) continue
    const plat = Number.parseFloat(h.lat ?? "")
    const plng = Number.parseFloat(h.lon ?? "")
    const road = h.address?.road
    const num = h.address?.house_number
    out.push({
      id: `${h.osm_id ?? name}`,
      name,
      stars: starsOf(h.extratags?.stars),
      distanceKm: Number.isFinite(plat) && Number.isFinite(plng) ? haversineKm(lat, lng, plat, plng) : null,
      address: road ? (num ? `${road} ${num}` : road) : null,
      phone: h.extratags?.phone ?? h.extratags?.["contact:phone"] ?? null,
      website: h.extratags?.website ?? h.extratags?.["contact:website"] ?? null,
      image: osmImage(h.extratags),
      taKey: tagsTa(h.extratags),
    })
  }
  return out.sort((a, b) => (a.distanceKm ?? 999) - (b.distanceKm ?? 999)).slice(0, cap)
}

interface PhotonFeature {
  geometry?: { coordinates?: number[] }
  properties?: {
    name?: string
    osm_id?: number
    street?: string
    housenumber?: string
    osm_value?: string
  }
}

export function normalizePhotonHotels(
  features: PhotonFeature[],
  lat: number,
  lng: number,
  cap = 24,
): BrowseHotel[] {
  const out: BrowseHotel[] = []
  for (const f of features) {
    const p = f.properties ?? {}
    const name = (p.name ?? "").trim()
    if (!keepHotelName(name)) continue
    const plng = f.geometry?.coordinates?.[0]
    const plat = f.geometry?.coordinates?.[1]
    const street = p.street
    const num = p.housenumber
    out.push({
      id: `${p.osm_id ?? name}`,
      name,
      stars: null,
      distanceKm: typeof plat === "number" && typeof plng === "number" ? haversineKm(lat, lng, plat, plng) : null,
      address: street ? (num ? `${street} ${num}` : street) : null,
      phone: null,
      website: null,
      image: null,
      taKey: null,
    })
  }
  return out.sort((a, b) => (a.distanceKm ?? 999) - (b.distanceKm ?? 999)).slice(0, cap)
}

export function foldHotelName(name: string): string {
  return name.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, "")
}

/** Dedup by folded name; first list wins (Nominatim EN names before Photon stubs). Cap 24. */
export function mergeBrowseHotels(...lists: (BrowseHotel[] | null | undefined)[]): BrowseHotel[] {
  const seen = new Set<string>()
  const out: BrowseHotel[] = []
  for (const list of lists) {
    const rows = [...(list ?? [])].sort((a, b) => (a.distanceKm ?? 999) - (b.distanceKm ?? 999))
    for (const h of rows) {
      const k = foldHotelName(h.name)
      if (!k || seen.has(k) || out.length >= 24) continue
      seen.add(k)
      out.push(h)
    }
  }
  return out
}

async function getJson(url: string, init: RequestInit = {}, ms = 5000, revalidate = 6 * 3600): Promise<unknown | null> {
  try {
    const res = await fetch(url, {
      ...init,
      headers: { "user-agent": UA, ...(init.headers as Record<string, string> | undefined) },
      next: { revalidate },
      signal: AbortSignal.timeout(ms),
    })
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  }
}

async function overpassHotels(lat: number, lng: number): Promise<BrowseHotel[] | null> {
  const body = new URLSearchParams({ data: browseQuery(lat, lng) })
  const hits = await Promise.all(
    OVERPASS_UPSTREAMS.map((api) =>
      getJson(api, { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" }, body }, 5000),
    ),
  )
  for (const json of hits) {
    const els = (json as { elements?: RawOsmElement[] } | null)?.elements
    if (!els?.length) continue
    const rows = normalizeOverpassHotels(els, lat, lng)
    if (rows.length) return rows
  }
  return null
}

async function nominatimHotels(lat: number, lng: number): Promise<BrowseHotel[] | null> {
  const d = 0.16
  const viewbox = `${lng - d},${lat + d},${lng + d},${lat - d}`
  const json = await getJson(
    `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=30&addressdetails=1&extratags=1&bounded=1&viewbox=${viewbox}&q=hotel`,
  )
  if (!Array.isArray(json)) return null
  const rows = normalizeNominatimHotels(json as NominatimHit[], lat, lng)
  return rows.length ? rows : null
}

async function photonHotels(lat: number, lng: number): Promise<BrowseHotel[] | null> {
  const json = await getJson(
    `https://photon.komoot.io/api/?q=hotel&lat=${lat}&lon=${lng}&limit=30` +
      `&osm_tag=tourism:hotel&osm_tag=tourism:hostel&osm_tag=tourism:guest_house`,
  )
  const features = (json as { features?: PhotonFeature[] } | null)?.features
  if (!features?.length) return null
  const rows = normalizePhotonHotels(features, lat, lng)
  return rows.length ? rows : null
}

async function directoryHotels(lat: number, lng: number): Promise<BrowseHotel[] | null> {
  // ponytail: Nominatim+Photon answer in <1s; Overpass mirrors often 5s-timeout. Only hit OSM if the fast pair is empty.
  const [nom, ph] = await Promise.all([nominatimHotels(lat, lng), photonHotels(lat, lng)])
  const fast = mergeBrowseHotels(nom, ph)
  if (fast.length) return fast
  return overpassHotels(lat, lng)
}

export interface XoteloRate {
  code?: string
  name?: string
  rate?: number
}

/** Xotelo docs: rate is per room per night. Stay total = rate × nights. */
export function bestXoteloStay(
  rates: XoteloRate[],
  nights: number,
  fx: FxRates,
  pct: number,
): { providerGel: number; totalGel: number; feeGel: number; providerTotal: number } | null {
  const n = Math.max(1, nights)
  let min = Infinity
  for (const r of rates) {
    const rate = typeof r.rate === "number" ? r.rate : Number.parseFloat(String(r.rate ?? ""))
    if (!Number.isFinite(rate) || rate <= 0) continue
    if (rate < min) min = rate
  }
  if (!Number.isFinite(min)) return null
  const providerTotal = Math.round(min * n * 100) / 100
  const providerGel = gelFrom(providerTotal, "EUR", fx)
  if (providerGel <= 0) return null
  const { totalGel, feeGel } = withMargin(providerGel, pct)
  return { providerGel, totalGel, feeGel, providerTotal }
}

export function normalizeXoteloRates(
  hotelId: string,
  name: string,
  rates: XoteloRate[],
  nights: number,
  fx: FxRates,
  pct: number,
): HotelResult[] {
  const n = Math.max(1, nights)
  const out: HotelResult[] = []
  for (const r of rates) {
    const rate = typeof r.rate === "number" ? r.rate : Number.parseFloat(String(r.rate ?? ""))
    if (!Number.isFinite(rate) || rate <= 0) continue
    const providerTotal = Math.round(rate * n * 100) / 100
    const providerGel = gelFrom(providerTotal, "EUR", fx)
    if (providerGel <= 0) continue
    const { totalGel, feeGel } = withMargin(providerGel, pct)
    out.push({
      hotelId,
      offerId: r.code ?? undefined,
      name,
      distanceKm: null,
      address: null,
      refundable: false,
      roomType: r.name ?? r.code ?? null,
      providerGel,
      totalGel,
      feeGel,
      providerCurrency: "EUR",
      providerTotal,
    })
  }
  return out.sort((a, b) => a.totalGel - b.totalGel)
}

export function wikiLodgingQuery(lat: number, lng: number): string {
  return (
    "SELECT ?kind ?name ?ta WHERE { SERVICE wikibase:around { ?h wdt:P625 ?loc . " +
    `bd:serviceParam wikibase:center "Point(${lng} ${lat})"^^geo:wktLiteral . ` +
    "bd:serviceParam wikibase:radius \"8\" . } ?h wdt:P3134 ?ta . " +
    "{ ?h wdt:P31/wdt:P279* wd:Q27686 . ?h rdfs:label ?name FILTER(LANG(?name)=\"en\") BIND(\"h\" AS ?kind) } " +
    "UNION { VALUES ?t { wd:Q515 wd:Q1549591 wd:Q1637706 wd:Q3957 } ?h wdt:P31/wdt:P279* ?t . BIND(\"c\" AS ?kind) BIND(\"\" AS ?name) } } LIMIT 30"
  )
}

export function parseWikiLodging(bindings: { kind?: { value?: string }; name?: { value?: string }; ta?: { value?: string } }[]): {
  geo: string | null
  hotels: { name: string; ta: string }[]
} {
  let geo: string | null = null
  const hotels: { name: string; ta: string }[] = []
  for (const b of bindings) {
    const ta = (b.ta?.value ?? "").replace(/^d/i, "")
    if (!/^\d{3,12}$/.test(ta)) continue
    if (b.kind?.value === "c") {
      if (!geo) geo = ta
      continue
    }
    const name = (b.name?.value ?? "").trim()
    if (!keepHotelName(name)) continue
    hotels.push({ name, ta })
  }
  return { geo, hotels }
}

/**
 * ponytail: Wikidata P3134 has zero hits near Tbilisi and OSM rarely carries a
 * tripadvisor tag, so the home market's live OTA prices come from this table.
 * Every key resolved from its own TripAdvisor review URL and confirmed to
 * return that hotel's own rate band on Xotelo — 2026-09-14. A wrong d-id still
 * answers with *some* hotel's rates, so verify the property, not just a 200.
 */
export const SEED_TA: { name: string; key: string }[] = [
  { name: "Rooms Hotel Tbilisi", key: "g294195-d7171589" },
  { name: "Radisson Blu Iveria Hotel, Tbilisi City Centre", key: "g294195-d1474950" },
  { name: "Stamba Hotel", key: "g294195-d14136141" },
  { name: "Sheraton Grand Tbilisi Metechi Palace", key: "g294195-d11934623" },
]

export function collectTaKeys(
  browse: BrowseHotel[],
  wiki: { geo: string | null; hotels: { name: string; ta: string }[] },
  lat: number,
  lng: number,
): { name: string; key: string }[] {
  const out: { name: string; key: string }[] = []
  const seen = new Set<string>()
  const add = (name: string, key: string | null | undefined) => {
    const k = parseTaKey(key)
    if (!k || seen.has(k)) return
    seen.add(k)
    out.push({ name, key: k })
  }
  // Seeds first: attachOtaPrices only fetches the first 8 keys, and these are
  // the verified ones — unverified OSM/wiki tags must never crowd them out.
  if (haversineKm(lat, lng, 41.7151, 44.8271) < 20) {
    for (const s of SEED_TA) add(s.name, s.key)
  }
  for (const h of browse) add(h.name, h.taKey)
  for (const h of wiki.hotels) add(h.name, hotelTaKey(wiki.geo ?? "", h.ta))
  return out
}

export function paintOtaPrices(
  browse: BrowseHotel[],
  priced: { name: string; key: string; providerGel: number; totalGel: number; feeGel: number }[],
): BrowseHotel[] {
  if (!Array.isArray(priced) || priced.length === 0) return browse ?? []
  const byKey = new Map(priced.map((p) => [p.key, p]))
  const byName = new Map(priced.map((p) => [foldHotelName(p.name), p]))
  const painted = browse.map((h) => {
    const hit = (h.taKey && byKey.get(h.taKey)) || byName.get(foldHotelName(h.name))
    if (!hit) return h
    return {
      ...h,
      id: hit.key,
      taKey: hit.key,
      providerGel: hit.providerGel,
      totalGel: hit.totalGel,
      feeGel: hit.feeGel,
    }
  })
  const have = new Set(painted.map((h) => foldHotelName(h.name)))
  const extra: BrowseHotel[] = []
  for (const p of priced) {
    if (have.has(foldHotelName(p.name)) || extra.length + painted.length >= 24) continue
    have.add(foldHotelName(p.name))
    extra.push({
      id: p.key,
      name: p.name,
      stars: null,
      distanceKm: null,
      address: null,
      phone: null,
      website: null,
      image: null,
      taKey: p.key,
      providerGel: p.providerGel,
      totalGel: p.totalGel,
      feeGel: p.feeGel,
    })
  }
  return [...extra, ...painted].sort((a, b) => {
    const pa = a.totalGel ?? 0
    const pb = b.totalGel ?? 0
    if (!pa !== !pb) return pa ? -1 : 1
    if (pa && pb && pa !== pb) return pa - pb
    return (a.distanceKm ?? 999) - (b.distanceKm ?? 999)
  })
}

async function wikiLodging(lat: number, lng: number): Promise<{ geo: string | null; hotels: { name: string; ta: string }[] }> {
  const url = `https://query.wikidata.org/sparql?format=json&query=${encodeURIComponent(wikiLodgingQuery(lat, lng))}`
  const json = (await getJson(url, {}, 8000, 24 * 3600)) as { results?: { bindings?: Parameters<typeof parseWikiLodging>[0] } } | null
  return parseWikiLodging(json?.results?.bindings ?? [])
}

/**
 * Xotelo scrapes the OTAs live, so it answers in ~7.5s — measured repeatedly,
 * never under 7. A budget below that silently zeroes out every price on the
 * page (getJson swallows the abort → no rates → nothing to paint), which is
 * exactly what a 4s budget did. Keep this comfortably above the real latency.
 */
const XOTELO_TIMEOUT_MS = 12_000

async function xoteloRates(key: string, checkIn: string, checkOut: string, adults: number): Promise<XoteloRate[]> {
  const url =
    `https://data.xotelo.com/api/rates?hotel_key=${encodeURIComponent(key)}` +
    `&chk_in=${checkIn}&chk_out=${checkOut}&currency=EUR&adults=${adults}`
  const json = (await getJson(url, {}, XOTELO_TIMEOUT_MS, 1800)) as { result?: { rates?: XoteloRate[] }; error?: unknown } | null
  if (!json || json.error || !Array.isArray(json.result?.rates)) return []
  return json.result.rates
}

async function attachOtaPrices(
  browse: BrowseHotel[],
  input: { lat: number; lng: number; checkIn: string; checkOut: string; adults: number; nights: number; pct: number },
): Promise<{ rows: BrowseHotel[]; fx: FxRates }> {
  const [wiki, fx] = await Promise.all([wikiLodging(input.lat, input.lng), getFx()])
  const keys = collectTaKeys(browse, wiki, input.lat, input.lng).slice(0, 8)
  if (!keys.length) return { rows: browse, fx }
  const fetched = await Promise.all(
    keys.map(async (k) => {
      const stay = bestXoteloStay(await xoteloRates(k.key, input.checkIn, input.checkOut, input.adults), input.nights, fx, input.pct)
      return stay ? { name: k.name, key: k.key, ...stay } : null
    }),
  )
  const priced = fetched.filter((p): p is NonNullable<typeof p> => p !== null)
  return { rows: priced.length ? paintOtaPrices(browse, priced) : browse, fx }
}

export async function searchHotels(input: {
  lat: number
  lng: number
  checkIn: string
  checkOut: string
  adults: number
}): Promise<HotelSearch> {
  const pct = marginPct()
  const browse = async (): Promise<HotelSearch> => {
    const dir = await directoryHotels(input.lat, input.lng)
    if (!dir?.length) return { mode: "error", marginPct: pct, fx: "fallback", hotels: [] }
    const stay = parseStay(input.checkIn, input.checkOut)
    if (!stay) return { mode: "browse", marginPct: pct, fx: "fallback", hotels: [], browse: dir }
    const { rows, fx } = await attachOtaPrices(dir, { ...input, nights: stay.nights, pct })
    return { mode: "browse", marginPct: pct, fx: fx.source, hotels: [], browse: rows }
  }
  try {
    const token = await amadeusToken()
    if (!token) return await browse()

    const listJson = (await amadeusGet(
      `/v1/reference-data/locations/hotels/by-geocode?latitude=${input.lat}&longitude=${input.lng}` +
        `&radius=8&radiusUnit=KM&hotelSource=ALL`,
      token,
      24 * 3600,
    )) as { data?: { hotelId?: string }[] }
    const hotelIds = (listJson.data ?? [])
      .map((h) => h.hotelId)
      .filter((id): id is string => typeof id === "string")
      .slice(0, 40)
    if (!hotelIds.length) {
      const b = await browse()
      return b.mode === "browse" ? b : { mode: "live", marginPct: pct, fx: (await getFx()).source, hotels: [] }
    }

    const offersJson = (await amadeusGet(
      `/v3/shopping/hotel-offers?hotelIds=${hotelIds.join(",")}&adults=${input.adults}` +
        `&checkInDate=${input.checkIn}&checkOutDate=${input.checkOut}&roomQuantity=1` +
        `&currencyCode=EUR&bestRateOnly=true&includeClosed=false`,
      token,
      1800,
    )) as { data?: RawHotelEntry[] }

    const fx = await getFx()
    const hotels = normalizeAmadeusOffers(offersJson.data ?? [], fx, pct)
    if (!hotels.length) {
      const b = await browse()
      if (b.mode === "browse") return b
    }
    return { mode: "live", marginPct: pct, fx: fx.source, hotels }
  } catch (err) {
    console.error("hotels search failed:", err)
    return await browse()
  }
}

export async function hotelRooms(input: {
  hotelId: string
  checkIn: string
  checkOut: string
  adults: number
}): Promise<HotelSearch & { hotelName: string | null }> {
  const pct = marginPct()
  const stay = parseStay(input.checkIn, input.checkOut)
  const ta = parseTaKey(input.hotelId)
  if (ta && stay) {
    try {
      const fx = await getFx()
      const hotels = normalizeXoteloRates(ta, ta, await xoteloRates(ta, input.checkIn, input.checkOut, input.adults), stay.nights, fx, pct)
      return { mode: "live", marginPct: pct, fx: fx.source, hotels, hotelName: null }
    } catch (err) {
      console.error("hotel rooms xotelo failed:", err)
      return { mode: "error", marginPct: pct, fx: "fallback", hotels: [], hotelName: null }
    }
  }
  try {
    const token = await amadeusToken()
    if (!token) return { mode: "unconfigured", marginPct: pct, fx: "fallback", hotels: [], hotelName: null }

    const json = (await amadeusGet(
      `/v3/shopping/hotel-offers?hotelIds=${encodeURIComponent(input.hotelId)}&adults=${input.adults}` +
        `&checkInDate=${input.checkIn}&checkOutDate=${input.checkOut}&roomQuantity=1` +
        `&currencyCode=EUR&includeClosed=false`,
      token,
      1800,
    )) as { data?: RawHotelEntry[] }
    const entry = (json.data ?? [])[0]
    const fx = await getFx()
    return {
      mode: "live",
      marginPct: pct,
      fx: fx.source,
      hotels: entry ? normalizeHotelRooms(entry, fx, pct) : [],
      hotelName: entry?.hotel?.name ?? null,
    }
  } catch (err) {
    console.error("hotel rooms failed:", err)
    return { mode: "error", marginPct: pct, fx: "fallback", hotels: [], hotelName: null }
  }
}

