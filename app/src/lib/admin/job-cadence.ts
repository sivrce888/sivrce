/**
 * Pure cron-cadence logic — no DB import, so checks can run env-free.
 * getJobHealth() lives in lib/admin/system.ts (DB-bound).
 */

/** Cron jobs tracked in JobRun (see /api/cron/*). Daily schedules. */
export const ADMIN_JOBS = [
  "expire-listings",
  "expire-promos",
  "market-snapshot",
  "sync-search",
  "sync-nearest-poi",
] as const

/** Daily cron + 2h margin before a job counts as missed. */
export const JOB_STALE_MS = 26 * 3_600_000

/** Pure: a job is overdue when it never ran or its last run is older than the cadence. */
export function jobStale(lastRanAt: Date | null, now: number): boolean {
  if (!lastRanAt) return true
  return now - lastRanAt.getTime() > JOB_STALE_MS
}

export interface JobHealthRow {
  job: string
  tracked: boolean
  lastRanAt: Date | null
  ok: boolean | null
  count: number | null
  ms: number | null
  error: string | null
  stale: boolean
}

export interface JobHealth {
  jobs: JobHealthRow[]
  /** Failures in the last 48h. */
  failed48h: number
  /** Tracked jobs with no run inside the cadence window. */
  overdue: number
}
