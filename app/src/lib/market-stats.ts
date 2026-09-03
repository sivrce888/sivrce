/**
 * SIVRCE — District market stats + monthly snapshots ("Bloomberg" layer).
 * Live stats aggregate active listings; MarketSnapshot rows accumulate
 * month-by-month history via the nightly cron (upsert, deduped by unique key).
 * Pure math lives in market-stats-core.ts (check-file safe).
 *
 * ponytail: JS-side aggregation over one capped query per district.
 * Upgrade path: SQL GROUP BY + materialized view when inventory outgrows it.
 */

import { db } from "@/lib/db"
import { safeQuery } from "@/lib/guards"
import { unstable_cache } from "next/cache"
import {
  MIN_SAMPLE,
  periodKey,
  statsFromRows,
  momDeltaPct,
  type DistrictStats,
} from "./market-stats-core"

export type { DistrictStats, StatRow } from "./market-stats-core"
export { MIN_SAMPLE, medianOf, momDeltaPct, periodKey, statsFromRows } from "./market-stats-core"

const ROW_CAP = 10_000

function prevMonthKey(now: number = Date.now()): string {
  const d = new Date(now)
  return periodKey(new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() - 1, 1)))
}

/** Mean MoM Δ% across the neighborhood's districts (exact when it has one). */
async function prevMonthDelta(
  city: string,
  districts: string[],
  currentAvg: number,
): Promise<number | null> {
  const snaps = await safeQuery(
    async () =>
      db.marketSnapshot.findMany({
        where: { city, district: { in: districts }, periodMonth: prevMonthKey() },
        select: { avgPricePerSqm: true },
      }),
    [],
  )
  if (!snaps.length) return null
  const mean = snaps.reduce((a, s) => a + s.avgPricePerSqm, 0) / snaps.length
  return momDeltaPct(currentAvg, mean)
}

/** Cached live stats for a neighborhood's district set (read-only, page-safe). */
export async function getNeighborhoodMarketStats(
  city: string,
  districts: string[],
  usdGel: number,
): Promise<{ stats: DistrictStats | null; mom: number | null }> {
  const cached = unstable_cache(
    async () => {
      const rows = await safeQuery(
        async () =>
          db.listing.findMany({
            where: { city, district: { in: districts }, status: "active", deletedAt: null },
            select: { pricePerSqm: true, currency: true, price: true, createdAt: true },
            take: ROW_CAP,
          }),
        [],
      )
      const stats = statsFromRows(rows, usdGel)
      const mom = stats && stats.sample >= MIN_SAMPLE
        ? await prevMonthDelta(city, districts, stats.avgPerM2USD)
        : null
      return { stats, mom }
    },
    ["nb-market", city, districts.join(",")],
    { revalidate: 3600 },
  )
  return cached()
}

/**
 * Nightly cron: upsert this month's snapshot per (city, district).
 * soldCount comes from real owner-marked sales (listing.soldAt).
 */
export async function writeMonthlySnapshots(): Promise<{ districts: number; written: number }> {
  const pairs = await db.listing.findMany({
    where: { status: "active", deletedAt: null, pricePerSqm: { gt: 0 } },
    select: { city: true, district: true },
    distinct: ["city", "district"],
  })
  const key = periodKey(new Date())
  const monthStart = new Date(`${key}-01T00:00:00Z`)
  let written = 0
  for (const { city, district } of pairs) {
    const rows = await safeQuery(
      async () =>
        db.listing.findMany({
          where: { city, district, status: "active", deletedAt: null },
          select: { pricePerSqm: true, currency: true, price: true, createdAt: true },
          take: ROW_CAP,
        }),
      [],
    )
    const stats = statsFromRows(rows, 2.7)
    if (!stats) continue
    // Real sold outcomes this month (0 until owners mark sales).
    const soldCount = await db.listing.count({
      where: { city, district, soldAt: { gte: monthStart } },
    })
    await db.marketSnapshot.upsert({
      // ponytail: compound-unique input name derives from the fields, not the map alias.
      where: { city_district_periodMonth: { city, district, periodMonth: key } },
      create: {
        city,
        district,
        periodMonth: key,
        avgPricePerSqm: stats.avgPerM2USD,
        medianPrice: stats.medianPriceUSD,
        soldCount,
        avgDaysOnMarket: stats.avgDomDays,
        newListingsCount: stats.newListings,
        activeListingsCount: stats.activeCount,
      },
      update: {
        avgPricePerSqm: stats.avgPerM2USD,
        medianPrice: stats.medianPriceUSD,
        soldCount,
        avgDaysOnMarket: stats.avgDomDays,
        newListingsCount: stats.newListings,
        activeListingsCount: stats.activeCount,
      },
    })
    written += 1
  }
  return { districts: pairs.length, written }
}
