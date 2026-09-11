/**
 * Sivrce real-estate intelligence core — pure functions, no DB, no network.
 * Single source of truth for: canonical statuses, multilingual normalization,
 * entity resolution, provenance/conflict rules, freshness, quality + coverage
 * scoring, source registry, ingestion-pipeline validation and intel queries.
 *
 * Consumed by lib/intel/store.ts (persistence), /api/intel/* (publication)
 * and /[lang]/admin/intel (control center). Asserted by core.check.ts.
 *
 * ponytail: one dependency-free module instead of a per-concern file fan-out;
 * exact/token-set matching, not embeddings — upgrade to pgvector similarity
 * only if the admin DUPLICATE_CANDIDATE queue runs dry.
 */

/* ── Canonical vocabularies (country-agnostic; Georgia is one adapter) ── */

export const PROJECT_STATUSES = [
  "announced",
  "pre_launch",
  "planned",
  "permitted",
  "under_construction",
  "near_completion",
  "completed",
  "suspended",
  "cancelled",
  "unknown",
] as const
export type ProjectStatus = (typeof PROJECT_STATUSES)[number]

/** Active = genuinely alive, never "an old webpage exists". */
export const ACTIVE_PROJECT_STATUSES: readonly ProjectStatus[] = [
  "pre_launch",
  "planned",
  "permitted",
  "under_construction",
  "near_completion",
]

export const VERIFICATION_LABELS = [
  "verified",
  "high_confidence",
  "likely",
  "unverified",
  "outdated",
  "conflicting",
] as const
export type VerificationLabel = (typeof VERIFICATION_LABELS)[number]

export const FRESHNESS_STATES = ["live", "recent", "aging", "stale", "unknown"] as const
export type Freshness = (typeof FRESHNESS_STATES)[number]

export const ENTITY_KINDS = [
  "developer",
  "company",
  "agency",
  "agent",
  "project",
  "building",
  "tower",
  "unit",
  "listing",
  "land",
  "permit",
  "document",
  "district",
  "neighborhood",
  "city",
  "country",
  "amenity",
  "infrastructure",
] as const
export type EntityKind = (typeof ENTITY_KINDS)[number]

export const SOURCE_KINDS = [
  "government",
  "registry",
  "official_company",
  "institution",
  "reputable_media",
  "company_profile",
  "public_listing",
  "open_dataset",
  "geospatial",
  "user_generated",
  "unknown",
] as const
export type SourceKind = (typeof SOURCE_KINDS)[number]

export const FACT_TYPES = [
  "permit_status",
  "project_status",
  "price",
  "availability",
  "completion_date",
  "address",
  "coordinates",
  "amenities",
  "company_identity",
  "contact",
  "specifications",
  "media",
] as const
export type FactType = (typeof FACT_TYPES)[number]

export const REVIEW_REASONS = [
  "needs_review",
  "duplicate_candidate",
  "conflict",
  "low_confidence",
  "failed_source",
  "stale_data",
  "new_entity",
] as const
export type ReviewReason = (typeof REVIEW_REASONS)[number]

export const PIPELINE_STAGES = [
  "discover",
  "fetch",
  "parse",
  "normalize",
  "identify",
  "resolve",
  "extract",
  "validate",
  "score",
  "provenance",
  "version",
  "index",
  "publish",
] as const

/* ── Multilingual normalization (ka/en/ru/ar preserved, never translated away) ── */

const LEGAL_TOKENS = new Set([
  "llc", "ltd", "inc", "corp", "gmbh", "mbh", "ag", "ug", "eg", "gbr", "kg", "ohg", "se",
  "ooo", "ооо", "шпс", "სს", "შპს",
  "ie", "ип", "individual", "entrepreneur",
])
const PUNCT_RX = /[«»„“”"'.‐‑‒–—―_\/\\|·•©®™²+*#§]/g

/** Minimal ka↔latin fold for matching only; originals are always preserved. */
const KA_FOLD: Record<string, string> = {
  ა: "a", ბ: "b", გ: "g", დ: "d", ე: "e", ვ: "v", ზ: "z", თ: "t",
  ი: "i", კ: "k", ლ: "l", მ: "m", ნ: "n", ო: "o", პ: "p", ჟ: "zh",
  რ: "r", ს: "s", ტ: "t", უ: "u", ფ: "p", ქ: "k", ღ: "gh", ყ: "q",
  შ: "sh", ჩ: "ch", ც: "ts", ძ: "dz", წ: "ts", ჭ: "ch", ხ: "kh",
  ჯ: "j", ჰ: "h",
}

export function foldScript(s: string): string {
  return s.replace(/[აბგდევზთიკლმნოპჟრსტუფქღყშჩცძწჭხჯჰ]/g, (c) => KA_FOLD[c] ?? c)
}

/** Minimal de fold for matching only (Müller ≡ Muller); originals preserved. */
const DE_FOLD: Record<string, string> = { "ä": "a", "ö": "o", "ü": "u", "ß": "ss" }

export function foldGerman(s: string): string {
  return s.replace(/[äöüß]/g, (c) => DE_FOLD[c] ?? c)
}

/** Canonical match key: folded, de-suffixed, de-punctuated, single-spaced. */
export function normalizeName(raw: string): string {
  const tokens = foldGerman(raw
    .toLowerCase()
    .replace(/[²³]/g, (c) => (c === "²" ? "2" : "3")) // m² → m2 before punct strip
    .replace(PUNCT_RX, " ")
    .split(/\s+/)
    .filter((t) => t && !LEGAL_TOKENS.has(t)) // suffixes removed pre-fold (შპს …)
    .join(" "))
  return foldScript(tokens).replace(/\s+/g, " ").trim()
}

/** Token-set Jaccard 0..1 on normalized names. */
export function nameSimilarity(a: string, b: string): number {
  const ta = new Set(normalizeName(a).split(" ").filter(Boolean))
  const tb = new Set(normalizeName(b).split(" ").filter(Boolean))
  if (!ta.size || !tb.size) return 0
  let inter = 0
  for (const t of ta) if (tb.has(t)) inter++
  return inter / (ta.size + tb.size - inter)
}

/* ── Entity resolution: strong signals, never silent merges ── */

export interface MatchSignals {
  nameA: string
  nameB: string
  addressA?: string | null
  addressB?: string | null
  latA?: number | null
  lngA?: number | null
  latB?: number | null
  lngB?: number | null
  domainA?: string | null
  domainB?: string | null
  phoneA?: string | null
  phoneB?: string | null
  sameCompanyId?: boolean
}

export function geoMeters(
  latA: number, lngA: number, latB: number, lngB: number,
): number {
  const r = 6371000
  const dLat = ((latB - latA) * Math.PI) / 180
  const dLng = ((lngB - lngA) * Math.PI) / 180
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((latA * Math.PI) / 180) * Math.cos((latB * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2
  return 2 * r * Math.asin(Math.sqrt(s))
}

const tail9 = (p: string | null | undefined): string | null => {
  if (!p) return null
  const d = p.replace(/\D+/g, "")
  return d.length >= 9 ? d.slice(-9) : null
}

export interface MatchVerdict {
  score: number
  /** "merge" only on hard identifiers; otherwise a reviewable candidate. */
  decision: "merge" | "candidate" | "distinct"
  reasons: string[]
}

/**
 * Weighted multi-signal match. Name resemblance alone can never merge —
 * it needs a hard identifier (company id, domain, phone tail, <150m coords
 * + address) or it stays a candidate for human verification.
 */
export function matchEntities(s: MatchSignals): MatchVerdict {
  const reasons: string[] = []
  let score = 0
  const nameSim = nameSimilarity(s.nameA, s.nameB)
  score += nameSim * 40
  if (nameSim > 0.8) reasons.push("name_strong")
  else if (nameSim > 0.5) reasons.push("name_partial")

  let hard = 0
  if (s.sameCompanyId) {
    hard++
    score += 45
    reasons.push("company_id")
  }
  const dA = (s.domainA ?? "").toLowerCase().replace(/^www\./, "")
  const dB = (s.domainB ?? "").toLowerCase().replace(/^www\./, "")
  if (dA && dA === dB) {
    hard++
    score += 30
    reasons.push("domain")
  }
  const pA = tail9(s.phoneA)
  const pB = tail9(s.phoneB)
  if (pA && pA === pB) {
    hard++
    score += 25
    reasons.push("phone")
  }
  if (
    s.latA != null && s.lngA != null && s.latB != null && s.lngB != null &&
    Number.isFinite(s.latA + s.lngA + s.latB + s.lngB)
  ) {
    const m = geoMeters(s.latA, s.lngA, s.latB, s.lngB)
    if (m < 150) {
      score += 20
      reasons.push("geo_close")
      const addrSim =
        s.addressA && s.addressB ? nameSimilarity(s.addressA, s.addressB) : 0
      if (addrSim > 0.5) {
        hard++
        score += 15
        reasons.push("address")
      }
    } else if (m > 2000) {
      score -= 25
      reasons.push("geo_far")
    }
  }

  score = Math.max(0, Math.min(100, Math.round(score)))
  if (hard > 0 && score >= 60) return { score, decision: "merge", reasons }
  if (score >= 35) return { score, decision: "candidate", reasons }
  return { score, decision: "distinct", reasons }
}

/* ── Source trust: reliability differs per fact type ── */

/**
 * Reliability 0..100 of a source KIND for a given FACT. Government permits
 * beat developer marketing for permit status; the developer's own price
 * list beats a scraped listing for asking price.
 */
const RELIABILITY: Record<SourceKind, Record<FactType, number>> = (() => {
  const base = (v: Partial<Record<FactType, number>>, dflt: number) => {
    const full = {} as Record<FactType, number>
    for (const f of FACT_TYPES) full[f] = v[f] ?? dflt
    return full
  }
  return {
    government: base({ permit_status: 95, project_status: 85, address: 85, coordinates: 80, completion_date: 75 }, 60),
    registry: base({ company_identity: 95, permit_status: 88, address: 85 }, 60),
    official_company: base({ price: 90, availability: 90, amenities: 90, specifications: 90, media: 92, project_status: 80, completion_date: 78, contact: 90 }, 70),
    institution: base({ price: 70, project_status: 72, completion_date: 70 }, 65),
    reputable_media: base({ project_status: 65, completion_date: 60, price: 55 }, 55),
    company_profile: base({ company_identity: 80, contact: 80, project_status: 60 }, 55),
    public_listing: base({ price: 60, availability: 65, address: 60, coordinates: 60 }, 45),
    open_dataset: base({ address: 85, coordinates: 88, permit_status: 80 }, 70),
    geospatial: base({ coordinates: 92, address: 80 }, 50),
    user_generated: base({}, 25),
    unknown: base({}, 15),
  }
})()

export function sourceReliability(kind: SourceKind, fact: FactType): number {
  return RELIABILITY[kind]?.[fact] ?? 15
}

/* ── Freshness + refresh cadence (hours) by fact volatility ── */

const REFRESH_HOURS: Record<string, number> = {
  price: 24,
  availability: 24,
  project_status: 72,
  permit_status: 168,
  completion_date: 168,
  company_identity: 720,
  address: 720,
  coordinates: 2160,
  amenities: 720,
  specifications: 720,
  contact: 720,
  media: 720,
}

export function refreshHoursFor(fact: FactType): number {
  return REFRESH_HOURS[fact] ?? 168
}

export function freshnessOf(lastSeenAt: Date | null, fact: FactType, now = Date.now()): Freshness {
  if (!lastSeenAt || Number.isNaN(lastSeenAt.getTime())) return "unknown"
  const ageH = (now - lastSeenAt.getTime()) / 3_600_000
  const cycle = refreshHoursFor(fact)
  if (ageH <= cycle) return "live"
  if (ageH <= cycle * 3) return "recent"
  if (ageH <= cycle * 8) return "aging"
  return "stale"
}

export function isDue(lastSeenAt: Date | null, fact: FactType, now = Date.now()): boolean {
  if (!lastSeenAt) return true
  return now - lastSeenAt.getTime() > refreshHoursFor(fact) * 3_600_000
}

/* ── Provenance + conflict resolution (retain all evidence, never discard) ── */

export interface EvidenceInput {
  sourceKind: SourceKind
  fact: FactType
  value: string
  retrievedAt: Date
  publishedAt?: Date | null
  url?: string | null
}

/** Best-supported current value; alternatives preserved by the caller. */
export function resolveConflict(items: EvidenceInput[], now = Date.now()): {
  value: string
  confidence: number
  label: VerificationLabel
  agreeing: number
  total: number
} {
  const total = items.length
  if (!total) return { value: "", confidence: 0, label: "unverified", agreeing: 0, total: 0 }
  const scored = items.map((e) => {
    const rel = sourceReliability(e.sourceKind, e.fact)
    const ageH = Math.max(0, (now - e.retrievedAt.getTime()) / 3_600_000)
    const decay = Math.max(0.4, 1 - ageH / (refreshHoursFor(e.fact) * 12))
    return { e, w: rel * decay }
  })
  const byValue = new Map<string, number>()
  for (const s of scored) byValue.set(s.e.value, (byValue.get(s.e.value) ?? 0) + s.w)
  const [value, weight] = [...byValue.entries()].sort((a, b) => b[1] - a[1])[0]
  const weightTotal = scored.reduce((a, s) => a + s.w, 0) || 1
  const share = weight / weightTotal
  const agreeing = items.filter((i) => i.value === value).length
  const confidence = Math.round(Math.min(97, (share * 70 + (weight / 100) * 30)))
  const label: VerificationLabel =
    total === 1 ? "unverified"
    : share >= 0.75 && agreeing >= 2 ? "verified"
    : share >= 0.6 ? "high_confidence"
    : share >= 0.45 ? "likely"
    : "conflicting"
  return { value, confidence, label, agreeing, total }
}

/* ── Project-status inference (multi-signal; stale pages never activate) ── */

export interface StatusSignal {
  kind: "permit" | "announcement" | "construction_update" | "listing_activity" | "page_exists" | "completion_record" | "suspension_record"
  at: Date
  detail?: string
}

const RECENT_MS = 180 * 24 * 3_600_000 // 6 months: older signals go stale

export function inferProjectStatus(signals: StatusSignal[], now = Date.now()): {
  status: ProjectStatus
  confidence: number
  label: VerificationLabel
} {
  const fresh = signals.filter((s) => now - s.at.getTime() <= RECENT_MS)
  const has = (k: StatusSignal["kind"]) => fresh.some((s) => s.kind === k)
  const lone = (k: StatusSignal["kind"]) => fresh.length > 0 && fresh.every((s) => s.kind === k)
  if (has("suspension_record")) return { status: "suspended", confidence: 70, label: "likely" }
  if (has("completion_record")) return { status: "completed", confidence: 80, label: "high_confidence" }
  if (has("construction_update")) {
    return {
      status: has("permit") ? "under_construction" : "under_construction",
      confidence: has("permit") ? 85 : 65,
      label: has("permit") ? "high_confidence" : "likely",
    }
  }
  if (has("permit")) return { status: "permitted", confidence: 80, label: "high_confidence" }
  if (has("announcement") && (has("listing_activity") || fresh.length >= 2)) {
    return { status: "announced", confidence: 60, label: "likely" }
  }
  if (lone("page_exists") || fresh.length === 0) {
    return { status: "unknown", confidence: 10, label: "unverified" }
  }
  if (has("listing_activity")) return { status: "announced", confidence: 45, label: "likely" }
  return { status: "unknown", confidence: 20, label: "unverified" }
}

/* ── Quality (0–100) + global coverage (0–100): measured, never claimed ── */

export interface QualityInput {
  completeness: number // 0..1 fields present
  accuracy: number // 0..1 cross-source agreement
  freshness: number // 0..1 (live=1 … stale=0)
  sourceQuality: number // 0..1 best-evidence reliability / 100
  agreement: number // 0..1 share of agreeing evidence
  geoConfidence: number // 0..1 coords precision
}

export function qualityScoreOf(q: QualityInput): number {
  const w = { completeness: 20, accuracy: 25, freshness: 15, sourceQuality: 20, agreement: 10, geoConfidence: 10 }
  const v =
    q.completeness * w.completeness + q.accuracy * w.accuracy +
    q.freshness * w.freshness + q.sourceQuality * w.sourceQuality +
    q.agreement * w.agreement + q.geoConfidence * w.geoConfidence
  return Math.max(0, Math.min(100, Math.round(v)))
}

export interface CoverageInput {
  developer: number // 0..1
  project: number // 0..1
  activeProject: number // 0..1
  geographic: number // 0..1
  source: number // 0..1 (healthy sources / registered)
  freshness: number // 0..1 live+recent facts share
  verifiedRatio: number // 0..1 verified+high_confidence facts share
}

export function coverageScoreOf(c: CoverageInput): number {
  const w = { developer: 15, project: 20, activeProject: 20, geographic: 10, source: 10, freshness: 15, verifiedRatio: 10 }
  const v =
    c.developer * w.developer + c.project * w.project + c.activeProject * w.activeProject +
    c.geographic * w.geographic + c.source * w.source + c.freshness * w.freshness +
    c.verifiedRatio * w.verifiedRatio
  return Math.max(0, Math.min(100, Math.round(v)))
}

/* ── Source registry: country adapters, shared canonical kinds ── */

export interface SourceDef {
  slug: string
  country: string // ISO-2, "*" = global
  kind: SourceKind
  name: string
  baseUrl: string
  facts: FactType[]
  refreshHours: number
  access: "api" | "dataset" | "html" | "feed"
  notes: string
}

/** Seed registry — official + open sources only. Aggregator scraping stays retired. */
export const SOURCE_REGISTRY: SourceDef[] = [
  { slug: "ge-napr", country: "GE", kind: "registry", name: "NAPR public registry", baseUrl: "https://napr.gov.ge", facts: ["company_identity", "address", "permit_status"], refreshHours: 168, access: "html", notes: "Public records only; no auth bypass." },
  { slug: "ge-tbilisi-opendata", country: "GE", kind: "government", name: "Tbilisi open data", baseUrl: "https://tbilisi.gov.ge", facts: ["permit_status", "project_status", "address"], refreshHours: 168, access: "dataset", notes: "Permits / planning notices where published." },
  { slug: "ge-geostat", country: "GE", kind: "institution", name: "Geostat", baseUrl: "https://geostat.ge", facts: ["price", "completion_date"], refreshHours: 720, access: "dataset", notes: "Statistical aggregates, not unit prices." },
  { slug: "global-osm", country: "*", kind: "geospatial", name: "OpenStreetMap", baseUrl: "https://overpass-api.de", facts: ["coordinates", "address"], refreshHours: 720, access: "api", notes: "ODbL: attribute, cache tiles; already ingested via OsmBuilding." },
  // ── Germany (DE adapter): official + open sources only ──
  { slug: "de-berlin-opendata", country: "DE", kind: "government", name: "Berlin Open Data (daten.berlin.de)", baseUrl: "https://daten.berlin.de", facts: ["address", "coordinates", "permit_status", "project_status"], refreshHours: 168, access: "dataset", notes: "dl-de-zero-2.0. Index for Denkmale, LOR, Energieatlas, Bauvorhaben." },
  { slug: "de-alkis", country: "DE", kind: "registry", name: "ALKIS Berlin (GDI WFS)", baseUrl: "https://gdi.berlin.de/services/wfs", facts: ["address", "coordinates", "permit_status"], refreshHours: 720, access: "api", notes: "dl-de-zero-2.0. Legal lots + footprints; live via lib/map/berlin-gov." },
  { slug: "de-boris", country: "DE", kind: "government", name: "BORIS Berlin Bodenrichtwerte", baseUrl: "https://fbinter.stadt-berlin.de/boris", facts: ["price"], refreshHours: 720, access: "html", notes: "Official land values since 1964 — price context per lot." },
  { slug: "de-bplaene", country: "DE", kind: "government", name: "Bebauungspläne (FIS-Broker)", baseUrl: "https://fbinter.stadt-berlin.de", facts: ["permit_status", "project_status"], refreshHours: 168, access: "html", notes: "Binding zoning per lot — development pipeline signal." },
  { slug: "de-mietspiegel", country: "DE", kind: "government", name: "Berliner Mietspiegel", baseUrl: "https://www.berlin.de/sen/wohnen/service/mietspiegel", facts: ["price"], refreshHours: 720, access: "dataset", notes: "Regulated rent benchmarks per district." },
  { slug: "de-statistik-bb", country: "DE", kind: "institution", name: "Amt für Statistik Berlin-Brandenburg", baseUrl: "https://www.statistik-berlin-brandenburg.de", facts: ["price", "completion_date"], refreshHours: 720, access: "dataset", notes: "Baugenehmigungen / Baufertigstellungen — supply pipeline." },
  { slug: "de-destatis", country: "DE", kind: "institution", name: "Destatis (Bautätigkeit)", baseUrl: "https://www.destatis.de", facts: ["price", "completion_date"], refreshHours: 720, access: "dataset", notes: "National construction permits/completions — Germany-wide supply." },
  { slug: "de-handelsregister", country: "DE", kind: "registry", name: "Handelsregister", baseUrl: "https://www.handelsregister.de", facts: ["company_identity", "contact"], refreshHours: 720, access: "html", notes: "Public company registration; no auth bypass, rate-limited." },
  { slug: "official-developer", country: "*", kind: "official_company", name: "Developer official site (per-entity)", baseUrl: "", facts: ["price", "availability", "amenities", "specifications", "project_status", "completion_date", "media", "contact"], refreshHours: 72, access: "html", notes: "Registered per developer; robots.txt + rate limits enforced." },
  { slug: "partner-feed", country: "*", kind: "company_profile", name: "Partner feed (Partner/ImportJob)", baseUrl: "", facts: ["price", "availability", "address", "coordinates"], refreshHours: 24, access: "feed", notes: "Existing Partner infra; facts only, no copied content." },
]

export function sourcesFor(country: string, fact?: FactType): SourceDef[] {
  return SOURCE_REGISTRY.filter(
    (s) => (s.country === country || s.country === "*") && (!fact || s.facts.includes(fact)),
  )
}

/* ── Ingestion guards: legal/ethical + security at the trust boundary ── */

const HTTP_RX = /^https?:\/\/[^\s/$.?#].[^\s]*$/i
const BLOCKED_HOST_RX = /^(localhost|127\.|10\.|192\.168\.|169\.254\.|0\.0\.0\.0|::1|\[?fe80|\[?fc00|\[?fd)/i

/** Reject non-http(s) URLs and private-network targets (SSRF guard). */
export function isFetchableUrl(raw: string): boolean {
  if (!HTTP_RX.test(raw.trim())) return false
  try {
    const host = new URL(raw.trim()).hostname.toLowerCase()
    return !BLOCKED_HOST_RX.test(host) && host !== "localhost" && !host.endsWith(".local") && !host.endsWith(".internal")
  } catch {
    return false
  }
}

/** Strip executable content from scraped text; cap length (never execute scraped content). */
export function sanitizeScrapedText(raw: string, maxLen = 8000): string {
  return raw
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLen)
}

export interface IngestRecord {
  sourceSlug: string
  entityKind: EntityKind
  externalId: string
  url?: string | null
  fetchedAt: Date
  payloadHash: string
  facts: { type: FactType; value: string; publishedAt?: Date | null }[]
}

/** Idempotency key: same source + entity + payload hash ⇒ never reprocess. */
export function ingestIdempotencyKey(r: Pick<IngestRecord, "sourceSlug" | "entityKind" | "externalId" | "payloadHash">): string {
  return [r.sourceSlug, r.entityKind, r.externalId, r.payloadHash].join("|")
}

export function validateIngestRecord(r: IngestRecord): string | null {
  if (!r.sourceSlug || !r.externalId || !r.payloadHash) return "missing_identity"
  if (!(ENTITY_KINDS as readonly string[]).includes(r.entityKind)) return "bad_entity_kind"
  if (r.url && !isFetchableUrl(r.url)) return "unfetchable_url"
  for (const f of r.facts) {
    if (!(FACT_TYPES as readonly string[]).includes(f.type)) return "bad_fact_type"
    if (!f.value || f.value.length > 4000) return "bad_fact_value"
  }
  return null
}

/* ── Intel natural-language queries (extends listings nl-search to entities) ── */

export interface IntelQuery {
  entity: "project" | "developer" | "building"
  city?: string
  district?: string
  status?: ProjectStatus | "active"
  maxPrice?: number
  completingYear?: number
  minActiveProjects?: number
}

const MONEY_RX = /[$€]\s*([\d.,]+)\s*([kKmM])?/
const MONEY_EUR_RX = /([\d.,]+)\s*([kKmM])?\s*(€|eur)\b/

function parseMoney(q: string): number | null {
  const m = q.match(MONEY_RX) ?? q.match(MONEY_EUR_RX)
  if (!m) return null
  const n = Number(m[1].replace(/[.,]/g, ""))
  if (!Number.isFinite(n) || n <= 0) return null
  return m[2] ? n * 1000 : n
}

/** Berlin Bezirke/Ortsteile → ka catalog label (falls back to EN mint). */
const BERLIN_DISTRICTS: Array<[RegExp, string]> = [
  [/prenzlauer berg/, "პრენცლაუერ-ბერგი"],
  [/friedrichshain/, "ფრიდრიხსჰაინი"],
  [/charlottenburg/, "შარლოტენბურგი"],
  [/neukölln|neukolln/, "ნოიკოლნი"],
  [/kreuzberg/, "კროიცბერგი"],
  [/schöneberg|schoneberg/, "შონებერგი"],
  [/tempelhof/, "ტემპელჰოფი"],
  [/lichtenberg/, "ლიხტენბერგი"],
  [/treptow|köpenick|kopenick/, "ტრეპტოვ-კეპენიკი"],
  [/pankow/, "პანკოვი"],
  [/spandau/, "შპანდაუ"],
  [/steglitz|zehlendorf|lichterfelde/, "ლიხტერფელდე"],
  [/reinickendorf/, "Reinickendorf"],
  [/wedding|moabit/, "Mitte"],
  [/marzahn|hellersdorf/, "Marzahn-Hellersdorf"],
  [/mitte/, "მიტე"],
]

/** "active developments in Tbilisi" · "projects completing in 2027" · "developers with multiple active projects" · "new apartments in Vake under $300k". */
export function parseIntelQuery(raw: string): IntelQuery | null {
  const q = foldGerman(raw.trim().toLowerCase())
  if (!q) return null
  const out: IntelQuery = { entity: /developer|agency|builder/i.test(raw) ? "developer" : "project" }
  if (/tbilisi|თბილისი/.test(q)) out.city = "თბილისი"
  else if (/batumi|ბათუმი/.test(q)) out.city = "ბათუმი"
  else if (/kutaisi|ქუთაისი/.test(q)) out.city = "ქუთაისი"
  else if (/rustavi|რუსთავი/.test(q)) out.city = "რუსთავი"
  else if (/berlin|ბერლინი/.test(q)) out.city = "ბერლინი"
  else if (/hamburg/.test(q)) out.city = "Hamburg"
  else if (/munich|munchen|münchen/.test(q)) out.city = "Munich"
  else if (/cologne|koln|köln/.test(q)) out.city = "Cologne"
  else if (/frankfurt/.test(q)) out.city = "Frankfurt"
  else if (/stuttgart/.test(q)) out.city = "Stuttgart"
  else if (/dusseldorf|düsseldorf/.test(q)) out.city = "Düsseldorf"
  else if (/leipzig/.test(q)) out.city = "Leipzig"
  else if (/dresden/.test(q)) out.city = "Dresden"
  else if (/dubai|დუბაი/.test(q)) out.city = "Dubai"
  const vake = /vake|ვაკე/.test(q)
  const districtHit = q.match(/(vake|saburtalo|didube|gldani|isani|samgori|chugureti|mtatsminda|nadzaladevi|didi digomi|ვაკე|საბურთალო|დიდუბე|გლდანი|ისანი|სამგორი|ჩუღურეთი|მთაწმინდა|ნაძალადევი|დიდი დიღომი)/)
  if (districtHit) out.district = vake ? "ვაკე" : districtHit[1]
  if (!out.district) {
    for (const [rx, label] of BERLIN_DISTRICTS) {
      if (rx.test(q)) {
        // Mitte is also a generic word — only accept it with a Berlin anchor.
        if (label === "მიტე" && out.city !== "ბერლინი" && !/berlin|გერმანია|germany|deutschland/.test(q)) break
        out.district = label
        break
      }
    }
  }
  if (/active|under construction|new apartments|ახალი/i.test(q)) out.status = "active"
  else if (/complet|\bready\b|handover/i.test(q)) {
    const y = q.match(/20(2[6-9]|3\d)/)
    if (y) out.completingYear = Number(y[0])
  }
  const m = parseMoney(q)
  if (m != null) out.maxPrice = m
  if (/multiple active|several|portfolio/i.test(q)) out.minActiveProjects = 2
  if (!out.city && !out.district && !out.status && !out.maxPrice && !out.completingYear && !out.minActiveProjects) return null
  return out
}
