/**
 * Seed script: inserts the 31 mock listings from src/data/listings.ts
 * into the Supabase Postgres database.
 *
 * Usage: npx tsx scripts/seed.ts
 * Requires: DATABASE_URL (pooled) and DIRECT_URL (for Prisma)
 *
 * ponytail: single-file seed, no migration framework. Run once per DB reset.
 * Upgrade path: prisma db seed + @prisma/seed when listing volume warrants it.
 */

import { config } from "dotenv"
import { resolve } from "path"

// Load env from project root
config({ path: resolve(__dirname, "..", ".env.local") })
config({ path: resolve(__dirname, "..", ".env") })

import { Prisma, PrismaClient } from "../src/generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { LISTINGS } from "../src/data/listings"
import { BUILDINGS } from "../src/data/buildings"
import { DEVELOPERS, PROJECTS } from "../src/data/professionals"
import { buildingFootprint } from "../src/lib/map/buildings"
import footprintData from "../src/data/building-footprints.json"

const connectionString = process.env.DATABASE_URL
if (!connectionString) {
  console.error("DATABASE_URL is not set. Check .env.local")
  process.exit(1)
}

const db = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
})

// Map mock data dealType → Prisma enum
function mapDealType(d: string): "buy" | "rent" | "daily" {
  if (d === "sale") return "buy"
  if (d === "rent") return "rent"
  if (d === "daily") return "daily"
  return "buy"
}

// Map mock data propType → Prisma enum
function mapPropType(p: string): "apartment" | "house" | "commercial" | "land" {
  if (p === "apartment") return "apartment"
  if (p === "house") return "house"
  if (p === "commercial") return "commercial"
  if (p === "land") return "land"
  return "apartment"
}

async function main() {
  console.log(`Seeding ${LISTINGS.length} listings...`)

  for (const l of LISTINGS) {
    const existing = await db.listing.findUnique({ where: { id: l.id } })
    if (existing) {
      console.log(`  skip ${l.id} (exists)`)
      continue
    }

    await db.listing.create({
      data: {
        id: l.id,
        slug: l.id,
        title: l.title,
        description: l.description,
        dealType: mapDealType(l.dealType),
        propertyType: mapPropType(l.propType),
        price: l.priceGEL,
        pricePerSqm: Math.round(l.perM2USD * 2.7),
        rooms: l.rooms,
        bedrooms: l.beds,
        bathrooms: l.baths,
        area: l.area,
        floor: l.floor,
        totalFloors: l.totalFloors,
        city: l.city,
        district: l.district,
        address: l.address,
        lat: l.coords.lat,
        lng: l.coords.lng,
        images: l.images,
        features: l.features,
        agent: l.agent as unknown as object,
        petsAllowed: l.features.includes("add.f.petsAllowed"),
        sellerType: l.agent.agency ? "agency" : "owner",
        views: l.views,
        verified: true,
        status: "active",
        tier: l.badge === "SUPER VIP" ? "super_vip" : l.badge === "VIP+" ? "vip" : l.badge === "VIP" ? "vip" : "standard",
        trustScore: l.ai.score,
      },
    })
    console.log(`  + ${l.id}`)
  }

  console.log(`Done. ${LISTINGS.length} listings seeded.`)

  // ——— Map buildings + developers (admin-curated layer for /map) ———
  // Idempotent upserts: reseeding syncs the DB with the static catalog.
  console.log(`Seeding ${DEVELOPERS.length} developers...`)
  for (const d of DEVELOPERS) {
    const data = {
      slug: d.slug,
      name: d.name.ka,
      logoText: d.name.en.replace(/[^A-Za-z]/g, "").slice(0, 3).toUpperCase() || "DEV",
      headquarters: d.city,
      description: d.description.ka,
      color: "#2E6BFF",
      projectsCount: d.projectsDone,
      completedCount: d.projectsDone,
    }
    await db.developerProfile.upsert({
      where: { id: d.slug },
      update: data,
      create: { id: d.slug, ...data },
    })
  }

  // ——— New-build projects directory ———
  // Same idempotent upsert; keyed by slug, developer resolved to the ka name.
  const devName = new Map(DEVELOPERS.map((d) => [d.slug, d.name.ka]))
  console.log(`Seeding ${PROJECTS.length} projects...`)
  for (const p of PROJECTS) {
    const developer = devName.get(p.developerSlug)
    if (!developer) {
      console.warn(`  ! ${p.slug}: unknown developerSlug ${p.developerSlug}, skipped`)
      continue
    }
    const data = {
      slug: p.slug,
      name: p.name,
      developer,
      city: p.city,
      district: p.location,
      address: p.location,
      lat: p.coords.lat,
      lng: p.coords.lng,
      status: p.done >= 100 ? "completed" : "active",
      readyBy: p.finish,
      pricePerSqmFrom: Number(p.priceFromM2.replace(/[^0-9]/g, "")) || 0,
      units: p.flats,
      image: p.img,
    }
    await db.projectDirectory.upsert({
      where: { slug: p.slug },
      update: data,
      create: { id: p.slug, ...data },
    })
  }
  console.log(`Developers + projects seeded.`)

  const rings = footprintData.footprints as unknown as Record<
    string,
    { ring: [number, number][]; osmId: number } | null
  >
  console.log(`Seeding ${BUILDINGS.length} popular map buildings...`)
  const listingsBySlug = new Map<string, typeof LISTINGS>()
  for (const l of LISTINGS) {
    if (!l.buildingSlug) continue
    const arr = listingsBySlug.get(l.buildingSlug) ?? []
    arr.push(l)
    listingsBySlug.set(l.buildingSlug, arr)
  }
  for (const b of BUILDINGS) {
    const ring = rings[`bldg-${b.slug}`]?.ring
    const data = {
      code: b.code,
      title: b.name,
      titleEn: b.nameEn,
      description: b.description.ka,
      address: b.address,
      city: b.city,
      district: b.district,
      buildingNumber: b.buildingNumber,
      polygonCoords: ring ? { ring } : undefined,
      lat: b.coords.lat,
      lng: b.coords.lng,
      floors: b.floors,
      yearBuilt: b.yearBuilt ?? null,
      img: b.img,
      status: b.status === "construction" ? "construction" : "active",
      popular: true,
      projectSlug: b.projectSlug ?? null,
      developerId: b.developerSlug,
    }
    const row = await db.mapBuilding.upsert({
      where: { slug: b.slug },
      update: data,
      create: { slug: b.slug, ...data },
    })
    console.log(`  + ${b.slug}`)

    // Floor inventory derived from seeded listings — create-only:
    // a Building3D that already exists is left untouched (admin edits win).
    const existing3D = await db.building3D.findUnique({
      where: { mapBuildingId: row.id },
      select: { id: true },
    })
    if (existing3D) continue
    const items = listingsBySlug.get(b.slug) ?? []
    const floorCount = Math.max(
      1,
      b.floors || Math.max(0, ...items.map((l) => l.totalFloors || l.floor || 0)) || 1,
    )
    type FloorAgg = {
      available: number
      sale: number
      rent: number
      daily: number
      pledge: number
      minM2: number | null
    }
    const perFloor = new Map<number, FloorAgg>()
    for (const l of items) {
      const n = Math.min(Math.max(1, l.floor || 1), floorCount)
      const f = perFloor.get(n) ?? { available: 0, sale: 0, rent: 0, daily: 0, pledge: 0, minM2: null }
      f.available += 1
      if (l.dealType === "sale") f.sale += 1
      else if (l.dealType === "rent") f.rent += 1
      else if (l.dealType === "daily") f.daily += 1
      else f.pledge += 1
      if (l.area > 0 && l.priceGEL > 0) {
        const m2 = Math.round(l.priceGEL / l.area)
        f.minM2 = f.minM2 == null ? m2 : Math.min(f.minM2, m2)
      }
      perFloor.set(n, f)
    }
    await db.building3D.create({
      data: {
        mapBuildingId: row.id,
        footprintGeoJson: (
          ring
            ? { type: "Polygon", coordinates: [ring] }
            : buildingFootprint(b.coords.lat, b.coords.lng)
        ) as Prisma.InputJsonValue,
        heightMeters: Math.min(18 + floorCount * 3.1, 110),
        floorCount,
        floors: {
          create: Array.from({ length: floorCount }, (_, i) => {
            const f = perFloor.get(i + 1)
            return {
              floorNumber: i + 1,
              totalUnits: f?.available ?? 0,
              availableUnits: f?.available ?? 0,
              forSaleCount: f?.sale ?? 0,
              forRentCount: f?.rent ?? 0,
              forDailyCount: f?.daily ?? 0,
              forPledgeCount: f?.pledge ?? 0,
              pricePerSqmMin: f?.minM2 ?? null,
            }
          }),
        },
      },
    })
    console.log(`    · ${floorCount} floors of inventory`)
  }
  console.log("Map buildings + developers + floor inventory seeded.")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => db.$disconnect())
