/**
 * Seed one searchable "ახალი მშენებლობა" listing per CDN-backed project.
 *
 * Why: Georgia #1 needs inventory density. These are catalog inquiry cards
 * (not fabricated unit floorplans) — title/description say "from ₾/m²",
 * seller is the developer, image is the real project hero on cdn.sivrce.ge.
 *
 * Usage:
 *   npx tsx scripts/seed-project-listings.ts
 *   npx tsx scripts/seed-project-listings.ts --check
 *   npx tsx scripts/seed-project-listings.ts --dry
 *
 * Idempotent upsert on id `proj-{slug}`. Skips stock art, zero price, no coords.
 * ponytail: indicative 50 m² × $/m² for the card price; upgrade when unit
 * inventory lands from developers.
 */

import { config } from "dotenv"
import { resolve } from "path"
import assert from "node:assert/strict"

config({ path: resolve(__dirname, "..", ".env.local") })
config({ path: resolve(__dirname, "..", ".env") })

import { PrismaClient } from "../src/generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { DEVELOPERS } from "../src/data/professionals"

const USD_GEL = 2.7
const INDICATIVE_M2 = 50
const ID_PREFIX = "proj-"

function withPgSslCompat(url: string) {
  if (/uselibpqcompat=/i.test(url) || /sslmode=disable/i.test(url)) return url
  return `${url}${url.includes("?") ? "&" : "?"}uselibpqcompat=true`
}

const connectionString = process.env.DATABASE_URL
if (!connectionString && !process.argv.includes("--check")) {
  console.error("DATABASE_URL missing")
  process.exit(1)
}

const db = connectionString
  ? new PrismaClient({
      adapter: new PrismaPg({ connectionString: withPgSslCompat(connectionString) }),
    })
  : null

const phoneByDevName = new Map(
  DEVELOPERS.filter((d) => d.phone && d.phone !== "—").map((d) => [d.name.ka, d.phone]),
)
const slugByDevName = new Map(DEVELOPERS.map((d) => [d.name.ka, d.slug]))

export function catalogTitle(name: string, usdPerM2: number): string {
  const gel = Math.round(usdPerM2 * USD_GEL)
  const base = `${name} — ახალი მშენებლობა, ${gel.toLocaleString("en-US")}/მ²-დან`
  return base.slice(0, 180)
}

export function catalogPriceGel(usdPerM2: number): number {
  return Math.round(usdPerM2 * INDICATIVE_M2 * USD_GEL)
}

/** Hero + gallery, deduped — card carousel caps at 4; detail can show the rest. */
export function catalogImages(hero: string, gallery: string[] = []): string[] {
  const out: string[] = []
  for (const u of [hero, ...gallery]) {
    if (u && !out.includes(u)) out.push(u)
  }
  return out.slice(0, 16)
}

async function main() {
  if (process.argv.includes("--check")) {
    assert.equal(catalogTitle("Test", 1000).includes("ახალი მშენებლობა"), true)
    assert.equal(catalogPriceGel(1000), Math.round(1000 * 50 * USD_GEL))
    assert.deepEqual(catalogImages("a.webp", ["a.webp", "b.webp", "c.webp"]), ["a.webp", "b.webp", "c.webp"])
    assert.equal(catalogImages("h.webp", Array.from({ length: 20 }, (_, i) => `g${i}.webp`)).length, 16)
    console.log("seed-project-listings.check OK")
    return
  }
  if (!db) process.exit(1)

  const dry = process.argv.includes("--dry")
  const rows = await db.projectDirectory.findMany({
    where: {
      deletedAt: null,
      image: { contains: "cdn.sivrce" },
      pricePerSqmFrom: { gt: 0 },
      lat: { not: null },
      lng: { not: null },
    },
    select: {
      slug: true,
      name: true,
      developer: true,
      city: true,
      district: true,
      address: true,
      lat: true,
      lng: true,
      image: true,
      gallery: true,
      pricePerSqmFrom: true,
      readyBy: true,
      units: true,
      body: true,
      status: true,
    },
  })

  console.log(`Candidates: ${rows.length}${dry ? " (dry)" : ""}`)
  let upserted = 0
  let skipped = 0

  for (const p of rows) {
    const phone = phoneByDevName.get(p.developer)
    if (!phone || p.lat == null || p.lng == null) {
      skipped++
      continue
    }
    const usdM2 = p.pricePerSqmFrom
    const id = `${ID_PREFIX}${p.slug}`.slice(0, 120)
    const slug = id
    const priceGel = catalogPriceGel(usdM2)
    const pricePerSqmGel = Math.round(usdM2 * USD_GEL)
    const title = catalogTitle(p.name, usdM2)
    const district = (p.district || p.city).slice(0, 120)
    const address = (p.address || `${p.district}, ${p.city}`).slice(0, 240)
    const devSlug = slugByDevName.get(p.developer)
    const description = (
      p.body?.trim() ||
      `${p.name} — დეველოპერი ${p.developer}. ფასი ${usdM2}$/მ²-დან` +
        (p.readyBy ? `, ჩაბარება ${p.readyBy}` : "") +
        (p.units ? `, ${p.units} ბინა` : "") +
        `. კატალოგის ბარათი — დეტალები და ხელმისაწვდომობა პროექტის გვერდზე` +
        (devSlug ? ` /projects/${p.slug}` : "") +
        `. მითითებული ფასი ${INDICATIVE_M2} მ² ერთეულის მაგალითზე.`
    ).slice(0, 8000)

    const data = {
      slug,
      title,
      description,
      dealType: "buy" as const,
      propertyType: "apartment" as const,
      price: priceGel,
      currency: "GEL" as const,
      pricePerSqm: pricePerSqmGel,
      rooms: 0,
      bedrooms: 0,
      bathrooms: 0,
      area: INDICATIVE_M2,
      floor: null as number | null,
      totalFloors: null as number | null,
      city: p.city.slice(0, 100),
      district,
      address,
      lat: p.lat,
      lng: p.lng,
      images: catalogImages(p.image, p.gallery),
      features: ["ახალი მშენებლობა", p.developer.slice(0, 40)],
      petsAllowed: false,
      sellerType: "agency",
      listingPhone: phone.slice(0, 30),
      agent: {
        name: p.developer,
        phone,
        agency: p.developer,
        profileHref: devSlug ? `/developers/${devSlug}` : null,
        role: "developer",
        verified: true,
      },
      extendedFields: {
        projectCatalog: true,
        projectSlug: p.slug,
        usdPerM2: usdM2,
        indicativeM2: INDICATIVE_M2,
      },
      views: 0,
      verified: true,
      status: "active" as const,
      tier: "standard" as const,
      trustScore: 82,
      fillPercentage: 65,
    }

    if (dry) {
      console.log(`  dry ${id} · ${title.slice(0, 60)} · ₾${priceGel}`)
      upserted++
      continue
    }

    await db.listing.upsert({
      where: { id },
      create: { id, ...data },
      update: {
        title: data.title,
        description: data.description,
        price: data.price,
        pricePerSqm: data.pricePerSqm,
        images: data.images,
        lat: data.lat,
        lng: data.lng,
        address: data.address,
        district: data.district,
        listingPhone: data.listingPhone,
        agent: data.agent,
        extendedFields: data.extendedFields,
        status: "active",
        deletedAt: null,
        verified: true,
      },
    })
    upserted++
    if (upserted % 40 === 0) console.log(`  …${upserted}/${rows.length}`)
  }

  const active = await db.listing.count({ where: { deletedAt: null, status: "active" } })
  console.log(`Upserted ${upserted}, skipped ${skipped}. Active listings now: ${active}`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => db?.$disconnect())
