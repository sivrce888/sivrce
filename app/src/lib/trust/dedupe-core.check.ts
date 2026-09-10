/** Runnable check: npx tsx src/lib/trust/dedupe-core.check.ts */
import {
  areaBucket,
  type DupeListing,
  geoFactsSignature,
  perSqmUsd,
  phoneFactsSignature,
  phoneKey,
  pickRepresentative,
  priceOutliers,
} from "./dedupe-core"

const base: DupeListing = {
  id: "l1", ownerId: "u1", verified: false, createdAt: new Date("2026-01-01"),
  dealType: "sale", propertyType: "apartment", city: "თბილისი", district: "ვაკე",
  rooms: 3, floor: 5, area: 82, lat: 41.7001, lng: 44.7999,
  listingPhone: "+995 555 12-34-56", price: 150000, currency: "USD", pricePerSqm: null,
}

// phoneKey: Georgian tails, junk-tolerant
console.assert(phoneKey("+995 555 12-34-56") === "555123456", "GE mobile tail")
console.assert(phoneKey("0 322 12 34 56") === "322123456", "landline tail")
console.assert(phoneKey("12345") === null, "too-short digits → null")
console.assert(phoneKey(null) === null && phoneKey(undefined) === null, "empty → null")

// areaBucket: ±2.5m² window
console.assert(areaBucket(82) === 80 && areaBucket(83) === 85, "bucket edges")
console.assert(areaBucket(57) === 55 && areaBucket(58) === 60, "57/58 split at midpoint")

// phone signature: same phone + facts → same sig; city or floor change → split
const repost = { ...base, id: "l2", createdAt: new Date("2026-02-01"), price: 155000 }
console.assert(phoneFactsSignature(base) === phoneFactsSignature(repost), "reprice keeps sig")
console.assert(
  phoneFactsSignature({ ...base, city: "ბათუმი" }) !== phoneFactsSignature(base),
  "city splits sig",
)
console.assert(
  phoneFactsSignature({ ...base, listingPhone: null }) === null,
  "no phone → no sig",
)

// geo signature: different seller, same pin cell + facts → collide; different floor → split
const crossSeller = { ...repost, id: "l3", listingPhone: "+995 599 99 88 77" }
console.assert(geoFactsSignature(base) === geoFactsSignature(crossSeller), "cross-seller collide")
console.assert(
  geoFactsSignature({ ...base, floor: 6 }) !== geoFactsSignature(base),
  "floor splits geo sig",
)
console.assert(
  geoFactsSignature({ ...base, lat: 41.7009 }) !== geoFactsSignature(base),
  "~100m apart splits geo sig",
)

// representative: verified beats newer; then oldest
const older = { ...base, id: "l0", createdAt: new Date("2025-12-01") }
const verifiedNewest = { ...base, id: "l9", verified: true, createdAt: new Date("2026-03-01") }
console.assert(pickRepresentative([repost, base, older]).id === "l0", "oldest unverified wins")
console.assert(pickRepresentative([repost, older, verifiedNewest]).id === "l9", "verified wins")

// perSqmUsd: derive from price/area, convert GEL
console.assert(perSqmUsd(base, 2.7) === 150000 / 82, "USD derived from price/area")
console.assert(
  perSqmUsd({ ...base, price: 270000, currency: "GEL", pricePerSqm: 3292 }, 2.7) === 3292 / 2.7,
  "GEL converts",
)

// outliers: needs ≥8 samples, >4× or <¼ median
const dup = (i: number, price: number): DupeListing => ({
  ...base, id: `o${i}`, price, pricePerSqm: price / 82,
})
const market = Array.from({ length: 8 }, (_, i) => dup(i, 100000))
console.assert(priceOutliers(market, 2.7).size === 0, "uniform market → no outliers")
const spiked = [...market, dup(99, 500000)]
console.assert(priceOutliers(spiked, 2.7).has("o99"), "5× median flagged")
const dumped = [...market, dup(98, 20000)]
console.assert(priceOutliers(dumped, 2.7).has("o98"), "⅕ median flagged")
const thin = market.slice(0, 6).concat(dup(97, 500000))
console.assert(priceOutliers(thin, 2.7).size === 0, "n<8 stays quiet")

console.log("dedupe-core: ok")
