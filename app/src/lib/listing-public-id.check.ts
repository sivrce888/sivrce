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
import { fairPriceOf, priceScaleOf } from "./price-scale"

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
console.log("listing-public-id + price-scale: ok")
