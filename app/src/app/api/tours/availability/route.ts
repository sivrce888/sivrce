/**
 * Tour availability API — public GET.
 * Returns bookable "HH:MM" start times for a listing on a date, from the
 * agent's weekly TourAvailability + TourDateOverride blocks − booked slots.
 */

import { NextRequest, NextResponse } from "next/server"
import { getBookableSlots, resolveListingAgentId } from "@/lib/tours"
import { checkRateLimit } from "@/lib/inquiries/rate-limit"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown"
  if (!checkRateLimit(`tour-avail:${ip}`).ok) {
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
