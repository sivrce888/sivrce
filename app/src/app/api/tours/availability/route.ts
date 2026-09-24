/**
 * Tour availability API — public GET.
 * Returns bookable "HH:MM" start times for a listing on a date, from the
 * agent's weekly TourAvailability + TourDateOverride blocks − booked slots.
 */

import { NextRequest, NextResponse } from "next/server"
import { getBookableSlots, resolveListingAgentId } from "@/lib/tours"
import { clientIp, rateLimit } from "@/lib/rate-limit"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  // Read budget, not the 10/10min write default: the date input fires per edit,
  // and Georgian mobile carriers put many users behind one CGNAT IP.
  if (!rateLimit(`tour-avail:${clientIp(req.headers)}`, { max: 120 }).ok) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 })
  }

  const listingId = req.nextUrl.searchParams.get("listingId") ?? ""
  const dateParam = req.nextUrl.searchParams.get("date") ?? ""
  const date = new Date(`${dateParam}T00:00:00Z`)
  if (!listingId || !dateParam || Number.isNaN(date.getTime())) {
    return NextResponse.json({ error: "Missing or invalid listingId/date" }, { status: 400 })
  }

  const resolved = await resolveListingAgentId(listingId)
  if (!resolved) {
    return NextResponse.json({ error: "Listing not found" }, { status: 404 })
  }

  const slots = await getBookableSlots(listingId, resolved.agentId, date)
  return NextResponse.json({ slots })
}
