import { db } from "@/lib/db";
import type { DataSourceKind, SourceReliability } from "@/generated/prisma/enums";

export async function registerSource(opts: {
  slug: string;
  name: string;
  kind: DataSourceKind;
  reliability: SourceReliability;
  country: string;
  url?: string;
  apiEndpoint?: string;
  robotsTxtOk?: boolean;
  termsUrl?: string;
  rateLimitMs?: number;
  refreshHours?: number;
  reliabilityNote?: string;
}) {
  return db.dataSource.upsert({
    where: { slug: opts.slug },
    create: {
      slug: opts.slug,
      name: opts.name,
      kind: opts.kind,
      reliability: opts.reliability,
      country: opts.country,
      url: opts.url,
      apiEndpoint: opts.apiEndpoint,
      robotsTxtOk: opts.robotsTxtOk ?? true,
      termsUrl: opts.termsUrl,
      rateLimitMs: opts.rateLimitMs,
      refreshHours: opts.refreshHours,
      reliabilityNote: opts.reliabilityNote,
    },
    update: {
      name: opts.name,
      url: opts.url,
      apiEndpoint: opts.apiEndpoint,
      refreshHours: opts.refreshHours,
      reliabilityNote: opts.reliabilityNote,
    },
  });
}

export async function getActiveSources(country?: string) {
  return db.dataSource.findMany({
    where: { isActive: true, ...(country ? { country } : {}) },
    orderBy: { reliability: "desc" },
  });
}

export async function markFetchSuccess(sourceId: string, recordCount: number) {
  return db.dataSource.update({
    where: { id: sourceId },
    data: {
      lastSuccessAt: new Date(),
      lastFetchedAt: new Date(),
      fetchCount: { increment: 1 },
      recordCount,
      lastError: null,
      lastErrorAt: null,
    },
  });
}

export async function markFetchError(sourceId: string, error: string) {
  return db.dataSource.update({
    where: { id: sourceId },
    data: {
      lastErrorAt: new Date(),
      lastFetchedAt: new Date(),
      fetchCount: { increment: 1 },
      errorCount: { increment: 1 },
      lastError: error.slice(0, 500),
    },
  });
}

export async function getSourceHealth() {
  const sources = await db.dataSource.findMany({
    where: { isActive: true },
    select: {
      id: true,
      slug: true,
      name: true,
      kind: true,
      reliability: true,
      country: true,
      lastSuccessAt: true,
      lastErrorAt: true,
      lastError: true,
      fetchCount: true,
      errorCount: true,
      recordCount: true,
    },
  });

  return sources.map((s) => {
    const errorRate = s.fetchCount > 0 ? s.errorCount / s.fetchCount : 0;
    const hoursSinceSuccess = s.lastSuccessAt
      ? (Date.now() - s.lastSuccessAt.getTime()) / 3600000
      : Infinity;

    let health: "healthy" | "degraded" | "failed" = "healthy";
    if (errorRate > 0.5 || hoursSinceSuccess > 72) health = "failed";
    else if (errorRate > 0.2 || hoursSinceSuccess > 24) health = "degraded";

    return { ...s, errorRate, hoursSinceSuccess, health };
  });
}
