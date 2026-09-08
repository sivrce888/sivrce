/** Helpers & action-state types for the admin system section. */

import { db } from "@/lib/db"

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

export type SettingsFormState = ConfigFormState

export type BroadcastFormState = {
  error: string | null
  createdCount: number | null
}

/* ------------------------------ cron job health --------------------------- */

import type { JobHealth, JobHealthRow } from "@/lib/admin/job-cadence"
import { ADMIN_JOBS, jobStale } from "@/lib/admin/job-cadence"

export async function getJobHealth(now = Date.now()): Promise<JobHealth> {
  const groups = await db.jobRun.groupBy({ by: ["job"], _max: { ranAt: true } })
  const [failed48h, latestRows] = await Promise.all([
    db.jobRun.count({
      where: { ok: false, ranAt: { gte: new Date(now - 48 * 3_600_000) } },
    }),
    db.jobRun.findMany({
      // One row per job: the exact latest timestamp of each (grouped above).
      where: {
        ranAt: { in: groups.map((g) => g._max.ranAt).filter((d): d is Date => Boolean(d)) },
      },
      orderBy: { ranAt: "desc" },
    }),
  ])

  const latest = new Map<string, (typeof latestRows)[number]>()
  for (const row of latestRows) {
    if (!latest.has(row.job)) latest.set(row.job, row)
  }

  const known = new Set(ADMIN_JOBS)
  const jobs: JobHealthRow[] = [...known].map((job) => {
    const row = latest.get(job)
    return {
      job,
      tracked: latest.has(job),
      lastRanAt: row?.ranAt ?? null,
      ok: row ? row.ok : null,
      count: row?.count ?? null,
      ms: row?.ms ?? null,
      error: row?.error ?? null,
      stale: jobStale(row?.ranAt ?? null, now),
    }
  })
  for (const row of latest.values()) {
    if (!known.has(row.job as (typeof ADMIN_JOBS)[number])) {
      jobs.push({
        job: row.job,
        tracked: true,
        lastRanAt: row.ranAt,
        ok: row.ok,
        count: row.count,
        ms: row.ms,
        error: row.error,
        stale: jobStale(row.ranAt, now),
      })
    }
  }

  return { jobs, failed48h, overdue: jobs.filter((j) => j.stale).length }
}
