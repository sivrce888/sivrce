/**
 * Run: npx tsx src/lib/listing-share.check.ts
 */
import assert from "node:assert/strict"
import {
  listingPriceLabel,
  listingShareLines,
  listingShareText,
  waSendHref,
} from "./listing-share"

assert.equal(listingPriceLabel(285000, "USD"), "$285,000")
assert.equal(listingPriceLabel(1200, "GEL"), "1,200 ₾")
assert.equal(listingPriceLabel(0, "USD"), "")

const lines = listingShareLines({
  title: "იყიდება 2-ოთახიანი ბინა ვაკეში",
  district: "ვაკე",
  city: "თბილისი",
  priceLabel: "$285,000",
  area: 90,
  agentName: "ნინო ბერიძე",
  agency: "სივრცე პრემიუმ",
})
assert.equal(lines[0], "იყიდება 2-ოთახიანი ბინა ვაკეში")
assert.equal(lines[1], "$285,000 · 90 მ² · ვაკე, თბილისი")
assert.equal(lines[2], "ნინო ბერიძე · სივრცე პრემიუმ")

const url = "https://sivrce.ge/listing/abc"
const pack = listingShareText(
  {
    title: "იყიდება 2-ოთახიანი ბინა ვაკეში",
    district: "ვაკე",
    city: "თბილისი",
    priceLabel: "$285,000",
    area: 90,
  },
  url,
)
assert.ok(pack.endsWith(url))
assert.ok(!pack.includes("\n\n"))

assert.equal(
  waSendHref("გამარჯობა"),
  "https://wa.me/?text=" + encodeURIComponent("გამარჯობა"),
)

console.log("listing-share.check: ok")
