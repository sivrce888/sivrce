/** Runnable check: npx tsx src/lib/listing-public-id.check.ts */
import {
  cadastralVariants,
  isExactLookupQuery,
  parseCadastralCode,
  parseListingNumber,
  parsePhoneDigits,
  publicIdFromString,
  PUBLIC_ID_BASE,
} from "./listing-public-id"
import { priceScaleOf } from "./price-scale"

const a = publicIdFromString("vake-chavchavadze-47")
const b = publicIdFromString("vake-chavchavadze-47")
console.assert(a === b && a >= PUBLIC_ID_BASE && String(a).length === 8, "stable 8-digit id")
console.assert(parseListingNumber("ID 24316314") === 24316314, "parse id")
console.assert(parsePhoneDigits("+995 597 737 123") === "597737123", "parse phone")
console.assert(parseCadastralCode("01.10.01.001.001") === "01.10.01.001.001", "parse cad dotted")
console.assert(parseCadastralCode("011001001001") === "011001001001", "parse cad digits")
console.assert(parseCadastralCode("597737123") === null, "phone not cad")
console.assert(cadastralVariants("011001001001").includes("01.10.01.001.001"), "cad re-dot")
console.assert(isExactLookupQuery("01.10.01.001.001"), "exact cad")
console.assert(priceScaleOf(500, [1000, 2000, 3000]).band === "low", "cheap band")
console.assert(priceScaleOf(4000, [1000, 2000, 3000]).band === "high", "high band")
console.log("listing-public-id + price-scale: ok")
