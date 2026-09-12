import { db } from "@/lib/db";
import type { EntityType } from "@/generated/prisma/enums";

type QualityScore = {
  completeness: number
  accuracy: number
  freshness: number
  sourceQuality: number
  crossSource: number
  overall: number
}

const WEIGHTS = { completeness: 0.3, accuracy: 0.25, freshness: 0.2, sourceQuality: 0.15, crossSource: 0.1 };

function clamp01(v: number) { return Math.max(0, Math.min(100, Math.round(v))); }

export async function calculateQualityScore(
  entityType: EntityType,
  entityId: string,
): Promise<QualityScore> {
  const provenances = await db.dataProvenance.findMany({
    where: { entityType, entityId, isCurrent: true },
    include: { source: { select: { reliability: true } } },
  });

  const factKeys = new Set(provenances.map((p) => p.factKey));
  const importantFields = ["name", "status", "address", "lat", "lng", "price", "developer"];
  const filledCount = importantFields.filter((f) => factKeys.has(f)).length;
  const completeness = (filledCount / importantFields.length) * 100;

  const reliabilityScores: Record<string, number> = {
    official_government: 100,
    official_registry: 95,
    official_company: 90,
    established_institution: 80,
    reputable_media: 70,
    verified_company: 65,
    public_listing: 50,
    user_generated: 30,
    unknown: 10,
  };
  const avgReliability = provenances.length > 0
    ? provenances.reduce((sum, p) => sum + (reliabilityScores[p.source.reliability] ?? 10), 0) / provenances.length
    : 0;
  const accuracy = clamp01(avgReliability);

  const latestFact = provenances[0];
  const hoursSinceFact = latestFact
    ? (Date.now() - latestFact.fetchedAt.getTime()) / 3600000
    : Infinity;
  let freshness = 100;
  if (hoursSinceFact < 24) freshness = 100;
  else if (hoursSinceFact < 168) freshness = 80;
  else if (hoursSinceFact < 720) freshness = 50;
  else if (hoursSinceFact < 2160) freshness = 25;
  else freshness = 10;

  const uniqueSources = new Set(provenances.map((p) => p.sourceId));
  const crossSource = clamp01(Math.min(100, uniqueSources.size * 25));

  const sourceQuality = clamp01(avgReliability * 0.6 + crossSource * 0.4);

  const overall = clamp01(
    completeness * WEIGHTS.completeness +
    accuracy * WEIGHTS.accuracy +
    freshness * WEIGHTS.freshness +
    sourceQuality * WEIGHTS.sourceQuality +
    crossSource * WEIGHTS.crossSource,
  );

  const score: QualityScore = {
    completeness: clamp01(completeness),
    accuracy: clamp01(accuracy),
    freshness: clamp01(freshness),
    sourceQuality: clamp01(sourceQuality),
    crossSource,
    overall,
  };

  await db.dataQualityScore.upsert({
    where: { entityType_entityId: { entityType, entityId } },
    create: { entityType, entityId, ...score },
    update: { ...score, calculatedAt: new Date() },
  });

  return score;
}

export async function getLowQualityEntities(limit = 50) {
  return db.dataQualityScore.findMany({
    where: { overall: { lt: 40 } },
    orderBy: { overall: "asc" },
    take: limit,
  });
}
