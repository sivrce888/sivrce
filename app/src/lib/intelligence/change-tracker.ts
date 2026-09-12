import { db } from "@/lib/db";
import type { EntityType, DataChangeKind } from "@/generated/prisma/enums";

export async function trackChange(opts: {
  entityType: EntityType;
  entityId: string;
  changeKind: DataChangeKind;
  field?: string;
  oldValue?: string;
  newValue?: string;
  sourceId?: string;
  snapshotId?: string;
}) {
  return db.dataChange.create({
    data: {
      entityType: opts.entityType,
      entityId: opts.entityId,
      changeKind: opts.changeKind,
      field: opts.field,
      oldValue: opts.oldValue,
      newValue: opts.newValue,
      sourceId: opts.sourceId,
      snapshotId: opts.snapshotId,
    },
  });
}

export async function createSnapshot(opts: {
  entityType: EntityType;
  entityId: string;
  data: Record<string, unknown>;
  sourceId?: string;
}) {
  return db.dataSnapshot.create({
    data: {
      entityType: opts.entityType,
      entityId: opts.entityId,
      data: JSON.parse(JSON.stringify(opts.data)) as object,
      sourceId: opts.sourceId,
    },
  });
}

export async function getFieldChangeHistory(
  entityType: EntityType,
  entityId: string,
  field: string,
) {
  return db.dataChange.findMany({
    where: { entityType, entityId, field },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
}

export async function getRecentChanges(entityType?: EntityType, hours = 24) {
  const since = new Date(Date.now() - hours * 3600000);
  return db.dataChange.findMany({
    where: {
      createdAt: { gte: since },
      ...(entityType ? { entityType } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 500,
  });
}

export async function compareAndUpdate(opts: {
  entityType: EntityType;
  entityId: string;
  currentData: Record<string, unknown>;
  newData: Record<string, unknown>;
  sourceId?: string;
  trackedFields?: string[];
}) {
  const fields = opts.trackedFields ?? Object.keys(opts.newData);
  const changes: { field: string; old: string; new: string; kind: DataChangeKind }[] = [];

  for (const field of fields) {
    const oldVal = opts.currentData[field];
    const newVal = opts.newData[field];
    if (oldVal === newVal) continue;
    if (oldVal === undefined && newVal === undefined) continue;
    if (newVal === undefined) continue;

    const oldStr = String(oldVal ?? "");
    const newStr = String(newVal ?? "");
    if (oldStr === newStr) continue;

    let kind: DataChangeKind = "updated";
    if (field === "status") kind = "status_changed";
    else if (field === "price") kind = "price_changed";

    changes.push({ field, old: oldStr, new: newStr, kind });
  }

  if (changes.length === 0) return { changes: [], snapshots: [] };

  const snapshot = await createSnapshot({
    entityType: opts.entityType,
    entityId: opts.entityId,
    data: opts.currentData,
    sourceId: opts.sourceId,
  });

  const tracked = await Promise.all(
    changes.map((c) =>
      trackChange({
        entityType: opts.entityType,
        entityId: opts.entityId,
        changeKind: c.kind,
        field: c.field,
        oldValue: c.old,
        newValue: c.new,
        sourceId: opts.sourceId,
        snapshotId: snapshot.id,
      }),
    ),
  );

  return { changes: tracked, snapshots: [snapshot] };
}
