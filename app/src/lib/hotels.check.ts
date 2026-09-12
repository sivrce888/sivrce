/**
 * Runnable check for the live-hotel-rates pipeline.
 * Run: npx tsx src/lib/hotels.check.ts
 *
 * ponytail: no network in prebuild — the Amadeus calls are covered by graceful
 * degrade (mode 'unconfigured'/'error' paths), the pure rules (margin, FX,
 * stay validation, normalization, compare links) are asserted directly.
 */
import { readFileSync } from "node:fs"
import { join, dirname } from "node:path"
import { fileURLToPath } from "node:url"

import {
  FX_FALLBACK,
  applyView,
  browseQuery,
  compareLinks,
  gelFrom,
  haversineKm,
  marginPct,
  normalizeAmadeusOffers,
  normalizeHotelRooms,
  normalizeOverpassHotels,
  parseStay,
  parseView,
  placeBySlug,
  withMargin,
  type FxRates,
} from "./hotels"

function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) {
    console.error(`hotels: ${msg}`)
    process.exit(1)
  }
}

// Margin math: fee rounds to whole ₾, totals never carry decimals.
assert(withMargin(100, 8).feeGel === 8 && withMargin(100, 8).totalGel === 108, "flat margin")
assert(withMargin(99.6, 8).feeGel === 8 && withMargin(99.6, 8).totalGel === 108, "fee rounds from 7.968")
assert(withMargin(100, 0).totalGel === 100 && withMargin(100, 0).feeGel === 0, "zero margin allowed")
assert(withMargin(0, 8).totalGel === 0, "zero base")

// Margin env: default 8, clamped to 0–30 even if misconfigured.
process.env.HOTEL_MARGIN_PCT = "250"
assert(marginPct() === 30, "margin clamps to 30")
process.env.HOTEL_MARGIN_PCT = "12.5"
assert(marginPct() === 12.5, "fractional margin allowed")
delete process.env.HOTEL_MARGIN_PCT
assert(marginPct() === 8, "default margin 8")

// FX: EUR/USD/GEL convert, unknown currency yields 0 (offer gets dropped).
const fx: FxRates = { usdGel: 2.7, eurGel: 3.04, source: "fallback" }
assert(gelFrom(100, "EUR", fx) === 304, "EUR→GEL")
assert(gelFrom(100, "USD", fx) === 270, "USD→GEL")
assert(gelFrom(150, "GEL", fx) === 150, "GEL passthrough")
assert(gelFrom(100, "JPY", fx) === 0, "unknown currency → 0")
assert(FX_FALLBACK.eurGel === 3.04 && FX_FALLBACK.usdGel === 2.7, "fallback matches currency.tsx")

// Stay validation: ISO, 1–30 nights, no past check-in.
const future = (d: number) => new Date(Date.now() + d * 86_400_000).toISOString().slice(0, 10)
assert(parseStay(future(7), future(9))?.nights === 2, "valid 2-night stay")
assert(parseStay(future(7), future(7)) === null, "same-day in/out rejected")
assert(parseStay(future(7), future(38)) === null, ">30 nights rejected")
assert(parseStay(future(-3), future(2)) === null, "past check-in rejected")
assert(parseStay("2026-13-01", "2026-13-05") === null, "non-ISO rejected")
assert(parseStay("15.09.2026", "17.09.2026") === null, "dot-date rejected")

// Place lookup: world-places is the source of truth.
const tbilisi = placeBySlug("tbilisi")
assert(tbilisi?.cc === "GE" && Math.abs(tbilisi.lat - 41.7151) < 1e-9, "tbilisi resolves")
assert(placeBySlug("not-a-city") === null, "unknown slug → null")

// Normalization: fixture with a live offer, a free-cancel offer and junk rows.
const norm = normalizeAmadeusOffers(
  [
    {
      hotel: { hotelId: "A", name: "Expensive", distance: 5.2, units: "KM", address: { lines: ["Rustaveli 1"] } },
      offers: [{ price: { currency: "EUR", total: "300.00" }, room: { typeEstimated: { category: "SUPERIOR" } } }],
    },
    {
      hotel: { hotelId: "B", name: "Cheap", distance: 0.8, units: "KM" },
      offers: [
        {
          price: { currency: "EUR", total: "100.50" },
          policies: { cancellation: { type: "FULL_STAY_BEFORE", description: "Fully refundable" } },
        },
      ],
    },
    { hotel: { hotelId: "C", name: "No offers" }, offers: [] },
    { hotel: { hotelId: "D", name: "Garbage price" }, offers: [{ price: { currency: "EUR", total: "N/A" } }] },
  ],
  fx,
  8,
)
assert(norm.length === 2, "junk rows dropped")
assert(norm[0].hotelId === "B" && norm[1].hotelId === "A", "sorted by total asc")
assert(norm[0].refundable && !norm[1].refundable, "refundable detection")
assert(norm[0].totalGel === 330 && norm[0].feeGel === 24, "margin applied on converted price")
assert(norm[0].providerGel === 306, "100.50 EUR → 306 ₾ (rounded)")
assert(norm[1].distanceKm === 5.2 && norm[1].address === "Rustaveli 1", "geo + address carried")

// Compare links: dates + adults embedded, affiliate params inject via env.
const links = compareLinks("Tbilisi", "2026-10-01", "2026-10-03", 2)
assert(links.length === 2 && links[0].name === "Booking.com" && links[1].name === "Expedia", "two partners")
assert(links[0].url.includes("ss=Tbilisi") && links[0].url.includes("checkin=2026-10-01"), "booking params")
assert(links[1].url.includes("d1=2026-10-01") && links[1].url.includes("adults=2"), "expedia params")
process.env.HOTEL_BOOKING_AID = "partner-42"
assert(compareLinks("Tbilisi", "2026-10-01", "2026-10-03", 2)[0].url.includes("aid=partner-42"), "affiliate aid injected")
delete process.env.HOTEL_BOOKING_AID

// Wiring: the page renders JSON-LD from these shapes and the route validates
// the same stay — source scan keeps the contract honest (i18n.check.ts pattern).
const page = readFileSync(join(dirname(fileURLToPath(import.meta.url)), "../app/[lang]/hotels/page.tsx"), "utf8")
assert(page.includes("application/ld+json"), "page emits hotel JSON-LD via script tag")
assert(!page.includes("'use client'") && !page.includes("useSearchParams"), "page stays server-only, zero client JS")
assert(page.includes("<Suspense"), "results stream inside Suspense — shell paints before Amadeus answers")
const route = readFileSync(join(dirname(fileURLToPath(import.meta.url)), "../app/api/hotels/route.ts"), "utf8")
assert(route.includes("s-maxage=600"), "route CDN-cached")

// Detail page wiring: room list + hotel JSON-LD, still server-only.
const detail = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), "../app/[lang]/hotels/[hotelId]/page.tsx"),
  "utf8",
)
assert(detail.includes("application/ld+json"), "detail page emits Hotel JSON-LD")
assert(!detail.includes("'use client'"), "detail page stays server-only")
assert(detail.includes("notFound()") && detail.includes("redirect("), "detail guards bad ids and stays")

// View params: clamped parse, pure filter+sort. Distance nulls last, cap is per-night.
const sample = normalizeAmadeusOffers(
  [
    { hotel: { hotelId: "A", name: "Far", distance: 6, units: "KM" }, offers: [{ price: { currency: "EUR", total: "300.00" } }] },
    { hotel: { hotelId: "B", name: "Near", distance: 0.4, units: "KM" }, offers: [{ price: { currency: "EUR", total: "100.00" } }] },
    { hotel: { hotelId: "C", name: "Mid", distance: 2.5, units: "KM" }, offers: [{ price: { currency: "EUR", total: "200.00" }, policies: { cancellation: { type: "FULL_STAY_BEFORE", description: "Free" } } }] },
  ],
  fx,
  8,
)
const byDistance = applyView(sample, parseView("distance"), 2)
assert(byDistance.map((h) => h.hotelId).join() === "B,C,A", "distance sort asc, price tiebreak n/a, no nulls here")
const refundOnly = applyView(sample, parseView(undefined, "1"), 2)
assert(refundOnly.length === 1 && refundOnly[0].hotelId === "C", "refund-only filter")
const capped = applyView(sample, parseView(undefined, undefined, "60"), 2)
assert(capped.every((h) => h.totalGel <= 60 * 2), "per-night cap multiplies by nights")
assert(applyView(sample, parseView(undefined, undefined, "99999"), 2).length === 3, "huge cap keeps all")
assert(applyView(sample, parseView(), 2)[0].hotelId === "B", "default view = price asc, no filter")
const noGeo = applyView([{ ...sample[0], distanceKm: null }], parseView("distance"), 2)
assert(noGeo[noGeo.length - 1].distanceKm === null, "distance sort: nulls last")

// normalizeHotelRooms: per-offer rows, junk dropped, offer ids carried.
const rooms = normalizeHotelRooms(
  {
    hotel: { hotelId: "A", name: "Grand", address: { lines: ["Rustaveli 1"] } },
    offers: [
      { id: "o1", price: { currency: "EUR", total: "150.00" }, room: { typeEstimated: { category: "DELUXE" } } },
      { id: "o2", price: { currency: "EUR", total: "90.00" }, policies: { cancellation: { type: "FULL_STAY_BEFORE", description: "Fully refundable" } } },
      { price: { currency: "EUR", total: "junk" } },
    ],
  },
  fx,
  8,
)
assert(rooms.length === 2, "junk room dropped")
assert(rooms[0].offerId === "o2" && rooms[0].refundable && rooms[0].providerGel === 274, "cheapest room first, refundable")
assert(rooms[1].offerId === "o1" && rooms[1].roomType === "DELUXE", "room category carried")
assert(normalizeHotelRooms({ hotel: { name: "no id" }, offers: [] }, fx, 8).length === 0, "hotel without id → []")

// Browse fallback: Overpass query shape, distance math, OSM normalization.
const q = browseQuery(41.7151, 44.8271)
assert(q.startsWith("[out:json][timeout:20];"), "query header")
assert(q.includes('["tourism"~"^(hotel|hostel|guest_house)$"](around:10000,41.7151,44.8271)'), "tourism filter + radius")
assert(q.includes("node") && q.includes("way") && q.endsWith("out center tags 60;"), "nodes+ways, centered, capped")
assert(haversineKm(41.7151, 44.8271, 41.7151, 44.8271) === 0, "zero distance")
assert(Math.abs(haversineKm(41.7151, 44.8271, 41.6934, 44.8015) - 3.3) < 0.2, "Tbilisi centre→Vake ≈3.3km")
const osm = normalizeOverpassHotels(
  [
    {
      type: "node",
      id: 1,
      lat: 41.72,
      lon: 44.83,
      tags: { name: "Near", stars: "4", "addr:street": "Rustaveli", "addr:housenumber": "3", phone: "+995 322 000000", website: "https://near.example" },
    },
    { type: "way", id: 2, center: { lat: 41.71, lon: 44.79 }, tags: { name: "Far Hotel" } },
    { type: "node", id: 3, lat: 41.71, lon: 44.82, tags: { name: "Bad stars", stars: "17" } },
    { type: "node", id: 4, lat: 41.71, lon: 44.82, tags: { amenity: "cafe" } },
    { type: "node", id: 5, tags: { name: "No coords" } },
  ],
  41.7151,
  44.8271,
)
assert(osm.length === 4, "unnamed dropped, rest kept")
assert(osm[0].name === "Near" && osm[0].stars === 4 && osm[0].address === "Rustaveli 3", "closest first, stars clamp + address join")
assert(osm[0].phone === "+995 322 000000" && osm[0].website === "https://near.example", "contacts carried")
assert(osm[0].distanceKm !== null && osm[0].distanceKm < 1, "node coords → distance")
const far = osm.find((h) => h.id === "2")
assert(far && far.stars === null && far.address === null && (far.distanceKm ?? 0) > 2, "way center, optional fields null")
assert(osm.find((h) => h.name === "Bad stars")?.stars === null, "out-of-range stars → null")
assert(osm[osm.length - 1].distanceKm === null, "null distance sorts last")
const dists = osm.map((h) => h.distanceKm ?? 999)
assert(dists.every((d, i) => i === 0 || dists[i - 1] <= d), "distance non-decreasing")
assert(page.includes("browseBadge") && page.includes("ODbL"), "browse mode renders + ODbL attribution present")

console.log("hotels.check: OK — margin, FX, stay, normalize, rooms, view, browse, links, wiring")
