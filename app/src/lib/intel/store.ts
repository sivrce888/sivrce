/**
 * Intelligence persistence — idempotent ingest tail + coverage aggregates.
 * Pure scoring lives in core.ts; this file only reads/writes Intel* tables
 * and reuses existing directory tables for entity counts (no rewrites).
 * ponytail: Prisma upserts, not a queue/worker split — extract to a worker
 * only when a single cron run exceeds Vercel maxDuration.
 */
import { db } from "@/lib/db"
import {
  ACTIVE_PROJECT_STATUSES,
  coverageScoreOf,
  freshnessOf,
  isDue,
  qualityScoreOf,
  resolveConflict,
  SOURCE_REGISTRY,
  validateIngestRecord,
  type EntityKind,
  type EvidenceInput,
  type FactType,
  type IngestRecord,
  type ReviewReason,
  type SourceKind,
} from "@/lib/intel/core"

/** Seed registry into intel_sources — safe to run every cron tick. */
export async function ensureSources(): Promise<number> {
  const ops = SOURCE_REGISTRY.map((s) =>
    db.intelSource.upsert({
      where: { slug: s.slug },
      update: {
        country: s.country, kind: s.kind, name: s.name, baseUrl: s.baseUrl || null,
        facts: s.facts, refreshHours: s.refreshHours, access: s.access,
      },
      create: {
        slug: s.slug, country: s.country, kind: s.kind, name: s.name,
        baseUrl: s.baseUrl || null, facts: s.facts,
        refreshHours: s.refreshHours, access: s.access,
      },
    }),
  )
  const rows = await Promise.all(ops)
  return rows.length
}

export interface IngestFactInput {
  entityKind: EntityKind
  entityId: string
  fact: FactType
  value: string
  sourceSlug: string
  sourceKind: SourceKind
  url?: string | null
  snippet?: string | null
  publishedAt?: Date | null
  retrievedAt?: Date
}

/**
 * Full pipeline tail for one fact: validate → upsert fact → append evidence
 * → resolve conflict → version on change → queue review when uncertain.
 * Idempotent per caller: identical replays only touch lastSeenAt.
 */
export async function ingestFact(i: IngestFactInput) {
  const bad = validateIngestRecord({
    sourceSlug: i.sourceSlug, entityKind: i.entityKind, externalId: i.entityId,
    fetchedAt: i.retrievedAt ?? new Date(), payloadHash: "fact",
    facts: [{ type: i.fact, value: i.value }],
    url: i.url ?? null,
  } as IngestRecord)
  if (bad) throw new Error(`intel_ingest_rejected: ${bad}`)
  const value = i.value.slice(0, 4000)
  const now = i.retrievedAt ?? new Date()

  const existing = await db.intelFact.findUnique({
    where: { entityKind_entityId_factType: { entityKind: i.entityKind, entityId: i.entityId, factType: i.fact } },
    include: { evidence: { orderBy: { retrievedAt: "desc" }, take: 20 } },
  })
  const dup = existing?.evidence.some(
    (e) => e.sourceSlug === i.sourceSlug && (e.url ?? null) === (i.url ?? null) &&
      now.getTime() - e.retrievedAt.getTime() < 3_600_000,
  )
  const fact = existing ?? (await db.intelFact.create({
    data: { entityKind: i.entityKind, entityId: i.entityId, factType: i.fact, value },
  }))
  if (!dup) {
    await db.intelEvidence.create({
      data: {
        factId: fact.id, sourceSlug: i.sourceSlug, sourceKind: i.sourceKind,
        value, url: i.url ?? null, retrievedAt: now, publishedAt: i.publishedAt ?? null,
        snippet: (i.snippet ?? "").slice(0, 2000) || null,
      },
    })
  }
  // Every evidence row carries its asserted value — conflict resolution
  // reads values, alternatives are preserved on the fact, never discarded.
  const prior: EvidenceInput[] = (existing?.evidence ?? []).map((e) => ({
    sourceKind: e.sourceKind as SourceKind, fact: i.fact as FactType,
    value: e.value || fact.value, retrievedAt: e.retrievedAt,
    publishedAt: e.publishedAt, url: e.url,
  }))
  const decided = resolveConflict([
    ...prior,
    ...(!dup ? [{ sourceKind: i.sourceKind, fact: i.fact, value, retrievedAt: now }] : []),
  ])
  const changed = fact.value !== decided.value
  const updated = await db.intelFact.update({
    where: { id: fact.id },
    data: {
      value: decided.value,
      confidence: decided.confidence,
      verification: decided.label,
      freshness: freshnessOf(now, i.fact, now.getTime()),
      alternatives: [
        ...new Set([
          ...((fact.alternatives as string[]) ?? []),
          ...(changed ? [fact.value] : []),
          ...(decided.total > 1 && value !== decided.value ? [value] : []),
        ]),
      ].slice(-8),
      lastSeenAt: now,
      lastVerifiedAt: decided.label === "verified" ? now : fact.lastVerifiedAt,
    },
  })
  if (changed || !existing) {
    await db.intelChange.create({
      data: {
        entityKind: i.entityKind, entityId: i.entityId, factType: i.fact,
        oldValue: existing ? fact.value : null, newValue: decided.value, sourceSlug: i.sourceSlug,
      },
    })
  }
  if (decided.label === "conflicting") {
    await queueReview("conflict", i.entityKind, i.entityId, { fact: i.fact, agreeing: decided.agreeing, total: decided.total })
  } else if (decided.confidence < 35) {
    await queueReview("low_confidence", i.entityKind, i.entityId, { fact: i.fact, confidence: decided.confidence })
  }
  return updated
}

export async function queueReview(reason: ReviewReason, entityKind?: EntityKind | null, entityId?: string | null, details: unknown = {}) {
  // ponytail: no dedupe table — one open row per (reason, entity) is enough signal.
  const open = await db.intelReview.findFirst({
    where: { reason, entityKind: entityKind ?? null, entityId: entityId ?? null, status: "open" },
    select: { id: true },
  })
  if (open) return open
  return db.intelReview.create({
    data: { reason, entityKind: entityKind ?? null, entityId: entityId ?? null, details: (details ?? {}) as object },
  })
}

/** Entity dossier: facts + evidence + immutable history + quality score. */
export async function getEntityProfile(entityKind: EntityKind, entityId: string) {
  const [facts, changes] = await Promise.all([
    db.intelFact.findMany({
      where: { entityKind, entityId },
      include: { evidence: { orderBy: { retrievedAt: "desc" }, take: 5 } },
      orderBy: { factType: "asc" },
    }),
    db.intelChange.findMany({
      where: { entityKind, entityId },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
  ])
  const live = facts.filter((f) => f.freshness === "live" || f.freshness === "recent").length
  const verified = facts.filter((f) => f.verification === "verified" || f.verification === "high_confidence").length
  const quality = facts.length
    ? qualityScoreOf({
        completeness: Math.min(1, facts.length / 12),
        accuracy: facts.reduce((a, f) => a + f.confidence, 0) / facts.length / 100,
        freshness: facts.length ? live / facts.length : 0,
        sourceQuality: Math.min(1, Math.max(...facts.map((f) => f.confidence), 0) / 90),
        agreement: facts.length ? verified / facts.length : 0,
        geoConfidence: facts.some((f) => f.factType === "coordinates" && f.confidence > 60) ? 1 : 0.4,
      })
    : 0
  return { facts, changes, quality }
}

export interface CoverageReport {
  score: number
  developers: number
  projects: number
  activeProjects: number
  buildings: number
  sources: { total: number; healthy: number }
  facts: { total: number; fresh: number; verified: number }
  changes7d: number
  reviewsOpen: number
}

/** Measured coverage — powers the public /api/intel/coverage + admin page. */
export async function getCoverage(): Promise<CoverageReport> {
  const weekAgo = new Date(Date.now() - 7 * 24 * 3_600_000)
  const [
    developers, projects, activeProjects, buildings,
    sources, facts, changes7d, reviewsOpen,
  ] = await Promise.all([
    db.developerProfile.count({ where: { deletedAt: null } }),
    db.projectDirectory.count({ where: { deletedAt: null } }),
    // Directory rows use a coarser lifecycle ("active"/"completed") than the
    // canonical intel vocabulary — count both as the live-project signal.
    db.projectDirectory.count({ where: { deletedAt: null, status: { in: [...ACTIVE_PROJECT_STATUSES, "active"] } } }),
    db.mapBuilding.count(),
    db.intelSource.findMany({ select: { failures: true, isActive: true } }),
    db.intelFact.findMany({ select: { freshness: true, verification: true } }),
    db.intelChange.count({ where: { createdAt: { gte: weekAgo } } }),
    db.intelReview.count({ where: { status: "open" } }),
  ])
  const healthy = sources.filter((s) => s.isActive && s.failures < 3).length
  const fresh = facts.filter((f) => f.freshness === "live" || f.freshness === "recent").length
  const verified = facts.filter((f) => f.verification === "verified" || f.verification === "high_confidence").length
  const score = coverageScoreOf({
    developer: Math.min(1, developers / 500),
    project: Math.min(1, projects / 2000),
    activeProject: projects ? activeProjects / projects : 0,
    geographic: 0.5, // ponytail: honest placeholder until district-coverage rollup lands
    source: sources.length ? healthy / sources.length : 0,
    freshness: facts.length ? fresh / facts.length : 0,
    verifiedRatio: facts.length ? verified / facts.length : 0,
  })
  return {
    score, developers, projects, activeProjects, buildings,
    sources: { total: sources.length, healthy },
    facts: { total: facts.length, fresh, verified },
    changes7d, reviewsOpen,
  }
}

/**
 * Nightly refresh tick: recompute freshness, queue stale_data reviews
 * (capped), report source health. Heavy re-crawls stay in country adapters.
 */
export async function refreshTick(limit = 500): Promise<{ checked: number; stale: number }> {
  await ensureSources()
  const facts = await db.intelFact.findMany({
    orderBy: { lastSeenAt: "asc" },
    take: limit,
    select: { id: true, entityKind: true, entityId: true, factType: true, lastSeenAt: true, freshness: true },
  })
  let stale = 0
  for (const f of facts) {
    const freshness = freshnessOf(f.lastSeenAt, f.factType as FactType)
    if (freshness !== f.freshness) {
      await db.intelFact.update({ where: { id: f.id }, data: { freshness } })
    }
    if ((freshness === "stale" || isDue(f.lastSeenAt, f.factType as FactType)) && stale < 50) {
      await queueReview("stale_data", f.entityKind as EntityKind, f.entityId, { fact: f.factType })
      stale++
    }
  }
  return { checked: facts.length, stale }
}
