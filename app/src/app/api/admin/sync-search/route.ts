/**
 * Admin-only endpoint to trigger full Meilisearch reindex.
 * ponytail: simple trigger. Add progress tracking for large datasets.
 */

import { NextResponse } from "next/server"
import { requireRole } from "@/lib/guards"
import { syncAllListings } from "@/lib/search"

export async function POST() {
  await requireRole("admin", "/admin")
  try {
    const result = await syncAllListings()
    return NextResponse.json(result)
  } catch (err) {
    console.error("Search sync error:", err)
    return NextResponse.json({ error: "Sync failed" }, { status: 500 })
  }
}
