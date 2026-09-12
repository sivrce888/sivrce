/**
 * Daily trust sweep: DuplicateCluster upserts + FraudSignal writes.
 * Feeds the existing admin Moderation → Duplicates/Fraud tabs; nothing here
 * auto-hides listings — humans resolve.
 */

import { ListingStatus } from "@/generated/prisma/client"
import { USD_GEL } from "@/data/listings"
import { db } from "@/lib/db"
import {
  CONFIDENCE,
  type DupeListing,
  clusterFuzzy,
  fuzzyBlockKey,
  geoFactsSignature,
  phoneFactsSignature,
  phoneKey,
  pickRepresentative,
  priceOutliers,
} from "@/lib/trust/dedupe-core"

type Row = DupeListing // job selects exactly the DupeListing shape

async function upsertCluster(
  signature: string,
  method: keyof typeof CONFIDENCE,
  group: Row[],
): Promise<string> {
  const rep = pickRepresentative(group)
  const cluster = await db.duplicateCluster.upsert({
    where: { clusterSignature: signature },
    create: {
      clusterSignature: signature,
      detectionMethod: method,
      confidence: CONFIDENCE[method],
      representativeListingId: rep.id,
      memberCount: group.length,
    },
    update: {
      detectionMethod: method,
      confidence: CONFIDENCE[method],
      representativeListingId: rep.id,
      memberCount: group.length,
    },
  })
  // Prune members that left the cluster (delisted/edited/repriced out), add missing.
  await db.duplicateClusterMember.deleteMany({
    where: { clusterId: cluster.id, listingId: { notIn: group.map((l) => l.id) } },
  })
  await db.duplicateClusterMember.createMany({
    data: group.map((l) => ({
      clusterId: cluster.id,
      listingId: l.id,
      similarityScore: CONFIDENCE[method],
    })),
    skipDuplicates: true,
  })
  return cluster.id
}

/** One active signal per listing+kind — the sweep is idempotent per day. */
async function writeSignal(
  subjectId: string,
  signalKind: string,
  severity: number,
  confidence: number,
  details: Record<string, string | number | null>,
): Promise<boolean> {
  const existing = await db.fraudSignal.findFirst({
    where: { subjectKind: "listing", subjectId, signalKind, isActive: true, resolvedAt: null },
    select: { id: true },
  })
  if (existing) return false
  await db.fraudSignal.create({
    data: { subjectKind: "listing", subjectId, signalKind, severity, confidence, details },
  })
  return true
}

// ponytail: sequential awaits — a daily job over ≤50k rows fits maxDuration 300
// comfortably; revisit only if cluster count grows past a few thousand.
export async function dedupeFraudJob(): Promise<{
  scanned: number
  clusters: number
  signals: number
}> {
  const rows: Row[] = await db.listing.findMany({
    where: { deletedAt: null, status: ListingStatus.active },
    select: {
      id: true, ownerId: true, verified: true, createdAt: true,
      dealType: true, propertyType: true, city: true, district: true,
      rooms: true, floor: true, area: true, lat: true, lng: true,
      listingPhone: true, price: true, currency: true, pricePerSqm: true,
    },
    take: 50_000,
  })

  let signals = 0
  let clusters = 0

  const passes: [(l: Row) => string | null, keyof typeof CONFIDENCE][] = [
    [phoneFactsSignature, "phone_facts"],
    [geoFactsSignature, "geo_facts"],
  ]
  const groups: { sig: string; method: keyof typeof CONFIDENCE; group: Row[] }[] = []
  for (const [sigOf, method] of passes) {
    const bySig = new Map<string, Row[]>()
    for (const l of rows) {
      const sig = sigOf(l)
      if (!sig) continue
      const arr = bySig.get(sig)
      if (arr) arr.push(l)
      else bySig.set(sig, [l])
    }
    for (const [sig, group] of bySig) {
      if (group.length >= 2) groups.push({ sig, method, group })
    }
  }

  // Fuzzy pass: exact hashes miss drifted area/floor + reworded text. Block
  // tight on cell+rooms, fetch text only for blocked candidates (bounded),
  // cluster loose. One stable signature per block — upsertCluster prunes churn.
  const blocked = new Map<string, string[]>()
  for (const l of rows) {
    const k = fuzzyBlockKey(l)
    const arr = blocked.get(k)
    if (arr) arr.push(l.id)
    else blocked.set(k, [l.id])
  }
  const candidateIds: string[] = []
  for (const ids of blocked.values()) {
    if (ids.length >= 2) candidateIds.push(...ids)
  }
  for (let i = 0; i < candidateIds.length; i += 1000) {
    const chunk = candidateIds.slice(i, i + 1000)
    const withText = await db.listing.findMany({
      where: { id: { in: chunk }, deletedAt: null, status: ListingStatus.active },
      select: {
        id: true, ownerId: true, verified: true, createdAt: true,
        dealType: true, propertyType: true, city: true, district: true,
        rooms: true, floor: true, area: true, lat: true, lng: true,
        listingPhone: true, price: true, currency: true, pricePerSqm: true,
        title: true, description: true,
      },
    })
    for (const g of clusterFuzzy(withText)) {
      groups.push({ sig: `fuzzy|v1|${fuzzyBlockKey(g[0]!)}`, method: "fuzzy_facts", group: g })
    }
  }

  for (const { sig, method, group } of groups) {
    clusters++
    const clusterId = await upsertCluster(sig, method, group)
    // ≥3 copies = spam-grade reposting, not an innocent double-submit
    if (group.length < 3) continue
    const rep = pickRepresentative(group)
    for (const l of group) {
      if (l.id === rep.id) continue
      if (await writeSignal(l.id, "duplicate_repost", 3, CONFIDENCE[method], {
        clusterId, signature: sig, memberCount: group.length,
      }))
        signals++
    }
  }

  for (const [id, o] of priceOutliers(rows, USD_GEL)) {
    if (await writeSignal(id, "price_outlier", 1, 0.7, { ...o }))
      signals++
  }

  const blocklist = await db.blocklistPhone.findMany({
    where: { OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }] },
    select: { phone: true },
  })
  const banned = new Set(blocklist.map((b) => phoneKey(b.phone)).filter(Boolean))
  for (const l of rows) {
    if (banned.has(phoneKey(l.listingPhone))) {
      if (await writeSignal(l.id, "blocklisted_phone", 3, 1, {}))
        signals++
    }
  }

  return { scanned: rows.length, clusters, signals }
}
