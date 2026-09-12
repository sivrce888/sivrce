import { db } from "@/lib/db";
import type { EntityType, FactConfidence, SourceReliability } from "@/generated/prisma/enums";
import type { ProvenanceFact } from "./types";

export const RELIABILITY_RANK: Record<SourceReliability, number> = {
  official_government: 10,
  official_registry: 9,
  official_company: 8,
  established_institution: 7,
  reputable_media: 6,
  verified_company: 5,
  public_listing: 4,
  user_generated: 2,
  unknown: 1,
};

export const CONFIDENCE_RANK: Record<FactConfidence, number> = {
  verified: 6,
  high_confidence: 5,
  likely: 4,
  unverified: 3,
  outdated: 2,
  conflicting: 1,
};

export function reliabilityScore(kind: SourceReliability): number {
  return RELIABILITY_RANK[kind] ?? 1;
}

export function confidenceRank(v: FactConfidence): number {
  return CONFIDENCE_RANK[v] ?? 3;
}

export function reliabilitySource(kind: SourceReliability): number {
  return reliabilityScore(kind);
}

interface ProvenanceFactWithSource extends ProvenanceFact {
  source: {
    name: string;
    reliability: SourceReliability;
  };
}

export async function recordFact(fact: ProvenanceFact) {
  return db.dataProvenance.create({
    data: {
      entityType: fact.entityType,
      entityId: fact.entityId,
      factKey: fact.factKey,
      factValue: fact.factValue,
      sourceId: fact.sourceId,
      sourceUrl: fact.sourceUrl,
      fetchedAt: fact.fetchedAt,
      publishedAt: fact.publishedAt,
      confidence: fact.confidence,
      isCurrent: true,
    },
  });
}

export async function recordFacts(facts: ProvenanceFact[]) {
  if (facts.length === 0) return;
  return db.dataProvenance.createMany({ data: facts, skipDuplicates: true });
}

export async function markFactStale(entityType: EntityType, entityId: string, factKey: string) {
  await db.dataProvenance.updateMany({
    where: { entityType, entityId, factKey, isCurrent: true },
    data: { isCurrent: false },
  });
}

export async function getCurrentFacts(
  entityType: EntityType,
  entityId: string,
): Promise<ProvenanceFact[]> {
  const rows = await db.dataProvenance.findMany({
    where: { entityType, entityId, isCurrent: true },
    orderBy: { fetchedAt: "desc" },
    include: { source: { select: { name: true, reliability: true } } },
  });

  return rows.map((r) => ({
    entityType: r.entityType,
    entityId: r.entityId,
    factKey: r.factKey,
    factValue: r.factValue,
    sourceId: r.sourceId,
    sourceUrl: r.sourceUrl ?? undefined,
    fetchedAt: r.fetchedAt,
    publishedAt: r.publishedAt ?? undefined,
    confidence: r.confidence,
  }));
}

export async function getFactHistory(
  entityType: EntityType,
  entityId: string,
  factKey: string,
): Promise<ProvenanceFact[]> {
  const rows = await db.dataProvenance.findMany({
    where: { entityType, entityId, factKey },
    orderBy: { fetchedAt: "desc" },
    include: { source: { select: { name: true, reliability: true } } },
  });

  return rows.map((r) => ({
    entityType: r.entityType,
    entityId: r.entityId,
    factKey: r.factKey,
    factValue: r.factValue,
    sourceId: r.sourceId,
    sourceUrl: r.sourceUrl ?? undefined,
    fetchedAt: r.fetchedAt,
    publishedAt: r.publishedAt ?? undefined,
    confidence: r.confidence,
  }));
}

export async function resolveFactConflicts(
  entityType: EntityType,
  entityId: string,
  factKey: string,
) {
  const facts = await db.dataProvenance.findMany({
    where: { entityType, entityId, factKey, isCurrent: true },
    include: { source: { select: { name: true, reliability: true } } },
    orderBy: { fetchedAt: "desc" },
  });

  if (facts.length === 0) return null;
  if (facts.length === 1) {
    return {
      value: facts[0].factValue,
      confidence: facts[0].confidence,
      sourceCount: 1,
      conflict: false,
    };
  }

  const sorted = [...facts].sort((a, b) => {
    const relDiff = reliabilityScore(b.source.reliability) - reliabilityScore(a.source.reliability);
    if (relDiff !== 0) return relDiff;
    const confDiff = confidenceRank(b.confidence) - confidenceRank(a.confidence);
    if (confDiff !== 0) return confDiff;
    return b.fetchedAt.getTime() - a.fetchedAt.getTime();
  });

  const best = sorted[0];
  const uniqueValues = new Set(sorted.map((f) => f.factValue));

  return {
    value: best.factValue,
    confidence: uniqueValues.size > 1 ? ("conflicting" as FactConfidence) : best.confidence,
    sourceCount: facts.length,
    conflict: uniqueValues.size > 1,
    alternatives: sorted.map((f) => ({
      value: f.factValue,
      source: f.source.reliability,
      confidence: f.confidence,
      fetchedAt: f.fetchedAt,
      reliabilityRank: reliabilityScore(f.source.reliability),
      confidenceRank: confidenceRank(f.confidence),
    })),
    bestSource: {
      name: best.source.name,
      reliability: best.source.reliability,
    },
  };
}

export async function getEntityProvenanceSummary(
  entityType: EntityType,
  entityId: string,
) {
  const facts = await db.dataProvenance.findMany({
    where: { entityType, entityId },
    include: { source: { select: { name: true, reliability: true } } },
  });

  const byKey: Record<string, ProvenanceFactWithSource[]> = facts.reduce((acc, f) => {
    (acc[f.factKey] = acc[f.factKey] || []).push(f as ProvenanceFactWithSource);
    return acc;
  }, {} as Record<string, ProvenanceFactWithSource[]>);

  const summary: Record<string, unknown> = {};
  for (const [key, keyFacts] of Object.entries(byKey)) {
    const uniqueValues = new Set(keyFacts.map((f) => f.factValue));
    const relScores = keyFacts.map((f) => reliabilityScore(f.source.reliability));
    const confRanks = keyFacts.map((f) => confidenceRank(f.confidence));

    summary[key] = {
      value: uniqueValues.size === 1 ? [...uniqueValues][0] : "conflicting",
      sourceCount: keyFacts.length,
      conflict: uniqueValues.size > 1,
      bestReliability: Math.max(...relScores, 0),
      avgReliability: relScores.reduce((a, b) => a + b, 0) / relScores.length,
      confidenceRanks: confRanks,
      fetchedAt: keyFacts[0].fetchedAt,
    };
  }

  return summary;
}

export async function getLowConfidenceFacts(
  entityType: EntityType,
  entityId: string,
  threshold = 3,
): Promise<{ factKey: string; factValue: string; confidence: FactConfidence; sourceReliability: SourceReliability }[]> {
  const facts = await db.dataProvenance.findMany({
    where: { entityType, entityId, isCurrent: true },
    include: { source: { select: { reliability: true } } },
  });

  return facts
    .filter((f) => confidenceRank(f.confidence) <= threshold)
    .map((f) => ({
      factKey: f.factKey,
      factValue: f.factValue,
      confidence: f.confidence,
      sourceReliability: f.source.reliability,
    }));
}