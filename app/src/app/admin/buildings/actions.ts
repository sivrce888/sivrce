"use server"

import { revalidatePath, revalidateTag } from "next/cache"
import { redirect } from "next/navigation"

import { logAdminAction } from "@/lib/admin/audit"
import { requireAdminAction } from "@/lib/admin/guard"
import { optInt, optString, reqEnum, reqFloat, reqString } from "@/lib/admin/validate"
import { db } from "@/lib/db"
import { buildingFootprint } from "@/lib/map/buildings"
import { MAP_BUILDINGS_TAG } from "@/lib/map/db-buildings"
import { Prisma } from "@/generated/prisma/client"

const STATUSES = ["active", "construction", "completed", "hidden"] as const
const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

function revalidateAll() {
  revalidateTag(MAP_BUILDINGS_TAG, "max")
  revalidatePath("/admin/buildings")
  revalidatePath("/map")
}

function parsePolygonCoords(raw: string | null): object | undefined {
  if (!raw) return undefined
  let v: unknown
  try {
    v = JSON.parse(raw)
  } catch {
    throw new Error("polygonCoords must be valid JSON, e.g. {\"ring\":[[44.77,41.70],...]}")
  }
  const ring = (v as { ring?: unknown })?.ring
  if (
    !Array.isArray(ring) ||
    ring.length < 4 ||
    !ring.every(
      (p) => Array.isArray(p) && p.length === 2 && p.every((n) => Number.isFinite(Number(n))),
    )
  ) {
    throw new Error("polygonCoords must look like {\"ring\":[[lng,lat],[lng,lat],...]}")
  }
  return v as object
}

function readBuildingForm(fd: FormData) {
  const slug = reqString(fd, "slug", 140)
  if (!SLUG_RE.test(slug)) throw new Error("Slug must be lowercase letters, digits and dashes")
  const lat = reqFloat(fd, "lat", -90, 90)
  const lng = reqFloat(fd, "lng", -180, 180)
  return {
    slug,
    code: optString(fd, "code", 20),
    title: reqString(fd, "title", 180),
    titleEn: optString(fd, "titleEn", 180),
    description: optString(fd, "description", 5000),
    address: optString(fd, "address", 240),
    city: optString(fd, "city", 100),
    district: optString(fd, "district", 120),
    buildingNumber: optString(fd, "buildingNumber", 12),
    lat,
    lng,
    floors: optInt(fd, "floors", 0, 300) ?? 0,
    yearBuilt: optInt(fd, "yearBuilt", 1800, 2100),
    img: optString(fd, "img", 260),
    status: reqEnum(fd, "status", STATUSES),
    popular: fd.get("popular") === "on",
    projectSlug: optString(fd, "projectSlug", 140),
    developerId: optString(fd, "developerId", 120),
    polygonCoords: parsePolygonCoords(optString(fd, "polygonCoords", 20000)),
  }
}

export async function upsertBuilding(fd: FormData) {
  const session = await requireAdminAction()
  const id = optString(fd, "id", 40)
  const data = readBuildingForm(fd)

  if (data.developerId) {
    const dev = await db.developerProfile.findUnique({
      where: { id: data.developerId },
      select: { id: true },
    })
    if (!dev) throw new Error("Developer not found")
  }

  let savedId = id
  if (id) {
    const before = await db.mapBuilding.findUniqueOrThrow({ where: { id } })
    await db.mapBuilding.update({ where: { id }, data })
    await logAdminAction(session, "map_building.update", "map_building", id, {
      before,
      after: data,
    })
  } else {
    try {
      const created = await db.mapBuilding.create({ data })
      savedId = created.id
      await logAdminAction(session, "map_building.create", "map_building", created.id, {
        after: data,
      })
    } catch (e) {
      if (typeof e === "object" && e !== null && (e as { code?: string }).code === "P2002") {
        throw new Error(`Slug "${data.slug}" is already taken`)
      }
      throw e
    }
  }

  revalidateAll()
  redirect(`/admin/buildings/${savedId}`)
}

export async function deleteBuilding(fd: FormData) {
  const session = await requireAdminAction()
  const id = reqString(fd, "id", 40)
  const before = await db.mapBuilding.findUniqueOrThrow({ where: { id } })
  await db.mapBuilding.delete({ where: { id } })
  await logAdminAction(session, "map_building.delete", "map_building", id, { before })
  revalidateAll()
  redirect("/admin/buildings")
}

export async function togglePopular(fd: FormData) {
  const session = await requireAdminAction()
  const id = reqString(fd, "id", 40)
  const before = await db.mapBuilding.findUniqueOrThrow({
    where: { id },
    select: { popular: true },
  })
  await db.mapBuilding.update({ where: { id }, data: { popular: !before.popular } })
  await logAdminAction(session, "map_building.toggle_popular", "map_building", id, {
    before,
    after: { popular: !before.popular },
  })
  revalidateAll()
}

// ── Floor inventory (Building3D + BuildingFloor) ──

function cellNum(v: FormDataEntryValue | null, max: number): number | null {
  if (typeof v !== "string" || !v.trim()) return null
  const n = Number(v)
  if (!Number.isFinite(n) || n < 0 || n > max) throw new Error(`Invalid number: ${v.slice(0, 20)}`)
  return n
}

function cellUnits(v: FormDataEntryValue | null): number {
  const n = cellNum(v, 100_000)
  if (n === null) return 0
  if (!Number.isInteger(n)) throw new Error("Unit counts must be whole numbers")
  return n
}

/** Create the Building3D shell + N empty BuildingFloor rows for a map building. */
export async function enableFloorInventory(fd: FormData) {
  const session = await requireAdminAction()
  const id = reqString(fd, "id", 40)
  const floorCount = optInt(fd, "floorCount", 1, 60)
  if (!floorCount) throw new Error("Floor count must be 1–60")
  const b = await db.mapBuilding.findUniqueOrThrow({
    where: { id },
    select: { lat: true, lng: true, height: true, polygonCoords: true },
  })
  const ring = (b.polygonCoords as { ring?: [number, number][] } | null)?.ring
  const footprint: Prisma.InputJsonValue = (
    Array.isArray(ring) && ring.length >= 4
      ? { type: "Polygon", coordinates: [ring] }
      : buildingFootprint(b.lat, b.lng)
  ) as Prisma.InputJsonValue
  try {
    await db.building3D.create({
      data: {
        mapBuildingId: id,
        footprintGeoJson: footprint,
        heightMeters: b.height > 0 ? b.height : Math.min(18 + floorCount * 3.1, 110),
        floorCount,
        floors: {
          create: Array.from({ length: floorCount }, (_, i) => ({ floorNumber: i + 1 })),
        },
      },
    })
  } catch (e) {
    if (typeof e === "object" && e !== null && (e as { code?: string }).code === "P2002") {
      throw new Error("Floor inventory is already enabled for this building")
    }
    throw e
  }
  await logAdminAction(session, "building3d.enable_floors", "map_building", id, {
    after: { floorCount },
  })
  revalidateAll()
  redirect(`/admin/buildings/${id}`)
}

/** Upsert every submitted floor row (whole grid saved at once). */
export async function saveFloorInventory(fd: FormData) {
  const session = await requireAdminAction()
  const id = reqString(fd, "id", 40)
  const building3DId = reqString(fd, "building3DId", 40)
  const rows = fd.getAll("n").map((v, i) => {
    const floorNumber = cellUnits(v)
    if (floorNumber < 1 || floorNumber > 60) throw new Error("Floor numbers must be 1–60")
    const totalUnits = cellUnits(fd.getAll("total")[i] ?? null)
    const availableUnits = cellUnits(fd.getAll("avail")[i] ?? null)
    if (availableUnits > totalUnits) {
      throw new Error(`Floor ${floorNumber}: available units exceed total units`)
    }
    return {
      floorNumber,
      totalUnits,
      availableUnits,
      forSaleCount: cellUnits(fd.getAll("sale")[i] ?? null),
      forRentCount: cellUnits(fd.getAll("rent")[i] ?? null),
      forDailyCount: cellUnits(fd.getAll("daily")[i] ?? null),
      pricePerSqmMin: cellNum(fd.getAll("pmin")[i] ?? null, 1_000_000),
      pricePerSqmMax: cellNum(fd.getAll("pmax")[i] ?? null, 1_000_000),
    }
  })
  if (rows.length === 0) throw new Error("No floor rows submitted")
  await db.$transaction(
    rows.map((r) =>
      db.buildingFloor.upsert({
        where: { building3DId_floorNumber: { building3DId, floorNumber: r.floorNumber } },
        create: { building3DId, ...r },
        update: r,
      }),
    ),
  )
  await logAdminAction(session, "building3d.save_floors", "map_building", id, {
    after: { rows: rows.length },
  })
  revalidateAll()
  redirect(`/admin/buildings/${id}`)
}

/** Grow/shrink the stack: creates missing floors, removes only empty extra ones. */
export async function setFloorCount(fd: FormData) {
  const session = await requireAdminAction()
  const id = reqString(fd, "id", 40)
  const building3DId = reqString(fd, "building3DId", 40)
  const count = optInt(fd, "floorCount", 1, 60)
  if (!count) throw new Error("Floor count must be 1–60")
  const occupied = await db.buildingFloor.count({
    where: { building3DId, floorNumber: { gt: count }, totalUnits: { gt: 0 } },
  })
  if (occupied > 0) {
    throw new Error(`${occupied} floor(s) above ${count} still have units — clear them first`)
  }
  await db.$transaction([
    db.buildingFloor.deleteMany({ where: { building3DId, floorNumber: { gt: count } } }),
    db.buildingFloor.createMany({
      data: Array.from({ length: count }, (_, i) => ({ building3DId, floorNumber: i + 1 })),
      skipDuplicates: true,
    }),
    db.building3D.update({ where: { id: building3DId }, data: { floorCount: count } }),
  ])
  await logAdminAction(session, "building3d.set_floor_count", "map_building", id, {
    after: { floorCount: count },
  })
  revalidateAll()
  redirect(`/admin/buildings/${id}`)
}
