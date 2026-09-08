import { NextResponse } from "next/server"

import { assertCronAuth } from "@/lib/cron/auth"
import { expireListingsJob } from "@/lib/jobs/expire-and-sync"
import { withJobRun } from "@/lib/jobs/run"

export const dynamic = "force-dynamic"
export const maxDuration = 60

/** GET /api/cron/expire-listings — mark active listings past 30d as expired. */
export async function GET(req: Request) {
  const denied = assertCronAuth(req)
  if (denied) return denied
  try {
    const result = await withJobRun("expire-listings", expireListingsJob, (r) => r.expired)
    return NextResponse.json({ ok: true, ...result })
  } catch (e) {
    console.error("[cron/expire-listings]", (e as Error).message)
    return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 500 })
  }
}
