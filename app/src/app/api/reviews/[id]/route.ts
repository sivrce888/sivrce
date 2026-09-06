import { type NextRequest, NextResponse } from "next/server"

import { auth } from "@/auth"
import { db } from "@/lib/db"
import { syncProfileRating } from "@/lib/reviews/aggregate"
import { clientIp, rateLimitOk } from "@/lib/reviews/rate-limit"
import { isSameOrigin } from "@/lib/security/origin"
import { parseReviewFields } from "@/lib/reviews/validate"

export const dynamic = "force-dynamic"

type Ctx = { params: Promise<{ id: string }> }

/** Loads an editable review or null when it doesn't exist (or is deleted). */
async function liveReview(id: string) {
  return db.review.findFirst({ where: { id, deletedAt: null } })
}

/** Author-only update: rating/title/body in place, aggregates re-synced. */
export async function PUT(req: NextRequest, ctx: Ctx) {
  if (!isSameOrigin(req)) {
    return NextResponse.json({ error: "bad_origin" }, { status: 403 })
  }
  const ip = clientIp(req.headers)
  if (!rateLimitOk(`reviews:${ip}`)) {
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
  const fields = parseReviewFields(payload)
  if (!fields.ok) {
    return NextResponse.json({ error: fields.error }, { status: 400 })
  }

  const { id } = await ctx.params
  try {
    const review = await liveReview(id)
    if (!review) return NextResponse.json({ error: "not_found" }, { status: 404 })
    if (review.authorId !== session.user.id) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 })
    }
    const updated = await db.$transaction(async (tx) => {
      const row = await tx.review.update({
        where: { id },
        data: {
          rating: fields.data.rating,
          body: fields.data.body,
          title: fields.data.title ?? null,
        },
      })
      await syncProfileRating(row.targetType, row.targetId, tx)
      return row
    })
    return NextResponse.json({ ok: true, rating: updated.rating })
  } catch {
    return NextResponse.json({ error: "db_unavailable" }, { status: 500 })
  }
}

/** Author-only soft delete — mirrors the admin path, aggregates re-synced. */
export async function DELETE(req: NextRequest, ctx: Ctx) {
  if (!isSameOrigin(req)) {
    return NextResponse.json({ error: "bad_origin" }, { status: 403 })
  }
  const ip = clientIp(req.headers)
  if (!rateLimitOk(`reviews:${ip}`)) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 })
  }
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  }

  const { id } = await ctx.params
  try {
    const review = await liveReview(id)
    if (!review) return NextResponse.json({ error: "not_found" }, { status: 404 })
    if (review.authorId !== session.user.id) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 })
    }
    await db.$transaction(async (tx) => {
      await tx.review.update({ where: { id }, data: { deletedAt: new Date() } })
      await syncProfileRating(review.targetType, review.targetId, tx)
    })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: "db_unavailable" }, { status: 500 })
  }
}
