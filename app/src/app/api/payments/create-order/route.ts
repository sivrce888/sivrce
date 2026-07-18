/**
 * POST /api/payments/create-order
 * Create a payment order for listing tier upgrade or add-on.
 * Requires session, validates listing ownership.
 */

import { auth } from "@/auth"
import { NextResponse } from "next/server"
import {
  createListingAddonOrder,
  createListingTierOrder,
  getTierPrice,
} from "@/lib/payments"
import { db } from "@/lib/db"
import {
  ADDON_TETRI,
  CHECKOUT_ADDONS,
  isCheckoutAddon,
  type CheckoutAddon,
} from "@/lib/promo-pricing"

const VALID_TIERS = ["vip", "super_vip", "diamond"]

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  }

  let body: { listingId?: string; tier?: string; addon?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "bad_json" }, { status: 400 })
  }

  const { listingId, tier, addon } = body
  if (!listingId) {
    return NextResponse.json({ error: "missing_listing_id" }, { status: 400 })
  }

  const listing = await db.listing.findUnique({
    where: { id: listingId },
    select: { ownerId: true, tier: true, status: true },
  })

  if (!listing) {
    return NextResponse.json({ error: "listing_not_found" }, { status: 404 })
  }
  if (listing.ownerId !== session.user.id) {
    return NextResponse.json({ error: "not_owner" }, { status: 403 })
  }
  if (listing.status !== "active") {
    return NextResponse.json({ error: "listing_not_active" }, { status: 400 })
  }

  try {
    if (addon) {
      if (!isCheckoutAddon(addon)) {
        return NextResponse.json(
          { error: "invalid_addon", valid: CHECKOUT_ADDONS },
          { status: 400 },
        )
      }
      const order = await createListingAddonOrder(session.user.id, listingId, addon)
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
    }

    if (!tier || !VALID_TIERS.includes(tier)) {
      return NextResponse.json({ error: "invalid_tier", valid: VALID_TIERS }, { status: 400 })
    }

    const tierRank: Record<string, number> = { standard: 0, vip: 1, super_vip: 2, diamond: 3 }
    if (tierRank[tier] <= tierRank[listing.tier]) {
      return NextResponse.json({ error: "tier_not_upgrade", current: listing.tier }, { status: 400 })
    }

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
    const msg = (error as Error).message
    if (msg === "refresh_cooldown") {
      return NextResponse.json({ error: "refresh_cooldown" }, { status: 429 })
    }
    console.error("[api/payments/create-order] failed:", msg)
    return NextResponse.json({ error: "server_error" }, { status: 500 })
  }
}

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  }

  const [vip, superVip, diamond] = await Promise.all([
    getTierPrice("vip"),
    getTierPrice("super_vip"),
    getTierPrice("diamond"),
  ])

  const addons = Object.fromEntries(
    CHECKOUT_ADDONS.map((k: CheckoutAddon) => [
      k,
      { priceTetri: ADDON_TETRI[k], label: k },
    ]),
  )

  return NextResponse.json({
    tiers: {
      vip: { priceTetri: vip, label: "VIP", durationDays: 30 },
      super_vip: { priceTetri: superVip, label: "VIP+", durationDays: 30 },
      diamond: { priceTetri: diamond, label: "SUPER VIP", durationDays: 30 },
    },
    addons,
  })
}
