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
  bestXoteloStay,
  browseQuery,
  collectTaKeys,
  compareLinks,
  foldHotelName,
  gelFrom,
  haversineKm,
  hotelTaKey,
  keepHotelName,
  marginPct,
  mergeBrowseHotels,
  osmImage,
  normalizeAmadeusOffers,
  normalizeHotelRooms,
  normalizeLiteApiRates,
  normalizeNominatimHotels,
  normalizeOverpassHotels,
  normalizePhotonHotels,
  normalizeXoteloRates,
  paintOtaPrices,
  parseStay,
  parseTaKey,
  parseView,
  parseWikiLodging,
  placeBySlug,
  SEED_TA,
  wikiLodgingQuery,
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
assert(links.length === 6 && links[0].name === "Google Hotels" && links[1].name === "Booking.com", "six partners, Google first")
assert(links[0].url.includes("google.com/travel/hotels") && links[0].url.includes("start_date=2026-10-01"), "google hotels params")
assert(links[1].url.includes("ss=Tbilisi") && links[1].url.includes("checkin=2026-10-01"), "booking params")
assert(links[2].name === "Kayak" && links[2].url.includes("kayak.com/hotels"), "kayak")
assert(links[3].url.includes("d1=2026-10-01") && links[3].url.includes("adults=2"), "expedia params")
assert(links[4].name === "Agoda" && links[4].url.includes("los=2"), "agoda nights")
assert(links[5].name === "Hotels.com" && links[5].url.includes("hotels.com"), "hotels.com")
process.env.HOTEL_BOOKING_AID = "partner-42"
assert(compareLinks("Tbilisi", "2026-10-01", "2026-10-03", 2)[1].url.includes("aid=partner-42"), "affiliate aid injected")
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
      tags: { name: "Near", stars: "4", "addr:street": "Rustaveli", "addr:housenumber": "3", phone: "+995 322 000000", website: "https://near.example", wikimedia_commons: "File:Near_hotel.jpg" },
    },
    { type: "way", id: 2, center: { lat: 41.71, lon: 44.79 }, tags: { name: "Far Hotel" } },
    { type: "node", id: 3, lat: 41.71, lon: 44.82, tags: { name: "Bad stars", stars: "17" } },
    { type: "node", id: 4, lat: 41.71, lon: 44.82, tags: { amenity: "cafe" } },
    { type: "node", id: 5, tags: { name: "No coords" } },
    { type: "node", id: 6, lat: 41.71, lon: 44.82, tags: { name: "Hotel" } },
    { type: "node", id: 7, lat: 41.71, lon: 44.82, tags: { name: "სასტუმრო", "name:en": "Rooms Hotel" } },
  ],
  41.7151,
  44.8271,
)
assert(osm.length === 5, "unnamed + generic Hotel dropped, rest kept")
assert(osm[0].name === "Near" && osm[0].stars === 4 && osm[0].address === "Rustaveli 3", "closest first, stars clamp + address join")
assert(osm[0].phone === "+995 322 000000" && osm[0].website === "https://near.example", "contacts carried")
assert(osm[0].image?.includes("Near_hotel.jpg") && osm[0].image?.includes("width=640"), "wikimedia photo")
assert(osm[0].distanceKm !== null && osm[0].distanceKm < 1, "node coords → distance")
const far = osm.find((h) => h.id === "2")
assert(far && far.stars === null && far.address === null && (far.distanceKm ?? 0) > 2, "way center, optional fields null")
assert(osm.find((h) => h.name === "Bad stars")?.stars === null, "out-of-range stars → null")
assert(osm.find((h) => h.name === "Rooms Hotel"), "name:en wins over local name")
assert(!osm.some((h) => h.name === "Hotel"), "generic amenity word dropped")
assert(osm[osm.length - 1].distanceKm === null, "null distance sorts last")
const dists = osm.map((h) => h.distanceKm ?? 999)
assert(dists.every((d, i) => i === 0 || dists[i - 1] <= d), "distance non-decreasing")
assert(page.includes("browseBadge") && page.includes("ODbL"), "browse mode renders + ODbL attribution present")
assert(page.includes("partnerRow(placeEn, true)"), "empty + browse footers keep OTA compare even without GDS")
assert(keepHotelName("Wyndham Grand") && !keepHotelName("Hotel") && !keepHotelName("ab"), "name filter")

const nom = normalizeNominatimHotels(
  [
    { osm_id: 1, lat: "41.716", lon: "44.828", name: "Wyndham Grand", type: "hotel", address: { road: "Gudiashvili", house_number: "3" }, extratags: { stars: "5", website: "https://w.example" } },
    { osm_id: 2, lat: "41.71", lon: "44.82", name: "Cafe", type: "restaurant" },
    { osm_id: 3, lat: "41.72", lon: "44.83", name: "Hotel" },
  ],
  41.7151,
  44.8271,
)
assert(nom.length === 1 && nom[0].name === "Wyndham Grand" && nom[0].stars === 5 && nom[0].website === "https://w.example" && nom[0].image === null, "nominatim: hotel kept, cafe+generic dropped")
assert(nom[0].address === "Gudiashvili 3", "nominatim address join")

const ph = normalizePhotonHotels(
  [
    { geometry: { coordinates: [44.819, 41.695] }, properties: { osm_id: 9, name: "Hotel Isaka", street: "Nastakiri", housenumber: "6" } },
    { geometry: { coordinates: [44.82, 41.71] }, properties: { osm_id: 10, name: "Hotel" } },
    { properties: { osm_id: 11, name: "No geom inn" } },
  ],
  41.7151,
  44.8271,
)
assert(ph.length === 2 && ph[0].name === "Hotel Isaka" && ph[0].address === "Nastakiri 6", "photon: named hotel first")
assert(ph[1].distanceKm === null, "photon missing coords → null distance")

const merged = mergeBrowseHotels(nom, [{ id: "x", name: "Wyndham Grand", stars: null, distanceKm: 9, address: null, phone: null, website: null, image: null }], ph)
assert(merged.length === 3 && merged[0].name === "Wyndham Grand" && merged[0].website === "https://w.example", "merge: first list wins, dup dropped")
const prio = mergeBrowseHotels(
  [{ id: "1", name: "Wyndham Grand", stars: null, distanceKm: 5, address: null, phone: null, website: null, image: null }],
  [{ id: "2", name: "Hotel Isaka", stars: null, distanceKm: 0.2, address: null, phone: null, website: null, image: null }],
)
assert(prio[0].name === "Wyndham Grand" && prio[1].name === "Hotel Isaka", "merge keeps source order, not global distance")

const src = readFileSync(join(dirname(fileURLToPath(import.meta.url)), "./hotels.ts"), "utf8")
assert(src.includes("nominatim.openstreetmap.org"), "Nominatim directory")
assert(src.includes("photon.komoot.io"), "Photon directory")
assert(src.includes("maps.mail.ru"), "Overpass mail.ru first (DE/kumi flake)")
assert(src.includes("data.xotelo.com/api/rates"), "Xotelo live OTA")
assert(src.includes("query.wikidata.org"), "Wikidata TA keys")
assert(src.includes("google.com/travel/hotels") && src.includes("kayak.com/hotels"), "Google Hotels + Kayak deep links")
assert(src.includes("sivrce-maps/1.0"), "Nominatim-required User-Agent")
assert(!src.includes("CURATED_HOTEL_IMAGES") && !src.includes("enrichHotelMeta"), "no stock-photo / fake-rating enrichment")
assert(!page.includes("enrichHotelMeta") && !detail.includes("enrichHotelMeta"), "pages do not invent OTA markups")
assert(osmImage({ wikimedia_commons: "File:Foo_bar.jpg" })?.includes("Special:FilePath/Foo_bar.jpg"), "wikimedia FilePath")
assert(osmImage({ wikimedia_commons: "Category:Hotels" }) === null, "skip commons Category")
assert(osmImage({ image: "https://cdn.example/h.jpg" }) === "https://cdn.example/h.jpg", "https jpg kept")
assert(osmImage({ image: "http://cdn.example/h.jpg" }) === null && osmImage({ image: "https://cdn.example/h.svg" }) === null, "http + svg dropped")

assert(parseTaKey("https://www.tripadvisor.com/Hotel_Review-g294195-d301416-Reviews-X") === "g294195-d301416", "ta url")
assert(parseTaKey("g294195-d23527973") === "g294195-d23527973", "ta key passthrough")
assert(parseTaKey("301416") === null && hotelTaKey("294195", "23527973") === "g294195-d23527973", "geo+d join")
assert(foldHotelName("Rooms Hotel Tbilisi") === foldHotelName("rooms-hotel tbilisi"), "fold name")

const xStay = bestXoteloStay(
  [{ name: "Vio.com", rate: 146 }, { name: "Booking.com", rate: 158 }, { rate: 0 }, { name: "junk" }],
  2,
  fx,
  8,
)
assert(xStay && xStay.providerTotal === 292, "xotelo min × nights")
assert(xStay.providerGel === 888 && xStay.feeGel === 71 && xStay.totalGel === 959, "xotelo margin on stay")
assert(bestXoteloStay([], 2, fx, 8) === null, "empty rates")
const xRooms = normalizeXoteloRates("g294195-d301416", "Rooms", [{ code: "BookingCom", name: "Booking.com", rate: 100 }, { rate: -1 }], 2, fx, 8)
assert(xRooms.length === 1 && xRooms[0].roomType === "Booking.com" && xRooms[0].providerTotal === 200, "xotelo room row")

/* ── LiteAPI normalization ───────────────────────────────────────────────
 * Payload shape copied from docs.liteapi.travel "Hotel Rates API JSON Data
 * Structure" (fetched 2026-09-15) — the adapter cannot be exercised without a
 * key, so the documented contract is what we pin.
 */
const liteRows = normalizeLiteApiRates(
  [
    {
      hotelId: "lp1f2a3",
      hotel: { name: "Rooms Hotel Tbilisi", address: "Kostava 14", latitude: 41.71, longitude: 44.79 },
      roomTypes: [
        {
          offerId: "offer-expensive",
          offerRetailRate: { amount: 300, currency: "EUR" },
          suggestedSellingPrice: { amount: 360, currency: "EUR" },
          rates: [{ name: "Suite", cancellationPolicies: { refundableTag: "RFN" } }],
        },
        {
          offerId: "offer-cheapest",
          offerRetailRate: { amount: 197.53, currency: "EUR" },
          suggestedSellingPrice: { amount: 249.53, currency: "EUR" },
          rates: [{ name: "Deluxe King", cancellationPolicies: { refundableTag: "NRFN" } }],
        },
      ],
    },
  ],
  fx,
  8,
  { lat: 41.7151, lng: 44.8271 },
)
assert(liteRows.length === 1, "one row per hotel")
assert(liteRows[0].offerId === "offer-cheapest", "cheapest offer wins, not the first listed")
// The pricing rule that matters: guest pays SSP, we pay retail, fee is the
// spread. A flat HOTEL_MARGIN_PCT here would break LiteAPI's revenue rules.
assert(liteRows[0].providerGel === gelFrom(197.53, "EUR", fx), "providerGel = offerRetailRate")
assert(liteRows[0].totalGel === gelFrom(249.53, "EUR", fx), "totalGel = suggestedSellingPrice")
assert(liteRows[0].feeGel === liteRows[0].totalGel - liteRows[0].providerGel, "fee is the SSP spread")
assert(liteRows[0].totalGel !== withMargin(liteRows[0].providerGel, 8).totalGel, "SSP must override flat margin")
assert(liteRows[0].refundable === false, "NRFN is not refundable")
assert(liteRows[0].distanceKm !== null && liteRows[0].distanceKm < 5, "distance from search origin")

// No SSP → fall back to the flat margin rather than selling at cost.
const liteNoSsp = normalizeLiteApiRates(
  [
    {
      hotelId: "h2",
      name: "Flat Margin Inn",
      roomTypes: [{ offerId: "o", offerRetailRate: { amount: 100, currency: "EUR" }, rates: [{ name: "Std", cancellationPolicies: { refundableTag: "RFN" } }] }],
    },
  ],
  fx,
  8,
)
assert(liteNoSsp[0].totalGel === withMargin(gelFrom(100, "EUR", fx), 8).totalGel, "no SSP → flat margin")
assert(liteNoSsp[0].refundable === true, "RFN is refundable")
assert(liteNoSsp[0].distanceKm === null, "no origin → no distance claim")

// An SSP below what we pay is bad data — never sell at a loss on it.
const liteBadSsp = normalizeLiteApiRates(
  [
    {
      hotelId: "h3",
      name: "Bad Data Inn",
      roomTypes: [
        {
          offerId: "o",
          offerRetailRate: { amount: 200, currency: "EUR" },
          suggestedSellingPrice: { amount: 150, currency: "EUR" },
          rates: [{ name: "Std" }],
        },
      ],
    },
  ],
  fx,
  8,
)
assert(liteBadSsp[0].totalGel > liteBadSsp[0].providerGel, "SSP below cost is ignored")
assert(liteBadSsp[0].refundable === false, "missing cancellation policy reads as non-refundable")

// Junk must be dropped, never rendered as a free room.
assert(normalizeLiteApiRates([{ hotelId: "x" }], fx, 8).length === 0, "no offers → no row")
assert(normalizeLiteApiRates([{ name: "No id" }], fx, 8).length === 0, "no hotelId → no row")
assert(
  normalizeLiteApiRates(
    [{ hotelId: "z", name: "Zero", roomTypes: [{ offerId: "o", offerRetailRate: { amount: 0, currency: "EUR" } }] }],
    fx,
    8,
  ).length === 0,
  "zero-price offer dropped",
)

const wiki = parseWikiLodging([
  { kind: { value: "c" }, name: { value: "" }, ta: { value: "294195" } },
  { kind: { value: "h" }, name: { value: "Spark by Hilton Tbilisi Biography" }, ta: { value: "23527973" } },
  { kind: { value: "h" }, name: { value: "Hotel" }, ta: { value: "99999" } },
])
assert(wiki.geo === "294195" && wiki.hotels.length === 1 && wiki.hotels[0].ta === "23527973", "wiki geo + hotel, generic dropped")
const wikiQ = wikiLodgingQuery(41.7151, 44.8271)
assert(wikiQ.includes("wikibase:around") && wikiQ.includes("P3134") && wikiQ.includes("Point(44.8271 41.7151)"), "wiki query")

const keys = collectTaKeys(
  [{ id: "1", name: "Local Inn", stars: null, distanceKm: 1, address: null, phone: null, website: null, image: null, taKey: "g294195-d111" }],
  wiki,
  41.7151,
  44.8271,
)
assert(keys.some((k) => k.key === "g294195-d23527973") && keys.some((k) => k.key === "g294195-d7171589"), "wiki + tbilisi seed")
assert(keys.some((k) => k.key === "g294195-d111"), "osm taKey collected")
assert(collectTaKeys([], { geo: null, hotels: [] }, 48.85, 2.35).length === 0, "paris: no ge seed")
// Seeds are the hand-verified keys; attachOtaPrices only fetches the first 8,
// so they must lead — an OSM tripadvisor tag must not push them off the edge.
assert(
  keys.slice(0, SEED_TA.length).every((k, i) => k.key === SEED_TA[i].key),
  "verified seeds lead the fetch queue",
)
assert(SEED_TA.length > 0 && new Set(SEED_TA.map((s) => s.key)).size === SEED_TA.length, "seed keys unique")
for (const s of SEED_TA) {
  assert(parseTaKey(s.key) === s.key, `seed key well-formed: ${s.name}`)
  assert(keepHotelName(s.name), `seed name usable on a card: ${s.key}`)
}

const painted = paintOtaPrices(
  [
    { id: "osm", name: "Spark by Hilton Tbilisi Biography", stars: 4, distanceKm: 0.4, address: "X", phone: null, website: null, image: null },
    { id: "2", name: "No Price Inn", stars: null, distanceKm: 0.1, address: null, phone: null, website: null, image: null },
  ],
  [{ name: "Spark by Hilton Tbilisi Biography", key: "g294195-d23527973", providerGel: 480, totalGel: 518, feeGel: 38 }],
)
assert(painted[0].totalGel === 518 && painted[0].id === "g294195-d23527973", "priced first, id=taKey")
assert(painted.some((h) => h.name === "No Price Inn" && !h.totalGel), "unpriced kept")
assert(page.includes("h.totalGel") && detail.includes("r.totalGel"), "UI shows sivrce quote (provider + margin)")
const nav = readFileSync(join(dirname(fileURLToPath(import.meta.url)), "../components/sections/Navbar.tsx"), "utf8")
assert(nav.includes("'nav.hotels'") && nav.includes("/hotels"), "Navbar ships Hotels → /hotels")
assert(nav.includes("!to.startsWith('/hotels')"), "market nav still localizes /hotels (not a country path)")
assert(nav.includes("{ key: 'nav.services', to: '/services', mobileOnly: true }"), "Services yields desktop slot so 6-cap holds")
const cats = readFileSync(join(dirname(fileURLToPath(import.meta.url)), "../components/sections/Categories.tsx"), "utf8")
assert(cats.includes("href: '/hotels'"), "home Hotels tile → GDS hub")

console.log("hotels.check: OK — margin, FX, stay, normalize, rooms, view, browse, links, photos, wiring")
