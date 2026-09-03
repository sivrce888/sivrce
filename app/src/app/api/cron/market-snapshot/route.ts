import { NextResponse } from "next/server"

import { assertCronAuth } from "@/lib/cron/auth"
import { writeMonthlySnapshots } from "@/lib/market-stats"

export const dynamic = "force-dynamic"
export const maxDuration = 300

/** GET /api/cron/market-snapshot — upsert this month's per-district snapshot. */
export async function GET(req: Request) {
  const denied = assertCronAuth(req)
  if (denied) return denied
  try {
    const result = await writeMonthlySnapshots()
    return NextResponse.json({ ok: true, ...result })
  } catch (e) {
    console.error("[cron/market-snapshot]", (e as Error).message)
    return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 500 })
  }
}
