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
  newListingsThisWeek: number
  pendingModeration: number
  openComplaints: number
  gelRevenueTetri: number
  stripeRevenueCents: number
  /** Revenue vs the same elapsed span of the previous month, %; null when no baseline. */
  revenueDeltaPct: number | null
  /** Users gained in the last 7 days vs the 7 before that, %; null when no baseline. */
  userDelta7d: number | null
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
  /** Distinct users with an authenticated request since UTC midnight. */
  activeUsersToday: number
  activeUsers7d: number
  newUsersToday: number
  /** First-touch acquisition sources, most common first. */
  signupSources: DistributionItem[]
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

/** Last-7-days vs the 7 before that, in %; null when the baseline week is empty. */
function last7Delta(series: TrendPoint[]): number | null {
  const last = series.slice(-7).reduce((s, p) => s + p.count, 0)
  const prev = series.slice(-14, -7).reduce((s, p) => s + p.count, 0)
  if (prev === 0) return null
  return Math.round(((last - prev) / prev) * 1000) / 10
}

export async function getDashboardMetrics(): Promise<DashboardMetrics> {
  const now = new Date()
  const todayStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
  const trendFrom = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - (TREND_DAYS - 1)),
  )
  const weekAgo = new Date(now.getTime() - 7 * DAY_MS)
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1))
  // Same elapsed span of the previous month, so "revenue so far" compares like for like.
  const prevMonthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1))
  const prevMonthElapsedEnd = new Date(
    prevMonthStart.getTime() + (now.getTime() - monthStart.getTime()),
  )
  const vipHorizon = new Date(now.getTime() + 7 * DAY_MS)
  const staleBefore = new Date(now.getTime() - 48 * HOUR_MS)

  const [
    activeListings,
    totalUsers,
    newUsersThisWeek,
    pendingModeration,
    openComplaints,
    gelRevenue,
    prevGelRevenue,
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
    activeUsersToday,
    activeUsers7d,
    newUsersToday,
    signupSourceRows,
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
    db.georgianPaymentOrder.aggregate({
      _sum: { amountTetri: true },
      where: {
        status: "paid",
        deletedAt: null,
        OR: [
          { paidAt: { gte: prevMonthStart, lt: prevMonthElapsedEnd } },
          {
            paidAt: null,
            createdAt: { gte: prevMonthStart, lt: prevMonthElapsedEnd },
          },
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
    db.user.count({ where: { lastSeenAt: { gte: todayStart } } }),
    db.user.count({ where: { lastSeenAt: { gte: weekAgo } } }),
    db.user.count({ where: { createdAt: { gte: todayStart } } }),
    db.user.groupBy({ by: ["signupSource"], _count: { _all: true } }),
  ])

  const listingTrendList = fillSeries(listingTrendRows, trendFrom)
  const userTrendList = fillSeries(userTrendRows, trendFrom)
  const prevGel = prevGelRevenue._sum.amountTetri ?? 0
  const curGel = gelRevenue._sum.amountTetri ?? 0

  return {
    activeListings,
    totalUsers,
    newUsersThisWeek,
    newListingsThisWeek: listingTrendList.slice(-7).reduce((s, p) => s + p.count, 0),
    pendingModeration,
    openComplaints,
    gelRevenueTetri: curGel,
    stripeRevenueCents: stripeRevenue._sum.amountCents ?? 0,
    // GEL-only baseline — Stripe (USD) is shown as a hint, never mixed into the ratio.
    revenueDeltaPct: prevGel === 0 ? null : Math.round(((curGel - prevGel) / prevGel) * 1000) / 10,
    userDelta7d: last7Delta(userTrendList),
    monthStart,
    liveAuctions,
    listingTrend: listingTrendList,
    userTrend: userTrendList,
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
    activeUsersToday,
    activeUsers7d,
    newUsersToday,
    signupSources: signupSourceRows
      .map((r) => ({ label: r.signupSource ?? "unknown", count: r._count._all }))
      .sort((a, b) => b.count - a.count),
  }
}

// ── Full statistics page (/admin/stats) ───────────────────────────────────

export interface EngagementRow {
  label: string
  today: number
  d7: number
  total: number
}

export interface PlatformStats {
  totalUsers: number
  activeToday: number
  active7d: number
  active30d: number
  newToday: number
  new7d: number
  verifiedEmails: number
  verifiedPhones: number
  avgTrust: number
  roles: DistributionItem[]
  providers: DistributionItem[]
  signupSources: DistributionItem[]
  engagement: EngagementRow[]
  listingStatuses: DistributionItem[]
  listingTiers: DistributionItem[]
  auctionStatuses: DistributionItem[]
  subscriptionTiers: DistributionItem[]
  subscriptionStatuses: DistributionItem[]
  gelTodayTetri: number
  gelMonthTetri: number
  gelOrdersToday: number
  usdTodayCents: number
  usdMonthCents: number
  failedPayments: number
  leadSales: number
  leadRevenueTetri: number
  inquiryTrend: TrendPoint[]
}

/** today / last-7-days / all-time counts for one event stream. */
function spanCounts(
  fn: (since?: Date) => Promise<number>,
  today: Date,
  week: Date,
): Promise<[number, number, number]> {
  return Promise.all([fn(today), fn(week), fn(undefined)]) as Promise<[number, number, number]>
}

export async function getPlatformStats(): Promise<PlatformStats> {
  const now = new Date()
  const todayStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
  const trendFrom = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - (TREND_DAYS - 1)),
  )
  const weekAgo = new Date(now.getTime() - 7 * DAY_MS)
  const d30 = new Date(now.getTime() - 30 * DAY_MS)
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1))

  const paidGelWhere = (since: Date) => ({
    status: "paid",
    deletedAt: null,
    OR: [{ paidAt: { gte: since } }, { paidAt: null, createdAt: { gte: since } }],
  })

  const noDelete = { deletedAt: null }
  const engagementDefs: { label: string; count: (since?: Date) => Promise<number> }[] = [
    {
      label: "Listings published",
      count: (s) => db.listing.count({ where: { ...noDelete, ...(s && { createdAt: { gte: s } }) } }),
    },
    {
      label: "Inquiries sent",
      count: (s) => db.inquiry.count({ where: { ...noDelete, ...(s && { createdAt: { gte: s } }) } }),
    },
    {
      label: "Chat messages",
      count: (s) => db.chatMessage.count({ where: s ? { createdAt: { gte: s } } : {} }),
    },
    {
      label: "Auction bids",
      count: (s) => db.bid.count({ where: s ? { placedAt: { gte: s } } : {} }),
    },
    {
      label: "Tours booked",
      count: (s) => db.propertyTour.count({ where: s ? { createdAt: { gte: s } } : {} }),
    },
    {
      label: "Listings saved",
      count: (s) => db.savedListing.count({ where: { ...noDelete, ...(s && { createdAt: { gte: s } }) } }),
    },
    {
      label: "Reviews posted",
      count: (s) => db.review.count({ where: { ...noDelete, ...(s && { createdAt: { gte: s } }) } }),
    },
    {
      label: "Forum replies",
      count: (s) => db.forumReply.count({ where: { ...noDelete, ...(s && { createdAt: { gte: s } }) } }),
    },
    {
      label: "Searches saved",
      count: (s) => db.savedSearch.count({ where: { ...noDelete, ...(s && { createdAt: { gte: s } }) } }),
    },
  ]

  const [
    totalUsers,
    activeToday,
    active7d,
    active30d,
    newToday,
    new7d,
    verifiedEmails,
    verifiedPhones,
    avgTrustAgg,
    roleRows,
    providerRows,
    sourceRows,
    engagementRows,
    listingStatusRows,
    listingTierRows,
    auctionStatusRows,
    subTierRows,
    subStatusRows,
    gelTodayAgg,
    gelMonthAgg,
    gelTodayCount,
    usdTodayAgg,
    usdMonthAgg,
    failedGeorgian,
    failedStripe,
    leadAgg,
    inquiryTrendRows,
  ] = await Promise.all([
    db.user.count(),
    db.user.count({ where: { lastSeenAt: { gte: todayStart } } }),
    db.user.count({ where: { lastSeenAt: { gte: weekAgo } } }),
    db.user.count({ where: { lastSeenAt: { gte: d30 } } }),
    db.user.count({ where: { createdAt: { gte: todayStart } } }),
    db.user.count({ where: { createdAt: { gte: weekAgo } } }),
    db.user.count({ where: { emailVerified: { not: null } } }),
    db.user.count({ where: { phoneVerifiedAt: { not: null } } }),
    db.user.aggregate({ _avg: { trustScore: true } }),
    db.user.groupBy({ by: ["role"], _count: { _all: true } }),
    db.account.groupBy({ by: ["provider"], _count: { _all: true } }),
    db.user.groupBy({ by: ["signupSource"], _count: { _all: true } }),
    Promise.all(engagementDefs.map((d) => spanCounts(d.count, todayStart, weekAgo))),
    db.listing.groupBy({ by: ["status"], where: { deletedAt: null }, _count: { _all: true } }),
    db.listing.groupBy({ by: ["tier"], where: { deletedAt: null }, _count: { _all: true } }),
    db.auction.groupBy({ by: ["status"], _count: { _all: true } }),
    db.subscription.groupBy({ by: ["tier"], where: { status: "active" }, _count: { _all: true } }),
    db.subscription.groupBy({ by: ["status"], _count: { _all: true } }),
    db.georgianPaymentOrder.aggregate({ _sum: { amountTetri: true }, where: paidGelWhere(todayStart) }),
    db.georgianPaymentOrder.aggregate({ _sum: { amountTetri: true }, where: paidGelWhere(monthStart) }),
    db.georgianPaymentOrder.count({ where: paidGelWhere(todayStart) }),
    db.stripeOrder.aggregate({ _sum: { amountCents: true }, where: { status: "paid", createdAt: { gte: todayStart } } }),
    db.stripeOrder.aggregate({ _sum: { amountCents: true }, where: { status: "paid", createdAt: { gte: monthStart } } }),
    db.georgianPaymentOrder.count({ where: { status: "failed", deletedAt: null } }),
    db.stripeOrder.count({ where: { status: "failed" } }),
    db.leadPurchase.aggregate({ _count: { _all: true }, _sum: { price: true }, where: { currency: "GEL" } }),
    db.$queryRaw<{ day: Date; count: number }[]>(Prisma.sql`
      SELECT date_trunc('day', "created_at") AS day, COUNT(*)::int AS count
      FROM "inquiries"
      WHERE "deleted_at" IS NULL AND "created_at" >= ${trendFrom}
      GROUP BY 1
      ORDER BY 1
    `),
  ])

  const engagement: EngagementRow[] = engagementDefs.map((d, i) => ({
    label: d.label,
    today: engagementRows[i][0],
    d7: engagementRows[i][1],
    total: engagementRows[i][2],
  }))
  const byCount = (rows: { label: string; count: number }[]) =>
    rows.sort((a, b) => b.count - a.count)

  return {
    totalUsers,
    activeToday,
    active7d,
    active30d,
    newToday,
    new7d,
    verifiedEmails,
    verifiedPhones,
    avgTrust: Math.round(avgTrustAgg._avg.trustScore ?? 0),
    roles: byCount(roleRows.map((r) => ({ label: prettyLabel(r.role), count: r._count._all }))),
    providers: byCount(providerRows.map((r) => ({ label: prettyLabel(r.provider), count: r._count._all }))),
    signupSources: byCount(sourceRows.map((r) => ({ label: r.signupSource ?? "unknown", count: r._count._all }))),
    engagement,
    listingStatuses: byCount(listingStatusRows.map((r) => ({ label: prettyLabel(r.status), count: r._count._all }))),
    listingTiers: byCount(listingTierRows.map((r) => ({ label: prettyLabel(r.tier), count: r._count._all }))),
    auctionStatuses: byCount(auctionStatusRows.map((r) => ({ label: prettyLabel(r.status), count: r._count._all }))),
    subscriptionTiers: byCount(subTierRows.map((r) => ({ label: prettyLabel(r.tier), count: r._count._all }))),
    subscriptionStatuses: byCount(subStatusRows.map((r) => ({ label: prettyLabel(r.status), count: r._count._all }))),
    gelTodayTetri: gelTodayAgg._sum.amountTetri ?? 0,
    gelMonthTetri: gelMonthAgg._sum.amountTetri ?? 0,
    gelOrdersToday: gelTodayCount,
    usdTodayCents: usdTodayAgg._sum.amountCents ?? 0,
    usdMonthCents: usdMonthAgg._sum.amountCents ?? 0,
    failedPayments: failedGeorgian + failedStripe,
    leadSales: leadAgg._count._all,
    leadRevenueTetri: (leadAgg._sum.price ?? 0) * 100,
    inquiryTrend: fillSeries(inquiryTrendRows, trendFrom),
  }
}
