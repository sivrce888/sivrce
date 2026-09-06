import { type NextRequest, NextResponse } from "next/server"

import { auth } from "@/auth"
import { db } from "@/lib/db"
import { getTargetOwnerId } from "@/lib/reviews/owner"
import { clientIp, rateLimitOk } from "@/lib/reviews/rate-limit"
import { isSameOrigin } from "@/lib/security/origin"

export const dynamic = "force-dynamic"

type Ctx = { params: Promise<{ id: string }> }

/** Owner reply to a review about the caller's own profile/listing. */
export async function POST(req: NextRequest, ctx: Ctx) {
  if (!isSameOrigin(req)) {
    return NextResponse.json({ error: "bad_origin" }, { status: 403 })
  }
  const ip = clientIp(req.headers)
  if (!rateLimitOk(`reply:${ip}`)) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 })
  }
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  }

  let payload: unknown
  try {
    payload = await req.json()
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 })
  }
  const body =
    typeof payload === "object" && payload !== null
      ? (payload as Record<string, unknown>).body
      : null
  if (typeof body !== "string" || body.trim().length < 2 || body.trim().length > 1000) {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 })
  }

  const { id } = await ctx.params
  try {
    const review = await db.review.findFirst({
      where: { id, status: "published", deletedAt: null },
      select: { targetType: true, targetId: true },
    })
    if (!review) return NextResponse.json({ error: "not_found" }, { status: 404 })

    const ownerId = await getTargetOwnerId(review.targetType, review.targetId)
    if (!ownerId || ownerId !== session.user.id) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 })
    }

    await db.review.update({
      where: { id },
      data: { ownerReply: body.trim(), ownerReplyAt: new Date() },
    })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: "db_unavailable" }, { status: 500 })
  }
}
