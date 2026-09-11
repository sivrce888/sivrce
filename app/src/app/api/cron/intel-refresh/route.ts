import { NextResponse } from "next/server"

import { assertCronAuth } from "@/lib/cron/auth"
import { refreshTick } from "@/lib/intel/store"
import { withJobRun } from "@/lib/jobs/run"

export const dynamic = "force-dynamic"
export const maxDuration = 60

/** GET /api/cron/intel-refresh — seed sources, recompute freshness, queue stale_data. */
export async function GET(req: Request) {
  const denied = assertCronAuth(req)
  if (denied) return denied
  try {
    const result = await withJobRun("intel-refresh", refreshTick, (r) => r.checked)
    return NextResponse.json({ ok: true, ...result })
  } catch (e) {
    console.error("[cron/intel-refresh]", (e as Error).message)
    return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 500 })
  }
}
