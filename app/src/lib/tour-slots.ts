/**
 * Tour slot mutual exclusion — pure helpers, no DB.
 * The booking POST serializes same-slot creates with a Postgres
 * transaction-scoped advisory lock derived here; the clash re-check inside
 * the lock stays as defense-in-depth.
 * ponytail: advisory xact lock, not a unique index — no migration, no schema
 * thaw; lock dies with the transaction so the max:1 pool can never leak it.
 * Upgrade → partial unique index when schema thaws.
 */

/** Lock partition — must mirror the clash where-clause (agent vs owner-hosted). */
export function tourSlotScope(agentId: string | null, listingId: string): string {
  return agentId ? `agent:${agentId}` : `owner:${listingId}`
}

/** FNV-1a 32-bit — deterministic, dependency-free, fits pg int4 via |0. */
function fnv1a(str: string, seed: number): number {
  let h = seed >>> 0
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return h | 0
}

export type TourSlotLock = { key1: number; key2: number }

/** Generic deterministic advisory-lock key from opaque parts. */
export function advisoryLockKey(namespace: string, ...parts: string[]): TourSlotLock {
  const base = [namespace, ...parts].join('|')
  return { key1: fnv1a(base, 0x811c9dc5), key2: fnv1a(base, 0x01000193) }
}

/**
 * Deterministic advisory-lock key for one slot.
 * dateISO must be the UTC calendar day (YYYY-MM-DD) — same day the clash
 * query matches on tourDate; time is the validated HH:MM slot.
 */
export function tourSlotLockKey(scope: string, dateISO: string, time: string): TourSlotLock {
  return advisoryLockKey('tour-slot/v1', scope, dateISO, time)
}

/** YYYY-MM-DD of a UTC-midnight Date (what the API stores in tourDate). */
export function tourDateISO(date: Date): string {
  return date.toISOString().slice(0, 10)
}
