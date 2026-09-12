/**
 * SIVRCE — live hotel rates (Amadeus Self-Service GDS) + transparent margin
 * and STAY -> LIVE -> BUY bridge.
 *
 * Zero new deps: native fetch + module caches. Two Amadeus calls per uncached
 * search: hotel list by geocode (24h) → v3 best-rate offers (30min).
 * No keys (or provider down / zero availability) → free OpenStreetMap Overpass
 * browse directory (real names/contacts, no fabricated prices, 6h cache) — never throws.
 *
 * Margin model: we display provider total + our service fee (HOTEL_MARGIN_PCT,
 * default 8%), labelled on-card — the same "includes taxes and fees" pattern
 * Expedia uses. Booking handoff goes through provider deep links; affiliate
 * IDs append automatically when the env vars appear.
 */

import { WORLD_PLACES } from "@/data/world-places"

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

/** Zero-key fallback inventory from OpenStreetMap — honest: names/contacts only. */
export interface BrowseHotel {
  id: string
  name: string
  stars: number | null
  distanceKm: number | null
  address: string | null
  phone: string | null
  website: string | null
}

export interface FxRates {
  usdGel: number
  eurGel: number
  source: "live" | "fallback"
}

/** Mirrors currency.tsx fallbacks so server and client agree pre-hydration. */
export const FX_FALLBACK: FxRates = { usdGel: 2.7, eurGel: 3.04, source: "fallback" }

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

let fxCache: { at: number; fx: FxRates } | null = null
const FX_TTL = 6 * 3600_000

/** USD-based live FX (same free endpoint as the client currency context). */
export async function getFx(): Promise<FxRates> {
  if (fxCache && Date.now() - fxCache.at < FX_TTL) return fxCache.fx
  try {
    const res = await fetch("https://open.er-api.com/v6/latest/USD", {
      next: { revalidate: 6 * 3600 },
    })
    const json = (await res.json()) as { rates?: Record<string, number> }
    const gel = json.rates?.GEL
    const eur = json.rates?.EUR
    if (typeof gel === "number" && typeof eur === "number" && gel > 0 && eur > 0) {
      const fx: FxRates = { usdGel: gel, eurGel: gel / eur, source: "live" }
      fxCache = { at: Date.now(), fx }
      return fx
    }
  } catch {
    // fall through to fallback
  }
  fxCache = { at: Date.now(), fx: FX_FALLBACK }
  return FX_FALLBACK
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
  const booking =
    `https://www.booking.com/searchresults.en-gb.html?ss=${c}&checkin=${checkIn}&checkout=${checkOut}` +
    `&group_adults=${adults}&no_rooms=1&selected_currency=EUR`
  const expedia =
    `https://www.expedia.com/Hotel-Search?destination=${c}&d1=${checkIn}&d2=${checkOut}&adults=${adults}`
  const aid = process.env.HOTEL_BOOKING_AID
  const afflid = process.env.HOTEL_EXPEDIA_AFFLID
  return [
    { name: "Booking.com", url: aid ? `${booking}&aid=${encodeURIComponent(aid)}` : booking },
    { name: "Expedia", url: afflid ? `${expedia}&afflid=${encodeURIComponent(afflid)}` : expedia },
  ]
}

const OVERPASS_UPSTREAMS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
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

export function normalizeOverpassHotels(
  elements: RawOsmElement[],
  lat: number,
  lng: number,
  cap = 24,
): BrowseHotel[] {
  const out: BrowseHotel[] = []
  for (const el of elements) {
    const tags = el.tags ?? {}
    const name = tags.name
    if (!name) continue
    const plat = el.lat ?? el.center?.lat
    const plng = el.lon ?? el.center?.lon
    const stars = Number.parseInt(tags.stars ?? "", 10)
    const addrStreet = tags["addr:street"]
    const addrNum = tags["addr:housenumber"]
    out.push({
      id: `${el.id}`,
      name,
      stars: stars >= 1 && stars <= 5 ? stars : null,
      distanceKm: typeof plat === "number" && typeof plng === "number" ? haversineKm(lat, lng, plat, plng) : null,
      address: addrStreet ? (addrNum ? `${addrStreet} ${addrNum}` : addrStreet) : null,
      phone: tags.phone ?? tags["contact:phone"] ?? null,
      website: tags.website ?? tags["contact:website"] ?? null,
    })
  }
  return out.sort((a, b) => (a.distanceKm ?? 999) - (b.distanceKm ?? 999)).slice(0, cap)
}

async function overpassHotels(lat: number, lng: number): Promise<BrowseHotel[] | null> {
  for (const api of OVERPASS_UPSTREAMS) {
    try {
      const res = await fetch(api, {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ data: browseQuery(lat, lng) }),
        next: { revalidate: 6 * 3600 },
        signal: AbortSignal.timeout(20_000),
      })
      if (!res.ok) continue
      const json = (await res.json()) as { elements?: RawOsmElement[] }
      return normalizeOverpassHotels(json.elements ?? [], lat, lng)
    } catch {
      // next mirror
    }
  }
  return null
}

export async function searchHotels(input: {
  lat: number
  lng: number
  checkIn: string
  checkOut: string
  adults: number
}): Promise<HotelSearch> {
  const pct = marginPct()
  const browse = () =>
    overpassHotels(input.lat, input.lng).then(
      (b): HotelSearch =>
        b && b.length
          ? { mode: "browse", marginPct: pct, fx: "fallback", hotels: [], browse: b }
          : { mode: "error", marginPct: pct, fx: "fallback", hotels: [] },
    )
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

/* ── STAY -> LIVE -> BUY Transition Bridge ── */

export interface StayBridgeOpportunity {
  type: 'long_term_rent' | 'buy_investment'
  titleEn: string
  titleKa: string
  targetUrl: string
  avgPriceEn: string
  avgPriceKa: string
}

export function getStayToLiveBuyBridge(citySlug: string, districtName?: string): StayBridgeOpportunity[] {
  const distParam = districtName ? `&district=${encodeURIComponent(districtName)}` : ''
  return [
    {
      type: 'long_term_rent',
      titleEn: `Long-term Stays & Rentals in ${districtName ?? citySlug}`,
      titleKa: `ხანგრძლივი იჯარა — ${districtName ?? citySlug}`,
      targetUrl: `/ka/search?deal=rent&city=${encodeURIComponent(citySlug)}${distParam}`,
      avgPriceEn: 'Explore 1-12 month residential leases',
      avgPriceKa: 'იხილეთ 1-12 თვიანი ბინები',
    },
    {
      type: 'buy_investment',
      titleEn: `Invest in ${districtName ?? citySlug} Real Estate`,
      titleKa: `უძრავი ქონების ინვესტიცია — ${districtName ?? citySlug}`,
      targetUrl: `/ka/search?deal=sale&city=${encodeURIComponent(citySlug)}${distParam}`,
      avgPriceEn: 'High-yield residential & commercial opportunities',
      avgPriceKa: 'მაღალმომგებიანი ბინები და პროექტები',
    },
  ]
}
