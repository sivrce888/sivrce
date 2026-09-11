/** Runnable check: npx tsx src/lib/intel/core.check.ts */
import {
  coverageScoreOf,
  foldGerman,
  freshnessOf,
  inferProjectStatus,
  ingestIdempotencyKey,
  isFetchableUrl,
  matchEntities,
  nameSimilarity,
  normalizeName,
  parseIntelQuery,
  qualityScoreOf,
  resolveConflict,
  sanitizeScrapedText,
  sourceReliability,
  sourcesFor,
  validateIngestRecord,
} from "./core"

// normalization: m² variants + ka fold collapse to one key
console.assert(normalizeName("m² Real Estate") === normalizeName("M2 Real Estate"), "m2 variants")
console.assert(normalizeName("m2.ge") === "m2 ge", "domain punct")
console.assert(normalizeName("შპს არქი") === normalizeName("არქი"), "legal suffix")
// DE adapter: umlauts fold, GmbH/AG suffixes drop, WBM-style names stable
console.assert(foldGerman("Grünau Köpenick") === "Grunau Kopenick", "de fold")
console.assert(normalizeName("Müller GmbH") === normalizeName("Muller"), "de legal suffix")
console.assert(normalizeName("WBM Wohnungsbaugesellschaft") === normalizeName("wbm wohnungsbaugesellschaft"), "de multi-token")
console.assert(nameSimilarity("Axis Towers", "Axis Towers Tbilisi") > 0.5, "project partial")
console.assert(nameSimilarity("Axis Towers", "Completely Other Name Xyz") < 0.35, "distinct names")

// resolution: resemblance alone never merges
const vake = { latA: 41.7, lngA: 44.79, latB: 41.7005, lngB: 44.7905 } as const
const merge = matchEntities({ nameA: "M2 Real Estate", nameB: "m2", domainA: "m2.ge", domainB: "m2.ge", ...vake })
console.assert(merge.decision === "merge", "domain+geo merges")
const cand = matchEntities({ nameA: "Axis Towers", nameB: "Axis Towers Tbilisi", ...vake })
console.assert(cand.decision === "candidate", "lookalike stays candidate")
const far = matchEntities({ nameA: "Axis Towers", nameB: "Axis Towers", latA: 41.7, lngA: 44.79, latB: 41.73, lngB: 44.83 })
console.assert(far.decision !== "merge", "far coords block merge")

// trust: permit facts rank government above marketing
console.assert(
  sourceReliability("government", "permit_status") > sourceReliability("official_company", "permit_status"),
  "gov wins permits",
)
console.assert(
  sourceReliability("official_company", "price") > sourceReliability("public_listing", "price"),
  "official wins price",
)

// freshness: price goes stale fast, coordinates almost never
const h = 3_600_000
const now = Date.now()
console.assert(freshnessOf(new Date(now - 2 * h), "price", now) === "live", "fresh price live")
console.assert(freshnessOf(new Date(now - 30 * 24 * h), "price", now) === "stale", "month-old price stale")
console.assert(freshnessOf(new Date(now - 30 * 24 * h), "coordinates", now) === "live", "coords stay live")
console.assert(freshnessOf(null, "price", now) === "unknown", "missing → unknown")

// conflicts: best-supported wins, alternatives kept by count
const r = resolveConflict([
  { sourceKind: "government", fact: "project_status", value: "under_construction", retrievedAt: new Date(now - h) },
  { sourceKind: "official_company", fact: "project_status", value: "under_construction", retrievedAt: new Date(now - h) },
  { sourceKind: "public_listing", fact: "project_status", value: "completed", retrievedAt: new Date(now - h) },
])
console.assert(r.value === "under_construction" && r.label === "verified", "majority verifies")
const solo = resolveConflict([
  { sourceKind: "public_listing", fact: "price", value: "150000", retrievedAt: new Date(now - h) },
])
console.assert(solo.label === "unverified", "single source never verified")

// status inference: stale page alone ⇒ unknown, never active
const old = new Date(now - 400 * 24 * h)
console.assert(inferProjectStatus([{ kind: "page_exists", at: old }], now).status === "unknown", "stale page unknown")
console.assert(
  inferProjectStatus([{ kind: "construction_update", at: new Date(now - h) }], now).status === "under_construction",
  "fresh update activates",
)
console.assert(
  inferProjectStatus([{ kind: "page_exists", at: new Date(now - h) }], now).status === "unknown",
  "lone fresh page still unknown",
)

// quality + coverage stay in range and reward evidence
const q = qualityScoreOf({ completeness: 1, accuracy: 1, freshness: 1, sourceQuality: 1, agreement: 1, geoConfidence: 1 })
console.assert(q === 100, "perfect evidence → 100")
console.assert(qualityScoreOf({ completeness: 0, accuracy: 0, freshness: 0, sourceQuality: 0, agreement: 0, geoConfidence: 0 }) === 0, "empty → 0")
const cov = coverageScoreOf({ developer: 1, project: 1, activeProject: 1, geographic: 1, source: 1, freshness: 1, verifiedRatio: 1 })
console.assert(cov === 100, "full coverage → 100")

// guards: SSRF blocked, scripts stripped, idempotency stable
console.assert(!isFetchableUrl("http://localhost:3000/x"), "localhost blocked")
console.assert(!isFetchableUrl("http://169.254.169.254/"), "link-local blocked")
console.assert(!isFetchableUrl("ftp://example.com/f"), "non-http blocked")
console.assert(isFetchableUrl("https://napr.gov.ge/public"), "public https allowed")
console.assert(!sanitizeScrapedText('<script>alert(1)</script><p>hi</p>').includes("alert"), "scripts stripped")
const rec = { sourceSlug: "ge-napr", entityKind: "project" as const, externalId: "p1", payloadHash: "h" }
console.assert(ingestIdempotencyKey(rec) === ingestIdempotencyKey(rec), "idempotency stable")
console.assert(
  validateIngestRecord({ ...rec, fetchedAt: new Date(), url: "http://localhost/x", facts: [] }) === "unfetchable_url",
  "pipeline rejects SSRF url",
)

// registry + intel queries
console.assert(sourcesFor("GE", "permit_status").some((s) => s.slug === "ge-napr"), "GE permits covered")
console.assert(sourcesFor("DE", "permit_status").some((s) => s.slug === "de-alkis"), "DE permits covered")
console.assert(sourcesFor("DE", "company_identity").some((s) => s.slug === "de-handelsregister"), "DE identity covered")
const iq = parseIntelQuery("Show me every active development in Tbilisi")
console.assert(iq?.entity === "project" && iq?.city === "თბილისი" && iq?.status === "active", "active-tbilisi parses")
const iqBerlin = parseIntelQuery("Show me every active development in Berlin")
console.assert(iqBerlin?.entity === "project" && iqBerlin?.city === "ბერლინი" && iqBerlin?.status === "active", "active-berlin parses")
console.assert(parseIntelQuery("projects completing in 2027")?.completingYear === 2027, "year parses")
console.assert(parseIntelQuery("developers with multiple active projects")?.minActiveProjects === 2, "portfolio parses")
console.assert(parseIntelQuery("new apartments in Vake under $300k")?.maxPrice === 300000, "money parses")
console.assert(parseIntelQuery("Neubau in Kreuzberg unter €500k")?.maxPrice === 500000, "euro money parses")
console.assert(parseIntelQuery("Neubau in Kreuzberg unter €500k")?.district === "კროიცბერგი", "berlin district parses")
console.assert(parseIntelQuery("hello there friend") === null, "chit-chat → null")

console.log("intel-core: ok")
