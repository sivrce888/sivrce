import { NextResponse } from "next/server"

import { assertCronAuth } from "@/lib/cron/auth"
import { syncSearchIndexJob } from "@/lib/jobs/expire-and-sync"

export const dynamic = "force-dynamic"
export const maxDuration = 300

/** GET /api/cron/sync-search — nightly Meilisearch backstop. */
export async function GET(req: Request) {
  const denied = assertCronAuth(req)
  if (denied) return denied
  try {
    const result = await syncSearchIndexJob()
    if (!result.ok) {
      return NextResponse.json(result, { status: 500 })
    }
    return NextResponse.json(result)
  } catch (e) {
    console.error("[cron/sync-search]", (e as Error).message)
    return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 500 })
  }
}
