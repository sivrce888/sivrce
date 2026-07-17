/**
 * POST /api/payments/create-order
 * Create a payment order for listing tier upgrade.
 * Requires session, validates listing ownership.
 */

import { auth } from "@/auth"
import { NextResponse } from "next/server"
import { createListingTierOrder, getTierPrice } from "@/lib/payments"
import { db } from "@/lib/db"

const VALID_TIERS = ["vip", "super_vip", "diamond"]

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  }

  let body: { listingId?: string; tier?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "bad_json" }, { status: 400 })
  }

  const { listingId, tier } = body
  if (!listingId) {
    return NextResponse.json({ error: "missing_listing_id" }, { status: 400 })
  }
  if (!tier || !VALID_TIERS.includes(tier)) {
    return NextResponse.json({ error: "invalid_tier", valid: VALID_TIERS }, { status: 400 })
  }

  // Verify the user owns this listing
  const listing = await db.listing.findUnique({
    where: { id: listingId },
    select: { ownerId: true, tier: true },
  })

  if (!listing) {
    return NextResponse.json({ error: "listing_not_found" }, { status: 404 })
  }
  if (listing.ownerId !== session.user.id) {
    return NextResponse.json({ error: "not_owner" }, { status: 403 })
  }

  // Prevent downgrading: don't pay for same or lower tier
  const tierRank: Record<string, number> = { standard: 0, vip: 1, super_vip: 2, diamond: 3 }
  if (tierRank[tier] <= tierRank[listing.tier]) {
    return NextResponse.json({ error: "tier_not_upgrade", current: listing.tier }, { status: 400 })
  }

  try {
    const order = await createListingTierOrder(session.user.id, listingId, tier)
    return NextResponse.json({
      ok: true,
      order: {
        id: order.id,
        providerOrderId: order.providerOrderId,
        tier: order.tier,
        amountTetri: order.amountTetri,
        currency: order.currency,
        status: order.status,
        redirectUrl: order.redirectUrl,
      },
    })
  } catch (error) {
    console.error("[api/payments/create-order] failed:", (error as Error).message)
    return NextResponse.json({ error: "server_error" }, { status: 500 })
  }
}

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  }

  // Return tier pricing info
  return NextResponse.json({
    tiers: {
      vip: { priceTetri: getTierPrice("vip"), label: "VIP", durationDays: 30 },
      super_vip: { priceTetri: getTierPrice("super_vip"), label: "VIP+", durationDays: 30 },
      diamond: { priceTetri: getTierPrice("diamond"), label: "SUPER VIP", durationDays: 30 },
    },
  })
}
