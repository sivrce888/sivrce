import { ADMIN_PAGE_SIZE } from "@/lib/admin/query"
import { db } from "@/lib/db"

export const PAYMENT_TABS = [
  { value: "georgian", label: "Georgian orders" },
  { value: "stripe", label: "Stripe orders" },
  { value: "subscriptions", label: "Subscriptions" },
  { value: "leads", label: "Lead purchases" },
] as const

export type PaymentTab = (typeof PAYMENT_TABS)[number]["value"]

export function isPaymentTab(v: string): v is PaymentTab {
  return (PAYMENT_TABS as readonly { value: string }[]).some((t) => t.value === v)
}

export const GEORGIAN_ORDER_STATUSES = [
  { value: "pending", label: "Pending" },
  { value: "paid", label: "Paid" },
  { value: "failed", label: "Failed" },
  { value: "refunded", label: "Refunded" },
  { value: "disputed", label: "Disputed" },
] as const

export const STRIPE_ORDER_STATUSES = [
  { value: "pending", label: "Pending" },
  { value: "succeeded", label: "Succeeded" },
  { value: "failed", label: "Failed" },
  { value: "canceled", label: "Canceled" },
  { value: "refunded", label: "Refunded" },
] as const

function monthStart(): Date {
  const d = new Date()
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1))
}

/** This-month revenue: paid Georgian orders + succeeded Stripe orders, active subs, lead sales. */
export async function getRevenueStats() {
  const since = monthStart()
  const [geo, stripe, activeSubs, leads] = await Promise.all([
    db.georgianPaymentOrder.aggregate({
      _sum: { amountTetri: true },
      where: { status: "paid", paidAt: { gte: since }, deletedAt: null },
    }),
    db.stripeOrder.aggregate({
      _sum: { amountCents: true },
      where: { status: "succeeded", createdAt: { gte: since } },
    }),
    db.subscription.count({ where: { status: { in: ["active", "trialing"] } } }),
    db.leadPurchase.aggregate({
      _sum: { price: true },
      where: { purchasedAt: { gte: since } },
    }),
  ])
  return {
    georgianTetri: geo._sum.amountTetri ?? 0,
    stripeCents: stripe._sum.amountCents ?? 0,
    activeSubs,
    leadRevenue: leads._sum.price ?? 0,
  }
}

/** Batch-resolve user ids → "name (email)" labels for models without a user relation. */
export async function userLabels(ids: readonly (string | null)[]): Promise<Map<string, string>> {
  const unique = [...new Set(ids.filter((x): x is string => typeof x === "string" && x.length > 0))]
  if (unique.length === 0) return new Map()
  const users = await db.user.findMany({
    where: { id: { in: unique } },
    select: { id: true, name: true, email: true },
  })
  return new Map(users.map((u) => [u.id, u.name ? `${u.name} (${u.email})` : u.email]))
}

export async function listGeorgianOrders(page: number, status: string) {
  const where = {
    deletedAt: null,
    ...(status ? { status } : {}),
  }
  const [rows, total] = await Promise.all([
    db.georgianPaymentOrder.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * ADMIN_PAGE_SIZE,
      take: ADMIN_PAGE_SIZE,
    }),
    db.georgianPaymentOrder.count({ where }),
  ])
  return { rows, total }
}

export async function listStripeOrders(page: number, status: string) {
  const where = status ? { status } : {}
  const [rows, total] = await Promise.all([
    db.stripeOrder.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * ADMIN_PAGE_SIZE,
      take: ADMIN_PAGE_SIZE,
    }),
    db.stripeOrder.count({ where }),
  ])
  return { rows, total }
}

export async function listSubscriptions(page: number) {
  const [rows, total] = await Promise.all([
    db.subscription.findMany({
      include: { user: { select: { name: true, email: true } } },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * ADMIN_PAGE_SIZE,
      take: ADMIN_PAGE_SIZE,
    }),
    db.subscription.count(),
  ])
  return { rows, total }
}

export async function listLeadPurchases(page: number) {
  const [rows, total] = await Promise.all([
    db.leadPurchase.findMany({
      include: { inquiry: { select: { buyerName: true, city: true, district: true } } },
      orderBy: { purchasedAt: "desc" },
      skip: (page - 1) * ADMIN_PAGE_SIZE,
      take: ADMIN_PAGE_SIZE,
    }),
    db.leadPurchase.count(),
  ])
  return { rows, total }
}
