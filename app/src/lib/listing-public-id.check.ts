/** Runnable check: npx tsx src/lib/listing-public-id.check.ts */
import {
  cadastralVariants,
  isExactLookupQuery,
  lookupKind,
  parseCadastralCode,
  parseListingNumber,
  parsePhoneDigits,
  phoneSearchNeedles,
  publicIdFromString,
  PUBLIC_ID_BASE,
} from "./listing-public-id"
import { daysSince, fairPriceOf, priceScaleOf, priceEventViews } from "./price-scale"

const a = publicIdFromString("vake-chavchavadze-47")
const b = publicIdFromString("vake-chavchavadze-47")
console.assert(a === b && a >= PUBLIC_ID_BASE && String(a).length === 8, "stable 8-digit id")
console.assert(parseListingNumber("ID 24316314") === 24316314, "parse id")
console.assert(parseListingNumber("597737123") === null, "phone not id")
console.assert(parseListingNumber("053215356") === null, "cad digits not id")
console.assert(parsePhoneDigits("+995 597 737 123") === "597737123", "parse phone")
console.assert(parseCadastralCode("01.10.01.001.001") === "01.10.01.001.001", "parse cad dotted")
console.assert(parseCadastralCode("011001001001") === "011001001001", "parse cad digits")
console.assert(parseCadastralCode("05.32.15.356") === "05.32.15.356", "parse cad 9-dot")
console.assert(parseCadastralCode("053215356") === "053215356", "parse cad 9-digit")
console.assert(parseCadastralCode("597737123") === null, "phone not cad")
console.assert(cadastralVariants("011001001001").includes("01.10.01.001.001"), "cad re-dot")
console.assert(cadastralVariants("053215356").includes("05.32.15.356"), "cad 9 re-dot")
console.assert(isExactLookupQuery("01.10.01.001.001"), "exact cad")
console.assert(lookupKind("+995 597 73 71 23") === "phone", "kind phone")
console.assert(lookupKind("24316314") === "id", "kind id")
console.assert(lookupKind("01.10.01.001.001") === "cadastral", "kind cad")
console.assert(phoneSearchNeedles("597737123").includes("+995 597 73 71 23"), "phone canon needle")
console.assert(priceScaleOf(500, [1000, 2000, 3000]).band === "low", "cheap band")
console.assert(priceScaleOf(4000, [1000, 2000, 3000]).band === "high", "high band")
const fair = fairPriceOf(285_000, 100, [2500, 2600, 2680, 2700, 2780, 2900, 3100])
console.assert(fair !== null && fair.position === "above", "above comps")
console.assert(fairPriceOf(100, 80, [1000, 2000]) === null, "thin sample")
const evs = priceEventViews(
  [
    { eventType: "listed", price: 80_000, previousPrice: null, currency: "USD", recordedAt: new Date("2026-08-01T10:00:00Z") },
    { eventType: "price_drop", price: 108_000, previousPrice: 120_000, currency: "GEL", recordedAt: "2026-08-15T10:00:00Z" },
    { eventType: "weird", price: 50_000, previousPrice: null, currency: "USD", recordedAt: "2026-08-20T10:00:00Z" },
  ],
  2.7,
)
console.assert(evs[0]!.type === "listed" && evs[0]!.priceUSD === 80_000 && evs[0]!.deltaPct === null, "ev listed")
console.assert(evs[1]!.priceUSD === 40_000 && evs[1]!.deltaPct === 10, "ev drop gel→usd")
console.assert(evs[2]!.type === "listed", "ev unknown type falls back")
const NOW = Date.parse("2026-09-03T12:00:00Z")
console.assert(daysSince("2026-08-20", NOW) === 14, "daysSince 14d")
console.assert(daysSince("2026-09-03", NOW) === 0, "daysSince today")
console.assert(daysSince("2026-09-10", NOW) === 0, "daysSince future clamps")
console.assert(daysSince("garbage", NOW) === 0, "daysSince bad input")
console.log("listing-public-id + price-scale: ok")
