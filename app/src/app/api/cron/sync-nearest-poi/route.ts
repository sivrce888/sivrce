import { NextResponse } from "next/server"

import { assertCronAuth } from "@/lib/cron/auth"
import { db } from "@/lib/db"
import { recomputeNearestPoisBatch, seedPoisFromJson, seedWorldMetroPois } from "@/lib/geo/nearest-poi"
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
        // World stations ride along: PostGIS recompute below then links every
        // listing on earth with true geodesic distance — no query changes.
        const world =
          await db.$queryRaw<{ n: number }[]>`SELECT COUNT(*)::int AS n FROM pois WHERE metadata->>'source' = 'osm-world'`
        let worldSeeded = 0
        if (world[0]?.n === 0 || url.searchParams.get("seed") === "1") {
          worldSeeded = (await seedWorldMetroPois()).upserted
        }
        const r = await recomputeNearestPoisBatch({
          forceAll: url.searchParams.get("all") === "1",
          limit: Math.min(500, Number(url.searchParams.get("limit") ?? 200) || 200),
        })
        return { ...r, seeded, worldSeeded, poiCount: count || seeded }
      },
      (r) => r.links,
    )
    return NextResponse.json({ ok: true, ...result })
  } catch (e) {
    console.error("[cron/sync-nearest-poi]", (e as Error).message)
    return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 500 })
  }
}
