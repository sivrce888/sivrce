import { NextResponse } from "next/server"

import { assertCronAuth } from "@/lib/cron/auth"
import { expirePromosJob } from "@/lib/jobs/expire-and-sync"

export const dynamic = "force-dynamic"
export const maxDuration = 60

/** GET /api/cron/expire-promos — downgrade listings with expired tierExpiresAt. */
export async function GET(req: Request) {
  const denied = assertCronAuth(req)
  if (denied) return denied
  try {
    const result = await expirePromosJob()
    return NextResponse.json({ ok: true, ...result })
  } catch (e) {
    console.error("[cron/expire-promos]", (e as Error).message)
    return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 500 })
  }
}
