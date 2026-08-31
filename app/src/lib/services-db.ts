/**
 * Live ServiceProvider rows overlay the static catalog (slug wins).
 */

import { db, dbAvailable } from '@/lib/db'
import { safeQuery } from '@/lib/guards'
import {
  isServiceCategoryId,
  providerBySlug,
  SERVICE_PROVIDERS,
  type ServiceCategoryId,
  type ServicePublic,
} from '@/lib/services'

function yearsSince(d: Date): number {
  return Math.max(0, Math.floor((Date.now() - d.getTime()) / (365.25 * 24 * 3600 * 1000)))
}

function fromRow(row: {
  slug: string
  name: string
  category: string
  city: string
  district: string | null
  description: string
  phone: string
  email: string | null
  website: string | null
  verified: boolean
  rating: number
  reviewCount: number
  features: string[]
  priceRangeMin: number | null
  priceRangeMax: number | null
  currency: string
  ownerId: string
  createdAt: Date
}): ServicePublic | null {
  if (!isServiceCategoryId(row.category)) return null
  const loc = { ka: row.name, en: row.name, ru: row.name }
  const desc = { ka: row.description, en: row.description, ru: row.description }
  return {
    slug: row.slug,
    name: loc,
    category: row.category,
    city: row.city,
    district: row.district,
    description: desc,
    phone: row.phone,
    email: row.email,
    website: row.website,
    verified: row.verified,
    yearsActive: yearsSince(row.createdAt),
    rating: row.rating,
    reviewCount: row.reviewCount,
    features: row.features,
    priceRangeMin: row.priceRangeMin,
    priceRangeMax: row.priceRangeMax,
    currency: row.currency,
    ownerId: row.ownerId,
  }
}

export async function listServiceProviders(category?: ServiceCategoryId): Promise<ServicePublic[]> {
  const live = await liveRows(category)
  const bySlug = new Map<string, ServicePublic>()
  for (const p of SERVICE_PROVIDERS) {
    if (category && p.category !== category) continue
    bySlug.set(p.slug, p)
  }
  for (const p of live) bySlug.set(p.slug, p)
  return [...bySlug.values()].sort((a, b) => {
    if (a.verified !== b.verified) return a.verified ? -1 : 1
    return b.reviewCount - a.reviewCount
  })
}

export async function getServiceBySlug(slug: string): Promise<ServicePublic | null> {
  return (await liveBySlug(slug)) ?? providerBySlug(slug) ?? null
}

export async function getServiceProvider(
  category: string,
  slug: string,
): Promise<ServicePublic | null> {
  const p = await getServiceBySlug(slug)
  return p && p.category === category ? p : null
}

async function liveRows(category?: ServiceCategoryId): Promise<ServicePublic[]> {
  if (!(await dbAvailable())) return []
  const rows = await safeQuery(
    () =>
      db.serviceProvider.findMany({
        where: {
          isActive: true,
          deletedAt: null,
          ...(category ? { category } : {}),
        },
        take: 200,
        orderBy: { reviewCount: 'desc' },
      }),
    [],
  )
  return rows.map(fromRow).filter((p): p is ServicePublic => p != null)
}

async function liveBySlug(slug: string): Promise<ServicePublic | null> {
  if (!(await dbAvailable())) return null
  const row = await safeQuery(
    () =>
      db.serviceProvider.findFirst({
        where: { slug, isActive: true, deletedAt: null },
      }),
    null,
  )
  return row ? fromRow(row) : null
}
