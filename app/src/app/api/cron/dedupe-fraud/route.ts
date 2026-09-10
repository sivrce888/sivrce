import { NextResponse } from "next/server"

import { assertCronAuth } from "@/lib/cron/auth"
import { dedupeFraudJob } from "@/lib/jobs/dedupe-fraud"
import { withJobRun } from "@/lib/jobs/run"

export const dynamic = "force-dynamic"
export const maxDuration = 300

/** GET /api/cron/dedupe-fraud — duplicate clusters + fraud signals sweep. */
export async function GET(req: Request) {
  const denied = assertCronAuth(req)
  if (denied) return denied
  try {
    const result = await withJobRun("dedupe-fraud", dedupeFraudJob, (r) => r.clusters)
    return NextResponse.json({ ok: true, ...result })
  } catch (e) {
    console.error("[cron/dedupe-fraud]", (e as Error).message)
    return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 500 })
  }
}
