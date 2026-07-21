/**
 * One-shot: pull official developer logos from korter → R2 (cdn.sivrce.ge)
 * + local public/images/developers/{slug}.webp, then set DB logoUrl.
 *
 * Usage: npx tsx scripts/sync-developer-logos.ts
 *        npx tsx scripts/sync-developer-logos.ts --check
 *
 * ponytail: korter is source-of-truth for logos only (not full re-import).
 * Re-run safe — skips rows already on cdn.sivrce.ge.
 */

import { config } from "dotenv"
import { createHash } from "crypto"
import { existsSync } from "fs"
import { writeFile, unlink } from "fs/promises"
import { resolve } from "path"
import assert from "node:assert/strict"
import sharp from "sharp"

config({ path: resolve(__dirname, "..", ".env.local") })
config({ path: resolve(__dirname, "..", ".env") })

import { PrismaClient } from "../src/generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { extractState } from "../src/lib/directory/sync-korter"
import { uploadFile } from "../src/lib/storage"
import { DEVELOPERS } from "../src/data/professionals"

const BASE = "https://korter.ge"
const UA = { "User-Agent": "Mozilla/5.0 (compatible; sivrce-logo-sync/1.0)" }
const OUR = /cdn\.sivrce\.ge|images\.sivrce\.ge/
const PUBLIC_DIR = resolve(__dirname, "..", "public", "images", "developers")
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

/** Our slug → korter path slug when they differ. */
const LOGO_SLUG_ALIAS: Record<string, string> = {
  "m2-development": "m-development",
  anagi: "anagi-development",
  "milestone-development": "milestone",
  "silk-development": "silk-road-group",
  "apart-group": "apart-development",
  "elt-group": "elt-building",
  "horizon-group": "horizons-group",
  "one-development": "x2-development",
  "ambassadori-group": "ambassadori-batumi-island",
  "mziuri-development": "urbanus-mziuri",
  "tbilisi-hills": "tbilisi-hills-development-and-construction",
  "alia-group": "mshenaliansi",
  "kolkhi-group": "kolkhi",
  "european-village": "european-village",
  "gradburg-development": "gradburg",
}

/** Direct official logo URLs when korter has none. */
const MANUAL_LOGO_URL: Record<string, string> = {
  dirsi: "https://dirsi.ge/images/logo.png",
  "king-david": "https://kdr.ge/wp-content/uploads/2025/08/king-logo.png",
  "lider-development": "https://liderdevelopment.com/assets/img/ld-logo.png",
  "telavi-estate": "https://telaviestate.com/storage/logo/logo-saitis.png",
  "kakheti-telavi-sun": "https://telavismze.com/_astro/logo-header.Cw7aA0cf.svg",
  "apollo-gs": "https://apollo.ge/wp-content/uploads/2023/01/Logo-For-Site-baner.png",
  "artex-group":
    "https://static.tildacdn.net/tild6133-3766-4366-b537-303434346133/Group_345.svg",
}

function withPgSslCompat(url: string) {
  if (/uselibpqcompat=/i.test(url) || /sslmode=disable/i.test(url)) return url
  return `${url}${url.includes("?") ? "&" : "?"}uselibpqcompat=true`
}

const connectionString = process.env.DATABASE_URL
if (!connectionString) {
  console.error("DATABASE_URL missing")
  process.exit(1)
}

const db = new PrismaClient({
  adapter: new PrismaPg({ connectionString: withPgSslCompat(connectionString) }),
})

const norm = (s: string): string => s.toLowerCase().replace(/[^a-z0-9ა-ჰ]+/gi, "")

type KorterListing = { name: string; link: string }

async function fetchJsonState(url: string): Promise<unknown | null> {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(url, { headers: UA })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      return extractState(await res.text())
    } catch (e) {
      if (attempt === 2) console.warn(`  ! ${url}: ${(e as Error).message}`)
      await sleep(400 * (attempt + 1))
    }
  }
  return null
}

async function listKorterDevs(): Promise<KorterListing[]> {
  const geos = ["tbilisi", "batumi", "kutaisi", "rustavi"]
  const byLink = new Map<string, KorterListing>()
  for (const geo of geos) {
    for (let page = 1; page <= 40; page++) {
      const state = (await fetchJsonState(`${BASE}/en/developers-in-${geo}?page=${page}`)) as {
        developerListingStore?: {
          developers?: { name: string; link: string }[]
          totalCount?: number
        }
      } | null
      await sleep(60)
      const batch = state?.developerListingStore?.developers ?? []
      for (const d of batch) {
        if (d.link && !byLink.has(d.link)) byLink.set(d.link, { name: d.name, link: d.link })
      }
      const total = state?.developerListingStore?.totalCount ?? 0
      if (batch.length === 0 || byLink.size >= total) break
    }
    console.log(`  listed ${geo}: ${byLink.size} unique so far`)
  }
  return [...byLink.values()]
}

function korterSlug(link: string): string {
  return link
    .replace(/^\/(en|ka|ru)\//, "")
    .replace(/\/$/, "")
    .toLowerCase()
}

async function logoFromKorter(korterPath: string): Promise<string | null> {
  const state = (await fetchJsonState(`${BASE}/en/${korterPath}`)) as {
    developerLandingStore?: { developer?: { logo?: unknown } }
  } | null
  const logo = state?.developerLandingStore?.developer?.logo
  return typeof logo === "string" && logo.startsWith("http") ? logo : null
}

async function logoFromWebsite(website: string): Promise<string | null> {
  try {
    const origin = new URL(website).origin
    const candidates = [
      `${origin}/images/logo.png`,
      `${origin}/images/logo.svg`,
      `${origin}/logo.png`,
      `${origin}/logo.svg`,
      `${origin}/assets/logo.png`,
      `${origin}/wp-content/uploads/logo.png`,
    ]
    for (const u of candidates) {
      const res = await fetch(u, { headers: UA, method: "HEAD" })
      const ct = res.headers.get("content-type") || ""
      if (res.ok && /image\//.test(ct)) return u
    }
    const page = await fetch(website, { headers: UA })
    if (!page.ok) return null
    const html = await page.text()
    const og = html.match(
      /property=["']og:image["'][^>]*content=["']([^"']+)["']|content=["']([^"']+)["'][^>]*property=["']og:image["']/i,
    )
    const ogUrl = og?.[1] || og?.[2]
    if (ogUrl?.startsWith("http") && !/favicon|sprite/i.test(ogUrl)) return ogUrl
    const logoSrc = html.match(/src=["']([^"']*logo[^"']*\.(?:png|svg|webp|jpe?g))["']/i)
    if (logoSrc?.[1]) {
      const abs = logoSrc[1].startsWith("http")
        ? logoSrc[1]
        : new URL(logoSrc[1], origin).href
      return abs
    }
  } catch {
    /* ignore */
  }
  return null
}

async function resolveLogoSrc(
  slug: string,
  name: string,
  tryPaths: string[],
  website?: string,
): Promise<string | null> {
  if (MANUAL_LOGO_URL[slug]) return MANUAL_LOGO_URL[slug]

  for (const path of tryPaths) {
    const src = await logoFromKorter(path)
    await sleep(80)
    if (src) return src
  }

  if (website) {
    const fromSite = await logoFromWebsite(website)
    if (fromSite) return fromSite
  }
  void name
  return null
}

async function toWebp(buf: Buffer): Promise<Buffer> {
  const base = sharp(buf).rotate().resize(400, 400, {
    fit: "inside",
    withoutEnlargement: true,
  })
  const meta = await base.metadata()
  let pipeline = base
  if (meta.hasAlpha) {
    const stats = await sharp(buf).rotate().stats()
    const alpha = stats.channels[3]?.mean ?? 255
    const rgb =
      ((stats.channels[0]?.mean ?? 0) +
        (stats.channels[1]?.mean ?? 0) +
        (stats.channels[2]?.mean ?? 0)) /
      3
    // Light mark on transparent → invisible on white cards; sit on navy.
    // Dark marks keep alpha (white card behind).
    if (alpha < 100 && rgb > 180) {
      pipeline = pipeline.flatten({ background: { r: 10, g: 16, b: 48 } })
    }
  }
  return pipeline.webp({ quality: 90 }).toBuffer()
}

async function mirrorLogo(srcUrl: string, slug: string): Promise<string | null> {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(srcUrl, { headers: UA })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const raw = Buffer.from(await res.arrayBuffer())
      if (raw.length < 64) throw new Error("too small")
      const webp = await toWebp(raw)
      const localPath = resolve(PUBLIC_DIR, `${slug}.webp`)
      await writeFile(localPath, webp)
      // Drop placeholder SVG once we own a real asset.
      await unlink(resolve(PUBLIC_DIR, `${slug}.svg`)).catch(() => {})

      const hash = createHash("sha1").update(srcUrl).digest("hex").slice(0, 16)
      const { url: pub } = await uploadFile({
        key: `directory/logos/${hash}.webp`,
        body: webp,
        contentType: "image/webp",
      })
      if (!OUR.test(pub)) throw new Error(`R2 not configured (${pub})`)
      return pub
    } catch (e) {
      if (attempt === 2) {
        console.warn(`  ! mirror ${slug}: ${(e as Error).message}`)
        return null
      }
      await sleep(400 * (attempt + 1))
    }
  }
  return null
}

async function main() {
  if (process.argv.includes("--check")) {
    assert.equal(korterSlug("/en/m-development"), "m-development")
    assert.equal(norm("m²"), "m")
    assert.ok(LOGO_SLUG_ALIAS["m2-development"])
    console.log("sync-developer-logos.check OK")
    return
  }
  if (!process.env.R2_ACCOUNT_ID || !process.env.R2_PUBLIC_URL) {
    console.error("R2 env missing — abort")
    process.exit(1)
  }

  const dbRows = await db.developerProfile.findMany({
    where: { deletedAt: null },
    select: { slug: true, name: true, logoUrl: true },
  })
  const byDbSlug = new Map(dbRows.map((d) => [d.slug, d]))

  // Union: DB profiles + curated static list (local webp even if no DB row).
  const targets = new Map<string, { slug: string; name: string; logoUrl: string | null }>()
  for (const d of dbRows) targets.set(d.slug, d)
  for (const d of DEVELOPERS) {
    if (targets.has(d.slug)) continue
    targets.set(d.slug, {
      slug: d.slug,
      name: d.name.en || d.name.ka || d.slug,
      logoUrl: null,
    })
  }

  const alreadyCdn = [...targets.values()].filter((d) => d.logoUrl && OUR.test(d.logoUrl)).length
  console.log(`Targets: ${targets.size} (${alreadyCdn} already on CDN)`)

  console.log("Listing korter developers…")
  const korter = await listKorterDevs()
  console.log(`Korter unique: ${korter.length}`)

  const byKorterSlug = new Map(korter.map((k) => [korterSlug(k.link), k]))
  const byName = new Map(korter.map((k) => [norm(k.name), k]))

  const websiteBySlug = new Map(
    DEVELOPERS.filter((d) => d.website).map((d) => [d.slug, d.website!]),
  )

  let ok = 0
  let miss = 0
  let skip = 0

  for (const d of targets.values()) {
    if (d.logoUrl && OUR.test(d.logoUrl) && existsSync(resolve(PUBLIC_DIR, `${d.slug}.webp`))) {
      skip++
      continue
    }

    const alias = LOGO_SLUG_ALIAS[d.slug]
    const listed =
      (alias && byKorterSlug.get(alias)) ||
      byKorterSlug.get(d.slug) ||
      byName.get(norm(d.name)) ||
      null

    const tryPaths = [
      ...new Set(
        [alias, d.slug, listed ? korterSlug(listed.link) : null].filter(
          (p): p is string => !!p,
        ),
      ),
    ]

    const src = await resolveLogoSrc(
      d.slug,
      d.name,
      tryPaths,
      websiteBySlug.get(d.slug),
    )

    if (!src) {
      miss++
      console.log(`  – no logo: ${d.slug} (tried ${tryPaths.join(", ") || "—"})`)
      continue
    }

    const pub = await mirrorLogo(src, d.slug)
    if (!pub) {
      miss++
      continue
    }

    if (byDbSlug.has(d.slug)) {
      await db.developerProfile.update({
        where: { slug: d.slug },
        data: { logoUrl: pub.slice(0, 320) },
      })
    }
    ok++
    console.log(`  ✓ ${d.slug}`)
  }

  console.log(JSON.stringify({ ok, skip, miss, total: targets.size }, null, 2))
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => db.$disconnect())
