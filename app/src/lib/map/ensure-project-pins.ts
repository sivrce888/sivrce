/**
 * Materialize project pins into MapBuilding (create-only).
 * Admin edits win — never overwrite existing slug / projectSlug rows.
 */

import { PROJECTS } from "@/data/professionals"
import { db } from "@/lib/db"

function clip(s: string, n: number): string {
  return s.length <= n ? s : s.slice(0, n)
}

/** Returns how many new MapBuilding rows were created. */
export async function ensureProjectMapPins(): Promise<number> {
  const [dir, catalogDevs, existing] = await Promise.all([
    db.projectDirectory.findMany({
      where: { deletedAt: null, lat: { not: null }, lng: { not: null } },
      select: {
        slug: true,
        name: true,
        address: true,
        city: true,
        district: true,
        lat: true,
        lng: true,
        image: true,
        status: true,
      },
    }),
    db.developerProfile.findMany({
      where: { deletedAt: null },
      select: { id: true, slug: true },
    }),
    db.mapBuilding.findMany({ select: { slug: true, projectSlug: true } }),
  ])

  const taken = new Set<string>()
  for (const b of existing) {
    taken.add(b.slug)
    if (b.projectSlug) taken.add(b.projectSlug)
  }
  const devBySlug = new Map(catalogDevs.map((d) => [d.slug, d.id]))

  type Row = {
    slug: string
    title: string
    address: string | null
    city: string | null
    district: string | null
    lat: number
    lng: number
    img: string | null
    status: string
    projectSlug: string
    developerId: string | null
    floors: number
    height: number
  }
  const rows: Row[] = []

  for (const p of dir) {
    if (p.lat == null || p.lng == null || !Number.isFinite(p.lat) || !Number.isFinite(p.lng)) {
      continue
    }
    if (taken.has(p.slug)) continue
    rows.push({
      slug: p.slug,
      title: clip(p.name, 180),
      address: p.address ? clip(p.address, 240) : null,
      city: p.city ? clip(p.city, 100) : null,
      district: p.district ? clip(p.district, 120) : null,
      lat: p.lat,
      lng: p.lng,
      img: p.image ? clip(p.image, 260) : null,
      status: p.status === "completed" ? "completed" : "construction",
      projectSlug: p.slug,
      developerId: null,
      floors: 0,
      height: 45,
    })
    taken.add(p.slug)
  }

  for (const p of PROJECTS) {
    const { lat, lng } = p.coords
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue
    if (taken.has(p.slug)) continue
    rows.push({
      slug: p.slug,
      title: clip(p.name, 180),
      address: clip(p.location, 240),
      city: clip(p.city, 100),
      district: null,
      lat,
      lng,
      img: p.img ? clip(p.img, 260) : null,
      status: p.done >= 100 ? "completed" : "construction",
      projectSlug: p.slug,
      developerId: devBySlug.get(p.developerSlug) ?? null,
      floors: p.floors ?? 0,
      height: 45,
    })
    taken.add(p.slug)
  }

  if (rows.length === 0) return 0
  const res = await db.mapBuilding.createMany({ data: rows, skipDuplicates: true })
  return res.count
}
