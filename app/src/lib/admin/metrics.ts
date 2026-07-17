import { Prisma } from "@/generated/prisma/client"
import { db } from "@/lib/db"

/** Dashboard data access — one Promise.all, everything aggregated DB-side. */

export interface TrendPoint {
  /** UTC day key, YYYY-MM-DD */
  date: string
  count: number
}

export interface DistributionItem {
  label: string
  count: number
}

export interface AuditEntry {
  id: string
  actorName: string
  action: string
  targetType: string
  createdAt: Date
}

export interface InquiryEntry {
  id: string
  buyerName: string
  city: string
  status: string
  price: number
  createdAt: Date
}

export interface DashboardMetrics {
  activeListings: number
  totalUsers: number
  newUsersThisWeek: number
  pendingModeration: number
  openComplaints: number
  gelRevenueTetri: number
  stripeRevenueCents: number
  monthStart: Date
  liveAuctions: number
  listingTrend: TrendPoint[]
  userTrend: TrendPoint[]
  unresolvedFraud: number
  vipExpiringSoon: number
  staleInquiries: number
  failedPayments: number
  latestAudit: AuditEntry[]
  latestInquiries: InquiryEntry[]
  dealTypes: DistributionItem[]
  propertyTypes: DistributionItem[]
  cities: DistributionItem[]
}

const DAY_MS = 86_400_000
const HOUR_MS = 3_600_000
const TREND_DAYS = 30

function dayKey(d: Date): string {
  return d.toISOString().slice(0, 10)
}

/** Dense 30-day series — DB returns only non-empty days, gaps become 0. */
function fillSeries(rows: { day: Date; count: number }[], from: Date): TrendPoint[] {
  const byDay = new Map(rows.map((r) => [dayKey(r.day), Number(r.count)]))
  const out: TrendPoint[] = []
  for (let i = 0; i < TREND_DAYS; i++) {
    const key = dayKey(new Date(from.getTime() + i * DAY_MS))
    out.push({ date: key, count: byDay.get(key) ?? 0 })
  }
  return out
}

function prettyLabel(raw: string): string {
  const s = raw.replaceAll("_", " ")
  return s.charAt(0).toUpperCase() + s.slice(1)
}

export async function getDashboardMetrics(): Promise<DashboardMetrics> {
  const now = new Date()
  const trendFrom = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - (TREND_DAYS - 1)),
  )
  const weekAgo = new Date(now.getTime() - 7 * DAY_MS)
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1))
  const vipHorizon = new Date(now.getTime() + 7 * DAY_MS)
  const staleBefore = new Date(now.getTime() - 48 * HOUR_MS)

  const [
    activeListings,
    totalUsers,
    newUsersThisWeek,
    pendingModeration,
    openComplaints,
    gelRevenue,
    stripeRevenue,
    liveAuctions,
    listingTrendRows,
    userTrendRows,
    unresolvedFraud,
    vipExpiringSoon,
    staleInquiries,
    failedGeorgian,
    failedStripe,
    latestAudit,
    latestInquiries,
    dealTypeRows,
    propertyTypeRows,
    cityRows,
  ] = await Promise.all([
    db.listing.count({ where: { status: "active", deletedAt: null } }),
    db.user.count(),
    db.user.count({ where: { createdAt: { gte: weekAgo } } }),
    db.moderationQueue.count({ where: { status: { in: ["pending", "in_review"] } } }),
    db.complaint.count({ where: { status: { in: ["open", "under_review"] } } }),
    db.georgianPaymentOrder.aggregate({
      _sum: { amountTetri: true },
      where: {
        status: "paid",
        deletedAt: null,
        OR: [
          { paidAt: { gte: monthStart } },
          { paidAt: null, createdAt: { gte: monthStart } },
        ],
      },
    }),
    db.stripeOrder.aggregate({
      _sum: { amountCents: true },
      where: { status: "paid", createdAt: { gte: monthStart } },
    }),
    db.auction.count({ where: { status: "live" } }),
    // Grouped DB-side per UTC day — no row materialisation in JS.
    db.$queryRaw<{ day: Date; count: number }[]>(Prisma.sql`
      SELECT date_trunc('day', "created_at") AS day, COUNT(*)::int AS count
      FROM "listings"
      WHERE "deleted_at" IS NULL AND "created_at" >= ${trendFrom}
      GROUP BY 1
      ORDER BY 1
    `),
    db.$queryRaw<{ day: Date; count: number }[]>(Prisma.sql`
      SELECT date_trunc('day', "created_at") AS day, COUNT(*)::int AS count
      FROM "users"
      WHERE "created_at" >= ${trendFrom}
      GROUP BY 1
      ORDER BY 1
    `),
    db.fraudSignal.count({ where: { isActive: true, resolvedAt: null } }),
    db.listing.count({
      where: {
        deletedAt: null,
        tier: { not: "standard" },
        tierExpiresAt: { gte: now, lte: vipHorizon },
      },
    }),
    db.inquiry.count({
      where: { deletedAt: null, status: "new", createdAt: { lt: staleBefore } },
    }),
    db.georgianPaymentOrder.count({ where: { status: "failed", deletedAt: null } }),
    db.stripeOrder.count({ where: { status: "failed" } }),
    db.adminAuditLog.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: "desc" },
      take: 8,
      select: {
        id: true,
        actorName: true,
        action: true,
        targetType: true,
        createdAt: true,
      },
    }),
    db.inquiry.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        buyerName: true,
        city: true,
        status: true,
        price: true,
        createdAt: true,
      },
    }),
    db.listing.groupBy({
      by: ["dealType"],
      where: { deletedAt: null },
      _count: { _all: true },
    }),
    db.listing.groupBy({
      by: ["propertyType"],
      where: { deletedAt: null },
      _count: { _all: true },
    }),
    db.listing.groupBy({
      by: ["city"],
      where: { deletedAt: null },
      _count: { city: true },
      orderBy: { _count: { city: "desc" } },
      take: 8,
    }),
  ])

  return {
    activeListings,
    totalUsers,
    newUsersThisWeek,
    pendingModeration,
    openComplaints,
    gelRevenueTetri: gelRevenue._sum.amountTetri ?? 0,
    stripeRevenueCents: stripeRevenue._sum.amountCents ?? 0,
    monthStart,
    liveAuctions,
    listingTrend: fillSeries(listingTrendRows, trendFrom),
    userTrend: fillSeries(userTrendRows, trendFrom),
    unresolvedFraud,
    vipExpiringSoon,
    staleInquiries,
    failedPayments: failedGeorgian + failedStripe,
    latestAudit,
    latestInquiries,
    dealTypes: dealTypeRows
      .map((r) => ({ label: prettyLabel(r.dealType), count: r._count._all }))
      .sort((a, b) => b.count - a.count),
    propertyTypes: propertyTypeRows
      .map((r) => ({ label: prettyLabel(r.propertyType), count: r._count._all }))
      .sort((a, b) => b.count - a.count),
    cities: cityRows.map((r) => ({ label: r.city, count: r._count.city })),
  }
}
