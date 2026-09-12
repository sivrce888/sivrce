/**
 * Host availability — GET/POST/DELETE /api/listings/[id]/blocked-dates.
 * Owner-or-admin only (blocked dates reveal host schedule — never public).
 * Search + booking requests already read this table; this closes the write end.
 *
 * ponytail: bulk date arrays, not one-request-per-day — a host blocking a
 * season does it in one call. createMany skipDuplicates (unique index exists).
 */

import { type NextRequest, NextResponse } from "next/server"

import { auth } from "@/auth"
import { db } from "@/lib/db"
import { checkRateLimit } from "@/lib/inquiries/rate-limit"
import { canManageListing } from "@/lib/listing-access"
import { tbilisiTodayUtc } from "@/lib/bookings"
import { isSameOrigin } from "@/lib/security/origin"

export const dynamic = "force-dynamic"

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/
const MAX_BATCH = 366

async function ownedListing(id: string) {
  const listing = await db.listing.findFirst({
    where: { id, deletedAt: null },
    select: { id: true, ownerId: true, dealType: true },
  })
  if (!listing || listing.dealType !== "daily") return null
  return listing
}

function parseDates(input: unknown): string[] | null {
  if (!Array.isArray(input) || input.length === 0 || input.length > MAX_BATCH) return null
  const out = [...new Set(input)]
  if (!out.every((d): d is string => typeof d === "string" && DATE_RE.test(d))) return null
  const today = tbilisiTodayUtc()
  if (!out.every((d) => new Date(`${d}T00:00:00Z`).getTime() >= today)) return null
  return out.sort()
}

async function gate(req: NextRequest, id: string) {
  if (!isSameOrigin(req)) return { error: "Forbidden", status: 403 } as const
  const session = await auth()
  if (!session?.user?.id) return { error: "Unauthorized", status: 401 } as const
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown"
  if (!checkRateLimit(`blocked-dates:${ip}`).ok) {
    return { error: "rate_limited", status: 429 } as const
  }
  const listing = await ownedListing(id)
  if (!listing) return { error: "listing_not_bookable", status: 404 } as const
  const allowed = await canManageListing(
    { id: session.user.id, role: session.user.role ?? "" },
    listing.ownerId,
  )
  if (!allowed) return { error: "Forbidden", status: 403 } as const
  return { listing } as const
}

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params
  const g = await gate(req, id)
  if ("error" in g) return NextResponse.json({ error: g.error }, { status: g.status })
  const rows = await db.dailyRentalBlockedDate.findMany({
    where: { listingId: id, date: { gte: new Date(tbilisiTodayUtc()) } },
    select: { date: true, reason: true },
    orderBy: { date: "asc" },
    take: 500,
  })
  return NextResponse.json({
    dates: rows.map((r) => ({
      date: r.date.toISOString().slice(0, 10),
      reason: r.reason,
    })),
  })
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params
  const g = await gate(req, id)
  if ("error" in g) return NextResponse.json({ error: g.error }, { status: g.status })
  let body: { dates?: unknown; reason?: unknown }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "bad_json" }, { status: 400 })
  }
  const dates = parseDates(body.dates)
  if (!dates) return NextResponse.json({ error: "bad_dates" }, { status: 400 })
  const reason =
    typeof body.reason === "string" && body.reason.length <= 120 ? body.reason : null
  const res = await db.dailyRentalBlockedDate.createMany({
    data: dates.map((d) => ({
      listingId: id,
      date: new Date(`${d}T00:00:00Z`),
      reason,
    })),
    skipDuplicates: true,
  })
  return NextResponse.json({ blocked: res.count }, { status: 201 })
}

export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params
  const g = await gate(req, id)
  if ("error" in g) return NextResponse.json({ error: g.error }, { status: g.status })
  let body: { dates?: unknown }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "bad_json" }, { status: 400 })
  }
  const dates = parseDates(body.dates)
  if (!dates) return NextResponse.json({ error: "bad_dates" }, { status: 400 })
  const res = await db.dailyRentalBlockedDate.deleteMany({
    where: {
      listingId: id,
      date: { in: dates.map((d) => new Date(`${d}T00:00:00Z`)) },
    },
  })
  return NextResponse.json({ unblocked: res.count })
}
