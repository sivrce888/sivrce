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
import projectDistricts from "@/data/project-districts.gen.json"
import {
  MIN_SAMPLE,
  periodKey,
  statsFromRows,
  momDeltaPct,
  medianOf,
  type DistrictStats,
  type StatRow,
} from "./market-stats-core"

export type { DistrictStats, StatRow } from "./market-stats-core"
/** $/m² stats are sale prices. Rent (monthly $/m²), daily and pledge (loan
 *  amount) rows are different units — mixing them made the average meaningless. */
const SALE = { dealType: "buy" as const }

export { MIN_SAMPLE, medianOf, momDeltaPct, periodKey, statsFromRows } from "./market-stats-core"

const ROW_CAP = 10_000

export interface DistrictMarketRow {
  district: string
  stats: DistrictStats
  mom: number | null
}

export interface MarketOverview {
  total: DistrictStats | null
  totalMom: number | null
  districts: DistrictMarketRow[]
}

/**
 * Platform-wide live overview for the public /market page: totals plus a
 * per-district board, MoM from last month's snapshots (read-only, page-safe).
 */
export async function getMarketOverview(usdGel: number): Promise<MarketOverview> {
  const cached = unstable_cache(
    async () => {
      const rows = await safeQuery(
        async () =>
          db.listing.findMany({
            // Georgia-branded market page: global listings would skew the board.
            where: { ...SALE, status: "active", deletedAt: null, country: "GE" },
            select: {
              district: true,
              pricePerSqm: true,
              currency: true,
              price: true,
              createdAt: true,
            },
            take: ROW_CAP,
          }),
        [],
      )
      const byDistrict = new Map<string, StatRow[]>()
      for (const r of rows) {
        if (!r.district) continue
        const list = byDistrict.get(r.district)
        if (list) list.push(r)
        else byDistrict.set(r.district, [r])
      }
      const names = [...byDistrict.keys()]
      const snaps = names.length
        ? await safeQuery(
            async () =>
              db.marketSnapshot.findMany({
                where: { district: { in: names }, periodMonth: prevMonthKey() },
                select: { district: true, avgPricePerSqm: true },
              }),
            [],
          )
        : []
      const prev = new Map(snaps.map((s) => [s.district, s.avgPricePerSqm]))
      const prevMean = snaps.length
        ? snaps.reduce((a, s) => a + s.avgPricePerSqm, 0) / snaps.length
        : null
      const total = statsFromRows(rows, usdGel)
      const districts = names
        .map((district) => {
          const list = byDistrict.get(district)!
          const stats = statsFromRows(list, usdGel)
          return stats
            ? { district, stats, mom: momDeltaPct(stats.avgPerM2USD, prev.get(district)) }
            : null
        })
        .filter((d): d is DistrictMarketRow => d !== null)
        .sort(
          (a, b) =>
            b.stats.activeCount - a.stats.activeCount || b.stats.sample - a.stats.sample,
        )
      return {
        total,
        totalMom: total ? momDeltaPct(total.avgPerM2USD, prevMean) : null,
        districts,
      }
    },
    ["market-overview", String(usdGel)],
    { revalidate: 3600 },
  )
  return cached()
}

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
            where: { ...SALE, city, district: { in: districts }, status: "active", deletedAt: null },
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
    where: { ...SALE, status: "active", deletedAt: null, pricePerSqm: { gt: 0 } },
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
          where: { ...SALE, city, district, status: "active", deletedAt: null },
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

// ---- Tbilisi raion medians from the new-development directory (price map) ---

const TBILISI_RAIONS = [
  "მთაწმინდა", "ვაკე", "საბურთალო", "კრწანისი", "ისანი",
  "სამგორი", "ჩუღურეთი", "დიდუბე", "ნაძალადევი", "გლდანი",
] as const

export interface RaionMedian {
  district: string
  median: number
  n: number
}

/** Median asking $/m² of active new-development projects per Tbilisi raion.
 *  Raions come from the coord-derived overrides (project-districts.gen.json) —
 *  the raw district column mixes in street strings. Cached daily. */
export async function getProjectRaionMedians(): Promise<RaionMedian[]> {
  const cached = unstable_cache(
    async () => {
      const rows = await safeQuery(
        async () =>
          db.projectDirectory.findMany({
            where: { deletedAt: null, city: "თბილისი", pricePerSqmFrom: { gt: 0 } },
            select: { slug: true, pricePerSqmFrom: true },
          }),
        [],
      )
      const byRaion = new Map<string, number[]>()
      for (const r of rows) {
        const raion = (projectDistricts as Record<string, string>)[r.slug]
        if (!raion || !(TBILISI_RAIONS as readonly string[]).includes(raion)) continue
        const list = byRaion.get(raion) ?? []
        list.push(r.pricePerSqmFrom)
        byRaion.set(raion, list)
      }
      return TBILISI_RAIONS.flatMap((name) => {
        const vals = byRaion.get(name)
        if (!vals || vals.length < MIN_SAMPLE) return []
        return [{ district: name, median: Math.round(medianOf(vals) ?? 0), n: vals.length }]
      })
    },
    ["ge-project-raion-medians"],
    { revalidate: 86_400 },
  )
  return cached()
}
