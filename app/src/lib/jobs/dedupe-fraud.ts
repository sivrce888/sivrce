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
  for (const [sigOf, method] of passes) {
    const groups = new Map<string, Row[]>()
    for (const l of rows) {
      const sig = sigOf(l)
      if (!sig) continue
      const arr = groups.get(sig)
      if (arr) arr.push(l)
      else groups.set(sig, [l])
    }
    for (const [sig, group] of groups) {
      if (group.length < 2) continue
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
