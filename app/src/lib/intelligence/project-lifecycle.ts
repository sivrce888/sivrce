import { db } from "@/lib/db";
import type { ProjectLifecycleStatus, FactConfidence, SourceReliability, DataChangeKind } from "@/generated/prisma/enums";
import type { ProvenanceFact } from "./types";
import { RELIABILITY_RANK, CONFIDENCE_RANK, reliabilityScore, confidenceRank } from "./provenance";

const RECENCY_THRESHOLDS = {
  very_recent: 1,    // < 1 month
  recent: 3,         // 1-3 months
  moderate: 6,       // 3-6 months
  old: 12,           // 6-12 months
  stale: 24,         // 12-24 months
  very_stale: 48,    // > 24 months
};

const STATUS_WEIGHTS: Record<ProjectLifecycleStatus, number> = {
  announced: 1,
  pre_launch: 2,
  planned: 3,
  permitted: 4,
  under_construction: 5,
  near_completion: 6,
  completed: 7,
  suspended: 0,
  cancelled: 0,
  unknown: 99,
};

interface ProjectStatusSignals {
  hasPermits: boolean;
  hasActiveConstruction: boolean;
  hasOfficialAnnouncement: boolean;
  hasRecentListingActivity: boolean;
  hasDeliveryDate: boolean;
  deliveryDateInFuture: boolean;
  lastUpdateMonthsAgo: number;
  sourceCount: number;
  freshnessClass: string;
  hasSuspensionSignal: boolean;
  hasCancellationSignal: boolean;
  hasCompletionDate: boolean;
  completionDate: Date | null;
  hasPriceData: boolean;
  activeListingCount: number;
  constructionStatusFact: string | undefined;
  statusFact: string | undefined;
  permitFact: string | undefined;
}

export async function getProjectSignals(projectId: string): Promise<ProjectStatusSignals> {
  const provenances = await db.dataProvenance.findMany({
    where: { entityType: "project", entityId: projectId, isCurrent: true },
    include: { source: { select: { reliability: true } } },
    orderBy: { fetchedAt: "desc" },
  });

  const facts = new Map(provenances.map((p) => [p.factKey, p.factValue]));

  const latestFact = provenances[0];
  const hoursSinceLatest = latestFact
    ? (Date.now() - latestFact.fetchedAt.getTime()) / 3600000
    : Infinity;

  let freshnessClass = "very_stale";
  if (hoursSinceLatest < 24) freshnessClass = "very_recent";
  else if (hoursSinceLatest < 120) freshnessClass = "recent";
  else if (hoursSinceLatest < 360) freshnessClass = "moderate";
  else if (hoursSinceLatest < 720) freshnessClass = "old";
  else if (hoursSinceLatest < 1440) freshnessClass = "stale";

  const deliveryStr = facts.get("expected_completion");
  const deliveryDate = deliveryStr ? new Date(deliveryStr) : null;
  const priceStr = facts.get("price_from");
  const priceFrom = priceStr ? Number(priceStr) : null;

  const statusFact = facts.get("status");
  const permitFact = facts.get("permit_status");
  const announcementFact = facts.get("official_announcement");

  // Detect construction activity signals
  const constructionStatusFact = facts.get("construction_status");
  const hasRecentConstructionUpdate = provenances.some(
    (p) => p.factKey === "construction_status" && new Date(p.fetchedAt).getTime() > Date.now() - 30 * 24 * 3600000
  );

  // Detect listing activity
  const listingCountStr = facts.get("listing_count");
  const activeListingCount = listingCountStr ? Number(listingCountStr) : 0;

  // Check for suspension/cancellation signals
  const suspensionFact = facts.get("suspension_reason");
  const cancellationFact = facts.get("cancellation_reason");

  // Check for completion signals
  const completionDateStr = facts.get("actual_completion");
  const completionDate = completionDateStr ? new Date(completionDateStr) : null;

  // Determine if there are active listings (not just historical)
  const hasActiveListings = activeListingCount > 0;

  // Determine if there are price updates (active market)
  const hasPriceData = priceFrom !== null;

  return {
    hasPermits: !!permitFact,
    hasActiveConstruction: 
      constructionStatusFact === "under_construction" || 
      (statusFact === "under_construction" && hasRecentConstructionUpdate),
    hasOfficialAnnouncement: !!announcementFact,
    hasRecentListingActivity: hasActiveListings,
    hasDeliveryDate: !!deliveryDate,
    deliveryDateInFuture: deliveryDate ? deliveryDate > new Date() : false,
    lastUpdateMonthsAgo: hoursSinceLatest > 0 ? hoursSinceLatest / 720 : Infinity,
    sourceCount: provenances.length,
    freshnessClass,
    hasSuspensionSignal: !!suspensionFact,
    hasCancellationSignal: !!cancellationFact,
    hasCompletionDate: !!completionDate,
    completionDate,
    hasPriceData,
    activeListingCount,
    constructionStatusFact,
    statusFact,
    permitFact,
  };
}

function weightForStatus(status: ProjectLifecycleStatus, signals: ProjectStatusSignals): number {
  // Base weight from status type
  let base = STATUS_WEIGHTS[status] || 50;

  // Adjust based on supporting signals
  if (status === "under_construction") {
    if (signals.hasActiveConstruction) base += 20;
    if (signals.deliveryDateInFuture) base += 10;
    if (signals.hasDeliveryDate) base += 5;
    if (!signals.deliveryDateInFuture) base -= 10;
  }

  if (status === "completed") {
    if (signals.hasCompletionDate) base += 30;
    if (signals.activeListingCount > 0) base += 10;
    if (signals.hasPriceData) base += 5;
  }

  if (status === "permitted") {
    if (signals.hasPermits) base += 20;
    if (signals.deliveryDateInFuture) base += 10;
  }

  if (status === "announced" || status === "pre_launch") {
    if (signals.hasOfficialAnnouncement) base += 20;
    if (signals.sourceCount < 3) base -= 10;
  }

  if (status === "suspended" || status === "cancelled") {
    if (signals.hasSuspensionSignal || signals.hasCancellationSignal) base += 30;
  }

  return Math.max(0, Math.min(100, base));
}

export function inferProjectStatus(signals: ProjectStatusSignals): ProjectLifecycleStatus {
  // 1. Check for cancelled/suspended first (highest priority signals)
  if (signals.hasSuspensionSignal) return "suspended";
  if (signals.hasCancellationSignal) return "cancelled";

  // 2. Check for completion (has actual completion date + no active construction)
  if (signals.hasCompletionDate && !signals.hasActiveConstruction) {
    // If there are active listings and price data, it's completed and still active
    if (signals.activeListingCount > 0 && signals.hasPriceData) {
      return "completed"; // completed but still listed
    }
    return "completed";
  }

  // 3. Check for near_completion (active construction + delivery date in future but close)
  if (signals.hasActiveConstruction && signals.deliveryDateInFuture) {
    // If very close to delivery (within 6 months), mark near_completion
    if (signals.lastUpdateMonthsAgo < 6 && signals.sourceCount >= 2) {
      return "near_completion";
    }
    return "under_construction";
  }

  // 4. Check for under_construction (active construction signals, no delivery date yet, or delivery far ahead)
  if (signals.hasActiveConstruction) {
    return "under_construction";
  }

  // 5. Check for permitted (has permits, no active construction yet)
  if (signals.hasPermits && !signals.hasActiveConstruction) {
    if (signals.deliveryDateInFuture) return "permitted";
    // If no delivery date but recent activity, could be under_construction
    if (signals.sourceCount >= 3 && signals.lastUpdateMonthsAgo < 12) {
      return "under_construction";
    }
    return "permitted";
  }

  // 6. Check for planned (official announcement, no permits yet, recent)
  if (signals.hasOfficialAnnouncement && !signals.hasPermits) {
    if (signals.lastUpdateMonthsAgo < 12) return "planned";
    return "announced";
  }

  // 7. Check for pre_launch (has permits but no active construction, early stage)
  if (signals.hasPermits && !signals.hasActiveConstruction && signals.sourceCount >= 2) {
    if (signals.lastUpdateMonthsAgo < 6) return "pre_launch";
    return "planned";
  }

  // 8. Check for announced (official announcement, no permits, stale data)
  if (signals.hasOfficialAnnouncement) {
    return "announced";
  }

  // 9. Check for planned (some activity, no official announcement yet)
  if (signals.sourceCount >= 2 && signals.lastUpdateMonthsAgo < 24) {
    return "planned";
  }

  // 10. Default to announced if we have any source at all
  if (signals.sourceCount >= 1) return "announced";

  // 11. Truly unknown
  return "unknown";
}

export async function updateProjectLifecycle(projectId: string) {
  const signals = await getProjectSignals(projectId);
  const status = inferProjectStatus(signals);

const confidence: FactConfidence = signals.sourceCount >= 5 ? "high_confidence" :
                        signals.sourceCount >= 3 ? "likely" :
                        "unverified";
  const now = new Date();

  // Check for existing system_inference record
  const existing = await db.dataProvenance.findFirst({
    where: {
      entityType: "project",
      entityId: projectId,
      factKey: "lifecycle_status",
      sourceId: "system_inference",
    },
  });

  // Also check for user-updated records to avoid overwriting
  const existingUser = await db.dataProvenance.findFirst({
    where: {
      entityType: "project",
      entityId: projectId,
      factKey: "lifecycle_status",
      NOT: { sourceId: "system_inference" },
    },
    orderBy: { fetchedAt: "desc" },
  });

  // Only update if no user override exists, or if the new status is more certain
  const shouldUpdate = !existingUser || 
    (confidenceRank(confidence) > (existingUser.confidence ? CONFIDENCE_RANK[existingUser.confidence] : 0));

  if (shouldUpdate && existing) {
    await db.dataProvenance.update({
      where: { id: existing.id },
      data: { factValue: status, confidence, fetchedAt: now },
    });
  } else if (shouldUpdate && !existing) {
    await db.dataProvenance.create({
      data: {
        entityType: "project",
        entityId: projectId,
        factKey: "lifecycle_status",
        factValue: status,
        sourceId: "system_inference",
        confidence,
        fetchedAt: now,
      },
    });
  } else if (!shouldUpdate && existing) {
    // Preserve user override - just update the timestamp to show it was checked
    await db.dataProvenance.update({
      where: { id: existing.id },
      data: { fetchedAt: now },
    });
  }

  return { status, signals, confidence };
}

export async function detectProjectChanges(projectId: string): Promise<{ kind: string; oldValue: string; newValue: string }[]> {
  const history = await db.dataChange.findMany({
    where: { entityType: "project", entityId: projectId },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  return history.map((h) => ({
    kind: h.changeKind,
    oldValue: h.oldValue ?? "",
    newValue: h.newValue ?? "",
  }));
}

export function calculateProjectConfidence(signals: ProjectStatusSignals): number {
  let score = 0;
  const maxPossible = 100;

  // Source count contributes (0-30 points)
  score += Math.min(30, signals.sourceCount * 6);

  // Freshness contributes (0-25 points)
  const freshnessScores: Record<string, number> = {
    very_recent: 25, recent: 20, moderate: 15, old: 10, stale: 5, very_stale: 0,
  };
  score += freshnessScores[signals.freshnessClass] || 0;

  // Signal completeness contributes (0-25 points)
  const signalCount = Object.values(signals).filter((v: unknown) => v !== undefined && v !== null && v !== false).length;
  score += Math.min(25, signalCount * 3);

  // Reliability of sources contributes (0-20 points)
  // Use source reliability from the signals' source count estimation
  const avgReliability = signals.sourceCount > 0 
    ? /* estimated from typical distribution */ 6 : 1; // fallback: ~6/10 reliability
  score += Math.min(20, avgReliability * 4);

  // Delivery date precision contributes (0-10 points)
  if (signals.hasDeliveryDate && signals.deliveryDateInFuture) {
    score += 5;
    if (signals.lastUpdateMonthsAgo < 6) score += 5;
  }

  return Math.min(maxPossible, Math.round(score));
}