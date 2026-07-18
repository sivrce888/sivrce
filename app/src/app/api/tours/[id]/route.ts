/**
 * Single-tour API — guest cancel (PATCH).
 * Only the booking user (session) can cancel, and only pending/confirmed tours.
 */

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { db } from "@/lib/db"
import { updateTourStatus } from "@/lib/tours"
import { isSameOrigin } from "@/lib/security/origin"

type Ctx = { params: Promise<{ id: string }> }

export async function PATCH(req: NextRequest, ctx: Ctx) {
  if (!isSameOrigin(req)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await req.json().catch(() => null)
  if (body?.action !== "cancel") {
    return NextResponse.json({ error: "Unsupported action" }, { status: 400 })
  }

  const { id } = await ctx.params
  const tour = await db.propertyTour.findUnique({
    where: { id },
    select: { status: true, guestId: true, userId: true },
  })
  if (!tour || (tour.guestId !== session.user.id && tour.userId !== session.user.id)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }
  if (tour.status !== "pending" && tour.status !== "confirmed") {
    return NextResponse.json({ error: "tour_not_cancellable" }, { status: 409 })
  }

  const reason = typeof body.reason === "string" ? body.reason.slice(0, 200) : undefined
  const updated = await updateTourStatus(id, "cancelled_by_guest", reason)
  return NextResponse.json({ tour: updated })
}
