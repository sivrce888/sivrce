/**
 * GET /api/geocode?q=… — Georgia-scoped address → lat/lng (Nominatim).
 * Same-origin only. Used by add-listing preview + publish fallback.
 */

import { type NextRequest, NextResponse } from "next/server"
import { geocodeAddress } from "@/lib/map/geocode"
import { isSameOrigin } from "@/lib/security/origin"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  if (!isSameOrigin(req) && process.env.NODE_ENV === "production") {
    return NextResponse.json({ ok: false, error: "bad_origin" }, { status: 403 })
  }
  const q = req.nextUrl.searchParams.get("q")?.trim() ?? ""
  if (q.length < 3) {
    return NextResponse.json({ ok: false, error: "short_query" }, { status: 400 })
  }
  const hit = await geocodeAddress(q)
  if (!hit) {
    return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 })
  }
  return NextResponse.json({ ok: true, ...hit })
}
