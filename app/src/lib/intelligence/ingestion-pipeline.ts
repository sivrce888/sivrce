import { db } from "@/lib/db";
import type { EntityType, FactConfidence, DataSourceKind, SourceReliability } from "@/generated/prisma/enums";
import type { ProvenanceFact, IngestionResult } from "./types";
import { recordFacts } from "./provenance";
import { markFetchSuccess, markFetchError, registerSource } from "./source-registry";

export interface IngestionSource {
  slug: string;
  name: string;
  kind: DataSourceKind;
  reliability: SourceReliability;
  country: string;
  url?: string;
}

export interface IngestionHandler {
  fetch(): Promise<RawRecord[]>;
  parse(raw: RawRecord): ParsedRecord[];
}

export interface RawRecord {
  externalId?: string;
  url?: string;
  data: Record<string, unknown>;
  fetchedAt: Date;
}

export interface ParsedRecord {
  entityType: EntityType;
  externalId?: string;
  name: string;
  facts: Record<string, string>;
  confidence: FactConfidence;
  sourceUrl?: string;
  lat?: number;
  lng?: number;
  country?: string;
  city?: string;
}

export async function runIngestion(
  source: IngestionSource,
  handler: IngestionHandler,
): Promise<IngestionResult> {
  const startTime = Date.now();
  const errors: string[] = [];
  let recordsCreated = 0;
  let recordsUpdated = 0;
  let recordsSkipped = 0;

  const ds = await registerSource(source);

  let rawRecords: RawRecord[];
  try {
    rawRecords = await handler.fetch();
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    await markFetchError(ds.id, msg);
    return {
      sourceId: ds.id,
      recordsProcessed: 0,
      recordsCreated: 0,
      recordsUpdated: 0,
      recordsSkipped: 0,
      errors: [msg],
      durationMs: Date.now() - startTime,
    };
  }

  const parsed = rawRecords.flatMap((r) => {
    try {
      return handler.parse(r);
    } catch (e) {
      errors.push(`Parse error for ${r.externalId ?? "unknown"}: ${e instanceof Error ? e.message : String(e)}`);
      return [];
    }
  });

  for (const record of parsed) {
    try {
      const existingAliases = await db.entityAlias.findMany({
        where: { entityType: record.entityType, alias: record.name },
        take: 1,
      });

      const entityId = existingAliases[0]?.entityId;

      if (entityId) {
        recordsUpdated++;
      } else {
        const id = `cuid_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
        await db.entityAlias.create({
          data: {
            entityType: record.entityType,
            entityId: id,
            alias: record.name,
            isCanonical: true,
          },
        });
        recordsCreated++;
      }

      const facts: ProvenanceFact[] = Object.entries(record.facts).map(([key, value]) => ({
        entityType: record.entityType,
        entityId: entityId ?? `new_${recordsCreated}`,
        factKey: key,
        factValue: value,
        sourceId: ds.id,
        sourceUrl: record.sourceUrl,
        fetchedAt: new Date(),
        confidence: record.confidence,
      }));

      await recordFacts(facts);
    } catch (e) {
      recordsSkipped++;
      errors.push(`Store error: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  await markFetchSuccess(ds.id, parsed.length);

  return {
    sourceId: ds.id,
    recordsProcessed: rawRecords.length,
    recordsCreated,
    recordsUpdated,
    recordsSkipped,
    errors,
    durationMs: Date.now() - startTime,
  };
}
