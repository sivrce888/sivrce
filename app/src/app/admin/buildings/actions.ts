"use server"

import { revalidatePath, revalidateTag } from "next/cache"
import { redirect } from "next/navigation"

import { logAdminAction } from "@/lib/admin/audit"
import { requireAdminAction } from "@/lib/admin/guard"
import { optInt, optString, reqEnum, reqFloat, reqString } from "@/lib/admin/validate"
import { db } from "@/lib/db"
import { MAP_BUILDINGS_TAG } from "@/lib/map/db-buildings"

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
