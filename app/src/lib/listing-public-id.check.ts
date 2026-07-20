/** Runnable check: npx tsx src/lib/listing-public-id.check.ts */
import {
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
console.assert(priceScaleOf(500, [1000, 2000, 3000]).band === "low", "cheap band")
console.assert(priceScaleOf(4000, [1000, 2000, 3000]).band === "high", "high band")
console.log("listing-public-id + price-scale: ok")
