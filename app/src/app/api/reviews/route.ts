import { randomUUID } from "node:crypto"

import { type NextRequest, NextResponse } from "next/server"

import { auth } from "@/auth"
import { db } from "@/lib/db"
import { clientIp, rateLimitOk } from "@/lib/reviews/rate-limit"
import { isSameOrigin } from "@/lib/security/origin"
import type { Review } from "@/generated/prisma/client"

export const dynamic = "force-dynamic"

const TARGET_TYPES = new Set([
  "listing",
  "project",
  "developer",
  "agent",
  "neighborhood",
  "account",
])
const SORTS = new Set(["newest", "highest", "helpful"])
const PAGE_SIZE = 10

/** Public wire shape per the fixed API contract. */
function toDto(r: Review) {
  return {
    id: r.id,
    authorName: r.authorName,
    rating: r.rating,
    ...(r.title != null ? { title: r.title } : {}),
    body: r.body,
    verified: r.verified,
    helpfulCount: r.helpfulCount,
    ...(r.ownerReply != null ? { ownerReply: r.ownerReply } : {}),
    createdAt: r.createdAt.toISOString(),
  }
}

const PUBLISHED = { status: "published", deletedAt: null } as const

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams

  // mine=1 — the caller's own reviews, newest first (session required).
  if (sp.get("mine") === "1") {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 })
    }
    try {
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
  const sortParam = sp.get("sort") ?? "newest"
  const sort = SORTS.has(sortParam) ? sortParam : "newest"
  const page = Math.max(1, Number.parseInt(sp.get("page") ?? "1", 10) || 1)

  const where = { targetType, targetId, ...PUBLISHED }
  const orderBy =
    sort === "highest"
      ? [{ rating: "desc" as const }, { createdAt: "desc" as const }]
      : sort === "helpful"
        ? [{ helpfulCount: "desc" as const }, { createdAt: "desc" as const }]
        : [{ createdAt: "desc" as const }]

  try {
    const [agg, dist, rows] = await Promise.all([
      db.review.aggregate({
        where,
        _avg: { rating: true },
        _count: { _all: true },
      }),
      db.review.groupBy({ by: ["rating"], where, _count: { _all: true } }),
      db.review.findMany({
        where,
        orderBy,
        skip: (page - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
      }),
    ])
    const count = agg._count?._all ?? 0
    const average = agg._avg?.rating
    const distribution: Record<string, number> = {
      "1": 0,
      "2": 0,
      "3": 0,
      "4": 0,
      "5": 0,
    }
    for (const row of dist) {
      distribution[String(row.rating)] = row._count?._all ?? 0
    }
    return NextResponse.json({
      average: average == null ? null : Math.round(average * 10) / 10,
      count,
      distribution,
      reviews: rows.map(toDto),
      page,
      pages: Math.ceil(count / PAGE_SIZE),
    })
  } catch {
    return NextResponse.json({ error: "db_unavailable" }, { status: 500 })
  }
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

  const rating = typeof p.rating === "number" ? p.rating : NaN
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return { ok: false, error: "invalid_rating" }
  }

  const body = typeof p.body === "string" ? p.body.trim() : ""
  if (body.length < 10 || body.length > 2000) {
    return { ok: false, error: "invalid_body" }
  }

  const title = typeof p.title === "string" ? p.title.trim() : undefined
  if (title !== undefined && title.length > 200) {
    return { ok: false, error: "invalid_title" }
  }

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

  const data: CreateData = { targetType, targetId, rating, body }
  if (title) data.title = title
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
  const parsed = parseCreate(payload, Boolean(session?.user?.id))
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
    const created = await db.review.create({
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
    return NextResponse.json({ ok: true, id: created.id }, { status: 201 })
  } catch {
    return NextResponse.json({ error: "db_unavailable" }, { status: 500 })
  }
}
