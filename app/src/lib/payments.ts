/**
 * Payment adapter — TBC E-Commerce / BOG iPay with graceful degradation.
 * ponytail: TBC and BOG API clients are stubbed — real integration needs
 * API credentials and endpoint URLs per-bank. Mock provider logs and returns
 * fake success so the rest of the system works without payment env vars.
 */

import { db } from "@/lib/db"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PaymentOrder {
  id: string
  provider: string
  providerOrderId: string
  providerPaymentId?: string
  userId?: string
  listingId?: string
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
// Tier pricing (ponytail: hardcoded — real pricing comes from an admin config)
// ---------------------------------------------------------------------------

const TIER_PRICES: Record<string, number> = {
  vip: 99_00,        // 99 GEL (tetri)
  super_vip: 199_00, // 199 GEL
  diamond: 499_00,   // 499 GEL
}

/** Get the price in tetri for a listing tier upgrade. */
export function getTierPrice(tier: string): number {
  return TIER_PRICES[tier] ?? 99_00
}

// ---------------------------------------------------------------------------
// High-level operations
// ---------------------------------------------------------------------------

/** Create a payment order for a listing tier upgrade. */
export async function createListingTierOrder(
  userId: string,
  listingId: string,
  tier: string,
): Promise<PaymentOrder> {
  const amountTetri = getTierPrice(tier)
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
  }
}

/** Handle a payment provider callback/webhook. */
export async function handleCallback(
  provider: PaymentProvider,
  payload: { providerOrderId: string; status?: string },
): Promise<void> {
  const { providerOrderId, status: callbackStatus } = payload

  // Fetch current status from provider
  const providerStatus = await provider.getOrderStatus(providerOrderId)

  const newStatus = callbackStatus === "success" ? "paid" : providerStatus.status === "captured" ? "paid" : "failed"

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
      lastEventPayload: payload as any,
    },
  })

  // If this is a listing tier upgrade and payment succeeded, activate the tier
  if (newStatus === "paid" && order.listingId && order.tier && order.tier !== "auction_deposit") {
    const tier = order.tier as "vip" | "super_vip" | "diamond"
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
  }
}
