/** Runnable check: npx tsx src/lib/trust/dedupe-core.check.ts */
import {
  areaBucket,
  type DupeListing,
  clusterFuzzy,
  fuzzyBlockKey,
  type FuzzyRow,
  geoFactsSignature,
  jaccard,
  perSqmUsd,
  phoneFactsSignature,
  phoneKey,
  pickRepresentative,
  priceOutliers,
  textTokens,
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

// textTokens: unicode split, stopwords + short tokens dropped
const toks = textTokens("იყიდება 3-ოთახიანი ბინა, ვაკეში! და The Sale")
console.assert(toks.has("ოთახიანი") && toks.has("ვაკეში"), "ka tokens kept")
console.assert(!toks.has("და") && !toks.has("the"), "stopwords dropped")
console.assert(textTokens("").size === 0 && textTokens(null).size === 0, "empty → ∅")
console.assert(jaccard(new Set(["a", "b"]), new Set(["a", "b"])) === 1, "identical → 1")
console.assert(jaccard(new Set(["a"]), new Set(["b"])) === 0, "disjoint → 0")
console.assert(jaccard(new Set(), new Set(["b"])) === 0, "empty → 0")

// fuzzyBlockKey: floor + area drift keeps the block; rooms/cell split it
const fz = (over: Partial<FuzzyRow>): FuzzyRow => ({
  id: "f1", dealType: "sale", propertyType: "apartment", city: "თბილისი",
  district: "ვაკე", rooms: 3, area: 82, lat: 41.7001, lng: 44.7999,
  title: "იყიდება 3 ოთახიანი ბინა ვაკეში", description: "ახალი რემონტით, ავეჯით",
  ...over,
})
const drifted = fz({ id: "f2", area: 88, title: "ბინა ვაკეში, 3 ოთახი, რემონტით" })
console.assert(fuzzyBlockKey(fz({})) === fuzzyBlockKey(drifted), "area drift keeps block")
console.assert(fuzzyBlockKey(fz({ rooms: 2 })) !== fuzzyBlockKey(fz({})), "rooms split block")
console.assert(fuzzyBlockKey(fz({ lat: 41.7021 })) !== fuzzyBlockKey(fz({})), "~200m splits block")

// clusterFuzzy: reworded + repriced + drifted repost clusters…
const reworded = fz({
  id: "f2", area: 88, title: "ბინა ვაკეში 3 ოთახიანი რემონტით",
  description: "იყიდება ავეჯით, ახალი რემონტი",
})
const groups = clusterFuzzy([fz({}), reworded])
console.assert(groups.length === 1 && groups[0]!.length === 2, "reworded repost clusters")
// …but area beyond ±15%, different rooms, or unrelated text stay out
console.assert(clusterFuzzy([fz({}), fz({ id: "f3", area: 110 })]).length === 0, "area +34% splits")
console.assert(
  clusterFuzzy([fz({}), fz({ id: "f4", title: "საოფისე ფართი საბურთალოზე", description: "ქირავდება ოფისი" })]).length === 0,
  "unrelated text splits",
)
// transitive merge: A~B, B~C with A≁C directly → one cluster of 3
// (abstract tokens pin the Jaccard arithmetic: 3/7 either link, 1/9 the gap)
const chainB = fz({ id: "fb", title: "alpha beta gamma", description: "zeta eta" })
const chainA = fz({ id: "fa", title: "alpha beta gamma delta", description: "eps" })
const chainC = fz({ id: "fc", title: "gamma zeta eta theta", description: "iota" })
const chain = clusterFuzzy([chainA, chainB, chainC])
console.assert(chain.length === 1 && chain[0]!.length === 3, "transitive triple merges")
// pathological blocks skip instead of O(n²) blowup
const mega = Array.from({ length: 65 }, (_, i) => fz({ id: `m${i}` }))
console.assert(clusterFuzzy(mega).length === 0, ">64 block skipped")

console.log("dedupe-core: ok")
