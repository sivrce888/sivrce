/**
 * SIVRCE — listing → building/floor attribution (ListingLocation).
 *
 * Publishing a live listing links it to the nearest Building3D (≤90m) and its
 * BuildingFloor, so live DB listings join the admin floor inventory; sold /
 * withdrawn / deleted removes the link and frees the unit ("sold → unavailable").
 *
 * Missing corpus within radius → auto-create MapBuilding + Building3D with a
 * stable SV-XX-XXXX code from the ~60 m coord cell (every კორპუსი gets an ID).
 *
 * ponytail: haversine scan of buildings_3d; upgrade → PostGIS ST_DWithin.
 * Ceiling: a resale unit already counted as developer stock double-counts;
 * upgrade → unit-level reconciliation when units are modeled.
 * db is imported lazily so the pure helpers stay checkable without DATABASE_URL.
 * Run self-check: npm run check:attribution
 */

import type { Prisma } from "@/generated/prisma/client"
import type { ListingDealType } from "@/generated/prisma/enums"
import { revalidateTag } from "next/cache"
import { haversineM, NEAREST_RADIUS_M, parseBuildingNumber } from "./buildings"
import { corpusFootprint, corpusIdentity } from "./corpus"

/** Floor inventory column that tracks live stock per deal type. */
export const DEAL_COUNT_FIELD = {
  buy: "forSaleCount",
  rent: "forRentCount",
  daily: "forDailyCount",
  mortgage: "forPledgeCount",
} as const satisfies Record<ListingDealType, string>

type CountField = (typeof DEAL_COUNT_FIELD)[ListingDealType]

/** Nearest Building3D within radius. Pure — the check runs it DB-free. */
export function nearestBuilding3DId(
  buildings: Array<{ id: string; lat: number; lng: number }>,
  lat: number,
  lng: number,
  radiusM = NEAREST_RADIUS_M,
): string | null {
  let best: string | null = null
  let bestD = radiusM
  for (const b of buildings) {
    const d = haversineM(lat, lng, b.lat, b.lng)
    if (d <= bestD) {
      bestD = d
      best = b.id
    }
  }
  return best
}

/** Create or reuse MapBuilding+Building3D for this coord cell. */
async function ensureBuilding3DId(
  lat: number,
  lng: number,
  meta: {
    address: string | null
    city: string | null
    district: string | null
    totalFloors: number | null
  },
): Promise<string> {
  const { db } = await import("@/lib/db")
  const buildings = await db.building3D.findMany({
    select: { id: true, mapBuilding: { select: { lat: true, lng: true } } },
  })
  const near = nearestBuilding3DId(
    buildings.map((b) => ({ id: b.id, lat: b.mapBuilding.lat, lng: b.mapBuilding.lng })),
    lat,
    lng,
  )
  if (near) return near

  const idn = corpusIdentity(lat, lng, meta.city)
  const existing = await db.mapBuilding.findUnique({
    where: { slug: idn.slug },
    select: { building3D: { select: { id: true } } },
  })
  if (existing?.building3D?.id) return existing.building3D.id

  const floors = Math.max(meta.totalFloors ?? 5, 1)
  const ring = corpusFootprint(lat, lng)
  const footprint = {
    type: "Polygon",
    coordinates: [ring],
  }
  const title = meta.address?.trim() || idn.code
  const buildingNumber = meta.address ? parseBuildingNumber(meta.address) || null : null

  try {
    const created = await db.mapBuilding.create({
      data: {
        slug: idn.slug,
        code: idn.code,
        title,
        address: meta.address,
        city: meta.city,
        district: meta.district,
        buildingNumber,
        lat,
        lng,
        height: floors * 3,
        floors,
        status: "active",
        polygonCoords: ring,
        building3D: {
          create: {
            footprintGeoJson: footprint,
            heightMeters: floors * 3,
            floorCount: floors,
          },
        },
      },
      select: { building3D: { select: { id: true } } },
    })
    if (created.building3D?.id) return created.building3D.id
  } catch {
    // Race: another publish created the same slug — read it back.
    const raced = await db.mapBuilding.findUnique({
      where: { slug: idn.slug },
      select: { building3D: { select: { id: true } } },
    })
    if (raced?.building3D?.id) return raced.building3D.id
  }

  // Last resort: create Building3D on orphan MapBuilding without 3D shell.
  const orphan = await db.mapBuilding.findUnique({ where: { slug: idn.slug }, select: { id: true } })
  if (orphan) {
    const shell = await db.building3D.create({
      data: {
        mapBuildingId: orphan.id,
        footprintGeoJson: footprint,
        heightMeters: floors * 3,
        floorCount: floors,
      },
      select: { id: true },
    })
    return shell.id
  }
  throw new Error("ensureBuilding3DId failed")
}

/**
 * Link a live listing to its building + floor and count it in floor stock.
 * No-op when the listing is not active, is deleted, or is already attributed.
 * Always resolves a Building3D (nearest ≤90m or auto-created corpus).
 */
export async function attributeListing(listingId: string): Promise<void> {
  const { db } = await import("@/lib/db")
  const l = await db.listing.findUnique({
    where: { id: listingId },
    select: {
      lat: true,
      lng: true,
      floor: true,
      totalFloors: true,
      dealType: true,
      status: true,
      deletedAt: true,
      address: true,
      city: true,
      district: true,
    },
  })
  if (!l || l.status !== "active" || l.deletedAt) return
  const existing = await db.listingLocation.findUnique({
    where: { listingId },
    select: { id: true },
  })
  if (existing) return

  const building3DId = await ensureBuilding3DId(l.lat, l.lng, {
    address: l.address,
    city: l.city,
    district: l.district,
    totalFloors: l.totalFloors,
  })

  const floorNumber = l.floor && l.floor > 0 ? l.floor : null
  const floor = floorNumber
    ? await db.buildingFloor.findUnique({
        where: { building3DId_floorNumber: { building3DId, floorNumber } },
        select: { id: true },
      })
    : null
  const field = DEAL_COUNT_FIELD[l.dealType] as CountField
  await db.$transaction([
    db.listingLocation.create({
      data: {
        listingId,
        building3DId,
        buildingFloorId: floor?.id ?? null,
        floorNumber,
        latitude: l.lat,
        longitude: l.lng,
        altitude: (floorNumber ?? 0) * 3,
      },
    }),
    ...(floor
      ? [
          db.buildingFloor.update({
            where: { id: floor.id },
            data: {
              availableUnits: { increment: 1 },
              [field]: { increment: 1 },
            } as Prisma.BuildingFloorUpdateInput,
          }),
        ]
      : []),
  ])
  revalidateTag("map-listings", "max")
  revalidateTag("map-buildings", "max")
}

/**
 * Remove a listing's attribution and free its unit back to the floor.
 * Count guards keep admin-edited stock from going negative on partial data.
 */
export async function unattributeListing(listingId: string): Promise<void> {
  const { db } = await import("@/lib/db")
  const loc = await db.listingLocation.findUnique({
    where: { listingId },
    select: { buildingFloorId: true, listing: { select: { dealType: true } } },
  })
  if (!loc) return
  const ops: Prisma.PrismaPromise<unknown>[] = [
    db.listingLocation.delete({ where: { listingId } }),
  ]
  if (loc.buildingFloorId) {
    const field = DEAL_COUNT_FIELD[loc.listing.dealType] as CountField
    ops.push(
      db.buildingFloor.updateMany({
        where: { id: loc.buildingFloorId, availableUnits: { gt: 0 } },
        data: { availableUnits: { decrement: 1 } },
      }),
      db.buildingFloor.updateMany({
        where: { id: loc.buildingFloorId, [field]: { gt: 0 } },
        data: { [field]: { decrement: 1 } } as Prisma.BuildingFloorUpdateManyArgs['data'],
      }),
    )
  }
  await db.$transaction(ops)
  revalidateTag("map-listings", "max")
  revalidateTag("map-buildings", "max")
}
