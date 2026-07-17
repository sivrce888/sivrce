/**
 * Tour booking API — public POST + user GET.
 * ponytail: inline validation, no zod. Add proper validation lib when forms grow complex.
 */

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { createTour, getToursByUser } from "@/lib/tours"
import { db } from "@/lib/db"
import { checkRateLimit } from "@/lib/inquiries/rate-limit"
import { isSameOrigin } from "@/lib/security/origin"

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const tours = await getToursByUser(session.user.id)
  return NextResponse.json({ tours })
}

export async function POST(req: NextRequest) {
  if (!isSameOrigin(req)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown"
  if (!checkRateLimit(`tours:${ip}`).ok) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 })
  }

  try {
    const body = await req.json()
    const { listingId, tourDate, tourTime, guestName, guestPhone, guestEmail, guestNotes } = body

    // Validation
    if (!listingId || !tourDate || !tourTime || !guestName || !guestPhone) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }
    if (!/^\+?\d{7,15}$/.test(guestPhone)) {
      return NextResponse.json({ error: "Invalid phone number" }, { status: 400 })
    }
    if (guestEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guestEmail)) {
      return NextResponse.json({ error: "Invalid email" }, { status: 400 })
    }
    const parsedDate = new Date(tourDate)
    if (typeof tourDate !== "string" || Number.isNaN(parsedDate.getTime())) {
      return NextResponse.json({ error: "Invalid tour date" }, { status: 400 })
    }

    // Get listing to find agent
    const listing = await db.listing.findUnique({
      where: { id: listingId },
      select: { agent: true, ownerId: true, title: true },
    })
    if (!listing) {
      return NextResponse.json({ error: "Listing not found" }, { status: 404 })
    }

    const agentData = listing.agent as { id?: string; name?: string } | null
    const agentId = agentData?.id

    // Find agent profile by name if no direct id link
    let resolvedAgentId = agentId
    if (!resolvedAgentId && agentData?.name) {
      const profile = await db.agentProfile.findFirst({
        where: { name: agentData.name },
        select: { id: true },
      })
      resolvedAgentId = profile?.id
    }

    const session = await auth()
    const tour = await createTour({
      listingId,
      agentId: resolvedAgentId ?? listing.ownerId ?? "unknown",
      guestId: session?.user?.id,
      tourDate: parsedDate,
      tourTime,
      guestName,
      guestPhone,
      guestEmail: guestEmail ?? undefined,
      guestNotes: guestNotes ?? undefined,
    })

    return NextResponse.json({ tour }, { status: 201 })
  } catch (err) {
    console.error("Tour booking error:", (err as Error).message)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
