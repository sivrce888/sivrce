/**
 * Shared search-filter plumbing, extracted from /api/search so the route and
 * the saved-search alert matcher build the SAME Prisma where from the SAME
 * param parsing — no parallel matcher.
 */

import { Prisma } from "@/generated/prisma/client"
import { USD_GEL } from "@/data/listings"
import { CONDITION_KEYS, BUILDING_STATUS_KEYS, FEATURE_KEYS } from "@/lib/features"
import { districtSearchValues } from "@/lib/district-canon"
import type { SearchFilters } from "@/lib/search"

// ---------------------------------------------------------------------------
// URL params → SearchFilters (trust-boundary sanitize)
// ---------------------------------------------------------------------------

export function parseSearchParams(sp: URLSearchParams): SearchFilters {
  // Number('undefined'/'abc') is NaN, which Prisma rejects as a missing
  // argument. Non-finite numbers become undefined.
  const num = (key: string) => {
    const raw = sp.get(key)
    if (!raw) return undefined
    const n = Number(raw)
    return Number.isFinite(n) ? n : undefined
  }

  // UI speaks "sale"/"pledge", DB speaks "buy"/"mortgage" (DEALS map in
  // /api/listings). Normalize once at the trust boundary — meili and DB
  // filters both consume this.
  const dealParam = sp.get("dealType")
  const dealType = dealParam === "sale" ? "buy" : dealParam === "pledge" ? "mortgage" : dealParam

  // Free-text / location strings are capped at the trust boundary — a 10MB q
  // would otherwise flow into Meili, ILIKE and Meili filter strings.
  const str = (key: string) => sp.get(key)?.slice(0, 120) || undefined

  // CSV params, whitelisted against the stored vocabulary (src/lib/features).
  const csv = (key: string, allowed: readonly string[]) => {
    const raw = sp.get(key)
    if (!raw) return undefined
    const vals = raw.split(",").filter((v) => allowed.includes(v))
    return vals.length ? vals : undefined
  }
  const curParam = sp.get("cur")

  // Daily-rent dates: YYYY-MM-DD, from ≥ today, from < to. Inline validation
  // (no zod in this codebase — /api/listings precedent); invalid ranges are
  // ignored so search degrades to unfiltered instead of 400-ing.
  const isoDate = (key: string) => {
    const v = sp.get(key)
    return v && /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(`${v}T00:00:00Z`)) ? v : undefined
  }
  const dFrom = isoDate("from")
  const dTo = isoDate("to")
  const today = new Date().toISOString().slice(0, 10)
  const dailyDates = dFrom && dTo && dFrom >= today && dFrom < dTo ? { dailyFrom: dFrom, dailyTo: dTo } : {}

  const sellerParam = sp.get("seller")

  return {
    q: str("q"),
    dealType: (dealType as SearchFilters["dealType"]) ?? undefined,
    propertyType: (sp.get("propertyType") as SearchFilters["propertyType"]) ?? undefined,
    city: str("city"),
    district: str("district"),
    minPrice: num("minPrice"),
    maxPrice: num("maxPrice"),
    minArea: num("minArea"),
    maxArea: num("maxArea"),
    rooms: num("rooms"),
    bedrooms: num("beds"),
    bathrooms: num("baths"),
    floorMin: num("fmin"),
    floorMax: num("fmax"),
    conditions: csv("cond", CONDITION_KEYS),
    buildingStatuses: csv("bstat", BUILDING_STATUS_KEYS),
    features: csv("feat", FEATURE_KEYS),
    hasPhoto: sp.get("photo") === "1" || undefined,
    verifiedOnly: sp.get("verified") === "1" || undefined,
    petsOnly: sp.get("pets") === "1" || undefined,
    sellerType: sellerParam === "owner" || sellerParam === "agency" ? sellerParam : undefined,
    ...dailyDates,
    currency: curParam === "GEL" ? "GEL" : "USD",
    sort: (sp.get("sort") as SearchFilters["sort"]) ?? "date",
    page: num("page") ?? 1,
    pageSize: num("pageSize") ?? 24,
  }
}

// ---------------------------------------------------------------------------
// SearchFilters → Prisma where (DB fallback + saved-search matcher)
// ---------------------------------------------------------------------------

export function buildDbWhere(filters: SearchFilters): Prisma.ListingWhereInput {
  const where: Prisma.ListingWhereInput = {
    deletedAt: null,
    status: "active",
  }
  const and: Prisma.ListingWhereInput[] = []

  if (filters.dealType) where.dealType = filters.dealType as Prisma.ListingWhereInput["dealType"]
  if (filters.propertyType) where.propertyType = filters.propertyType as Prisma.ListingWhereInput["propertyType"]
  if (filters.city) where.city = filters.city
  if (filters.district) {
    const vals = districtSearchValues(filters.district, filters.city)
    where.district = vals.length === 1 ? vals[0]! : { in: vals }
  }
  // Price bounds arrive in filters.currency (default USD): match listings
  // priced in that currency directly, plus converted bounds on the other.
  if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
    const cur = filters.currency === "GEL" ? "GEL" : "USD"
    const other = cur === "USD" ? "GEL" : "USD"
    const conv = (v: number) => (cur === "USD" ? v * USD_GEL : v / USD_GEL)
    const same: Prisma.ListingWhereInput = { currency: cur }
    const cross: Prisma.ListingWhereInput = { currency: other }
    if (filters.minPrice !== undefined) {
      same.price = { gte: filters.minPrice }
      cross.price = { gte: Math.floor(conv(filters.minPrice)) }
    }
    if (filters.maxPrice !== undefined) {
      same.price = { ...(same.price as object ?? {}), lte: filters.maxPrice }
      cross.price = { ...(cross.price as object ?? {}), lte: Math.ceil(conv(filters.maxPrice)) }
    }
    and.push({ OR: [same, cross] })
  }
  if (filters.minArea !== undefined) where.area = { ...(where.area as object ?? {}), gte: filters.minArea }
  if (filters.maxArea !== undefined) where.area = { ...(where.area as object ?? {}), lte: filters.maxArea }
  if (filters.rooms !== undefined) where.rooms = { ...(where.rooms as object ?? {}), gte: filters.rooms }
  if (filters.bedrooms !== undefined) where.bedrooms = { gte: filters.bedrooms }
  if (filters.bathrooms !== undefined) where.bathrooms = { gte: filters.bathrooms }
  if (filters.floorMin !== undefined) where.floor = { ...(where.floor as object ?? {}), gte: filters.floorMin }
  if (filters.floorMax !== undefined) where.floor = { ...(where.floor as object ?? {}), lte: filters.floorMax }
  // JSON extendedFields hold the condition/building-status vocabulary keys.
  if (filters.conditions?.length) {
    and.push({ OR: filters.conditions.map((c) => ({ extendedFields: { path: ["condition"], equals: c } })) })
  }
  if (filters.buildingStatuses?.length) {
    and.push({ OR: filters.buildingStatuses.map((s) => ({ extendedFields: { path: ["buildingStatus"], equals: s } })) })
  }
  if (filters.features?.length) where.features = { hasEvery: filters.features }
  if (filters.hasPhoto) where.images = { isEmpty: false }
  if (filters.verifiedOnly) where.verified = true
  if (filters.petsOnly) where.petsAllowed = true
  if (filters.sellerType) where.sellerType = filters.sellerType

  // Daily-rent availability: drop listings whose confirmed/pending bookings or
  // host-blocked dates overlap the requested [from, to) window. Half-open
  // semantics — checkout day is free for the next guest.
  if (filters.dailyFrom && filters.dailyTo) {
    const from = new Date(`${filters.dailyFrom}T00:00:00Z`)
    const to = new Date(`${filters.dailyTo}T00:00:00Z`)
    and.push({
      dailyRentalBookings: {
        none: {
          status: { in: ["pending", "confirmed"] },
          checkIn: { lt: to },
          checkOut: { gt: from },
        },
      },
      dailyRentalBlockedDates: {
        none: { date: { gte: from, lt: to } },
      },
    })
  }

  // Free-text search: simple ILIKE on title + description (Postgres).
  // ponytail: no tsvector for DB fallback — fine for MVP. Upgrade: enable pg_trgm.
  if (filters.q) {
    and.push({
      OR: [
        { title: { contains: filters.q, mode: "insensitive" } },
        { description: { contains: filters.q, mode: "insensitive" } },
        { city: { contains: filters.q, mode: "insensitive" } },
        { district: { contains: filters.q, mode: "insensitive" } },
        { address: { contains: filters.q, mode: "insensitive" } },
      ],
    })
  }

  if (and.length) where.AND = and
  return where
}
