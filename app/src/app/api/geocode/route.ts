/**
 * GET /api/geocode?q=… — forward
 * GET /api/geocode?suggest=1&q=…&city= — autocomplete (≤5)
 * GET /api/geocode?lat=&lng= — reverse
 * GET /api/geocode?street=&houseNo=&city=&district= — structured listing address
 */

import { type NextRequest, NextResponse } from "next/server"
import { cdnJson } from "@/lib/cdn-cache"
import { getConfig } from "@/lib/config"
import {
  geocodeAddress,
  geocodeListingAddress,
  reverseGeocode,
  suggestAddresses,
} from "@/lib/map/geocode"
import { isSameOrigin } from "@/lib/security/origin"

export const maxDuration = 8
export const preferredRegion = "fra1"

export async function GET(req: NextRequest) {
  if (!(await getConfig("map.geocodeEnabled"))) {
    return NextResponse.json({ ok: false, error: "geocode_disabled" }, { status: 503 })
  }
  if (!isSameOrigin(req) && process.env.NODE_ENV === "production") {
    return NextResponse.json({ ok: false, error: "bad_origin" }, { status: 403 })
  }

  const sp = req.nextUrl.searchParams
  // ponytail: Number(null)===0 — missing lat/lng must not enter reverse.
  const latRaw = sp.get("lat")
  const lngRaw = sp.get("lng")
  if (latRaw != null && latRaw !== "" && lngRaw != null && lngRaw !== "") {
    const lat = Number(latRaw)
    const lng = Number(lngRaw)
    if (Number.isFinite(lat) && Number.isFinite(lng)) {
      const hit = await reverseGeocode(lat, lng)
      if (!hit) return cdnJson({ ok: false, error: "not_found" }, 300, 404)
      return cdnJson({ ok: true, ...hit })
    }
  }

  if (sp.get("suggest") === "1") {
    const q = sp.get("q")?.trim() ?? ""
    const city = sp.get("city")?.trim() ?? undefined
    if (q.length < 2) {
      return cdnJson({ ok: true, hits: [] })
    }
    const hits = await suggestAddresses(q, city)
    return cdnJson({ ok: true, hits })
  }

  const street = sp.get("street")?.trim() ?? ""
  const houseNo = sp.get("houseNo")?.trim() ?? ""
  const city = sp.get("city")?.trim() ?? ""
  const district = sp.get("district")?.trim() ?? ""
  if (street || (city && houseNo)) {
    const hit = await geocodeListingAddress({ street, houseNo, city, district })
    if (!hit) return cdnJson({ ok: false, error: "not_found" }, 300, 404)
    return cdnJson({ ok: true, ...hit })
  }

  const q = sp.get("q")?.trim() ?? ""
  if (q.length < 3) {
    return NextResponse.json({ ok: false, error: "short_query" }, { status: 400 })
  }
  const hit = await geocodeAddress(q)
  if (!hit) return cdnJson({ ok: false, error: "not_found" }, 300, 404)
  return cdnJson({ ok: true, ...hit })
}
