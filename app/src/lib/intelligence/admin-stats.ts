import { db } from "@/lib/db";

export async function getDashboardStats() {
  const [
    totalDevelopers,
    totalProjects,
    totalListings,
    totalSources,
    activeSources,
    totalProvenances,
    totalChanges,
    totalSnapshots,
    lowQualityCount,
    reviewQueueCount,
    recentChanges,
    topSources,
    qualityDistribution,
  ] = await Promise.all([
    db.developerProfile.count({ where: { deletedAt: null } }),
    db.projectDirectory.count({ where: { deletedAt: null } }),
    db.listing.count({ where: { status: "active" } }),
    db.dataSource.count(),
    db.dataSource.count({ where: { isActive: true } }),
    db.dataProvenance.count({ where: { isCurrent: true } }),
    db.dataChange.count(),
    db.dataSnapshot.count(),
    db.dataQualityScore.count({ where: { overall: { lt: 40 } } }),
    db.reviewQueueItem.count({ where: { resolvedAt: null } }),
    db.dataChange.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
      select: {
        entityType: true,
        entityId: true,
        changeKind: true,
        field: true,
        oldValue: true,
        newValue: true,
        createdAt: true,
      },
    }),
    db.dataSource.findMany({
      where: { isActive: true },
      orderBy: { recordCount: "desc" },
      take: 10,
      select: {
        name: true,
        kind: true,
        reliability: true,
        recordCount: true,
        lastSuccessAt: true,
        lastErrorAt: true,
      },
    }),
    db.dataQualityScore.groupBy({
      by: ["entityType"],
      _avg: { overall: true },
      _count: true,
    }),
  ]);

  const twentyFourHoursAgo = new Date(Date.now() - 24 * 3600000);
  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 3600000);

  const [changesToday, changesThisWeek, newEntitiesThisWeek] = await Promise.all([
    db.dataChange.count({ where: { createdAt: { gte: twentyFourHoursAgo } } }),
    db.dataChange.count({ where: { createdAt: { gte: oneWeekAgo } } }),
    db.entityAlias.count({ where: { createdAt: { gte: oneWeekAgo } } }),
  ]);

  return {
    totals: {
      developers: totalDevelopers,
      projects: totalProjects,
      listings: totalListings,
      sources: totalSources,
      activeSources,
      provenances: totalProvenances,
      changes: totalChanges,
      snapshots: totalSnapshots,
    },
    health: {
      lowQualityEntities: lowQualityCount,
      pendingReviewItems: reviewQueueCount,
      changesToday,
      changesThisWeek,
      newEntitiesThisWeek,
    },
    recentChanges,
    topSources,
    qualityDistribution: qualityDistribution.map((q) => ({
      entityType: q.entityType,
      avgOverall: q._avg.overall ?? 0,
      count: q._count,
    })),
  };
}

export async function getReviewQueue(kind?: string, limit = 50) {
  return db.reviewQueueItem.findMany({
    where: {
      resolvedAt: null,
      ...(kind ? { kind: kind as never } : {}),
    },
    orderBy: { createdAt: "asc" },
    take: limit,
  });
}

export async function resolveReviewItem(id: string, resolution: string) {
  return db.reviewQueueItem.update({
    where: { id },
    data: {
      resolvedAt: new Date(),
      resolution,
    },
  });
}
