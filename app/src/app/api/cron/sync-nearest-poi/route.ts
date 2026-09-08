import { NextResponse } from "next/server"

import { assertCronAuth } from "@/lib/cron/auth"
import { db } from "@/lib/db"
import { recomputeNearestPoisBatch, seedPoisFromJson } from "@/lib/geo/nearest-poi"
import { withJobRun } from "@/lib/jobs/run"

export const dynamic = "force-dynamic"
export const maxDuration = 300

/**
 * GET /api/cron/sync-nearest-poi
 * Auto-seeds pois table when empty. ?seed=1 force re-upsert. ?all=1 recompute all.
 */
export async function GET(req: Request) {
  const denied = assertCronAuth(req)
  if (denied) return denied
  const url = new URL(req.url)
  try {
    const result = await withJobRun(
      "sync-nearest-poi",
      async () => {
        const count = await db.poi.count()
        let seeded = 0
        if (count === 0 || url.searchParams.get("seed") === "1") {
          seeded = (await seedPoisFromJson()).upserted
        }
        const r = await recomputeNearestPoisBatch({
          forceAll: url.searchParams.get("all") === "1",
          limit: Math.min(500, Number(url.searchParams.get("limit") ?? 200) || 200),
        })
        return { ...r, seeded, poiCount: count || seeded }
      },
      (r) => r.links,
    )
    return NextResponse.json({ ok: true, ...result })
  } catch (e) {
    console.error("[cron/sync-nearest-poi]", (e as Error).message)
    return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 500 })
  }
}
