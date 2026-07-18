/**
 * Korter.ge → Neon directory sync (shared by CLI + Vercel cron).
 *
 * Pulls every Georgian-geo developer and their for-sale ongoing projects from
 * `window.INITIAL_STATE`. Upserts address / lat / lng / render / official site.
 * Available ongoing projects are status "active" (public + map).
 *
 * ponytail: ~700 HTTP fetches, 6-wide. Ceiling: korter rate-limit → partnership
 * or sitemap dump. Name-matched developers reuse our slug (projects + map pins).
 */

import type { PrismaClient } from "@/generated/prisma/client"

const BASE = "https://korter.ge"
const UA = { "User-Agent": "Mozilla/5.0 (compatible; sivrce-directory-sync/1.0)" }
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

export function extractState(html: string): unknown | null {
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

type KorterState = {
  developerListingStore?: {
    seo?: { seoLinks?: { link: string }[] }
    developers?: {
      developerId: number
      name: string
      link: string
      foundationYear?: number | null
    }[]
    totalCount?: number
  }
  developerLandingStore?: {
    developer?: { site?: { url?: string; name?: string } | null; logo?: unknown }
    ongoingBuildings?: { buildings?: KorterBuilding[] }
  }
}

async function fetchState(url: string): Promise<KorterState | null> {
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
  kobuleti: "ქობულეთი",
}
const kaCity = (en: string | undefined): string =>
  GEO_KA[(en ?? "").toLowerCase()] ?? en ?? ""

const norm = (s: string): string => s.toLowerCase().replace(/[^a-z0-9ა-ჰ]+/gi, "")
const slugFromLink = (link: string): string =>
  link.replace(/^\/(en|ka|ru)\//, "").replace(/\/$/, "")
const logoOf = (name: string): string =>
  name.replace(/[^A-Za-z0-9]/g, "").slice(0, 3).toUpperCase() || "DEV"

/** Decode korter redirect → official site URL. */
export function officialWebsite(site?: { url?: string; name?: string } | null): string {
  if (!site) return ""
  try {
    if (site.url) {
      const u = new URL(site.url, BASE)
      const to = u.searchParams.get("to")
      if (to) return decodeURIComponent(to).replace(/\/$/, "")
    }
  } catch {
    /* fall through */
  }
  return site.name ? `https://${site.name.replace(/^https?:\/\//, "")}` : ""
}

function clip(s: string, n: number): string {
  return s.length <= n ? s : s.slice(0, n)
}

/** Door/corpus number from street address — Georgian "ქუჩა 37" or EN "St, 99". */
export function buildingNumberOf(address: string): string {
  const head = address.split(",")[0] ?? address
  const fromHead = head.match(/(\d+[a-zA-Zა-ჰ]?)\s*$/)?.[1]
  if (fromHead) return fromHead
  return address.match(/,\s*(\d+[a-zA-Zა-ჰ]?)\b/)?.[1] ?? ""
}

interface KorterDev {
  developerId: number
  name: string
  link: string
  foundationYear: number | null
  geoSlug: string
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
  phone?: string | null
}

const DEV_ALIAS = new Map([
  [norm("GBG Development"), "gbg-development"],
  [norm("Ande Group"), "ande-group"],
  [norm("Kolos"), "kolos"],
  [norm("One Development"), "x2-development"],
  [norm("m²"), "m2-development"],
  [norm("m2"), "m2-development"],
  [norm("Anagi Development"), "anagi"],
  [norm("Anagi"), "anagi"],
  [norm("Milestone"), "milestone-development"],
  [norm("Silk Development"), "silk-development"],
  [norm("Apart Development"), "apart-group"],
  [norm("Elt Building"), "elt-group"],
  [norm("Horizon Batumi"), "horizon-group"],
])

/** Curated slug → korter slug that already has the official logo. */
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
}

export type SyncKorterResult = {
  developersSeen: number
  newDevelopers: number
  nameMatches: number
  newProjects: number
  updatedProjects: number
  withCoords: number
  mapBuildingsUpserted: number
  draftsActivated: number
  logosAliased: number
}

async function listGeos(): Promise<string[]> {
  const state = await fetchState(`${BASE}/en/developers-in-tbilisi`)
  const links: { link: string }[] = state?.developerListingStore?.seo?.seoLinks ?? []
  const geos = new Set<string>(["tbilisi"])
  for (const l of links) geos.add(slugFromLink(l.link).replace("developers-in-", ""))
  return [...geos]
}

async function listDevelopers(geoSlug: string): Promise<KorterDev[]> {
  const out: KorterDev[] = []
  for (let page = 1; page <= 60; page++) {
    const state = await fetchState(`${BASE}/en/developers-in-${geoSlug}?page=${page}`)
    await sleep(80)
    const store = state?.developerListingStore
    const batch = store?.developers ?? []
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

export async function syncKorterDirectory(
  db: PrismaClient,
  opts: { log?: (msg: string) => void } = {},
): Promise<SyncKorterResult> {
  const log = opts.log ?? (() => {})

  log("Loading existing directory...")
  const [dbDevs, dbProjects] = await Promise.all([
    db.developerProfile.findMany({ select: { id: true, slug: true, name: true } }),
    db.projectDirectory.findMany({ select: { slug: true, status: true } }),
  ])
  const devBySlug = new Map(dbDevs.map((d) => [d.slug, { id: d.id, name: d.name }]))
  const devNames = new Map(dbDevs.map((d) => [norm(d.name), d.slug]))
  const projectStatus = new Map(dbProjects.map((p) => [p.slug, p.status]))
  log(`  ${dbDevs.length} developers, ${dbProjects.length} projects in DB`)

  const geos = await listGeos()
  log(`Geos: ${geos.join(", ")}`)

  const seen = new Map<number, KorterDev>()
  for (const geo of geos) {
    const devs = await listDevelopers(geo)
    for (const d of devs) if (!seen.has(d.developerId)) seen.set(d.developerId, d)
    log(`  ${geo}: ${devs.length} developers`)
  }
  log(`Total unique korter developers: ${seen.size}`)

  let newDevs = 0
  let newProjects = 0
  let updatedProjects = 0
  let withCoords = 0
  let nameMatches = 0
  let mapBuildingsUpserted = 0

  const importDeveloper = async (kd: KorterDev): Promise<void> => {
    const slug = slugFromLink(kd.link)

    let ourSlug = devBySlug.has(slug) ? slug : DEV_ALIAS.get(norm(kd.name))
    if (ourSlug && !devBySlug.has(ourSlug)) ourSlug = undefined
    if (!ourSlug) {
      const named = devNames.get(norm(kd.name))
      if (named) {
        // Same developer, different korter slug — reuse ours so projects/pins attach.
        nameMatches++
        ourSlug = named
      }
    }

    const state = await fetchState(`${BASE}${kd.link}`)
    const landing = state?.developerLandingStore
    const kdInfo = landing?.developer
    const website = officialWebsite(kdInfo?.site)
    const logoUrl = typeof kdInfo?.logo === "string" ? kdInfo.logo : ""

    if (!ourSlug) {
      try {
        await db.developerProfile.upsert({
          where: { slug },
          update: {
            ...(website ? { website: clip(website, 200) } : {}),
            ...(logoUrl ? { logoUrl: clip(logoUrl, 320) } : {}),
          },
          create: {
            id: `korter_${kd.developerId}`,
            slug,
            name: kd.name,
            logoText: logoOf(kd.name),
            website: website ? clip(website, 200) : null,
            logoUrl: logoUrl ? clip(logoUrl, 320) : null,
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
        if ((e as { code?: string }).code !== "P2002") throw e
      }
      const row = await db.developerProfile.findUnique({
        where: { slug },
        select: { id: true, name: true },
      })
      if (row) {
        devBySlug.set(slug, row)
        ourSlug = slug
      }
    } else if (website || logoUrl) {
      // ponytail: Neon free-tier socket timeouts under 6-wide concurrency.
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          await db.developerProfile.update({
            where: { slug: ourSlug },
            data: {
              ...(website ? { website: clip(website, 200) } : {}),
              ...(logoUrl ? { logoUrl: clip(logoUrl, 320) } : {}),
            },
          })
          break
        } catch (e) {
          if ((e as { code?: string }).code !== "P1008" || attempt === 2) throw e
          await sleep(400 * (attempt + 1))
        }
      }
    }

    if (!ourSlug) return

    const buildings: KorterBuilding[] = landing?.ongoingBuildings?.buildings ?? []
    for (const b of buildings) {
      if (b.salesStatus !== "available" || !b.name) continue
      const pSlug = slugFromLink(b.url)
      const lat = b.location?.lat ?? null
      const lng = b.location?.lng ?? null
      const image = b.images?.[0]?.mediaSrc?.default?.x2 ?? ""
      const district = clip(b.subLocalityNominative || "", 120)
      const address = clip(b.address || "", 240)
      const readyBy = b.endYear && b.endQuarter ? `${b.endYear} Q${b.endQuarter}` : ""
      const sourceUrl = clip(`${BASE}${b.url}`, 320)
      const features: string[] = []
      if (b.constructionStatus) features.push(`status:${b.constructionStatus}`)
      if (b.phone) features.push(`phone:${b.phone}`)

      // Available on korter = live on sivrce (map + /projects).
      const data = {
        name: clip(b.name, 180),
        developer: clip(devBySlug.get(ourSlug)?.name ?? kd.name, 180),
        city: clip(kaCity(b.mainGeoObject?.name), 100),
        district: district || clip(address, 120),
        address: address || null,
        lat,
        lng,
        sourceUrl,
        readyBy: clip(readyBy, 80),
        priceFrom: b.minPrice ?? 0,
        pricePerSqmFrom: b.minPriceSqm ?? 0,
        image: clip(image, 320),
        features,
        status: "active" as const,
      }

      const existed = projectStatus.has(pSlug)
      try {
        await db.projectDirectory.upsert({
          where: { slug: pSlug },
          update: data,
          create: {
            id: `korter_${pSlug}`,
            slug: pSlug,
            units: 0,
            ...data,
          },
        })
        if (existed) updatedProjects++
        else {
          newProjects++
          projectStatus.set(pSlug, "active")
        }
        if (lat != null && lng != null) withCoords++
      } catch (e) {
        if ((e as { code?: string }).code !== "P2002") throw e
        projectStatus.set(pSlug, "active")
      }

      // Exact corpus pin linked to developer + project (admin map + DB merge).
      if (lat != null && lng != null && Number.isFinite(lat) && Number.isFinite(lng)) {
        const bn = buildingNumberOf(address)
        const pin = {
          title: clip(b.name, 180),
          address: address || null,
          city: clip(kaCity(b.mainGeoObject?.name), 100) || null,
          district: district || null,
          buildingNumber: bn || null,
          lat,
          lng,
          img: image ? clip(image, 260) : null,
          status: "construction" as const,
          projectSlug: pSlug,
          developerId: devBySlug.get(ourSlug)?.id ?? null,
          floors: 0,
          height: 45,
        }
        try {
          await db.mapBuilding.upsert({
            where: { slug: pSlug },
            update: pin,
            create: { slug: pSlug, ...pin },
          })
          mapBuildingsUpserted++
        } catch (e) {
          if ((e as { code?: string }).code !== "P2002") throw e
        }
      }
    }
  }

  const devs = [...seen.values()]
  // ponytail: 3-wide — Neon socket timeout at 6 under full refresh.
  for (let i = 0; i < devs.length; i += 3) {
    await Promise.all(devs.slice(i, i + 3).map(importDeveloper))
    await sleep(120)
    if (i > 0 && i % 150 === 0) log(`  …${i}/${devs.length} developers processed`)
  }

  // Catch any leftover drafts from older imports.
  const activated = await db.projectDirectory.updateMany({
    where: { status: "draft", deletedAt: null },
    data: { status: "active" },
  })

  // Copy logos from korter twin slugs onto curated profiles (m2 ↔ m², etc.).
  let logosAliased = 0
  for (const [curated, twin] of Object.entries(LOGO_SLUG_ALIAS)) {
    const src = await db.developerProfile.findUnique({
      where: { slug: twin },
      select: { logoUrl: true, website: true },
    })
    if (!src?.logoUrl) continue
    const dst = await db.developerProfile.findUnique({
      where: { slug: curated },
      select: { logoUrl: true, website: true },
    })
    if (!dst || dst.logoUrl) continue
    await db.developerProfile.update({
      where: { slug: curated },
      data: {
        logoUrl: src.logoUrl,
        ...(src.website && !dst.website ? { website: src.website } : {}),
      },
    })
    logosAliased++
  }

  return {
    developersSeen: seen.size,
    newDevelopers: newDevs,
    nameMatches,
    newProjects,
    updatedProjects,
    withCoords,
    mapBuildingsUpserted,
    draftsActivated: activated.count,
    logosAliased,
  }
}
