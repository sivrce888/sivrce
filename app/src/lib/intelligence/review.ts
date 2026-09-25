import { db } from "@/lib/db"

/** Open review-queue counts by kind + latest items (triage view). */
export async function getReviewQueue(limit = 60) {
  const [byKind, items] = await Promise.all([
    db.reviewQueueItem.groupBy({
      by: ["kind"],
      where: { resolvedAt: null },
      _count: { _all: true },
    }),
    db.reviewQueueItem.findMany({
      where: { resolvedAt: null },
      orderBy: { createdAt: "desc" },
      take: limit,
    }),
  ])
  const counts = Object.fromEntries(byKind.map((k) => [k.kind, k._count._all])) as Record<string, number>
  return { counts, items }
}

/** Georgia coverage gaps: projects missing key facts. */
export async function getGeGaps() {
  const base = { deletedAt: null }
  const [total, noCoords, noReadyBy, noImage, noBody, osmRows] = await Promise.all([
    db.projectDirectory.count({ where: base }),
    db.projectDirectory.count({ where: { ...base, OR: [{ lat: null }, { lng: null }] } }),
    db.projectDirectory.count({ where: { ...base, readyBy: "" } }),
    db.projectDirectory.count({ where: { ...base, image: "" } }),
    db.projectDirectory.count({ where: { ...base, OR: [{ body: null }, { body: "" }] } }),
    db.projectDirectory.count({ where: { ...base, id: { startsWith: "osm-way-" } } }),
  ])
  return { total, noCoords, noReadyBy, noImage, noBody, osmRows }
}
