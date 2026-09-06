import { randomUUID } from "node:crypto"

import { type NextRequest, NextResponse } from "next/server"

import { auth } from "@/auth"
import { Prisma } from "@/generated/prisma/client"
import { db } from "@/lib/db"
import { syncProfileRating } from "@/lib/reviews/aggregate"
import { listReviews, parseSort, toDto } from "@/lib/reviews/list"
import { clientIp, rateLimitOk } from "@/lib/reviews/rate-limit"
import { isSameOrigin } from "@/lib/security/origin"
import { parseReviewFields } from "@/lib/reviews/validate"

export const dynamic = "force-dynamic"

const TARGET_TYPES = new Set([
  "listing",
  "project",
  "developer",
  "agent",
  "agency",
  "neighborhood",
  "account",
  "building",
  "service",
])
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams

  // about=1 — published reviews about targets owned by the caller (dashboard).
  if (sp.get("about") === "1") {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 })
    }
    try {
      const me = session.user.id
      const [agents, agencies, developers, listings] = await Promise.all([
        db.agentProfile.findMany({ where: { ownerId: me, deletedAt: null }, select: { slug: true } }),
        db.agencyProfile.findMany({ where: { ownerId: me, deletedAt: null }, select: { slug: true } }),
        db.developerProfile.findMany({ where: { ownerId: me, deletedAt: null }, select: { slug: true } }),
        db.listing.findMany({ where: { ownerId: me, deletedAt: null }, select: { id: true }, take: 50 }),
      ])
      const or = [
        ...agents.map((a) => ({ targetType: "agent", targetId: a.slug })),
        ...agencies.map((a) => ({ targetType: "agency", targetId: a.slug })),
        ...developers.map((d) => ({ targetType: "developer", targetId: d.slug })),
        ...listings.map((l) => ({ targetType: "listing", targetId: l.id })),
      ]
      if (or.length === 0) return NextResponse.json({ reviews: [] })
      const reviews = await db.review.findMany({
        where: { OR: or, status: "published", deletedAt: null },
        orderBy: { createdAt: "desc" },
        take: 30,
      })
      return NextResponse.json({ reviews: reviews.map(toDto) })
    } catch {
      return NextResponse.json({ error: "db_unavailable" }, { status: 500 })
    }
  }

  // mine=1 — the caller's own reviews, newest first (session required).
  if (sp.get("mine") === "1") {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 })
    }
    const mineType = sp.get("targetType")
    const mineTarget = sp.get("targetId")
    try {
      if (mineType && mineTarget) {
        // The caller's own review for one target — powers form prefill/edit.
        const mine = await db.review.findFirst({
          where: {
            authorId: session.user.id,
            targetType: TARGET_TYPES.has(mineType) ? mineType : "-",
            targetId: mineTarget.slice(0, 120),
            deletedAt: null,
          },
          orderBy: { createdAt: "desc" },
        })
        return NextResponse.json({ review: mine ? toDto(mine) : null })
      }
      // ponytail: hard cap instead of pagination; revisit if a user can
      // realistically exceed 100 reviews.
      const reviews = await db.review.findMany({
        where: { authorId: session.user.id, deletedAt: null },
        orderBy: { createdAt: "desc" },
        take: 100,
      })
      return NextResponse.json({ reviews: reviews.map(toDto) })
    } catch {
      return NextResponse.json({ error: "db_unavailable" }, { status: 500 })
    }
  }

  const targetType = sp.get("targetType") ?? ""
  const targetId = sp.get("targetId") ?? ""
  if (!TARGET_TYPES.has(targetType) || !targetId) {
    return NextResponse.json({ error: "invalid_target" }, { status: 400 })
  }
  const sort = parseSort(sp.get("sort"))
  const page = Math.max(1, Number.parseInt(sp.get("page") ?? "1", 10) || 1)

  const list = await listReviews(targetType, targetId, page, sort)
  if (!list) return NextResponse.json({ error: "db_unavailable" }, { status: 500 })
  return NextResponse.json(list)
}

type CreateData = {
  targetType: string
  targetId: string
  rating: number
  title?: string
  body: string
  authorName?: string
  locale?: string
}

/** ponytail: hand-rolled validation — zod is not in the dependency set. */
function parseCreate(
  payload: unknown,
  hasSession: boolean,
): { ok: true; data: CreateData } | { ok: false; error: string } {
  if (typeof payload !== "object" || payload === null) {
    return { ok: false, error: "invalid_payload" }
  }
  const p = payload as Record<string, unknown>

  const targetType = typeof p.targetType === "string" ? p.targetType : ""
  if (!TARGET_TYPES.has(targetType)) return { ok: false, error: "invalid_target_type" }

  const targetId = typeof p.targetId === "string" ? p.targetId.trim() : ""
  if (!targetId || targetId.length > 120) return { ok: false, error: "invalid_target_id" }

  const fields = parseReviewFields(p)
  if (!fields.ok) return fields

  const authorName =
    typeof p.authorName === "string" ? p.authorName.trim() : undefined
  if (authorName !== undefined && authorName.length > 160) {
    return { ok: false, error: "invalid_author_name" }
  }
  if (!hasSession && !authorName) {
    return { ok: false, error: "author_name_required" }
  }

  const locale = typeof p.locale === "string" ? p.locale.trim() : undefined
  if (locale !== undefined && !/^[a-z]{2}(-[a-z]{2})?$/i.test(locale)) {
    return { ok: false, error: "invalid_locale" }
  }

  const data: CreateData = { targetType, targetId, ...fields.data }
  if (authorName) data.authorName = authorName
  if (locale) data.locale = locale
  return { ok: true, data }
}

export async function POST(req: NextRequest) {
  if (!isSameOrigin(req)) {
    return NextResponse.json({ error: "bad_origin" }, { status: 403 })
  }
  const ip = clientIp(req.headers)
  if (!rateLimitOk(`reviews:${ip}`)) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 })
  }

  let payload: unknown
  try {
    payload = await req.json()
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 })
  }

  const session = await auth()
  if (!session?.user?.id) {
    // Reviews are attributable UGC — anonymous posting is a review-bombing
    // vector with no accountability; shadow-ban tooling needs an authorId.
    return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  }
  const parsed = parseCreate(payload, true)
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 })
  }

  const authorName = (
    session?.user?.name?.trim() ||
    parsed.data.authorName ||
    ""
  ).slice(0, 160)
  if (!authorName) {
    return NextResponse.json({ error: "author_name_required" }, { status: 400 })
  }

  try {
    const created = await db.$transaction(async (tx) => {
      const row = await tx.review.create({
        data: {
          id: randomUUID(),
          targetType: parsed.data.targetType,
          targetId: parsed.data.targetId,
          rating: parsed.data.rating,
          title: parsed.data.title ?? null,
          body: parsed.data.body,
          authorName,
          authorId: session?.user?.id ?? null,
          locale: parsed.data.locale ?? "ka",
          status: "published",
        },
      })
      await syncProfileRating(parsed.data.targetType, parsed.data.targetId, tx)
      return row
    })
    return NextResponse.json({ ok: true, id: created.id }, { status: 201 })
  } catch (err) {
    // Unique [targetType, targetId, authorId] — one review per author per target.
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return NextResponse.json({ error: "already_reviewed" }, { status: 409 })
    }
    return NextResponse.json({ error: "db_unavailable" }, { status: 500 })
  }
}
