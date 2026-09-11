import { NextResponse } from "next/server"

import { getCoverage } from "@/lib/intel/store"

export const revalidate = 3600

/**
 * GET /api/intel/coverage — measured dataset coverage (no claims of
 * completeness: every number is computed from live tables). Aggregate
 * stats only: no PII, no auth required. Cached 1h at the edge.
 */
export async function GET() {
  try {
    const c = await getCoverage()
    return NextResponse.json({ ok: true, ...c })
  } catch (e) {
    return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 500 })
  }
}
