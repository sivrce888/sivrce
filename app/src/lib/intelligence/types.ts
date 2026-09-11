import type {
  DataSourceKind,
  SourceReliability,
  FactConfidence,
  FreshnessState,
  EntityType,
  ProjectLifecycleStatus,
  DataChangeKind,
  ReviewQueueKind,
} from "@/generated/prisma/enums";

export type { DataSourceKind, SourceReliability, FactConfidence, FreshnessState, EntityType, ProjectLifecycleStatus, DataChangeKind, ReviewQueueKind };

export interface ProvenanceFact {
  entityType: EntityType;
  entityId: string;
  factKey: string;
  factValue: string;
  sourceId: string;
  sourceUrl?: string;
  fetchedAt: Date;
  publishedAt?: Date;
  confidence: FactConfidence;
}

export interface EntityMatchCandidate {
  entityType: EntityType;
  entityId: string;
  name: string;
  aliases: string[];
  country: string;
  city?: string;
  lat?: number;
  lng?: number;
  website?: string;
  externalId?: string;
}

export interface EntityMatchResult {
  candidate: EntityMatchCandidate;
  score: number;
  reasons: string[];
}

export interface QualityScore {
  completeness: number;
  accuracy: number;
  freshness: number;
  sourceQuality: number;
  crossSource: number;
  overall: number;
}

export interface IngestionResult {
  sourceId: string;
  recordsProcessed: number;
  recordsCreated: number;
  recordsUpdated: number;
  recordsSkipped: number;
  errors: string[];
  durationMs: number;
}

export interface ProjectStatusSignals {
  hasPermits: boolean;
  hasActiveConstruction: boolean;
  hasOfficialAnnouncement: boolean;
  hasRecentListingActivity: boolean;
  hasDeliveryDate: boolean;
  deliveryDateInFuture: boolean;
  lastUpdateMonthsAgo: number;
  sourceCount: number;
}

export const CONFIDENCE_WEIGHTS: Record<FactConfidence, number> = {
  verified: 1.0,
  high_confidence: 0.85,
  likely: 0.65,
  unverified: 0.3,
  outdated: 0.1,
  conflicting: 0.0,
};

export const SOURCE_RELIABILITY_WEIGHTS: Record<SourceReliability, number> = {
  official_government: 1.0,
  official_registry: 0.95,
  official_company: 0.9,
  established_institution: 0.8,
  reputable_media: 0.7,
  verified_company: 0.65,
  public_listing: 0.5,
  user_generated: 0.3,
  unknown: 0.1,
};
