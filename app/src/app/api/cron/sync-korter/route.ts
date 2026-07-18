import { NextResponse } from "next/server"

/**
 * RETIRED — sivrce owns directory media on cdn.sivrce.ge.
 * Do not re-import from third-party aggregators.
 * One-shot historical import lived in `lib/directory/sync-korter.ts` (offline only).
 */
export const dynamic = "force-dynamic"

export async function GET() {
  return NextResponse.json(
    {
      ok: false,
      error: "retired",
      message:
        "Directory sync from external aggregators is disabled. Media lives on cdn.sivrce.ge; update projects via admin or npm run directory:localize -- --mirror-only.",
    },
    { status: 410 },
  )
}
