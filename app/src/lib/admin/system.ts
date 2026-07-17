/** Helpers & action-state types for the admin system section. */

export const CONFIG_KEY_RE = /^[A-Za-z0-9_.:-]{1,64}$/

export const NOTIFICATION_KIND_RE = /^[a-z0-9_]{1,40}$/

export const BROADCAST_BATCH_SIZE = 500

/** Pretty-print a JSON column for editing. */
export function prettyJson(value: unknown): string {
  try {
    return JSON.stringify(value, null, 2) ?? ""
  } catch {
    return ""
  }
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v)
}

/**
 * Top-level keys whose serialized value differs between two JSON documents.
 * Non-object documents report as ["(root)"] when they differ at all.
 */
export function changedJsonKeys(before: unknown, after: unknown): string[] {
  const b = isRecord(before) ? before : null
  const a = isRecord(after) ? after : null
  if (!b || !a) {
    return JSON.stringify(before ?? null) === JSON.stringify(after ?? null)
      ? []
      : ["(root)"]
  }
  const keys = new Set([...Object.keys(b), ...Object.keys(a)])
  return [...keys].filter((k) => JSON.stringify(b[k]) !== JSON.stringify(a[k]))
}

export type ConfigFormState = { error: string | null; saved: boolean }

export type BroadcastFormState = {
  error: string | null
  createdCount: number | null
}
