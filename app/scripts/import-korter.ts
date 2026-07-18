/**
 * Korter.ge → Neon directory importer.
 *
 * Pulls every developer listed on korter.ge (all Georgian geos) and their
 * under-construction projects, using the server-rendered
 * `window.INITIAL_STATE` JSON — no headless browser needed.
 *
 * Import policy:
 *  - Developers already in our DB (by slug or exact normalized name) are
 *    skipped; our curated records are richer. Name-only matches are logged
 *    for manual review and their projects are NOT imported (attribution risk).
 *  - New developers land in developer_profiles with empty description for
 *    admin review.
 *  - Missing projects (any developer whose slug we have) land in
 *    project_directories as status "draft" — invisible to public pages,
 *    reviewed in /admin/professionals.
 *
 * Usage: npx tsx scripts/import-korter.ts
 * Requires: DATABASE_URL (see seed.ts). Idempotent — safe to re-run.
 *
 * ponytail: ~640 sequential HTTP fetches with an 80ms gap instead of a
 * scraping framework. Upgrade path: korter data partnership if they ever
 * rate-limit; near-duplicate name matches are logged, not auto-merged.
 */

import { config } from "dotenv"
import { resolve } from "path"

config({ path: resolve(__dirname, "..", ".env.local") })
config({ path: resolve(__dirname, "..", ".env") })

import { PrismaClient } from "../src/generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"

const connectionString = process.env.DATABASE_URL
if (!connectionString) {
  console.error("DATABASE_URL is not set. Check .env.local")
  process.exit(1)
}

const db = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
})

const BASE = "https://korter.ge"
const UA = { "User-Agent": "Mozilla/5.0 (compatible; sivrce-directory-sync/1.0)" }
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

/** Extract the first top-level JSON object assigned to window.INITIAL_STATE. */
function extractState(html: string): any | null {
  const marker = "window.INITIAL_STATE = "
  const start = html.indexOf(marker)
  if (start === -1) return null
  const from = start + marker.length
  let depth = 0
  for (let i = from; i < html.length; i++) {
    const ch = html[i]
    if (ch === "{") depth++
    else if (ch === "}") {
      depth--
      if (depth === 0) {
        try {
          return JSON.parse(html.slice(from, i + 1))
        } catch {
          return null
        }
      }
    }
  }
  return null
}

async function fetchState(url: string): Promise<any | null> {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(url, { headers: UA })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const state = extractState(await res.text())
      if (state) return state
    } catch (e) {
      if (attempt === 2) console.warn(`  ! ${url}: ${(e as Error).message}`)
    }
    await sleep(500 * (attempt + 1))
  }
  return null
}

/** English geo name (korter mainGeoObject.name / list slug) → ka city. */
const GEO_KA: Record<string, string> = {
  tbilisi: "თბილისი",
  batumi: "ბათუმი",
  kutaisi: "ქუთაისი",
  rustavi: "რუსთავი",
  bakuriani: "ბაკურიანი",
  borjomi: "ბორჯომი",
  gori: "გორი",
  gudauri: "გუდაური",
  bazaleti: "ბაზალეთი",
  gurjaani: "გურჯაანი",
  mtskheta: "მცხეთა",
  poti: "ფოთი",
  ureki: "ურეკი",
  zugdidi: "ზუგდიდი",
}
const kaCity = (en: string | undefined): string =>
  GEO_KA[(en ?? "").toLowerCase()] ?? en ?? ""

const norm = (s: string): string => s.toLowerCase().replace(/[^a-z0-9ა-ჰ]+/gi, "")
const slugFromLink = (link: string): string => link.replace(/^\/(en|ka|ru)\//, "").replace(/\/$/, "")
const logoOf = (name: string): string =>
  name.replace(/[^A-Za-z0-9]/g, "").slice(0, 3).toUpperCase() || "DEV"

interface KorterDev {
  developerId: number
  name: string
  link: string
  foundationYear: number | null
  geoSlug: string
}

async function listGeos(): Promise<string[]> {
  const state = await fetchState(`${BASE}/en/developers-in-tbilisi`)
  const links: { nominative: string; link: string }[] =
    state?.developerListingStore?.seo?.geoObjectPreposition
      ? state.developerListingStore.seo.seoLinks
      : []
  const geos = new Set<string>(["tbilisi"])
  for (const l of links ?? []) geos.add(slugFromLink(l.link).replace("developers-in-", ""))
  return [...geos]
}

async function listDevelopers(geoSlug: string): Promise<KorterDev[]> {
  const out: KorterDev[] = []
  for (let page = 1; page <= 60; page++) {
    const state = await fetchState(`${BASE}/en/developers-in-${geoSlug}?page=${page}`)
    await sleep(80)
    const store = state?.developerListingStore
    const batch: any[] = store?.developers ?? []
    for (const d of batch) {
      out.push({
        developerId: d.developerId,
        name: d.name,
        link: d.link,
        foundationYear: d.foundationYear ?? null,
        geoSlug,
      })
    }
    const total: number = store?.totalCount ?? 0
    if (batch.length === 0 || out.length >= total) break
  }
  return out
}

interface KorterBuilding {
  url: string
  name: string
  address: string
  mainGeoObject?: { name: string }
  subLocalityNominative?: string | null
  minPriceSqm: number | null
  minPrice: number | null
  salesStatus: string
  location?: { lat: number; lng: number } | null
  constructionStatus?: string
  endYear?: number | null
  endQuarter?: number | null
  images?: { mediaSrc?: { default?: { x2?: string } } }[]
}

/** Korter names that are the same company as a curated entry under a
 *  different name — import their projects onto the curated record instead
 *  of skipping them as name-only matches. */
const DEV_ALIAS = new Map([
  [norm("GBG Development"), "gbg-development"],
  [norm("Ande Group"), "ande-group"],
  [norm("Kolos"), "kolos"],
  [norm("One Development"), "x2-development"],
])

async function main() {
  console.log("Loading existing directory from Neon...")
  const [dbDevs, dbProjects] = await Promise.all([
    db.developerProfile.findMany({ select: { slug: true, name: true } }),
    db.projectDirectory.findMany({ select: { slug: true } }),
  ])
  const devBySlug = new Map(dbDevs.map((d) => [d.slug, d.name]))
  const devNames = new Map(dbDevs.map((d) => [norm(d.name), d.slug]))
  const projectSlugs = new Set(dbProjects.map((p) => p.slug))
  console.log(`  ${dbDevs.length} developers, ${dbProjects.length} projects in DB`)

  const geos = await listGeos()
  console.log(`Geos: ${geos.join(", ")}`)

  // Collect + dedupe developers across geos
  const seen = new Map<number, KorterDev>()
  for (const geo of geos) {
    const devs = await listDevelopers(geo)
    for (const d of devs) if (!seen.has(d.developerId)) seen.set(d.developerId, d)
    console.log(`  ${geo}: ${devs.length} developers`)
  }
  console.log(`Total unique korter developers: ${seen.size}`)

  let newDevs = 0
  let newProjects = 0
  let nameMatches = 0

  const importDeveloper = async (kd: KorterDev): Promise<void> => {
    const slug = slugFromLink(kd.link)

    // Existing developer? Slug wins, then curated alias; remaining exact-name
    // matches are reported, not merged.
    let ourSlug = devBySlug.has(slug) ? slug : DEV_ALIAS.get(norm(kd.name))
    if (ourSlug && !devBySlug.has(ourSlug)) ourSlug = undefined
    if (!ourSlug) {
      const named = devNames.get(norm(kd.name))
      if (named) {
        nameMatches++
        console.log(`  ~ name match "${kd.name}" → ${named} (korter slug ${slug}); projects skipped`)
        return
      }
    }

    if (!ourSlug) {
      // Brand-new developer → reviewable row
      try {
        await db.developerProfile.upsert({
          where: { slug },
          update: {},
          create: {
            id: `korter_${kd.developerId}`,
            slug,
            name: kd.name,
            logoText: logoOf(kd.name),
            projectsCount: 0,
            completedCount: 0,
            headquarters: kaCity(kd.geoSlug),
            rating: 0,
            color: "#2E6BFF",
            description: "",
          },
        })
        newDevs++
      } catch (e) {
        // ponytail: same P2002 race as projects — row exists either way.
        if ((e as { code?: string }).code !== "P2002") throw e
      }
      devBySlug.set(slug, kd.name)
      ourSlug = slug
    }

    // Their under-construction projects (only when sales are open)
    const state = await fetchState(`${BASE}${kd.link}`)
    const buildings: KorterBuilding[] =
      state?.developerLandingStore?.ongoingBuildings?.buildings ?? []
    for (const b of buildings) {
      if (b.salesStatus !== "available") continue
      const pSlug = slugFromLink(b.url)
      if (projectSlugs.has(pSlug)) continue
      try {
        await db.projectDirectory.upsert({
          where: { slug: pSlug },
          update: {},
          create: {
            id: `korter_${pSlug}`,
            slug: pSlug,
            name: b.name,
            developer: devBySlug.get(ourSlug) ?? kd.name,
            city: kaCity(b.mainGeoObject?.name),
            district: b.subLocalityNominative || b.address || "",
            status: "draft",
            readyBy: b.endYear && b.endQuarter ? `${b.endYear} Q${b.endQuarter}` : "",
            priceFrom: b.minPrice ?? 0,
            pricePerSqmFrom: b.minPriceSqm ?? 0,
            units: 0,
            image: b.images?.[0]?.mediaSrc?.default?.x2 ?? "",
            features: [],
          },
        })
        projectSlugs.add(pSlug)
        newProjects++
      } catch (e) {
        // ponytail: joint-venture projects show on several dev pages — a sibling
        // batch wins the insert race (P2002); the row exists either way.
        if ((e as { code?: string }).code !== "P2002") throw e
        projectSlugs.add(pSlug)
      }
    }
  }

  // ponytail: 6-wide batches with an 80ms gap — ~6x faster, still gentle on korter.
  const devs = [...seen.values()]
  for (let i = 0; i < devs.length; i += 6) {
    await Promise.all(devs.slice(i, i + 6).map(importDeveloper))
    await sleep(80)
    if (i > 0 && i % 150 === 0) console.log(`  …${i}/${devs.length} developers processed`)
  }

  console.log("—")
  console.log(`Korter developers seen: ${seen.size}`)
  console.log(`New developers imported (review): ${newDevs}`)
  console.log(`Name-only matches logged: ${nameMatches}`)
  console.log(`New draft projects imported: ${newProjects}`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => db.$disconnect())
