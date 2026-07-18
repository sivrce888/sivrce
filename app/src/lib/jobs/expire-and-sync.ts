/**
 * Expire active listings past 30-day lifetime + downgrade expired paid tiers
 * + Meilisearch full sync (admin + cron).
 */

import { ListingStatus, ListingTier } from "@/generated/prisma/client"
import { USD_GEL } from "@/data/listings"
import { db } from "@/lib/db"
import { LISTING_LIFETIME_MS } from "@/lib/listings/lifetime"
import { unattributeListing } from "@/lib/map/attribution"
import { metroMeters } from "@/lib/map/pois"
import { reindexListingById } from "@/lib/payments"
import {
  activeColorUntil,
  activePriceDropUntil,
  activeStoryUntil,
  activeUrgentUntil,
  effectiveTierKey,
  tierRankOf,
} from "@/lib/promo-pricing"
import { deleteListing, syncAllListings, type ListingDocument } from "@/lib/search"

const BATCH = 200

export async function expireListingsJob(): Promise<{ expired: number }> {
  const cutoff = new Date(Date.now() - LISTING_LIFETIME_MS)
  const rows = await db.listing.findMany({
    where: {
      deletedAt: null,
      status: ListingStatus.active,
      createdAt: { lt: cutoff },
    },
    select: { id: true },
    take: BATCH,
  })

  for (const { id } of rows) {
    await db.listing.update({
      where: { id },
      data: { status: ListingStatus.expired },
    })
    await unattributeListing(id).catch(() => {})
    await deleteListing(id).catch(() => {})
  }
  return { expired: rows.length }
}

export async function expirePromosJob(): Promise<{ downgraded: number }> {
  const now = new Date()
  const rows = await db.listing.findMany({
    where: {
      deletedAt: null,
      tier: { not: ListingTier.standard },
      tierExpiresAt: { lt: now },
    },
    select: { id: true },
    take: BATCH,
  })

  for (const { id } of rows) {
    await db.listing.update({
      where: { id },
      data: {
        tier: ListingTier.standard,
        tierExpiresAt: null,
        tierPurchasedAt: null,
        tierPaymentOrderId: null,
      },
    })
    await reindexListingById(id).catch(() => {})
  }
  return { downgraded: rows.length }
}

/** Full Meili reindex — shared by admin + cron. */
export async function syncSearchIndexJob(): Promise<{
  ok: boolean
  indexed: number
  total: number
  error?: string
}> {
  const rows = await db.listing.findMany({
    where: { deletedAt: null, status: "active" },
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
    },
    take: 50_000,
  })

  const listings: ListingDocument[] = rows.map((row) => {
    const { extendedFields, tier, tierExpiresAt, ...rest } = row
    const ext = extendedFields as {
      condition?: string
      buildingStatus?: string
      colorUntil?: string
      urgentUntil?: string
      priceDropUntil?: string
      storyUntil?: string
    } | null
    const tierKey = effectiveTierKey(tier, tierExpiresAt)
    return {
      ...rest,
      priceUSD: row.currency === "USD" ? row.price : Math.round(row.price / USD_GEL),
      pricePerSqm: row.pricePerSqm ?? undefined,
      hasImages: row.images.length > 0,
      condition: ext?.condition,
      buildingStatus: ext?.buildingStatus,
      features: (row.features as string[]) ?? [],
      images: (row.images as string[]) ?? [],
      floor: row.floor ?? undefined,
      totalFloors: row.totalFloors ?? undefined,
      metroM: metroMeters(row.lat, row.lng),
      createdAt: row.createdAt.toISOString(),
      colorUntil: activeColorUntil(ext),
      urgentUntil: activeUrgentUntil(ext),
      priceDropUntil: activePriceDropUntil(ext),
      storyUntil: activeStoryUntil(ext),
      tier: tierKey,
      tierRank: tierRankOf(tier, tierExpiresAt),
    }
  })

  const result = await syncAllListings(listings)
  if (!result.ok) {
    return {
      ok: false,
      indexed: result.indexed,
      total: listings.length,
      error: result.error ?? "sync_failed",
    }
  }
  return { ok: true, indexed: result.indexed, total: listings.length }
}
