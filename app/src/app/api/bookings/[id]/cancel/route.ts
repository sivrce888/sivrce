/**
 * Guest cancellation — POST /api/bookings/[id]/cancel { token? }.
 * Two ownership proofs, either suffices: the HMAC cancel token handed back at
 * create time (anonymous guests), or a session whose user id is the guestId.
 * Paid bookings are refused by transitionStayBooking — refunds are a flow we
 * do not have yet, and guessing at one would lose someone's money.
 */

import { type NextRequest, NextResponse } from "next/server"

import { auth } from "@/auth"
import { db } from "@/lib/db"
import { BookingStatus } from "@/generated/prisma/enums"
import { checkRateLimit } from "@/lib/inquiries/rate-limit"
import { isSameOrigin } from "@/lib/security/origin"
import { transitionStayBooking } from "@/lib/stay-create"
import { verifyStayCancelToken } from "@/lib/stay-token"

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  if (!isSameOrigin(req)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown"
  if (!checkRateLimit(`stay-cancel:${ip}`).ok) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 })
  }
  const { id } = await ctx.params
  if (!/^[0-9a-f-]{10,64}$/i.test(id)) {
    return NextResponse.json({ error: "bad_id" }, { status: 400 })
  }
  try {
    const booking = await db.dailyRentalBooking.findUnique({
      where: { id },
      select: { guestId: true, status: true },
    })
    if (!booking) return NextResponse.json({ error: "not_found" }, { status: 404 })
    if (booking.status === "cancelled_by_guest" || booking.status === "cancelled_by_host") {
      return NextResponse.json({ error: "already_cancelled" }, { status: 409 })
    }
    let token: unknown
    try {
      token = (await req.json())?.token
    } catch {
      token = undefined
    }
    const session = await auth()
    const owns = verifyStayCancelToken(id, token) || (session?.user?.id && session.user.id === booking.guestId)
    if (!owns) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    await db.$transaction((tx) =>
      transitionStayBooking(tx, id, BookingStatus.cancelled_by_guest, { cancelReason: "guest" }),
    )
    return NextResponse.json({ ok: true })
  } catch (err) {
    const msg = (err as Error).message
    if (msg.includes("cannot be moved")) return NextResponse.json({ error: "not_cancellable" }, { status: 409 })
    if (msg.includes("Paid bookings")) return NextResponse.json({ error: "paid_not_cancellable" }, { status: 409 })
    console.error("Stay cancel error:", msg)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
