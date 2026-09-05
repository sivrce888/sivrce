/**
 * Gap import from myhome.ge public projects API (owner-approved 2026-09-03;
 * 2026-09-05 sweep also imports KNOWN developers' missing projects — skipped
 * before, leaving ~14 live projects out). Dup guards: competitor id,
 * name+developer, name+city. Existing myhome_<id> rows only upgrade to
 * completed (never downgrade — stale sweep owns the other direction).
 * Media stays remote URL here; the re-run of scripts/localize-directory.ts
 * mirrors it to R2.
 */
import { config } from "dotenv"
import { resolve } from "path"

config({ path: resolve(__dirname, "..", ".env.local") })
config({ path: resolve(__dirname, "..", ".env") })

import { PrismaClient } from "../src/generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"

const u = process.env.DATABASE_URL as string
const db = new PrismaClient({
  adapter: new PrismaPg({
    connectionString: /uselibpqcompat=/i.test(u) ? u : `${u}${u.includes("?") ? "&" : "?"}uselibpqcompat=true`,
  }),
})

const API = "https://api-statements.tnet.ge/api/tnet-projects/listing"
const HEADERS = { "X-Website-Key": "myhome", Accept: "application/json", "User-Agent": "Mozilla/5.0" }
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))
const norm = (s: string): string => s.toLowerCase().replace(/შპს|llc|ltd|inc|·|•|\+/g, " ").replace(/[^a-z0-9ა-ჰ]+/g, "")
const slugify = (s: string): string =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/-{2,}/g, "-").replace(/^-+|-+$/g, "").slice(0, 120)
const logoTextOf = (name: string): string => name.replace(/[^A-Za-z0-9ა-ჰ]/g, "").slice(0, 3).toUpperCase() || "DEV"

interface MhProject {
  id: number
  slug: string
  display_name: string
  street: string
  city: string
  district: string
  urban: string
  building_status: string
  image: string
  images?: { large: string; is_main: boolean }[]
  min_price?: Record<string, { square_price_from?: string; price_from?: string }>
  developer: { global_user_id: number; name: string; logo: string } | null
}

async function fetchAllProjects(): Promise<MhProject[]> {
  const out: MhProject[] = []
  for (let page = 1; page <= 20; page++) {
    const res = await fetch(`${API}?page=${page}`, { headers: HEADERS })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const json = (await res.json()) as { data: { data: MhProject[]; last_page: number } }
    out.push(...json.data.data)
    if (page >= json.data.last_page) break
    await sleep(300)
  }
  return out
}

async function main() {
  const [devs, rows] = await Promise.all([
    db.developerProfile.findMany({ where: { deletedAt: null }, select: { name: true } }),
    db.projectDirectory.findMany({ select: { name: true, developer: true, city: true } }),
  ])
  const devNorms = devs.map((d) => norm(d.name))
  // Dedup keys: name+developer and name+city (developer string spelling varies
  // across korter/ss/myhome, same building re-listed).
  const rowKeys = new Set(rows.map((r) => norm(r.name) + "|" + norm(r.developer)))
  const rowCityKeys = new Set(rows.map((r) => norm(r.name) + "|" + norm(r.city)))
  const projects = await fetchAllProjects()
  console.log(`myhome projects fetched: ${projects.length}`)

  let newDevs = 0
  let newProjects = 0
  let completedUpgrades = 0
  let knownDevProjects = 0
  let skippedDup = 0

  for (const p of projects) {
    const devName = (p.developer?.name || "").trim()
    if (!devName || !p.display_name) continue
    const n = norm(devName)
    const id = `myhome_${p.id}`
    const status = /დასრულ/i.test(p.building_status) ? "completed" : "active"

    // Existing row → refresh status upward, nothing else (readyBy: myhome has none).
    if (await db.projectDirectory.findUnique({ where: { id }, select: { id: true, status: true } })) {
      if (status === "completed") {
        await db.projectDirectory.update({ where: { id }, data: { status: "completed" } })
        completedUpgrades++
      }
      continue
    }

    // New row: skip if the same building already exists under another source.
    const nameKey = norm(p.display_name) + "|" + n
    const cityKey = norm(p.display_name) + "|" + norm(p.city || "")
    if (rowKeys.has(nameKey) || rowCityKeys.has(cityKey)) {
      skippedDup++
      continue
    }

    const matched = n.length > 2 && devNorms.some((d) => d === n || (n.length > 5 && (d.includes(n) || n.includes(d))))
    if (matched) knownDevProjects++

    // Create developer if this sweep hasn't already.
    const devSlug = `mh-${slugify(devName)}`
    if (!matched) {
      const existed = await db.developerProfile.findUnique({ where: { slug: devSlug }, select: { id: true } })
      if (!existed) {
        await db.developerProfile.create({
          data: {
            id: `myhome_${p.developer!.global_user_id}`,
            slug: devSlug,
            name: devName.slice(0, 160),
            logoText: logoTextOf(devName).slice(0, 40),
            logoUrl: p.developer!.logo ? p.developer!.logo.slice(0, 320) : null,
            headquarters: (p.city || "თბილისი").slice(0, 160),
            color: "#2E6BFF",
            description: "",
          },
        })
        devNorms.push(norm(devName))
        newDevs++
      }
    }

    const prices = Object.values(p.min_price ?? {})
    const priceFrom = Math.min(...prices.map((x) => Number(x.price_from ?? 0)).filter((x) => x > 0), Number.MAX_SAFE_INTEGER)
    const sqmFrom = Math.min(...prices.map((x) => Number(x.square_price_from ?? 0)).filter((x) => x > 0), Number.MAX_SAFE_INTEGER)
    const gallery = (p.images ?? []).map((i) => i.large).filter((x) => x.startsWith("http")).slice(0, 16)
    const slug = slugify(p.slug || p.display_name)
    const data = {
      name: p.display_name.slice(0, 180),
      developer: devName.slice(0, 180),
      city: (p.city || "თბილისი").slice(0, 100),
      district: (p.urban || p.district || "—").slice(0, 120),
      address: p.street ? p.street.slice(0, 240) : null,
      status,
      readyBy: "",
      priceFrom: Number.isFinite(priceFrom) && priceFrom < Number.MAX_SAFE_INTEGER ? Math.round(priceFrom) : 0,
      pricePerSqmFrom: Number.isFinite(sqmFrom) && sqmFrom < Number.MAX_SAFE_INTEGER ? Math.round(sqmFrom) : 0,
      image: (gallery[0] || p.image || "").slice(0, 320),
      gallery,
    }
    rowKeys.add(nameKey)
    rowCityKeys.add(cityKey)
    try {
      await db.projectDirectory.create({
        data: { id, slug, units: 0, ...data },
      })
      newProjects++
    } catch {
      // slug collision (korter row with same slug) — prefix and retry once
      try {
        await db.projectDirectory.create({
          data: { id, slug: `mh-${slug}`.slice(0, 140), units: 0, ...data },
        })
        newProjects++
      } catch (e2) {
        console.warn(`  ! ${p.slug}: ${(e2 as Error).message.slice(0, 80)}`)
      }
    }
  }
  console.log(`RESULT knownDevProjects=${knownDevProjects} newDevs=${newDevs} newProjects=${newProjects} completedUpgrades=${completedUpgrades} dupSkips=${skippedDup}`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => db.$disconnect())
