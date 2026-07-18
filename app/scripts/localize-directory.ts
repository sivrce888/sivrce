/**
 * One-shot: mirror directory media to R2 (cdn.sivrce.ge). Clears external
 * sourceUrl so runtime never depends on third-party aggregators.
 *
 * Usage:
 *   npx tsx scripts/localize-directory.ts
 *   npx tsx scripts/localize-directory.ts --mirror-only
 *   npx tsx scripts/localize-directory.ts --mirror-only --heroes
 *
 * Enrich step only runs when sourceUrl is still set (legacy rows). After this
 * completes once, re-run with --mirror-only — never re-fetch aggregators.
 *
 * ponytail: gallery capped at 16/project. Re-run safe (skips already-cdn URLs).
 * Supabase pool: 2-wide + dbRetry — P1008 if you bump concurrency.
 */

import { config } from "dotenv"
import { resolve } from "path"
import { createHash } from "crypto"

config({ path: resolve(__dirname, "..", ".env.local") })
config({ path: resolve(__dirname, "..", ".env") })

import { PrismaClient } from "../src/generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { extractState } from "../src/lib/directory/sync-korter"
import { uploadFile } from "../src/lib/storage"

const UA = { "User-Agent": "Mozilla/5.0 (compatible; sivrce-directory-localize/1.0)" }
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))
const OUR = /cdn\.sivrce\.ge|images\.sivrce\.ge/
const GALLERY_CAP = 16

const connectionString = process.env.DATABASE_URL
if (!connectionString) {
  console.error("DATABASE_URL missing")
  process.exit(1)
}

const db = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
})

function absUrl(src: string): string {
  if (!src) return ""
  if (src.startsWith("//")) return `https:${src}`
  return src
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim()
}

function galleryUrls(store: {
  gallery?: { images?: { src?: string; mediaSrc?: { default?: { x2?: string } } }[] }
  constructionState?: {
    points?: { previewImage?: { src?: string; mediaSrc?: { default?: { x2?: string } } } }[]
  }
}): string[] {
  const out: string[] = []
  const push = (u?: string) => {
    const a = absUrl(u || "")
    if (a.startsWith("http") && !out.includes(a)) out.push(a)
  }
  for (const img of store.gallery?.images ?? []) {
    push(img.mediaSrc?.default?.x2 || img.src)
  }
  for (const pt of store.constructionState?.points ?? []) {
    const p = pt.previewImage
    if (p) push(p.mediaSrc?.default?.x2 || p.src)
  }
  return out.slice(0, GALLERY_CAP)
}

async function fetchBuilding(url: string): Promise<{
  gallery: string[]
  body: string
  passportUrl: string
  image: string
  lat: number | null
  lng: number | null
  floors: number
  address: string
} | null> {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(url, { headers: UA })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const state = extractState(await res.text()) as {
        buildingLandingStore?: {
          gallery?: { images?: { src?: string; mediaSrc?: { default?: { x2?: string } } }[] }
          constructionState?: {
            points?: { previewImage?: { src?: string; mediaSrc?: { default?: { x2?: string } } } }[]
          }
          description?: string
          passport?: string
          map?: { lat?: number; lng?: number; houses?: { floorCount?: number }[] }
          main?: { address?: string }
        }
      } | null
      const b = state?.buildingLandingStore
      if (!b) return null
      const gallery = galleryUrls(b)
      const passportUrl =
        typeof b.passport === "string" && b.passport.startsWith("http") ? b.passport : ""
      const floors = Math.max(0, ...(b.map?.houses ?? []).map((h) => h.floorCount ?? 0))
      return {
        gallery,
        body: stripHtml(b.description || "").slice(0, 8000),
        passportUrl,
        image: gallery[0] || "",
        lat: typeof b.map?.lat === "number" ? b.map.lat : null,
        lng: typeof b.map?.lng === "number" ? b.map.lng : null,
        floors,
        address: (b.main?.address || "").slice(0, 240),
      }
    } catch (e) {
      if (attempt === 2) console.warn(`  ! enrich ${url}: ${(e as Error).message}`)
      await sleep(400 * (attempt + 1))
    }
  }
  return null
}

function extOf(url: string, contentType: string): string {
  const fromCt = contentType.split(";")[0]?.trim().toLowerCase()
  if (fromCt === "image/jpeg" || fromCt === "image/jpg") return "jpg"
  if (fromCt === "image/png") return "png"
  if (fromCt === "image/webp") return "webp"
  if (fromCt === "image/svg+xml") return "svg"
  if (fromCt === "application/pdf") return "pdf"
  const m = url.split("?")[0]?.match(/\.([a-z0-9]{2,5})$/i)
  return (m?.[1] || "jpg").toLowerCase()
}

async function dbRetry<T>(fn: () => Promise<T>, tries = 5): Promise<T> {
  for (let i = 0; i < tries; i++) {
    try {
      return await fn()
    } catch (e) {
      const code = (e as { code?: string }).code
      if ((code !== "P1008" && code !== "P1017") || i === tries - 1) throw e
      await sleep(600 * (i + 1))
    }
  }
  throw new Error("dbRetry exhausted")
}

async function mirrorOne(url: string, folder: string): Promise<string | null> {
  if (!url || !url.startsWith("http")) return null
  if (OUR.test(url)) return url
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(url, { headers: UA })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const buf = Buffer.from(await res.arrayBuffer())
      if (buf.length < 64) throw new Error("too small")
      const ct = res.headers.get("content-type") || "image/jpeg"
      const hash = createHash("sha1").update(url).digest("hex").slice(0, 16)
      const key = `directory/${folder}/${hash}.${extOf(url, ct)}`
      const { url: pub } = await uploadFile({
        key,
        body: buf,
        contentType: ct.split(";")[0]!.trim(),
      })
      if (!OUR.test(pub) && pub.startsWith("/placeholder")) {
        throw new Error("R2 not configured")
      }
      return pub
    } catch (e) {
      if (attempt === 2) {
        console.warn(`  ! mirror ${url.slice(0, 80)}: ${(e as Error).message}`)
        return null
      }
      await sleep(400 * (attempt + 1))
    }
  }
  return null
}

async function enrichProjects(): Promise<number> {
  const rows = await db.projectDirectory.findMany({
    where: {
      deletedAt: null,
      sourceUrl: { not: null },
      OR: [{ gallery: { isEmpty: true } }, { body: null }],
    },
    select: { slug: true, sourceUrl: true, lat: true, lng: true, image: true, address: true },
  })
  console.log(`Enrich ${rows.length} projects from source pages…`)
  let ok = 0
  for (let i = 0; i < rows.length; i += 2) {
    const batch = rows.slice(i, i + 2)
    await Promise.all(
      batch.map(async (r) => {
        if (!r.sourceUrl) return
        const deep = await fetchBuilding(r.sourceUrl)
        if (!deep) return
        try {
          const updated = await dbRetry(() =>
            db.projectDirectory.updateMany({
              where: { slug: r.slug, deletedAt: null },
              data: {
                ...(deep.gallery.length ? { gallery: deep.gallery } : {}),
                ...(deep.body ? { body: deep.body } : {}),
                ...(deep.passportUrl ? { passportUrl: deep.passportUrl.slice(0, 320) } : {}),
                ...(deep.image ? { image: deep.image.slice(0, 320) } : {}),
                ...(deep.address && !r.address ? { address: deep.address } : {}),
                ...(deep.lat != null && deep.lng != null ? { lat: deep.lat, lng: deep.lng } : {}),
              },
            }),
          )
          if (updated.count === 0) return
        } catch (e) {
          console.warn(`  ! update ${r.slug}: ${(e as Error).message}`)
          return
        }
        if (deep.lat != null && deep.lng != null && deep.floors > 0) {
          await db.mapBuilding
            .updateMany({
              where: { slug: r.slug },
              data: {
                floors: deep.floors,
                height: Math.max(45, deep.floors * 3.2),
                ...(deep.image ? { img: deep.image.slice(0, 260) } : {}),
                lat: deep.lat,
                lng: deep.lng,
                ...(deep.address ? { address: deep.address } : {}),
              },
            })
            .catch(() => {})
        }
        ok++
      }),
    )
    await sleep(120)
    if (i > 0 && i % 40 === 0) console.log(`  …${i}/${rows.length}`)
  }
  return ok
}

async function mirrorAll(heroesOnly: boolean): Promise<{ logos: number; projects: number; map: number }> {
  const [devs, projects, maps] = await Promise.all([
    db.developerProfile.findMany({
      where: { deletedAt: null, logoUrl: { contains: "googleapis.com" } },
      select: { slug: true, logoUrl: true },
    }),
    db.projectDirectory.findMany({
      where: { deletedAt: null },
      select: { slug: true, image: true, gallery: true, passportUrl: true },
    }),
    db.mapBuilding.findMany({
      where: { img: { contains: "googleapis.com" } },
      select: { slug: true, img: true },
    }),
  ])

  const needsMirror = projects.filter(
    (p) =>
      (p.image && !OUR.test(p.image) && p.image.startsWith("http")) ||
      (p.passportUrl && !OUR.test(p.passportUrl)) ||
      (!heroesOnly && (p.gallery ?? []).some((g) => g.startsWith("http") && !OUR.test(g))),
  )

  let logos = 0
  let projectImgs = 0
  let mapImgs = 0

  console.log(`Mirror ${devs.length} logos…`)
  for (let i = 0; i < devs.length; i += 2) {
    await Promise.all(
      devs.slice(i, i + 2).map(async (d) => {
        const mirrored = await mirrorOne(d.logoUrl!, "logos")
        if (!mirrored || mirrored === d.logoUrl) return
        await dbRetry(() =>
          db.developerProfile.updateMany({
            where: { slug: d.slug },
            data: { logoUrl: mirrored.slice(0, 320) },
          }),
        )
        logos++
      }),
    )
    await sleep(100)
    if (i > 0 && i % 40 === 0) console.log(`  …logos ${i}/${devs.length}`)
  }

  console.log(`Mirror ${needsMirror.length} project media${heroesOnly ? " (heroes+passport)" : ""}…`)
  for (let i = 0; i < needsMirror.length; i += 2) {
    await Promise.all(
      needsMirror.slice(i, i + 2).map(async (p) => {
        const hero =
          p.image?.startsWith("http") && !OUR.test(p.image)
            ? await mirrorOne(p.image, "projects")
            : p.image && OUR.test(p.image)
              ? p.image
              : null
        let gallery: string[] | undefined
        if (!heroesOnly) {
          gallery = []
          for (const g of p.gallery ?? []) {
            const m = OUR.test(g) ? g : await mirrorOne(g, "projects")
            if (m) gallery.push(m)
          }
        }
        const passport =
          p.passportUrl && !OUR.test(p.passportUrl)
            ? await mirrorOne(p.passportUrl, "passports")
            : p.passportUrl || null
        await dbRetry(() =>
          db.projectDirectory.updateMany({
            where: { slug: p.slug },
            data: {
              sourceUrl: null,
              ...(hero ? { image: hero.slice(0, 320) } : {}),
              ...(gallery?.length ? { gallery } : {}),
              ...(passport ? { passportUrl: passport.slice(0, 320) } : {}),
            },
          }),
        )
        if (hero || gallery?.length || passport) projectImgs++
      }),
    )
    await sleep(100)
    if (i > 0 && i % 20 === 0) console.log(`  …projects ${i}/${needsMirror.length}`)
  }

  console.log(`Mirror ${maps.length} map pins…`)
  for (let i = 0; i < maps.length; i += 2) {
    await Promise.all(
      maps.slice(i, i + 2).map(async (m) => {
        if (!m.img) return
        const mirrored = await mirrorOne(m.img, "projects")
        if (!mirrored || mirrored === m.img) return
        await dbRetry(() =>
          db.mapBuilding.updateMany({
            where: { slug: m.slug },
            data: { img: mirrored.slice(0, 260) },
          }),
        )
        mapImgs++
      }),
    )
    await sleep(100)
  }

  return { logos, projects: projectImgs, map: mapImgs }
}

async function main() {
  if (!process.env.R2_ACCOUNT_ID || !process.env.R2_PUBLIC_URL) {
    console.error("R2 env missing — abort (would leave hotlinks)")
    process.exit(1)
  }
  const mirrorOnly = process.argv.includes("--mirror-only")
  const heroesOnly = process.argv.includes("--heroes")
  if (!mirrorOnly) {
    const enriched = await enrichProjects()
    console.log(`Enriched ${enriched} projects`)
  }
  const mirrored = await mirrorAll(heroesOnly)
  console.log("Mirrored", mirrored)
  const cleared = await db.projectDirectory.updateMany({
    where: { sourceUrl: { contains: "korter." } },
    data: { sourceUrl: null },
  })
  console.log(`Cleared ${cleared.count} korter sourceUrl rows`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => db.$disconnect())
