/**
 * Payment adapter — TBC E-Commerce / BOG iPay with graceful degradation.
 * ponytail: TBC and BOG API clients are stubbed — real integration needs
 * API credentials and endpoint URLs per-bank. Mock provider logs and returns
 * fake success so the rest of the system works without payment env vars.
 */

import { getConfig } from "@/lib/config"
import { db } from "@/lib/db"
import { Prisma } from "@/generated/prisma/client"
import { USD_GEL } from "@/data/listings"
import { revalidateTag } from "next/cache"
import { MAP_LISTINGS_TAG } from "@/lib/map/db-buildings"
import { deleteListing, indexListing, type ListingDocument } from "@/lib/search"
import {
  activeColorUntil,
  activePriceDropUntil,
  activeUrgentUntil,
  addonPriceTetri,
  COLOR_HIGHLIGHT_DAYS,
  effectiveTierKey,
  extendIso,
  isCheckoutAddon,
  isTurboAddon,
  REFRESH_COOLDOWN_MS,
  STICKER_PRICE_DROP_DAYS,
  STICKER_URGENT_DAYS,
  TURBO_DAYS,
  tierRankOf,
  type CheckoutAddon,
  type PromoExtFields,
} from "@/lib/promo-pricing"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PaymentOrder {
  id: string
  provider: string
  providerOrderId: string
  providerPaymentId?: string | null
  userId?: string | null
  listingId?: string | null
  tier: string
  amountTetri: number
  currency: string
  status: string
  redirectUrl?: string
  createdAt: Date
}

export interface CreateOrderInput {
  userId: string
  listingId?: string
  tier: string
  amountTetri: number
  currency?: string
  description?: string
}

export interface PaymentProvider {
  /** Create a new payment order and return a redirect URL for the user. */
  createOrder(input: CreateOrderInput): Promise<{ providerOrderId: string; redirectUrl: string }>
  /** Capture/verify an authorized payment. */
  captureOrder(providerOrderId: string): Promise<{ status: string; providerPaymentId?: string }>
  /** Refund a captured payment. */
  refundOrder(providerOrderId: string, amountTetri?: number): Promise<{ status: string }>
  /** Get current status of an order from the provider. */
  getOrderStatus(providerOrderId: string): Promise<{ status: string; providerPaymentId?: string }>
}

// ---------------------------------------------------------------------------
// Mock provider (used when env vars are missing)
// ---------------------------------------------------------------------------

function createMockProvider(): PaymentProvider {
  // Mock is a dev tool: in production a silent mock means anyone can mark an
  // order paid for free. Fail closed instead of falling back.
  if (process.env.NODE_ENV === "production") {
    throw new Error("payment provider not configured")
  }
  const prefix = "mock"
  return {
    async createOrder(input) {
      const id = `${prefix}_${crypto.randomUUID()}`
      console.log("[payments:mock] createOrder", { id, ...input })
      return {
        providerOrderId: id,
        redirectUrl: `/api/payments/callback?mock=1&orderId=${id}&status=success`,
      }
    },
    async captureOrder(providerOrderId) {
      console.log("[payments:mock] captureOrder", providerOrderId)
      return { status: "captured", providerPaymentId: `pay_${providerOrderId}` }
    },
    async refundOrder(providerOrderId) {
      console.log("[payments:mock] refundOrder", providerOrderId)
      return { status: "refunded" }
    },
    async getOrderStatus(providerOrderId) {
      console.log("[payments:mock] getOrderStatus", providerOrderId)
      return { status: "captured", providerPaymentId: `pay_${providerOrderId}` }
    },
  }
}

// ---------------------------------------------------------------------------
// TBC E-Commerce provider
// ponytail: stub — real implementation needs TBC API docs and credentials
// ---------------------------------------------------------------------------

function createTbcProvider(): PaymentProvider {
  const merchantId = process.env.TBC_MERCHANT_ID
  const apiKey = process.env.TBC_API_KEY
  const apiSecret = process.env.TBC_API_SECRET
  const baseUrl = process.env.TBC_CALLBACK_URL
    ? new URL(process.env.TBC_CALLBACK_URL).origin
    : "https://api.tbcbank.ge/v1"

  if (!merchantId || !apiKey || !apiSecret) {
    console.warn("[payments:tbc] TBC_MERCHANT_ID, TBC_API_KEY or TBC_API_SECRET missing — falling back to mock")
    return createMockProvider()
  }

  return {
    async createOrder(input) {
      // ponytail: real TBC e-commerce API call
      const id = `tbc_${crypto.randomUUID()}`
      console.log("[payments:tbc] createOrder (stub)", { id, ...input })
      return {
        providerOrderId: id,
        redirectUrl: `${baseUrl}/checkout/${id}`,
      }
    },
    async captureOrder(providerOrderId) {
      console.log("[payments:tbc] captureOrder (stub)", providerOrderId)
      return { status: "captured", providerPaymentId: `tbc_pay_${providerOrderId}` }
    },
    async refundOrder(providerOrderId, amountTetri) {
      console.log("[payments:tbc] refundOrder (stub)", providerOrderId, amountTetri)
      return { status: "refunded" }
    },
    async getOrderStatus(providerOrderId) {
      console.log("[payments:tbc] getOrderStatus (stub)", providerOrderId)
      return { status: "captured", providerPaymentId: `tbc_pay_${providerOrderId}` }
    },
  }
}

/** Create a TBC E-Commerce provider. */
export { createTbcProvider }

// ---------------------------------------------------------------------------
// BOG iPay provider
// ponytail: stub — real implementation needs BOG API docs and credentials
// ---------------------------------------------------------------------------

function createBogProvider(): PaymentProvider {
  const merchantId = process.env.BOG_MERCHANT_ID
  const apiKey = process.env.BOG_API_KEY
  const apiSecret = process.env.BOG_API_SECRET
  const baseUrl = process.env.BOG_CALLBACK_URL
    ? new URL(process.env.BOG_CALLBACK_URL).origin
    : "https://ipay.bog.ge/api"

  if (!merchantId || !apiKey || !apiSecret) {
    console.warn("[payments:bog] BOG_MERCHANT_ID, BOG_API_KEY or BOG_API_SECRET missing — falling back to mock")
    return createMockProvider()
  }

  return {
    async createOrder(input) {
      // ponytail: real BOG iPay API call
      const id = `bog_${crypto.randomUUID()}`
      console.log("[payments:bog] createOrder (stub)", { id, ...input })
      return {
        providerOrderId: id,
        redirectUrl: `${baseUrl}/orders/${id}`,
      }
    },
    async captureOrder(providerOrderId) {
      console.log("[payments:bog] captureOrder (stub)", providerOrderId)
      return { status: "captured", providerPaymentId: `bog_pay_${providerOrderId}` }
    },
    async refundOrder(providerOrderId, amountTetri) {
      console.log("[payments:bog] refundOrder (stub)", providerOrderId, amountTetri)
      return { status: "refunded" }
    },
    async getOrderStatus(providerOrderId) {
      console.log("[payments:bog] getOrderStatus (stub)", providerOrderId)
      return { status: "captured", providerPaymentId: `bog_pay_${providerOrderId}` }
    },
  }
}

/** Create a BOG iPay provider. */
export { createBogProvider }

// ---------------------------------------------------------------------------
// Provider factory
// ---------------------------------------------------------------------------

/** Returns the configured payment provider based on PAYMENT_PROVIDER env var. */
export function getPaymentProvider(): PaymentProvider {
  const provider = process.env.PAYMENT_PROVIDER?.toLowerCase()

  switch (provider) {
    case "tbc":
      return createTbcProvider()
    case "bog":
      return createBogProvider()
    default:
      console.warn("[payments] PAYMENT_PROVIDER not set or unknown — using mock provider")
      return createMockProvider()
  }
}

// ---------------------------------------------------------------------------
// Tier pricing — admin-editable (Admin → System → Settings), stored in tetri
// ---------------------------------------------------------------------------

const TIER_CONFIG_KEYS = {
  vip: "price.vip",
  super_vip: "price.superVip",
  diamond: "price.diamond",
} as const

/** Get the price in tetri for a listing tier upgrade (unknown tier → VIP price). */
export async function getTierPrice(tier: string): Promise<number> {
  const key = TIER_CONFIG_KEYS[tier as keyof typeof TIER_CONFIG_KEYS] ?? TIER_CONFIG_KEYS.vip
  return getConfig(key)
}

// ---------------------------------------------------------------------------
// High-level operations
// ---------------------------------------------------------------------------

/** Create a payment order for listing tier upgrade. */
export async function createListingTierOrder(
  userId: string,
  listingId: string,
  tier: string,
): Promise<PaymentOrder> {
  const amountTetri = await getTierPrice(tier)
  const provider = getPaymentProvider()

  const { providerOrderId, redirectUrl } = await provider.createOrder({
    userId,
    listingId,
    tier,
    amountTetri,
    currency: "GEL",
    description: `Listing ${listingId} tier upgrade to ${tier}`,
  })

  const order = await db.georgianPaymentOrder.create({
    data: {
      provider: process.env.PAYMENT_PROVIDER ?? "mock",
      providerOrderId,
      userId,
      listingId,
      tier,
      amountTetri,
      currency: "GEL",
      status: "pending",
    },
  })

  return {
    ...order,
    redirectUrl,
    createdAt: order.createdAt,
    providerPaymentId: order.providerPaymentId ?? undefined,
  }
}

/** Create a payment order for a listing add-on (refresh / color / FB). */
export async function createListingAddonOrder(
  userId: string,
  listingId: string,
  addon: CheckoutAddon,
): Promise<PaymentOrder> {
  if (addon === "refresh_once") {
    const recent = await db.listingBoostHistory.findFirst({
      where: {
        listingId,
        toTier: "refresh_once",
        createdAt: { gte: new Date(Date.now() - REFRESH_COOLDOWN_MS) },
      },
      select: { id: true },
    })
    if (recent) {
      throw new Error("refresh_cooldown")
    }
  }

  const amountTetri = addonPriceTetri(addon)
  const provider = getPaymentProvider()

  const { providerOrderId, redirectUrl } = await provider.createOrder({
    userId,
    listingId,
    tier: addon,
    amountTetri,
    currency: "GEL",
    description: `Listing ${listingId} addon ${addon}`,
  })

  const order = await db.georgianPaymentOrder.create({
    data: {
      provider: process.env.PAYMENT_PROVIDER ?? "mock",
      providerOrderId,
      userId,
      listingId,
      tier: addon,
      amountTetri,
      currency: "GEL",
      status: "pending",
    },
  })

  return {
    ...order,
    redirectUrl,
    createdAt: order.createdAt,
    providerPaymentId: order.providerPaymentId ?? undefined,
  }
}

/** Create a payment order for an auction deposit. */
export async function createAuctionDepositOrder(
  userId: string,
  auctionId: string,
  amountTetri: number,
): Promise<PaymentOrder> {
  const provider = getPaymentProvider()

  const { providerOrderId, redirectUrl } = await provider.createOrder({
    userId,
    tier: "auction_deposit",
    amountTetri,
    currency: "GEL",
    description: `Auction ${auctionId} deposit`,
  })

  const order = await db.georgianPaymentOrder.create({
    data: {
      provider: process.env.PAYMENT_PROVIDER ?? "mock",
      providerOrderId,
      userId,
      tier: "auction_deposit",
      amountTetri,
      currency: "GEL",
      status: "pending",
    },
  })

  return {
    ...order,
    redirectUrl,
    createdAt: order.createdAt,
    providerPaymentId: order.providerPaymentId ?? undefined,
  }
}

/** Handle a payment provider callback/webhook. */
export async function handleCallback(
  provider: PaymentProvider,
  payload: { providerOrderId: string; status?: string },
): Promise<void> {
  const { providerOrderId } = payload

  // Trust boundary: client-supplied `status` is never trusted. Paid state is
  // decided only by a server-to-server lookup at the provider.
  const providerStatus = await provider.getOrderStatus(providerOrderId)

  const newStatus = providerStatus.status === "captured" ? "paid" : "failed"

  const order = await db.georgianPaymentOrder.findFirst({
    where: { providerOrderId },
  })

  if (!order) {
    console.error("[payments:callback] unknown order:", providerOrderId)
    return
  }

  await db.georgianPaymentOrder.update({
    where: { id: order.id },
    data: {
      status: newStatus,
      providerPaymentId: providerStatus.providerPaymentId ?? undefined,
      paidAt: newStatus === "paid" ? new Date() : undefined,
      lastEventPayload: payload as Prisma.InputJsonValue,
    },
  })

  // If this is a listing tier upgrade and payment succeeded, activate the tier
  if (newStatus === "paid" && order.listingId && order.tier && order.tier !== "auction_deposit") {
    if (isCheckoutAddon(order.tier)) {
      await applyPaidAddon(order.listingId, order.userId, order.tier, order.amountTetri, order.provider)
      return
    }

    const tier = order.tier as "vip" | "super_vip" | "diamond"
    if (tier !== "vip" && tier !== "super_vip" && tier !== "diamond") return

    const expiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days

    await db.listing.update({
      where: { id: order.listingId },
      data: {
        tier,
        tierPurchasedAt: new Date(),
        tierExpiresAt: expiry,
        tierPaymentOrderId: order.id,
      },
    })

    await reindexListingById(order.listingId)
  }
}

async function applyPaidAddon(
  listingId: string,
  userId: string | null,
  addon: CheckoutAddon,
  amountTetri: number,
  provider: string | null,
): Promise<void> {
  const listing = await db.listing.findUnique({
    where: { id: listingId },
    select: { tier: true, tierExpiresAt: true, extendedFields: true },
  })
  if (!listing) return

  const now = new Date()
  let durationDays = 0
  let expiresAt = now
  const prev = (listing.extendedFields as PromoExtFields | null) ?? {}
  let reindex = false

  if (addon === "refresh_once") {
    // ponytail: bump createdAt — Georgian classifieds freshness; dedicated bumpedAt if audit needs it
    durationDays = 0
    expiresAt = now
    await db.listing.update({
      where: { id: listingId },
      data: { createdAt: now },
    })
    reindex = true
  } else if (addon === "color") {
    durationDays = COLOR_HIGHLIGHT_DAYS
    const until = extendIso(prev.colorUntil, COLOR_HIGHLIGHT_DAYS, now)
    expiresAt = until
    await db.listing.update({
      where: { id: listingId },
      data: {
        extendedFields: { ...prev, colorUntil: until.toISOString() } as Prisma.InputJsonValue,
      },
    })
    reindex = true
  } else if (addon === "sticker_urgent") {
    durationDays = STICKER_URGENT_DAYS
    const until = extendIso(prev.urgentUntil, STICKER_URGENT_DAYS, now)
    expiresAt = until
    await db.listing.update({
      where: { id: listingId },
      data: {
        extendedFields: { ...prev, urgentUntil: until.toISOString() } as Prisma.InputJsonValue,
      },
    })
    reindex = true
  } else if (addon === "sticker_price_drop") {
    durationDays = STICKER_PRICE_DROP_DAYS
    const until = extendIso(prev.priceDropUntil, STICKER_PRICE_DROP_DAYS, now)
    expiresAt = until
    await db.listing.update({
      where: { id: listingId },
      data: {
        extendedFields: {
          ...prev,
          priceDropUntil: until.toISOString(),
        } as Prisma.InputJsonValue,
      },
    })
    reindex = true
  } else if (isTurboAddon(addon)) {
    // Turbo = SUPER VIP + color + urgent sticker + bump for N days (−20/−25/−30 vs stack).
    durationDays = TURBO_DAYS[addon]
    const colorUntil = extendIso(prev.colorUntil, durationDays, now)
    const urgentUntil = extendIso(prev.urgentUntil, durationDays, now)
    const turboExpiry = new Date(now.getTime() + durationDays * 86_400_000)
    const keepDiamond =
      listing.tier === "diamond" &&
      listing.tierExpiresAt &&
      listing.tierExpiresAt.getTime() > turboExpiry.getTime()
    expiresAt = keepDiamond ? listing.tierExpiresAt! : turboExpiry
    await db.listing.update({
      where: { id: listingId },
      data: {
        createdAt: now,
        tier: "diamond",
        tierPurchasedAt: now,
        tierExpiresAt: expiresAt,
        extendedFields: {
          ...prev,
          colorUntil: colorUntil.toISOString(),
          urgentUntil: urgentUntil.toISOString(),
        } as Prisma.InputJsonValue,
      },
    })
    reindex = true
  } else {
    // Facebook packs — paid SKU; fulfillment is ops (boost history is the queue signal).
    durationDays = addon === "facebook" ? 3 : 7
    expiresAt = new Date(now.getTime() + durationDays * 86_400_000)
  }

  await db.listingBoostHistory.create({
    data: {
      listingId,
      userId: userId ?? undefined,
      fromTier: listing.tier,
      toTier: addon,
      amountTetri,
      currency: "GEL",
      provider: provider ?? undefined,
      durationDays,
      startedAt: now,
      expiresAt,
    },
  })

  if (reindex) {
    await reindexListingById(listingId)
  }
}

/** Reindex active listing; remove from Meili when inactive/missing. */
export async function reindexListingById(listingId: string): Promise<void> {
  const listing = await db.listing.findUnique({
    where: { id: listingId },
    select: {
      id: true,
      title: true,
      description: true,
      city: true,
      district: true,
      address: true,
      dealType: true,
      propertyType: true,
      price: true,
      currency: true,
      pricePerSqm: true,
      verified: true,
      petsAllowed: true,
      sellerType: true,
      extendedFields: true,
      area: true,
      rooms: true,
      bedrooms: true,
      bathrooms: true,
      floor: true,
      totalFloors: true,
      features: true,
      images: true,
      lat: true,
      lng: true,
      createdAt: true,
      status: true,
      trustScore: true,
      tier: true,
      tierExpiresAt: true,
      deletedAt: true,
    },
  })
  if (!listing || listing.deletedAt || listing.status !== "active") {
    void deleteListing(listingId)
    return
  }

  const ext = listing.extendedFields as PromoExtFields | null
  const tierKey = effectiveTierKey(listing.tier, listing.tierExpiresAt)
  const doc: ListingDocument = {
    id: listing.id,
    title: listing.title,
    description: listing.description,
    city: listing.city,
    district: listing.district,
    address: listing.address,
    dealType: listing.dealType,
    propertyType: listing.propertyType,
    price: listing.price,
    currency: listing.currency,
    priceUSD:
      listing.currency === "USD" ? listing.price : Math.round(listing.price / USD_GEL),
    pricePerSqm: listing.pricePerSqm ?? undefined,
    verified: listing.verified,
    hasImages: listing.images.length > 0,
    petsAllowed: listing.petsAllowed ?? undefined,
    sellerType: listing.sellerType ?? undefined,
    condition: ext?.condition,
    buildingStatus: ext?.buildingStatus,
    area: listing.area,
    rooms: listing.rooms,
    bedrooms: listing.bedrooms,
    bathrooms: listing.bathrooms,
    floor: listing.floor ?? undefined,
    totalFloors: listing.totalFloors ?? undefined,
    features: (listing.features as string[]) ?? [],
    images: (listing.images as string[]) ?? [],
    lat: listing.lat,
    lng: listing.lng,
    createdAt: listing.createdAt.toISOString(),
    status: listing.status,
    colorUntil: activeColorUntil(ext),
    urgentUntil: activeUrgentUntil(ext),
    priceDropUntil: activePriceDropUntil(ext),
    trustScore: listing.trustScore,
    tier: tierKey,
    tierRank: tierRankOf(listing.tier, listing.tierExpiresAt),
  }
  void indexListing(doc).catch(() => {})
  revalidateTag(MAP_LISTINGS_TAG, "max")
}
