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
  QUARTER_RE,
  monthsOfQuarter,
  prevQuarterKey,
  quarterStats,
  weightedTotal,
  type DistrictStats,
  type QuarterStats,
  type QuarterSnapshotRow,
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

// ---- Quarterly report editions (/market/2026-Q3) ----

export interface QuarterDistrictReport {
  district: string
  stats: QuarterStats
  qoq: number | null
}

export interface QuarterReport {
  quarter: string
  prevQuarter: string | null
  /** Snapshot months present for the quarter, sorted. */
  monthsPresent: string[]
  total: QuarterStats | null
  totalQoq: number | null
  /** Real freshness stamp: latest snapshot updatedAt in the quarter. */
  dataAsOf: Date | null
  districts: QuarterDistrictReport[]
}

/** Snapshot row + the grouping/stamp fields quarterStats doesn't need. */
interface SnapRow extends QuarterSnapshotRow {
  district: string | null
  updatedAt: Date
}

async function districtRows(city: string, months: string[]) {
  return safeQuery(
    async () =>
      db.marketSnapshot.findMany({
        where: { city, periodMonth: { in: months } },
        orderBy: { periodMonth: "asc" },
      }),
    [] as SnapRow[],
  )
}

/** Georgia-first: the report edition is Tbilisi (city rows are ka-named). */
export async function getQuarterReport(quarter: string): Promise<QuarterReport | null> {
  if (!QUARTER_RE.test(quarter)) return null
  const cached = unstable_cache(
    async (): Promise<QuarterReport> => {
      const months = monthsOfQuarter(quarter)
      const prev = prevQuarterKey(quarter)
      const [rows, prevRows] = await Promise.all([
        districtRows("თბილისი", months),
        prev ? districtRows("თბილისი", monthsOfQuarter(prev)) : Promise.resolve([]),
      ])
      const monthsPresent = [...new Set(rows.map((r) => r.periodMonth))].sort()

      const byDistrict = new Map<string, QuarterSnapshotRow[]>()
      for (const r of rows) {
        const list = byDistrict.get(r.district ?? "")
        if (list) list.push(r)
        else byDistrict.set(r.district ?? "", [r])
      }
      const prevByDistrict = new Map<string, QuarterSnapshotRow[]>()
      for (const r of prevRows) {
        const list = prevByDistrict.get(r.district ?? "")
        if (list) list.push(r)
        else prevByDistrict.set(r.district ?? "", [r])
      }

      const districts: QuarterDistrictReport[] = []
      for (const [district, rows] of byDistrict) {
        if (!district) continue
        const stats = quarterStats(rows)
        if (!stats) continue
        const prevStats = quarterStats(prevByDistrict.get(district) ?? [])
        districts.push({ district, stats, qoq: momDeltaPct(stats.avgPerM2USD, prevStats?.avgPerM2USD) })
      }
      districts.sort((a, b) => b.stats.activeEnd - a.stats.activeEnd)

      // City total: weighted $/m² mean, sums elsewhere; no city median —
      // district medians don't re-median honestly.
      const statsList = districts.map((d) => d.stats)
      const weight = statsList.reduce((a, s) => a + s.activeEnd, 0)
      const total: QuarterStats | null = statsList.length ? {
        months: Math.max(...statsList.map((s) => s.months)),
        avgPerM2USD: weightedTotal(statsList)!,
        medianPriceUSD: null,
        soldCount: statsList.reduce((a, s) => a + s.soldCount, 0),
        newListings: statsList.reduce((a, s) => a + s.newListings, 0),
        activeEnd: weight,
        avgDomDays: Math.round(statsList.reduce((a, s) => a + s.avgDomDays * s.activeEnd, 0) / Math.max(1, weight)),
      } : null
      const prevTotal = (() => {
        const prevStats = [...prevByDistrict.values()]
          .map((rows) => quarterStats(rows))
          .filter((s): s is QuarterStats => !!s)
        return prevStats.length ? weightedTotal(prevStats) : null
      })()

      const dataAsOf = rows.reduce<Date | null>((acc, r) => (!acc || r.updatedAt > acc ? r.updatedAt : acc), null)

      return {
        quarter, prevQuarter: prev, monthsPresent,
        total, totalQoq: total ? momDeltaPct(total.avgPerM2USD, prevTotal) : null,
        dataAsOf,
        districts,
      }
    },
    ["quarter-report", quarter],
    { revalidate: 3600 },
  )
  return cached()
}

/** Quarters with ≥2 Tbilisi district snapshots — sitemap lists only real
 *  editions (a thinner quarter is noindex on the page; never list it here). */
export async function reportedQuarters(): Promise<string[]> {
  return safeQuery(async () => {
    const rows = await db.marketSnapshot.groupBy({
      by: ["periodMonth", "district"],
      where: { city: "თბილისი", district: { not: null } },
    })
    const districtsPerQuarter = new Map<string, Set<string>>()
    for (const { periodMonth, district } of rows) {
      const q = `${periodMonth.slice(0, 4)}-Q${Math.floor((Number(periodMonth.slice(5)) - 1) / 3) + 1}`
      const set = districtsPerQuarter.get(q) ?? new Set<string>()
      if (district) set.add(district)
      districtsPerQuarter.set(q, set)
    }
    return [...districtsPerQuarter.entries()]
      .filter(([, set]) => set.size >= 2)
      .map(([q]) => q)
      .sort()
  }, [])
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
