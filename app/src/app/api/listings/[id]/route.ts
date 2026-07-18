/**
 * POST/PATCH/DELETE /api/listings/[id] — owner manage: edit fields, status, soft-delete.
 * Auth + same-origin. Floor attribution kept in sync with admin actions.
 */

import { type NextRequest, NextResponse } from "next/server"

import { auth } from "@/auth"
import { ListingStatus } from "@/generated/prisma/client"
import { db } from "@/lib/db"
import { attributeListing, unattributeListing } from "@/lib/map/attribution"
import { reindexListingById } from "@/lib/payments"
import { deleteListing as unindexListing } from "@/lib/search"
import { isSameOrigin } from "@/lib/security/origin"

export const dynamic = "force-dynamic"

const OWNER_STATUSES = new Set<ListingStatus>([
  ListingStatus.active,
  ListingStatus.withdrawn,
  ListingStatus.sold,
  ListingStatus.pending,
])

async function loadOwned(id: string, userId: string, role: string | undefined) {
  const listing = await db.listing.findFirst({
    where: { id, deletedAt: null },
    select: {
      id: true,
      ownerId: true,
      status: true,
      title: true,
      price: true,
      description: true,
    },
  })
  if (!listing) return null
  if (listing.ownerId !== userId && role !== "admin") return "forbidden" as const
  return listing
}

export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  if (!isSameOrigin(req)) {
    return NextResponse.json({ ok: false, error: "bad_origin" }, { status: 403 })
  }
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 })
  }

  const { id } = await ctx.params
  if (!id || id.length > 120) {
    return NextResponse.json({ ok: false, error: "bad_id" }, { status: 400 })
  }

  const owned = await loadOwned(id, session.user.id, session.user.role)
  if (owned === null) return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 })
  if (owned === "forbidden") {
    return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 })
  }

  let body: Record<string, unknown>
  try {
    body = (await req.json()) as Record<string, unknown>
  } catch {
    return NextResponse.json({ ok: false, error: "bad_json" }, { status: 400 })
  }

  const data: {
    status?: ListingStatus
    title?: string
    price?: number
    description?: string
    soldAt?: Date | null
  } = {}

  if (typeof body.status === "string") {
    if (!OWNER_STATUSES.has(body.status as ListingStatus)) {
      return NextResponse.json({ ok: false, error: "bad_status" }, { status: 400 })
    }
    data.status = body.status as ListingStatus
    if (data.status === ListingStatus.sold) data.soldAt = new Date()
    else if (owned.status === ListingStatus.sold) data.soldAt = null
  }

  if (typeof body.title === "string") {
    const t = body.title.trim()
    if (t.length < 3 || t.length > 180) {
      return NextResponse.json({ ok: false, error: "bad_title" }, { status: 400 })
    }
    data.title = t
  }

  if (typeof body.price === "number") {
    if (!Number.isInteger(body.price) || body.price < 0 || body.price > 1_000_000_000) {
      return NextResponse.json({ ok: false, error: "bad_price" }, { status: 400 })
    }
    data.price = body.price
  }

  if (typeof body.description === "string") {
    const d = body.description.trim()
    if (d.length > 20_000) {
      return NextResponse.json({ ok: false, error: "bad_description" }, { status: 400 })
    }
    data.description = d
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ ok: false, error: "empty" }, { status: 400 })
  }

  const beforeStatus = owned.status
  await db.listing.update({ where: { id }, data })

  if (data.status && data.status !== beforeStatus) {
    if (beforeStatus === "active" && data.status !== "active") await unattributeListing(id)
    else if (beforeStatus !== "active" && data.status === "active") await attributeListing(id)
  }

  // Search must drop withdrawn/sold/edited-inactive; reindex when still/again active.
  void reindexListingById(id)

  return NextResponse.json({
    ok: true,
    id,
    status: data.status,
    title: data.title,
    price: data.price,
    description: data.description,
  })
}

export async function DELETE(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  if (!isSameOrigin(req)) {
    return NextResponse.json({ ok: false, error: "bad_origin" }, { status: 403 })
  }
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 })
  }

  const { id } = await ctx.params
  if (!id || id.length > 120) {
    return NextResponse.json({ ok: false, error: "bad_id" }, { status: 400 })
  }

  const owned = await loadOwned(id, session.user.id, session.user.role)
  if (owned === null) return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 })
  if (owned === "forbidden") {
    return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 })
  }

  const deletedAt = new Date()
  await db.listing.update({ where: { id }, data: { deletedAt } })
  await unattributeListing(id)
  void unindexListing(id)

  return NextResponse.json({ ok: true, id, deletedAt: deletedAt.toISOString() })
}
