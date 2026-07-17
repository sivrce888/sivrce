import type { Prisma } from "@/generated/prisma/client"
import {
  ListingDealType,
  ListingPropertyType,
  ListingStatus,
  ListingTier,
} from "@/generated/prisma/enums"

import { param, type SearchParams } from "@/lib/admin/query"

/** FilterSelect option lists — values come straight from the Prisma enums. */
export const DEAL_TYPE_OPTIONS = [
  { value: ListingDealType.buy, label: "Buy" },
  { value: ListingDealType.rent, label: "Rent" },
  { value: ListingDealType.daily, label: "Daily" },
  { value: ListingDealType.mortgage, label: "Mortgage" },
] as const

export const PROPERTY_TYPE_OPTIONS = [
  { value: ListingPropertyType.apartment, label: "Apartment" },
  { value: ListingPropertyType.house, label: "House" },
  { value: ListingPropertyType.villa, label: "Villa" },
  { value: ListingPropertyType.commercial, label: "Commercial" },
  { value: ListingPropertyType.land, label: "Land" },
  { value: ListingPropertyType.hotel, label: "Hotel" },
  { value: ListingPropertyType.party_house, label: "Party house" },
] as const

export const STATUS_OPTIONS = [
  { value: ListingStatus.active, label: "Active" },
  { value: ListingStatus.pending, label: "Pending" },
  { value: ListingStatus.sold, label: "Sold" },
  { value: ListingStatus.expired, label: "Expired" },
  { value: ListingStatus.withdrawn, label: "Withdrawn" },
] as const

export const TIER_OPTIONS = [
  { value: ListingTier.standard, label: "Standard" },
  { value: ListingTier.vip, label: "VIP" },
  { value: ListingTier.super_vip, label: "Super VIP" },
  { value: ListingTier.diamond, label: "Diamond" },
] as const

export const VERIFIED_OPTIONS = [
  { value: "yes", label: "Verified" },
  { value: "no", label: "Unverified" },
] as const

export function optionLabel(
  options: readonly { value: string; label: string }[],
  value: string,
): string {
  return options.find((o) => o.value === value)?.label ?? value
}

function enumOrNull<T extends string>(values: readonly T[], raw: string): T | null {
  return (values as readonly string[]).includes(raw) ? (raw as T) : null
}

/** Server-side where clause for the listings table; soft-deleted rows excluded. */
export function listingListWhere(sp: SearchParams): Prisma.ListingWhereInput {
  const where: Prisma.ListingWhereInput = { deletedAt: null }

  const q = param(sp.q)
  if (q) {
    where.OR = [
      { title: { contains: q, mode: "insensitive" } },
      { slug: { contains: q, mode: "insensitive" } },
      { id: { contains: q, mode: "insensitive" } },
    ]
  }

  const dealType = enumOrNull(Object.values(ListingDealType), param(sp.dealType))
  if (dealType) where.dealType = dealType
  const propertyType = enumOrNull(Object.values(ListingPropertyType), param(sp.propertyType))
  if (propertyType) where.propertyType = propertyType
  const status = enumOrNull(Object.values(ListingStatus), param(sp.status))
  if (status) where.status = status
  const tier = enumOrNull(Object.values(ListingTier), param(sp.tier))
  if (tier) where.tier = tier

  const verified = param(sp.verified)
  if (verified === "yes") where.verified = true
  else if (verified === "no") where.verified = false

  return where
}
