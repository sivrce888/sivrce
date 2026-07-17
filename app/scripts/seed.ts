/**
 * Seed script: inserts the 31 mock listings from src/data/listings.ts
 * into the Neon Postgres database.
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

import { PrismaClient } from "../src/generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { LISTINGS } from "../src/data/listings"
import { BUILDINGS } from "../src/data/buildings"
import { DEVELOPERS } from "../src/data/professionals"
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

  const rings = footprintData.footprints as unknown as Record<
    string,
    { ring: [number, number][]; osmId: number } | null
  >
  console.log(`Seeding ${BUILDINGS.length} popular map buildings...`)
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
    await db.mapBuilding.upsert({
      where: { slug: b.slug },
      update: data,
      create: { slug: b.slug, ...data },
    })
    console.log(`  + ${b.slug}`)
  }
  console.log("Map buildings + developers seeded.")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => db.$disconnect())
