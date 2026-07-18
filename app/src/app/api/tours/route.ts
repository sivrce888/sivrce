/**
 * Tour booking API — public POST + user GET.
 * ponytail: inline validation, no zod. Add proper validation lib when forms grow complex.
 */

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { getBookableSlots, getToursByUser, resolveListingAgentId } from "@/lib/tours"
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
    if (typeof tourTime !== "string" || !/^([01]\d|2[0-3]):[0-5]\d$/.test(tourTime)) {
      return NextResponse.json({ error: "Invalid tour time" }, { status: 400 })
    }
    const parsedDate = new Date(`${tourDate}T00:00:00Z`)
    if (typeof tourDate !== "string" || Number.isNaN(parsedDate.getTime())) {
      return NextResponse.json({ error: "Invalid tour date" }, { status: 400 })
    }
    const today = tbilisiToday()
    if (parsedDate.getTime() < today) {
      return NextResponse.json({ error: "Tour date is in the past" }, { status: 400 })
    }

    // NULL agent = owner-hosted tour (private seller), shown in /seller/tours
    const resolved = await resolveListingAgentId(listingId)
    if (!resolved) {
      return NextResponse.json({ error: "Listing not found" }, { status: 404 })
    }
    const { agentId } = resolved

    // The requested slot must come from real availability (same source the picker shows).
    const slots = await getBookableSlots(listingId, agentId, parsedDate)
    if (!slots.includes(tourTime)) {
      return NextResponse.json({ error: "slot_unavailable" }, { status: 409 })
    }

    const session = await auth()

    // ponytail: schema has no unique constraint on (agent, date, time) — enforce here in a
    // transaction. Upgrade path: partial unique index via raw migration when schema thaws.
    const tour = await db.$transaction(async (tx) => {
      const clash = await tx.propertyTour.findFirst({
        where: {
          tourDate: parsedDate,
          tourTime,
          status: { in: ["pending", "confirmed"] },
          ...(agentId ? { agentId } : { listingId }),
        },
        select: { id: true },
      })
      if (clash) return null
      return tx.propertyTour.create({
        data: {
          listingId,
          agentId,
          guestId: session?.user?.id ?? guestPhone,
          userId: session?.user?.id ?? null,
          tourDate: parsedDate,
          tourTime,
          guestName,
          guestPhone,
          guestEmail: guestEmail ?? null,
          guestNotes: guestNotes ?? null,
        },
      })
    })
    if (!tour) {
      return NextResponse.json({ error: "slot_unavailable" }, { status: 409 })
    }

    return NextResponse.json({ tour }, { status: 201 })
  } catch (err) {
    console.error("Tour booking error:", (err as Error).message)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

/** UTC-midnight timestamp of "today" on the Tbilisi (UTC+4) clock. */
function tbilisiToday(): number {
  const shifted = new Date(Date.now() + 4 * 3600_000)
  return Date.UTC(shifted.getUTCFullYear(), shifted.getUTCMonth(), shifted.getUTCDate())
}
