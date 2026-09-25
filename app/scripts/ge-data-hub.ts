/**
 * SIVRCE GE data hub — the Georgian real-estate data pipeline.
 *
 * Subcommands (npx tsx scripts/ge-data-hub.ts <cmd>):
 *   sources     — register/upsert GE data sources (data_sources)
 *   provenance  — backfill data_provenance for existing project rows (id prefix → source)
 *   graph       — entity_aliases (ka + romanized) + developer→project relationships
 *   dedupe      — duplicate/conflict detection → review_queue
 *   quality     — data_quality_scores per project/developer + data_coverage_metrics for GE
 *   audit       — stale/missing-data/failed-source report → review_queue
 *   cities      — canonicalize project.city (latin→ka, street text out of city, "null" addresses)
 *   geocode     — Nominatim street-level coords for projects missing lat/lng (rate-limited)
 *   wiki        — Wikidata CC0 landmarks in Georgia: enrich matches, add missing landmarks
 *   osm         — Overpass full-Georgia discovery: named construction sites → project rows
 *   all         — everything above except osm/geocode/wiki (default; those are explicit)
 *
 * Legal: ss.ge/myhome/korter are owner-approved APIs; OSM is ODbL (attribution
 * © OpenStreetMap contributors); NAPR is the public cadastre. No copyrighted
 * media is copied here — remote URLs stay remote (mirror only via approved
 * localize-directory flow).
 *
 * ponytail: single-file pipeline; split per-source modules when a source needs
 * its own parser tests.
 */

import { config } from "dotenv"
import { resolve } from "path"

config({ path: resolve(__dirname, "..", ".env.local") })
config({ path: resolve(__dirname, "..", ".env") })

import { PrismaClient } from "../src/generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { toLatin } from "../src/lib/ka-latin"
import { GEO_CITIES, GEO_MUNICIPALITIES } from "../src/data/georgia-locations"

const u = process.env.DATABASE_URL as string
const db = new PrismaClient({
  adapter: new PrismaPg({
    connectionString: /uselibpqcompat=/i.test(u) ? u : `${u}${u.includes("?") ? "&" : "?"}uselibpqcompat=true`,
  }),
})

const norm = (s: string): string =>
  s.toLowerCase().replace(/შპს|შps|llc|ltd|inc|·|•|\+/g, " ").replace(/[^a-z0-9ა-ჰ]+/g, "")

// ---- sources ----------------------------------------------------------

type SourceSeed = {
  slug: string
  name: string
  kind: "government" | "public_listing" | "open_data" | "geospatial" | "official_registry" | "official_company" | "media" | "api"
  reliability: "official_government" | "official_registry" | "official_company" | "established_institution" | "public_listing" | "reputable_media" | "user_generated" | "unknown"
  url: string
  apiEndpoint?: string
  robotsTxtOk: boolean
  rateLimitMs?: number
  refreshHours?: number
  note: string
  active: boolean
}

const GE_SOURCES: SourceSeed[] = [
  {
    slug: "ge-ss-ge", name: "ss.ge projects API", kind: "public_listing", reliability: "public_listing",
    url: "https://www.ss.ge", apiEndpoint: "https://account.ss.ge/connect/token",
    robotsTxtOk: true, rateLimitMs: 600, refreshHours: 24,
    note: "Owner-approved 2026-09-03 (scripts/import-ssgap.ts). Public web client, rate-limited.", active: true,
  },
  {
    slug: "ge-myhome", name: "myhome.ge projects API", kind: "public_listing", reliability: "public_listing",
    url: "https://www.myhome.ge", apiEndpoint: "https://api-statements.tnet.ge/api/tnet-projects/listing",
    robotsTxtOk: true, rateLimitMs: 600, refreshHours: 24,
    note: "Owner-approved 2026-09-03 (scripts/import-myhome-gap.ts). Rate-limited.", active: true,
  },
  {
    slug: "ge-korter", name: "korter.ge projects", kind: "public_listing", reliability: "public_listing",
    url: "https://korter.ge", apiEndpoint: null as unknown as string,
    robotsTxtOk: true, rateLimitMs: 1000, refreshHours: 168,
    note: "Imported via scripts/import-korter.ts / lib/directory/sync-korter.", active: true,
  },
  {
    slug: "ge-osm", name: "OpenStreetMap Georgia", kind: "geospatial", reliability: "unknown",
    url: "https://www.openstreetmap.org", apiEndpoint: "https://overpass-api.de/api/interpreter",
    robotsTxtOk: true, rateLimitMs: 1200, refreshHours: 720,
    note: "© OpenStreetMap contributors (ODbL). Buildings corpus + construction-site discovery.", active: true,
  },
  {
    slug: "ge-napr", name: "NAPR public registry / cadastre", kind: "government", reliability: "official_government",
    url: "https://www.napr.gov.ge", apiEndpoint: null as unknown as string,
    robotsTxtOk: true, rateLimitMs: 1500, refreshHours: 168,
    note: "Public cadastral parcels (CadRepGeo) via lib/map/napr-parcel — pin snapping + verification.", active: true,
  },
  {
    slug: "ge-nominatim", name: "Nominatim (OSM geocoder)", kind: "geospatial", reliability: "unknown",
    url: "https://nominatim.openstreetmap.org", apiEndpoint: "https://nominatim.openstreetmap.org/search",
    robotsTxtOk: true, rateLimitMs: 1100, refreshHours: 8760,
    note: "© OpenStreetMap contributors (ODbL). Street-level geocoding of imported ka addresses; public-API usage policy honored (1 req/s, UA set).", active: true,
  },
  {
    slug: "ge-geostat", name: "Geostat (National Statistics Office)", kind: "government", reliability: "official_government",
    url: "https://www.geostat.ge",
    robotsTxtOk: true, refreshHours: 720,
    note: "Construction permits/completions statistics — market context. Open data.", active: true,
  },
  {
    slug: "ge-wikidata", name: "Wikidata (GE landmarks)", kind: "open_data", reliability: "established_institution",
    url: "https://www.wikidata.org",
    robotsTxtOk: true, refreshHours: 2160,
    note: "CC0. Famous/notable buildings, architects, heritage status — enrichment only.", active: true,
  },
  {
    slug: "ge-tbilisi-gov", name: "Tbilisi City Hall open data", kind: "government", reliability: "official_government",
    url: "https://tbilisi.gov.ge",
    robotsTxtOk: true, refreshHours: 720,
    note: "Municipal permits/news — pending structured feed discovery.", active: false,
  },
  {
    slug: "ge-place-ge", name: "place.ge listings", kind: "public_listing", reliability: "public_listing",
    url: "https://www.place.ge",
    robotsTxtOk: false, refreshHours: 168,
    note: "ponytail: inactive pending robots.txt/terms review — do not enable without owner approval.", active: false,
  },
  {
    slug: "ge-property-ge", name: "property.ge listings", kind: "public_listing", reliability: "public_listing",
    url: "https://property.ge",
    robotsTxtOk: false, refreshHours: 168,
    note: "Candidate source — inactive pending robots.txt/terms review + owner approval.", active: false,
  },
]

async function sources() {
  for (const s of GE_SOURCES) {
    await db.dataSource.upsert({
      where: { slug: s.slug },
      create: {
        slug: s.slug, name: s.name, kind: s.kind, reliability: s.reliability, country: "GE",
        url: s.url, apiEndpoint: s.apiEndpoint ?? null, robotsTxtOk: s.robotsTxtOk,
        rateLimitMs: s.rateLimitMs ?? null, refreshHours: s.refreshHours ?? null,
        reliabilityNote: s.note, isActive: s.active,
      },
      update: {
        name: s.name, kind: s.kind, reliability: s.reliability, url: s.url,
        apiEndpoint: s.apiEndpoint ?? null, robotsTxtOk: s.robotsTxtOk,
        rateLimitMs: s.rateLimitMs ?? null, refreshHours: s.refreshHours ?? null,
        reliabilityNote: s.note, isActive: s.active,
      },
    })
    console.log(`source ${s.slug} ${s.active ? "✓" : "(inactive)"}`)
  }
}

// ---- provenance -------------------------------------------------------

const PREFIX_TO_SOURCE: Record<string, { slug: string; confidence: "likely" | "unverified" | "verified" }> = {
  ss: { slug: "ge-ss-ge", confidence: "likely" },
  myhome: { slug: "ge-myhome", confidence: "likely" },
  korter: { slug: "ge-korter", confidence: "likely" },
  osm: { slug: "ge-osm", confidence: "unverified" },
  napr: { slug: "ge-napr", confidence: "verified" },
}

async function provenance() {
  const rows = await db.projectDirectory.findMany({
    where: { deletedAt: null },
    select: { id: true, name: true, sourceUrl: true },
  })
  const sources = await db.dataSource.findMany({ where: { country: "GE" }, select: { id: true, slug: true } })
  const bySlug = new Map(sources.map((s) => [s.slug, s.id]))
  const existing = new Set(
    (await db.dataProvenance.findMany({
      where: { entityType: "project", factKey: "identity" },
      select: { entityId: true, sourceId: true },
    })).map((p) => `${p.entityId}:${p.sourceId}`),
  )
  const now = new Date()
  const create = []
  let unmapped = 0
  for (const r of rows) {
    const prefix = r.id.split(/[-_]/)[0]
    const m = PREFIX_TO_SOURCE[prefix]
    if (!m) { unmapped++; continue }
    const sourceId = bySlug.get(m.slug)
    if (!sourceId) continue
    if (existing.has(`${r.id}:${sourceId}`)) continue
    create.push({
      entityType: "project" as const, entityId: r.id, factKey: "identity", factValue: r.name,
      sourceId, sourceUrl: r.sourceUrl, fetchedAt: now, confidence: m.confidence, isCurrent: true,
    })
  }
  if (create.length) await db.dataProvenance.createMany({ data: create, skipDuplicates: true })
  console.log(`provenance: +${create.length} (unmapped prefix: ${unmapped})`)
}

// ---- graph: aliases + relationships ----------------------------------

async function graph() {
  const projects = await db.projectDirectory.findMany({
    where: { deletedAt: null },
    select: { id: true, name: true, developer: true },
  })
  const devs = await db.developerProfile.findMany({
    where: { deletedAt: null },
    select: { id: true, slug: true, name: true },
  })
  const devByNorm = new Map<string, string>()
  for (const d of devs) devByNorm.set(norm(d.name), d.id)

  const aliases: {
    entityType: "project" | "developer"; entityId: string; alias: string
    language: string; isCanonical: boolean
  }[] = []
  const rels: { fromType: "developer"; fromId: string; toType: "project"; toId: string; relation: string }[] = []
  let unmatchedDev = 0
  for (const p of projects) {
    const clean = p.name.trim()
    if (clean) {
      aliases.push({ entityType: "project", entityId: p.id, alias: clean, language: "ka", isCanonical: true })
      const lat = toLatin(clean)
      if (lat !== clean) aliases.push({ entityType: "project", entityId: p.id, alias: lat, language: "en", isCanonical: false })
    }
    const dn = norm(p.developer)
    const devId = devByNorm.get(dn)
    if (devId) rels.push({ fromType: "developer", fromId: devId, toType: "project", toId: p.id, relation: "owns" })
    else unmatchedDev++
  }
  for (const d of devs) {
    if (!d.name) continue
    aliases.push({ entityType: "developer", entityId: d.id, alias: d.name.trim(), language: "ka", isCanonical: true })
    const lat = toLatin(d.name.trim())
    if (lat !== d.name.trim()) aliases.push({ entityType: "developer", entityId: d.id, alias: lat, language: "en", isCanonical: false })
  }
  if (aliases.length) await db.entityAlias.createMany({ data: aliases, skipDuplicates: true })
  if (rels.length) await db.entityRelationship.createMany({ data: rels, skipDuplicates: true })
  console.log(`graph: +${aliases.length} aliases, +${rels.length} owns-relationships (projects with no developerProfile match: ${unmatchedDev})`)
}

// ---- dedupe / conflicts ----------------------------------------------

async function dedupe() {
  const rows = await db.projectDirectory.findMany({
    where: { deletedAt: null },
    select: { id: true, name: true, developer: true, city: true, status: true, readyBy: true, slug: true },
  })
  const groups = new Map<string, typeof rows>()
  for (const r of rows) {
    const n = norm(r.name)
    if (!n) continue
    const key = `${n}|${r.city}`
    ;(groups.get(key) ?? groups.set(key, []).get(key)!).push(r)
  }
  // Reset our auto items (resolved ones stay for history).
  const del = await db.reviewQueueItem.deleteMany({
    where: { entityType: "project", reason: { startsWith: "auto:" }, resolvedAt: null },
  })
  let dupes = 0
  let conflicts = 0
  for (const [, g] of groups) {
    if (g.length < 2) continue
    dupes++
    const rep = g[0]
    await db.reviewQueueItem.create({
      data: {
        kind: "duplicate_candidate", entityType: "project", entityId: rep.id,
        reason: `auto:name+city collision (${g.length} rows)`,
        details: {
          cluster: g.map((r) => ({ id: r.id, name: r.name, slug: r.slug, developer: r.developer })),
          city: rep.city,
        },
      },
    })
    const statuses = new Set(g.map((r) => r.status))
    if (statuses.size > 1) {
      conflicts++
      await db.reviewQueueItem.create({
        data: {
          kind: "conflict", entityType: "project", entityId: rep.id,
          reason: "auto:same name+city, differing status across sources",
          details: { statuses: [...statuses], cluster: g.map((r) => ({ id: r.id, status: r.status, readyBy: r.readyBy })) },
        },
      })
    }
  }
  console.log(`dedupe: ${dupes} duplicate groups, ${conflicts} status conflicts (cleared ${del.count} old auto items)`)
}

// ---- quality + coverage ----------------------------------------------

const SRC_QUALITY: Record<string, number> = { napr: 95, korter: 85, ss: 75, myhome: 75, osm: 60, proj: 50 }

function projectCompleteness(p: {
  name: string; developer: string; city: string; district: string; address: string | null
  lat: number | null; lng: number | null; status: string; readyBy: string; priceFrom: number
  pricePerSqmFrom: number; image: string; gallery: string[]; body: string | null; features: string[]
}): number {
  let s = 0
  if (p.name.trim()) s += 5
  if (p.developer.trim()) s += 10
  if (p.city.trim()) s += 5
  if (p.district.trim()) s += 5
  if ((p.address ?? "").trim()) s += 10
  if (p.lat != null && p.lng != null) s += 15
  if (p.status) s += 5
  if (p.readyBy.trim()) s += 10
  if (p.priceFrom > 0) s += 10
  if (p.pricePerSqmFrom > 0) s += 5
  if (p.image.trim()) s += 10
  if (p.gallery.length > 0) s += 5
  if ((p.body ?? "").trim().length > 40) s += 10
  if (p.features.length > 0) s += 5
  return Math.min(100, Math.round((s / 110) * 100))
}

async function quality() {
  const projects = await db.projectDirectory.findMany({
    where: { deletedAt: null },
    select: {
      id: true, name: true, developer: true, city: true, district: true, address: true, lat: true, lng: true,
      status: true, readyBy: true, priceFrom: true, pricePerSqmFrom: true, image: true, gallery: true,
      body: true, features: true, updatedAt: true,
    },
  })
  const provCounts = await db.dataProvenance.groupBy({
    by: ["entityId"], where: { entityType: "project", isCurrent: true }, _count: { _all: true },
  })
  const provById = new Map(provCounts.map((p) => [p.entityId, p._count._all]))
  const now = Date.now()
  let overallSum = 0
  const upserts = projects.map((p) => {
    const prefix = p.id.split(/[-_]/)[0]
    const srcQ = SRC_QUALITY[prefix] ?? 50
    const days = (now - p.updatedAt.getTime()) / 86400000
    const freshness = Math.max(0, Math.min(100, Math.round(100 - days * 0.5)))
    const completeness = projectCompleteness(p)
    const cross = Math.min(100, (provById.get(p.id) ?? 0) * 50)
    const overall = Math.round(completeness * 0.4 + srcQ * 0.25 + freshness * 0.2 + cross * 0.15)
    overallSum += overall
    return db.dataQualityScore.upsert({
      where: { entityType_entityId: { entityType: "project", entityId: p.id } },
      create: {
        entityType: "project", entityId: p.id, completeness, accuracy: srcQ,
        freshness, sourceQuality: srcQ, crossSource: cross, overall,
      },
      update: {
        completeness, accuracy: srcQ, freshness, sourceQuality: srcQ,
        crossSource: cross, overall, calculatedAt: new Date(),
      },
    })
  })
  const devs = await db.developerProfile.findMany({ where: { deletedAt: null }, select: { id: true, updatedAt: true } })
  for (const d of devs) {
    const days = (now - d.updatedAt.getTime()) / 86400000
    const freshness = Math.max(0, Math.min(100, Math.round(100 - days * 0.5)))
    upserts.push(
      db.dataQualityScore.upsert({
        where: { entityType_entityId: { entityType: "developer", entityId: d.id } },
        create: {
          entityType: "developer", entityId: d.id, completeness: 30, accuracy: 60,
          freshness, sourceQuality: 60, crossSource: 0, overall: Math.round(30 * 0.5 + 60 * 0.3 + freshness * 0.2),
        },
        update: { freshness, calculatedAt: new Date() },
      }),
    )
  }
  for (let i = 0; i < upserts.length; i += 250) {
    await db.$transaction(upserts.slice(i, i + 250), { timeout: 60_000 })
  }

  const withCoords = projects.filter((p) => p.lat != null && p.lng != null).length
  const activeCount = projects.filter((p) => p.status === "active").length
  const overallAvg = projects.length ? Math.round(overallSum / projects.length) : 0
  const verified = await db.dataProvenance.count({ where: { entityType: "project", isCurrent: true, confidence: "verified" } })
  const provTotal = await db.dataProvenance.count({ where: { entityType: "project", isCurrent: true } })
  const activeSources = await db.dataSource.count({ where: { country: "GE", isActive: true } })
  const totalSources = await db.dataSource.count({ where: { country: "GE" } })
  await db.dataCoverageMetric.create({
    data: {
      country: "GE",
      developerCoverage: Math.min(100, (devs.length / 1000) * 100),
      projectCoverage: Math.min(100, (projects.length / 2000) * 100),
      activeProjectCoverage: projects.length ? Math.min(100, (activeCount / projects.length) * 100) : 0,
      geographicCoverage: projects.length ? Math.round((withCoords / projects.length) * 100) : 0,
      sourceCoverage: totalSources ? (activeSources / totalSources) * 100 : 0,
      freshnessScore: overallAvg,
      verifiedRatio: provTotal ? (verified / provTotal) * 100 : 0,
      overallScore: overallAvg,
    },
  })
  console.log(`quality: ${projects.length} projects + ${devs.length} developers scored; avg overall ${overallAvg}; geo coverage ${projects.length ? Math.round((withCoords / projects.length) * 100) : 0}%`)
}

// ---- audit ------------------------------------------------------------

async function audit() {
  const now = Date.now()
  const projects = await db.projectDirectory.findMany({
    where: { deletedAt: null },
    select: { id: true, updatedAt: true, lat: true, readyBy: true, name: true },
  })
  await db.reviewQueueItem.deleteMany({
    where: { entityType: "project", reason: { startsWith: "auto-stale:" }, resolvedAt: null },
  })
  let stale = 0
  for (const p of projects) {
    const days = (now - p.updatedAt.getTime()) / 86400000
    if (days < 45) continue
    if (stale >= 200) break
    stale++
    await db.reviewQueueItem.create({
      data: {
        kind: "stale_data", entityType: "project", entityId: p.id,
        reason: `auto-stale: no source refresh in ${Math.round(days)}d`,
        details: { days: Math.round(days), missingCoords: p.lat == null, missingReadyBy: !p.readyBy.trim() },
      },
    })
  }
  const failed = await db.dataSource.findMany({ where: { country: "GE", lastErrorAt: { not: null } }, select: { slug: true, lastError: true } })
  for (const f of failed) {
    await db.reviewQueueItem.create({
      data: { kind: "failed_source", entityType: "country", entityId: "GE", reason: `auto:source ${f.slug} failed: ${(f.lastError ?? "").slice(0, 200)}` },
    })
  }
  const noCoords = projects.filter((p) => p.lat == null).length
  const noReady = projects.filter((p) => !p.readyBy.trim()).length
  console.log(`audit: ${stale} stale items queued, ${failed.length} failed sources; gaps → no-coords ${noCoords}, no-readyBy ${noReady}`)
}

// ---- cities: canonical city fields -------------------------------------

const STREET_MARK = /ქუჩა|გამზირი|ბულვარი|გზატკეცილი|შესახვევი|მოედანი|ხევი|ქ\.|\d/
const NOMINATIM_UA = "sivrce-data/1.0 (sivrce888@gmail.com)"

// Settlements real projects use but georgia-locations catalog doesn't list yet —
// canonical = the ka form already dominant in project_directories. When the
// catalog sync adds them, drop the entries that collide.
const CITY_ALIASES: [string, string][] = [
  ["Gonio", "გონიო"], ["Chakvi", "ჩაქვი"], ["Kvariati", "კვარიათი"],
  ["Saguramo", "საგურამო"], ["Tsavkisi", "წავკისი"],
]

function cityCanonMap(): Map<string, string> {
  const m = new Map<string, string>()
  // Municipalities first so the city key wins collisions ("ქობულეთი" stays a city).
  for (const c of [...GEO_MUNICIPALITIES, ...GEO_CITIES]) {
    m.set(norm(c), c)
    m.set(norm(toLatin(c)), c)
    m.set(norm(c.replace(/ის მუნიციპალიტეტი$/, "")), c)
  }
  for (const [variant, canonical] of CITY_ALIASES) {
    m.set(norm(variant), canonical)
    m.set(norm(canonical), canonical) // ka head inside "გონიო ანდრია …" must hit too
    m.set(norm(toLatin(canonical)), canonical)
  }
  return m
}

async function cities() {
  const canon = cityCanonMap()
  const rows = await db.projectDirectory.findMany({
    where: { deletedAt: null },
    select: { id: true, city: true, address: true, district: true },
  })
  let renamed = 0
  let split = 0
  let nullFixed = 0
  const samples: string[] = []
  for (const r of rows) {
    const raw = r.city.trim()
    let patch: { city?: string; address?: string | null } | null = null

    if ((r.address ?? "") === "null") { patch = { address: null }; nullFixed++ }

    if (!raw) continue
    const direct = canon.get(norm(raw))
    if (direct && direct !== raw) {
      patch = { ...patch, city: direct }
    } else if (!direct) {
      // "ბაკურიანი მთისუბნის ქუჩა 4" / "ქობულეთის მუნიციპალიტეტი" → leading known city + remainder
      const words = raw.split(/\s+/)
      for (let take = Math.min(words.length, 3); take >= 1; take--) {
        const head = words.slice(0, take).join(" ")
        const hit = canon.get(norm(head))
        if (!hit) continue
        const rest = words.slice(take).join(" ").replace(/^\s*/, "")
        if (STREET_MARK.test(head) && take === words.length) break // whole string is an address, not a city
        patch = { ...patch, city: hit }
        // Remainder is locality/street detail — never drop it, park it in address.
        if (rest) patch.address = r.address?.trim() ? `${r.address.trim()}, ${rest}` : rest
        if (rest && samples.length < 15) samples.push(`${raw} → ${hit} (+ "${rest}")`)
        split++
        break
      }
    }
    if (!patch) continue
    if (patch.city && patch.city !== raw) renamed++
    await db.projectDirectory.update({ where: { id: r.id }, data: patch })
  }
  console.log(`cities: renamed→ka ${renamed}, split street-out-of-city ${split}, null-address fixed ${nullFixed}`)
  for (const s of samples) console.log(`  e.g. ${s}`)
}

// ---- geocode: Nominatim for missing coords ------------------------------

async function geocode() {
  const sources = await db.dataSource.findMany({ where: { country: "GE" }, select: { id: true, slug: true } })
  const src = sources.find((s) => s.slug === "ge-nominatim")
  if (!src) { console.log("geocode: run `sources` first"); return }

  const rows = await db.projectDirectory.findMany({
    where: { deletedAt: null, lat: null, address: { not: null } },
    select: { id: true, address: true, city: true, district: true },
    take: 700,
    orderBy: { updatedAt: "asc" },
  })
  let ok = 0
  let miss = 0
  for (const r of rows) {
    const q = [r.address!.trim(), r.city.trim() || r.district.trim(), "Georgia"].filter(Boolean).join(", ")
    if (q.length < 8 || r.address!.trim().length < 4) { miss++; continue }
    let hits: { lat: string; lon: string; importance?: number }[] = []
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&countrycodes=ge&q=${encodeURIComponent(q)}`,
        { headers: { "User-Agent": NOMINATIM_UA }, signal: AbortSignal.timeout(20_000) },
      )
      if (res.ok) hits = (await res.json()) as typeof hits
    } catch { /* count as miss, keep going */ }
    const h = hits[0]
    const lat = h ? Number(h.lat) : NaN
    const lng = h ? Number(h.lon) : NaN
    if (h && lat >= GE_BBOX.south && lat <= GE_BBOX.north && lng >= GE_BBOX.west && lng <= GE_BBOX.east) {
      await db.projectDirectory.update({ where: { id: r.id }, data: { lat, lng } })
      await db.dataProvenance.create({
        data: {
          entityType: "project", entityId: r.id, factKey: "location", factValue: q,
          sourceId: src.id, sourceUrl: `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}`,
          fetchedAt: new Date(), confidence: "unverified", isCurrent: true,
        },
      })
      ok++
    } else {
      miss++
    }
    await db.dataSource.update({ where: { id: src.id }, data: { lastFetchedAt: new Date(), fetchCount: { increment: 1 } } })
    await new Promise((r) => setTimeout(r, 1100))
  }
  await db.dataSource.update({ where: { id: src.id }, data: { lastSuccessAt: new Date() } })
  console.log(`geocode: +${ok} coords, ${miss} unresolved (of ${rows.length} candidates)`)
}

// ---- wiki: Wikidata landmarks -------------------------------------------

// ponytail: direct P31 + VALUES, no /P279* — the subclass walk 500s on WDQS
// for Georgia's full building graph (probed 2026-09-25). Widen the list instead.
const WIKIDATA_SPARQL = `SELECT ?item ?kaLabel ?enLabel ?coord ?arch ?archLabel ?inception ?heritage ?heritageLabel WHERE {
  ?item wdt:P17 wd:Q230 ; wdt:P625 ?coord ; wdt:P31 ?cls .
  VALUES ?cls { wd:Q41176 wd:Q1175546 wd:Q27686 wd:Q11303 wd:Q16560 wd:Q12518 wd:Q16970 wd:Q11315 wd:Q570116 wd:Q847017 }
  ?item rdfs:label ?kaLabel . FILTER(LANG(?kaLabel) = "ka")
  OPTIONAL { ?item rdfs:label ?enLabel . FILTER(LANG(?enLabel) = "en") }
  OPTIONAL { ?item wdt:P84 ?arch }
  OPTIONAL { ?item wdt:P571 ?inception }
  OPTIONAL { ?item wdt:P1435 ?heritage }
  SERVICE wikibase:label { bd:serviceParam wikibase:language "ka,en". }
}`

async function wiki() {
  const sources = await db.dataSource.findMany({ where: { country: "GE" }, select: { id: true, slug: true } })
  const src = sources.find((s) => s.slug === "ge-wikidata")
  if (!src) { console.log("wiki: run `sources` first"); return }

  // GET not POST — probed 2026-09-25: POST times out from this network, GET answers in <1s.
  const res = await fetch(`https://query.wikidata.org/sparql?query=${encodeURIComponent(WIKIDATA_SPARQL)}&format=json`, {
    headers: {
      "User-Agent": NOMINATIM_UA,
      Accept: "application/sparql-results+json",
    },
    signal: AbortSignal.timeout(120_000),
  })
  if (!res.ok) { console.error(`wiki: sparql ${res.status}`); return }
  type Row = { item: { value: string }; kaLabel: { value: string }; enLabel?: { value: string }; coord: { value: string }; archLabel?: { value: string }; inception?: { value: string }; heritageLabel?: { value: string } }
  const { results: { bindings: rows } } = (await res.json()) as { results: { bindings: Row[] } }

  const existing = await db.projectDirectory.findMany({
    where: { deletedAt: null },
    select: { id: true, name: true, lat: true, lng: true, features: true },
  })
  const byNorm = new Map(existing.map((p) => [norm(p.name), p]))
  const dist = (a: { lat: number; lng: number }, b: { lat: number; lng: number }) => {
    const dLat = (a.lat - b.lat) * 111_320
    const dLng = (a.lng - b.lng) * 88_000
    return Math.hypot(dLat, dLng)
  }

  let enriched = 0
  let created = 0
  const seen = new Set<string>()
  for (const r of rows) {
    const qid = r.item.value.split("/").pop() as string
    if (seen.has(qid)) continue
    seen.add(qid)
    const name = (r.kaLabel?.value ?? r.enLabel?.value ?? "").trim()
    const [lngS, latS] = r.coord.value.replace(/Point\(|\)/g, "").split(" ")
    const lat = Number(latS), lng = Number(lngS)
    if (!name || !Number.isFinite(lat) || !Number.isFinite(lng)) continue
    const facts = [
      r.archLabel?.value ? `architect=${r.archLabel.value}` : "",
      r.inception?.value ? `inception=${r.inception.value.slice(0, 10)}` : "",
      r.heritageLabel?.value ? `heritage=${r.heritageLabel.value}` : "",
    ].filter(Boolean)

    const hit = byNorm.get(norm(name)) ??
      existing.find((p) => p.lat != null && p.lng != null && dist({ lat, lng }, { lat: p.lat, lng: p.lng }) < 150)
    if (hit) {
      const merged = [...new Set([...hit.features, ...facts])].slice(0, 20)
      if (merged.length !== hit.features.length) {
        await db.projectDirectory.update({ where: { id: hit.id }, data: { features: merged } })
        await db.dataProvenance.create({
          data: {
            entityType: "project", entityId: hit.id, factKey: "landmark", factValue: facts.join("; ") || name,
            sourceId: src.id, sourceUrl: `https://www.wikidata.org/wiki/${qid}`,
            fetchedAt: new Date(), confidence: "likely", isCurrent: true,
          },
        })
        enriched++
      }
      continue
    }
    const slug = `${toLatin(name).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 90)}-${qid.toLowerCase()}`
    const row = await db.projectDirectory.upsert({
      where: { id: `wikidata-${qid}` },
      create: {
        id: `wikidata-${qid}`, slug, name, developer: "", city: "", district: "",
        lat, lng, sourceUrl: `https://www.wikidata.org/wiki/${qid}`,
        status: "", readyBy: "", image: "", features: facts,
        body: "Wikidata landmark (CC0). Not a developer listing — pending classification.",
      },
      update: { lat, lng },
    })
    await db.dataProvenance.create({
      data: {
        entityType: "project", entityId: row.id, factKey: "identity", factValue: name,
        sourceId: src.id, sourceUrl: `https://www.wikidata.org/wiki/${qid}`,
        fetchedAt: new Date(), confidence: "likely", isCurrent: true,
      },
    })
    created++
  }
  await db.dataSource.update({ where: { id: src.id }, data: { lastSuccessAt: new Date(), lastFetchedAt: new Date(), fetchCount: { increment: 1 }, recordCount: { increment: created } } })
  console.log(`wiki: ${rows.length} bindings → enriched ${enriched}, created ${created} landmark rows`)
}

// ---- OSM discovery ----------------------------------------------------

const GE_BBOX = { south: 41.05, west: 39.95, north: 43.6, east: 46.75 }
const ENDPOINTS = [
  // ponytail: order matters — probed 2026-09-25, private.coffee/kumi blackhole
  // from this network; de answers in ~2s. Re-probe before reordering.
  "https://overpass-api.de/api/interpreter",
  "https://overpass.private.coffee/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
]
const UA = "sivrce-data/1.0 (sivrce888@gmail.com)"

async function overpass(q: string, tries = 3): Promise<{ elements: { type: string; id: number; lat?: number; lon?: number; center?: { lat: number; lon: number }; tags?: Record<string, string> }[] }> {
  for (let i = 0; i < tries; i++) {
    for (const ep of ENDPOINTS) {
      try {
        const res = await fetch(ep, {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded", "User-Agent": UA },
          body: `data=${encodeURIComponent(q)}`,
          signal: AbortSignal.timeout(660_000),
        })
        if (!res.ok) { console.log(`  overpass ${new URL(ep).host} → HTTP ${res.status}`); continue }
        return (await res.json()) as { elements: never[] }
      } catch (e) { console.log(`  overpass ${new URL(ep).host} → ${(e as Error).message}`) }
    }
    if (i < tries - 1) await new Promise((r) => setTimeout(r, 30_000))
  }
  return { elements: [] }
}

async function osm() {
  const sources = await db.dataSource.findMany({ where: { country: "GE" }, select: { id: true, slug: true } })
  const osmSource = sources.find((s) => s.slug === "ge-osm")
  if (!osmSource) { console.log("osm: run `sources` first"); return }

  // Existing anchors for proximity+name dedupe.
  const existing = await db.projectDirectory.findMany({
    where: { deletedAt: null },
    select: { id: true, name: true, lat: true, lng: true },
  })
  const existingNorms = new Set(existing.map((p) => norm(p.name)))

  const created: { id: string; name: string }[] = []
  let sites = 0
  let named = 0
  let skippedName = 0

  const { south: s, west: w, north: n, east: e } = GE_BBOX
  // Regional bboxes — the single country query starves on busy Overpass
  // mirrors ("Dispatcher_Client timeout"), small queries get through.
  const REGIONS: { name: string; bbox: string }[] = [
    { name: "tbilisi", bbox: "41.62,44.60,41.85,45.05" },
    { name: "adjara", bbox: "41.48,41.40,41.95,42.05" },
    { name: "imereti", bbox: "42.00,42.55,42.45,43.30" },
    { name: "kvemo-shida-kartli", bbox: "41.40,43.90,42.30,45.20" },
    { name: "samtskhe-javakheti", bbox: "41.30,42.70,42.05,43.70" },
    { name: "kakheti", bbox: "41.40,45.30,42.40,46.75" },
    { name: "samegrelo-guria", bbox: "41.90,41.45,43.10,42.30" },
    { name: "svaneti-racha", bbox: "42.35,42.30,43.60,44.60" },
    { name: "mtskheta-tianeti", bbox: "41.90,44.30,42.55,45.40" },
  ]
  for (const reg of REGIONS) {
    const query = `[out:json][timeout:300];(way["building"="construction"](${reg.bbox});way["landuse"="construction"](${reg.bbox}););out center tags;`
    console.log(`osm: region ${reg.name}…`)
    const data = await overpass(query)
    const now = new Date()
    const before = created.length
  for (const el of data.elements) {
    sites++
    const c = el.center ?? (el.lat && el.lon ? { lat: el.lat, lon: el.lon } : null)
    if (!c) continue
    const t = el.tags ?? {}
    const name = (t["name:ka"] ?? t.name ?? "").trim()
    if (!name) continue
    named++
    const nKey = norm(name)
    // Same complex name already in catalog → skip (near-duplicate guard).
    if (existingNorms.has(nKey)) { skippedName++; continue }
    existingNorms.add(nKey)
    const slug = `${toLatin(name).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 90)}-osm${el.id}`.replace(/^-+/, "")
    const id = `osm-way-${el.id}`
    const row = await db.projectDirectory.upsert({
      where: { id },
      create: {
        id, slug, name,
        developer: t["operator"] ?? t["developer"] ?? "",
        city: t["addr:city"] ?? "",
        district: t["addr:district"] ?? t["addr:suburb"] ?? "",
        address: [t["addr:street"], t["addr:housenumber"]].filter(Boolean).join(" ") || null,
        lat: c.lat, lng: c.lon,
        sourceUrl: `https://www.openstreetmap.org/way/${el.id}`,
        status: "construction",
        readyBy: "",
        image: "",
        body: t.description ? `${t.description} (OSM tags)` : null,
        features: Object.entries(t).filter(([k]) => k.startsWith("building:") || k === "levels" || k === "height" || k.startsWith("architect")).map(([k, v]) => `${k}=${v}`).slice(0, 10),
      },
      update: { lat: c.lat, lng: c.lon },
    })
    created.push({ id: row.id, name })
    await db.dataProvenance.create({
      data: {
        entityType: "project", entityId: row.id, factKey: "identity", factValue: name,
        sourceId: osmSource.id, sourceUrl: `https://www.openstreetmap.org/way/${el.id}`,
        fetchedAt: now, confidence: "unverified", isCurrent: true,
      },
    })
  }
  await db.dataSource.update({ where: { id: osmSource.id }, data: { lastFetchedAt: new Date(), fetchCount: { increment: 1 }, recordCount: { increment: created.length - before } } })
  }
  await db.dataSource.update({ where: { id: osmSource.id }, data: { lastSuccessAt: new Date() } })
  console.log(`osm: ${sites} construction sites seen, ${named} named, +${created.length} new project rows (skipped ${skippedName} name-matched)`)
}

// ---- main -------------------------------------------------------------

async function main() {
  const cmd = process.argv[2] ?? "all"
  const t0 = Date.now()
  if (cmd === "sources" || cmd === "all") await sources()
  if (cmd === "provenance" || cmd === "all") await provenance()
  if (cmd === "graph" || cmd === "all") await graph()
  if (cmd === "dedupe" || cmd === "all") await dedupe()
  if (cmd === "quality" || cmd === "all") await quality()
  if (cmd === "audit" || cmd === "all") await audit()
  if (cmd === "cities") await cities()
  if (cmd === "geocode") await geocode()
  if (cmd === "wiki") await wiki()
  if (cmd === "osm") await osm()
  console.log(`done (${cmd}) in ${Math.round((Date.now() - t0) / 1000)}s`)
}

main()
  .catch((e) => { console.error(e); process.exitCode = 1 })
  .finally(() => db.$disconnect())
