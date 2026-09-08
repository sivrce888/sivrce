/** Pure checks for admin system helpers — job staleness cadence. */
import { ADMIN_JOBS, jobStale, JOB_STALE_MS } from "@/lib/admin/job-cadence"

const now = 1_000_000_000_000
const HOUR = 3_600_000

const assert = (cond: boolean, msg: string) => {
  if (!cond) {
    console.error(`FAIL: ${msg}`)
    process.exit(1)
  }
}

// Never ran → overdue.
assert(jobStale(null, now), "null lastRanAt must be stale")

// Fresh run inside cadence → healthy.
assert(!jobStale(new Date(now - 20 * HOUR), now), "20h-old run must be fresh")

// Just past cadence (26h + 1ms) → overdue.
assert(jobStale(new Date(now - JOB_STALE_MS - 1), now), "27h-old run must be stale")

// Exactly at cadence boundary → not yet stale (strict >).
assert(!jobStale(new Date(now - JOB_STALE_MS), now), "boundary run must be fresh")

// All tracked cron jobs are listed (route names in /api/cron/*).
assert(
  JSON.stringify([...ADMIN_JOBS].sort()) ===
    JSON.stringify(
      [
        "expire-listings",
        "expire-promos",
        "market-snapshot",
        "sync-nearest-poi",
        "sync-search",
      ].sort(),
    ),
  "ADMIN_JOBS must match cron routes",
)

console.log("system.check: all ok")
