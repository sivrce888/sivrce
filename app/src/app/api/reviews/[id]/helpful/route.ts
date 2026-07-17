import { createHash } from "node:crypto"

import { type NextRequest, NextResponse } from "next/server"

import { Prisma } from "@/generated/prisma/client"
import { db } from "@/lib/db"
import { clientIp, rateLimitOk } from "@/lib/reviews/rate-limit"
import { isSameOrigin } from "@/lib/security/origin"

export const dynamic = "force-dynamic"

type Ctx = { params: Promise<{ id: string }> }

export async function POST(req: NextRequest, ctx: Ctx) {
  if (!isSameOrigin(req)) {
    return NextResponse.json({ error: "bad_origin" }, { status: 403 })
  }
  const { id } = await ctx.params
  const ip = clientIp(req.headers)
  if (!rateLimitOk(`helpful:${ip}`)) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 })
  }

  // Pseudonymous voter identity: one vote per IP+UA per review.
  const ua = req.headers.get("user-agent") ?? ""
  const voterKey = createHash("sha256")
    .update(`sivrce-helpful|${ip}|${ua}`)
    .digest("hex")

  try {
    const review = await db.review.findFirst({
      where: { id, status: "published", deletedAt: null },
      select: { id: true, helpfulCount: true },
    })
    if (!review) {
      return NextResponse.json({ error: "not_found" }, { status: 404 })
    }

    try {
      await db.reviewHelpfulVote.create({ data: { reviewId: id, voterKey } })
    } catch (err) {
      // Unique [reviewId, voterKey] — already voted; count stays unchanged.
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === "P2002"
      ) {
        return NextResponse.json({ helpfulCount: review.helpfulCount })
      }
      throw err
    }

    const updated = await db.review.update({
      where: { id },
      data: { helpfulCount: { increment: 1 } },
      select: { helpfulCount: true },
    })
    return NextResponse.json({ helpfulCount: updated.helpfulCount })
  } catch {
    return NextResponse.json({ error: "db_unavailable" }, { status: 500 })
  }
}
