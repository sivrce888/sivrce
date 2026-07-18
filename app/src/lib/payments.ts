/**
 * Payment adapter — TBC E-Commerce (tpay) / BOG iPay with graceful degradation.
 *
 * Verification pattern (both banks, per their docs): the browser redirect and
 * the webhook body are NEVER trusted for paid state. The only source of truth
 * is a server-to-server status lookup at the bank (GET payment/receipt).
 * BOG callbacks additionally carry an RSA-SHA256 `Callback-Signature` header,
 * verified against the bank's published public key before parsing.
 *
 * Status flip is idempotent: one atomic `UPDATE … WHERE status='pending'`
 * claim inside a transaction; entitlement writes ride the same transaction,
 * so a paid order activates its boost exactly once.
 */

import { createVerify } from "node:crypto"

import { getConfig } from "@/lib/config"
import { db } from "@/lib/db"
import { Prisma } from "@/generated/prisma/client"
import { USD_GEL } from "@/data/listings"
import { revalidateTag } from "next/cache"
import { MAP_LISTINGS_TAG } from "@/lib/map/db-buildings"
import { deleteListing, indexListing, type ListingDocument } from "@/lib/search"
import { metroMeters } from "@/lib/map/pois"
import {
  activeColorUntil,
  activePriceDropUntil,
  activeStoryUntil,
  activeUrgentUntil,
  addonPriceTetri,
  COLOR_HIGHLIGHT_DAYS,
  STORY_DAYS,
  effectiveTierKey,
  extendIso,
  isCheckoutAddon,
  isTurboAddon,
  REFRESH_COOLDOWN_MS,
  STICKER_PRICE_DROP_DAYS,
  STICKER_URGENT_DAYS,
  tierRankOf,
  TURBO_DAYS,
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
  /** Our internal order UUID — echoed to the bank as merchant-side reference. */
  orderId: string
  userId: string
  listingId?: string
  tier: string
  amountTetri: number
  currency?: string
  description?: string
}

/** Normalized provider-side status; only "captured" flips an order to paid. */
export type ProviderStatus = "captured" | "failed" | "pending"

export interface PaymentProvider {
  /** Create a new payment order and return a redirect URL for the user. */
  createOrder(input: CreateOrderInput): Promise<{ providerOrderId: string; redirectUrl: string }>
  /** Server-to-server truth lookup — the ONLY way an order becomes paid. */
  getOrderStatus(
    providerOrderId: string,
  ): Promise<{ status: ProviderStatus; providerPaymentId?: string }>
  /** Refund a captured payment (best-effort; ops usually refunds in the bank dashboard). */
  refundOrder(providerOrderId: string, amountTetri?: number): Promise<{ status: string }>
}

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

const FETCH_TIMEOUT_MS = 15_000

/** Public origin for bank callbacks + return redirects. */
function publicBaseUrl(): string {
  return (
    process.env.PAYMENTS_PUBLIC_URL ??
    process.env.AUTH_URL ??
    "http://localhost:3000"
  ).replace(/\/$/, "")
}

function callbackUrl(): string {
  return `${publicBaseUrl()}/api/payments/callback`
}

/** Bank sends the user back here; this route re-verifies and 302s to a result page. */
function returnUrl(orderId: string): string {
  return `${publicBaseUrl()}/api/payments/return?order=${orderId}`
}

async function readJson<T>(res: Response, label: string): Promise<T> {
  if (!res.ok) {
    const text = await res.text().catch(() => "")
    throw new Error(`${label} http_${res.status}: ${text.slice(0, 200)}`)
  }
  return (await res.json()) as T
}

// ---------------------------------------------------------------------------
// Mock provider (dev only; fails closed in production)
// ---------------------------------------------------------------------------

function createMockProvider(): PaymentProvider {
  // Mock is a dev tool: in production a silent mock means anyone can mark an
  // order paid for free. Fail closed instead of falling back.
  if (process.env.NODE_ENV === "production") {
    throw new Error("payment provider not configured")
  }
  return {
    async createOrder(input) {
      const id = `mock_${crypto.randomUUID()}`
      console.log("[payments:mock] createOrder", { id, ...input })
      return { providerOrderId: id, redirectUrl: returnUrl(input.orderId) }
    },
    async getOrderStatus(providerOrderId) {
      console.log("[payments:mock] getOrderStatus", providerOrderId)
      return { status: "captured" as const, providerPaymentId: `pay_${providerOrderId}` }
    },
    async refundOrder(providerOrderId) {
      console.log("[payments:mock] refundOrder", providerOrderId)
      return { status: "refunded" }
    },
  }
}

// ---------------------------------------------------------------------------
// TBC E-Commerce (tpay) — https://developers.tbcbank.ge
// apikey header on every call; OAuth client-credentials token (valid 1 day).
// ---------------------------------------------------------------------------

const TBC_API_BASE = "https://api.tbcbank.ge/v1/tpay"

/** TBC payment-detail statuses we treat as final. Everything else = pending. */
const TBC_PAID = new Set(["succeeded", "partialreturned"])
const TBC_FAILED = new Set(["failed", "canceled", "returned"])

let tbcToken: { value: string; expiresAt: number } | null = null

async function tbcAccessToken(apiKey: string, clientId: string, clientSecret: string): Promise<string> {
  if (tbcToken && tbcToken.expiresAt > Date.now() + 60_000) return tbcToken.value
  const res = await fetch(`${TBC_API_BASE}/access-token`, {
    method: "POST",
    headers: { apikey: apiKey, "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ client_id: clientId, client_secret: clientSecret }),
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    cache: "no-store",
  })
  const data = await readJson<{ access_token: string; expires_in?: number }>(res, "tbc:token")
  tbcToken = {
    value: data.access_token,
    expiresAt: Date.now() + (data.expires_in ?? 86_400) * 1000,
  }
  return data.access_token
}

interface TbcPayment {
  payId: string
  status: string
  transactionId?: string | null
  links?: Array<{ uri: string; method: string; rel: string }>
  developerMessage?: string | null
}

function createTbcProvider(): PaymentProvider {
  const apiKey = process.env.TBC_API_KEY
  const clientId = process.env.TBC_CLIENT_ID
  const clientSecret = process.env.TBC_CLIENT_SECRET

  if (!apiKey || !clientId || !clientSecret) {
    console.warn("[payments:tbc] TBC_API_KEY, TBC_CLIENT_ID or TBC_CLIENT_SECRET missing — falling back to mock")
    return createMockProvider()
  }

  async function authed(path: string, init: RequestInit = {}): Promise<Response> {
    const token = await tbcAccessToken(apiKey!, clientId!, clientSecret!)
    return fetch(`${TBC_API_BASE}${path}`, {
      ...init,
      headers: {
        apikey: apiKey!,
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        ...(init.headers ?? {}),
      },
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      cache: "no-store",
    })
  }

  return {
    async createOrder(input) {
      const res = await authed("/payments", {
        method: "POST",
        body: JSON.stringify({
          amount: { currency: input.currency ?? "GEL", total: input.amountTetri / 100 },
          returnurl: returnUrl(input.orderId),
          callbackUrl: callbackUrl(),
          language: "KA",
          preAuthorization: false,
          merchantPaymentId: input.orderId,
        }),
      })
      const data = await readJson<TbcPayment>(res, "tbc:create")
      const redirect = data.links?.find((l) => l.rel.includes("approval"))
      if (!data.payId || !redirect?.uri) {
        throw new Error(`tbc:create missing payId/approval link: ${data.developerMessage ?? "unknown"}`)
      }
      return { providerOrderId: data.payId, redirectUrl: redirect.uri }
    },

    async getOrderStatus(providerOrderId) {
      const res = await authed(`/payments/${encodeURIComponent(providerOrderId)}`)
      const data = await readJson<TbcPayment>(res, "tbc:status")
      const s = data.status.toLowerCase()
      const status: ProviderStatus = TBC_PAID.has(s) ? "captured" : TBC_FAILED.has(s) ? "failed" : "pending"
      return { status, providerPaymentId: data.transactionId ?? undefined }
    },

    // ponytail: cancels an unfinished/pre-auth payment. Captured-payment refunds
    // are ops (TBC merchant dashboard); admin marks the local row refunded.
    async refundOrder(providerOrderId) {
      const res = await authed(`/payments/${encodeURIComponent(providerOrderId)}/cancel`, { method: "POST" })
      await readJson(res, "tbc:cancel")
      return { status: "refunded" }
    },
  }
}

/** Create a TBC E-Commerce provider. */
export { createTbcProvider }

// ---------------------------------------------------------------------------
// BOG iPay — https://api.bog.ge/docs/en/payments
// OAuth2 client-credentials (Basic auth) → JWT; receipt lookup for truth.
// ---------------------------------------------------------------------------

const BOG_API_BASE = "https://api.bog.ge/payments/v1"
const BOG_TOKEN_URL = "https://oauth2.bog.ge/auth/realms/bog/protocol/openid-connect/token"

/** Production callback public key published in BOG docs (override via env for tests). */
const BOG_PROD_CALLBACK_PUBLIC_KEY = `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAu4RUyAw3+CdkS3ZNILQh
zHI9Hemo+vKB9U2BSabppkKjzjjkf+0Sm76hSMiu/HFtYhqWOESryoCDJoqffY0Q
1VNt25aTxbj068QNUtnxQ7KQVLA+pG0smf+EBWlS1vBEAFbIas9d8c9b9sSEkTrr
TYQ90WIM8bGB6S/KLVoT1a7SnzabjoLc5Qf/SLDG5fu8dH8zckyeYKdRKSBJKvhx
tcBuHV4f7qsynQT+f2UYbESX/TLHwT5qFWZDHZ0YUOUIvb8n7JujVSGZO9/+ll/g
4ZIWhC1MlJgPObDwRkRd8NFOopgxMcMsDIZIoLbWKhHVq67hdbwpAq9K9WMmEhPn
PwIDAQAB
-----END PUBLIC KEY-----`

/**
 * Verify BOG's `Callback-Signature` header: SHA256withRSA over the RAW request
 * body (verified before deserialization, per BOG docs).
 */
export function verifyBogCallbackSignature(rawBody: string, signatureBase64: string): boolean {
  try {
    const key = process.env.BOG_CALLBACK_PUBLIC_KEY ?? BOG_PROD_CALLBACK_PUBLIC_KEY
    return createVerify("RSA-SHA256").update(rawBody).verify(key, signatureBase64, "base64")
  } catch {
    return false
  }
}

let bogToken: { value: string; expiresAt: number } | null = null

async function bogAccessToken(clientId: string, clientSecret: string): Promise<string> {
  if (bogToken && bogToken.expiresAt > Date.now() + 60_000) return bogToken.value
  const res = await fetch(BOG_TOKEN_URL, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({ grant_type: "client_credentials" }),
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    cache: "no-store",
  })
  const data = await readJson<{ access_token: string; expires_in?: number }>(res, "bog:token")
  bogToken = {
    value: data.access_token,
    expiresAt: Date.now() + (data.expires_in ?? 3600) * 1000,
  }
  return data.access_token
}

interface BogOrderCreated {
  id: string
  _links?: { redirect?: { href?: string } }
}

interface BogReceipt {
  order_id: string
  order_status?: { key?: string }
  payment_detail?: { transaction_id?: string }
}

function createBogProvider(): PaymentProvider {
  const clientId = process.env.BOG_CLIENT_ID
  const clientSecret = process.env.BOG_CLIENT_SECRET

  if (!clientId || !clientSecret) {
    console.warn("[payments:bog] BOG_CLIENT_ID or BOG_CLIENT_SECRET missing — falling back to mock")
    return createMockProvider()
  }

  async function authed(path: string, init: RequestInit = {}): Promise<Response> {
    const token = await bogAccessToken(clientId!, clientSecret!)
    return fetch(`${BOG_API_BASE}${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        ...(init.headers ?? {}),
      },
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      cache: "no-store",
    })
  }

  return {
    async createOrder(input) {
      const gel = input.amountTetri / 100
      const back = returnUrl(input.orderId)
      const res = await authed("/ecommerce/orders", {
        method: "POST",
        headers: { "Idempotency-Key": input.orderId },
        body: JSON.stringify({
          callback_url: callbackUrl(),
          external_order_id: input.orderId,
          capture: "automatic",
          purchase_units: {
            currency: input.currency ?? "GEL",
            total_amount: gel,
            basket: [{ quantity: 1, unit_price: gel, product_id: input.tier }],
          },
          redirect_urls: { success: back, fail: back },
        }),
      })
      const data = await readJson<BogOrderCreated>(res, "bog:create")
      const href = data._links?.redirect?.href
      if (!data.id || !href) throw new Error("bog:create missing id/redirect link")
      return { providerOrderId: data.id, redirectUrl: href }
    },

    async getOrderStatus(providerOrderId) {
      const res = await authed(`/receipt/${encodeURIComponent(providerOrderId)}`)
      const data = await readJson<BogReceipt>(res, "bog:receipt")
      const key = data.order_status?.key ?? ""
      const status: ProviderStatus =
        key === "completed" || key === "partially_refunded"
          ? "captured"
          : key === "rejected" || key === "refunded"
            ? "failed"
            : "pending"
      return { status, providerPaymentId: data.payment_detail?.transaction_id }
    },

    async refundOrder(providerOrderId, amountTetri) {
      const res = await authed(`/refund/${encodeURIComponent(providerOrderId)}`, {
        method: "POST",
        body: JSON.stringify(amountTetri != null ? { amount: amountTetri / 100 } : {}),
      })
      await readJson(res, "bog:refund")
      return { status: "refunded" }
    },
  }
}

/** Create a BOG iPay provider. */
export { createBogProvider }

// ---------------------------------------------------------------------------
// Provider factory — single obvious switch.
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
// Order creation — pending row first, then the bank, then the bank's ids.
// ---------------------------------------------------------------------------

type OrderRow = Prisma.GeorgianPaymentOrderGetPayload<object>

async function placeOrder(
  draft: Omit<CreateOrderInput, "orderId">,
): Promise<PaymentOrder> {
  const providerName = process.env.PAYMENT_PROVIDER?.toLowerCase() ?? "mock"
  // Placeholder satisfies NOT NULL + unique until the bank returns its own id.
  const row = await db.georgianPaymentOrder.create({
    data: {
      provider: providerName,
      providerOrderId: `tmp_${crypto.randomUUID()}`,
      userId: draft.userId,
      listingId: draft.listingId,
      tier: draft.tier,
      amountTetri: draft.amountTetri,
      currency: draft.currency ?? "GEL",
      status: "pending",
    },
  })

  try {
    const provider = getPaymentProvider()
    const { providerOrderId, redirectUrl } = await provider.createOrder({ ...draft, orderId: row.id })
    const order = await db.georgianPaymentOrder.update({
      where: { id: row.id },
      data: { providerOrderId },
    })
    return toPaymentOrder(order, redirectUrl)
  } catch (error) {
    // Bank never saw a payable order — mark failed so it can't be claimed later.
    await db.georgianPaymentOrder.update({
      where: { id: row.id },
      data: {
        status: "failed",
        lastEventPayload: { createError: (error as Error).message.slice(0, 300) },
      },
    })
    throw error
  }
}

function toPaymentOrder(order: OrderRow, redirectUrl?: string): PaymentOrder {
  return {
    ...order,
    redirectUrl,
    createdAt: order.createdAt,
    providerPaymentId: order.providerPaymentId ?? undefined,
  }
}

/** Create a payment order for listing tier upgrade. */
export async function createListingTierOrder(
  userId: string,
  listingId: string,
  tier: string,
): Promise<PaymentOrder> {
  const amountTetri = await getTierPrice(tier)
  return placeOrder({
    userId,
    listingId,
    tier,
    amountTetri,
    currency: "GEL",
    description: `Listing ${listingId} tier upgrade to ${tier}`,
  })
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

  return placeOrder({
    userId,
    listingId,
    tier: addon,
    amountTetri: addonPriceTetri(addon),
    currency: "GEL",
    description: `Listing ${listingId} addon ${addon}`,
  })
}

/** Create a payment order for an auction deposit. */
export async function createAuctionDepositOrder(
  userId: string,
  auctionId: string,
  amountTetri: number,
): Promise<PaymentOrder> {
  return placeOrder({
    userId,
    tier: "auction_deposit",
    amountTetri,
    currency: "GEL",
    description: `Auction ${auctionId} deposit`,
  })
}

// ---------------------------------------------------------------------------
// Finalization — idempotent claim + transactional entitlement.
// ---------------------------------------------------------------------------

export interface FinalizeResult {
  outcome: "paid" | "failed" | "pending" | "unknown"
  orderId?: string
  status?: string
}

/**
 * Verify an order server-to-server and, on a terminal state, flip it exactly
 * once. Safe to call from webhooks, return redirects and retries — repeats
 * after a final flip are no-ops.
 */
export async function finalizeOrder(
  provider: PaymentProvider,
  providerOrderId: string,
  payload?: unknown,
): Promise<FinalizeResult> {
  const order = await db.georgianPaymentOrder.findFirst({
    where: { providerOrderId },
  })
  if (!order) {
    console.error("[payments:finalize] unknown order:", providerOrderId)
    return { outcome: "unknown" }
  }

  if (order.status !== "pending") {
    return { outcome: order.status === "paid" ? "paid" : "failed", orderId: order.id, status: order.status }
  }

  // Trust boundary: only the bank's own API decides paid state.
  const providerStatus = await provider.getOrderStatus(providerOrderId)
  if (providerStatus.status === "pending") {
    return { outcome: "pending", orderId: order.id, status: "pending" }
  }
  const newStatus = providerStatus.status === "captured" ? "paid" : "failed"

  const listingToReindex = await db.$transaction(async (tx) => {
    // Atomic claim: exactly one concurrent caller wins the pending→final flip.
    const claimed = await tx.georgianPaymentOrder.updateMany({
      where: { id: order.id, status: "pending" },
      data: {
        status: newStatus,
        providerPaymentId: providerStatus.providerPaymentId ?? undefined,
        paidAt: newStatus === "paid" ? new Date() : undefined,
        lastEventPayload: (payload ?? Prisma.JsonNull) as Prisma.InputJsonValue,
      },
    })
    if (claimed.count === 0) return null // someone else finalized first

    if (newStatus !== "paid") return null
    return applyEntitlementTx(tx, order)
  })

  if (listingToReindex) await reindexListingById(listingToReindex)

  return { outcome: newStatus === "paid" ? "paid" : "failed", orderId: order.id, status: newStatus }
}

/**
 * Apply the purchased entitlement inside the claim transaction.
 * Returns the listing id to reindex after commit (or null).
 */
async function applyEntitlementTx(
  tx: Prisma.TransactionClient,
  order: { id: string; listingId: string | null; userId: string | null; tier: string; amountTetri: number; provider: string },
): Promise<string | null> {
  if (!order.listingId || order.tier === "auction_deposit") return null

  const now = new Date()

  // — Listing tier upgrade (VIP / VIP+ / SUPER VIP, 30 days) —
  if (order.tier === "vip" || order.tier === "super_vip" || order.tier === "diamond") {
    await tx.listing.update({
      where: { id: order.listingId },
      data: {
        tier: order.tier,
        tierPurchasedAt: now,
        tierExpiresAt: new Date(now.getTime() + 30 * 86_400_000),
        tierPaymentOrderId: order.id,
      },
    })
    return order.listingId
  }

  if (!isCheckoutAddon(order.tier)) return null
  const addon = order.tier

  const listing = await tx.listing.findUnique({
    where: { id: order.listingId },
    select: { tier: true, extendedFields: true },
  })
  if (!listing) return null

  const prev = (listing.extendedFields as PromoExtFields | null) ?? {}
  let durationDays = 0
  let expiresAt = now

  if (addon === "refresh_once") {
    // ponytail: bump createdAt — Georgian classifieds freshness; dedicated bumpedAt if audit needs it
    await tx.listing.update({ where: { id: order.listingId }, data: { createdAt: now } })
  } else if (addon === "color") {
    durationDays = COLOR_HIGHLIGHT_DAYS
    expiresAt = extendIso(prev.colorUntil, COLOR_HIGHLIGHT_DAYS, now)
    await tx.listing.update({
      where: { id: order.listingId },
      data: { extendedFields: { ...prev, colorUntil: expiresAt.toISOString() } as Prisma.InputJsonValue },
    })
  } else if (addon === "sticker_urgent" || addon === "sticker_price_drop") {
    durationDays = addon === "sticker_urgent" ? STICKER_URGENT_DAYS : STICKER_PRICE_DROP_DAYS
    const field = addon === "sticker_urgent" ? "urgentUntil" : "priceDropUntil"
    expiresAt = extendIso(prev[field], durationDays, now)
    await tx.listing.update({
      where: { id: order.listingId },
      data: { extendedFields: { ...prev, [field]: expiresAt.toISOString() } as Prisma.InputJsonValue },
    })
  } else if (addon === "story") {
    durationDays = STORY_DAYS
    expiresAt = extendIso(prev.storyUntil, STORY_DAYS, now)
    await tx.listing.update({
      where: { id: order.listingId },
      data: {
        extendedFields: {
          ...prev,
          storyUntil: expiresAt.toISOString(),
        } as Prisma.InputJsonValue,
      },
    })
  } else if (isTurboAddon(addon)) {
    // Turbo = SUPER VIP + color + urgent sticker + freshness bump, N days.
    durationDays = TURBO_DAYS[addon]
    expiresAt = new Date(now.getTime() + durationDays * 86_400_000)
    await tx.listing.update({
      where: { id: order.listingId },
      data: {
        tier: "diamond",
        tierPurchasedAt: now,
        tierExpiresAt: expiresAt,
        tierPaymentOrderId: order.id,
        createdAt: now,
        extendedFields: {
          ...prev,
          colorUntil: extendIso(prev.colorUntil, durationDays, now).toISOString(),
          urgentUntil: extendIso(prev.urgentUntil, durationDays, now).toISOString(),
        } as Prisma.InputJsonValue,
      },
    })
  } else {
    // Facebook packs — paid SKU; fulfillment is ops (boost history is the queue signal).
    durationDays = addon === "facebook" ? 3 : 7
    expiresAt = new Date(now.getTime() + durationDays * 86_400_000)
  }

  await tx.listingBoostHistory.create({
    data: {
      listingId: order.listingId,
      userId: order.userId ?? undefined,
      fromTier: listing.tier,
      toTier: addon,
      amountTetri: order.amountTetri,
      currency: "GEL",
      provider: order.provider,
      durationDays,
      startedAt: now,
      expiresAt,
    },
  })

  return order.listingId
}

type ExtFields = {
  condition?: string
  buildingStatus?: string
  colorUntil?: string
  urgentUntil?: string
  priceDropUntil?: string
  storyUntil?: string
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

  const ext = listing.extendedFields as ExtFields | null
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
    metroM: metroMeters(listing.lat, listing.lng),
    createdAt: listing.createdAt.toISOString(),
    status: listing.status,
    colorUntil: activeColorUntil(ext),
    urgentUntil: activeUrgentUntil(ext),
    priceDropUntil: activePriceDropUntil(ext),
    storyUntil: activeStoryUntil(ext),
    trustScore: listing.trustScore,
    tier: tierKey,
    tierRank: tierRankOf(listing.tier, listing.tierExpiresAt),
  }
  void indexListing(doc).catch(() => {})
  revalidateTag(MAP_LISTINGS_TAG, "max")
}
