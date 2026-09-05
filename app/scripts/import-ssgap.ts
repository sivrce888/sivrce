/**
 * Gap import from ss.ge House API (owner-approved 2026-09-03; 2026-09-05
 * sweep also imports KNOWN developers' missing projects — skipped before,
 * leaving ~426 live projects out). OAuth client_credentials with the public
 * web client (ssweb) — same creds the ss.ge site itself uses in-browser.
 * Dup guards: competitor id, name+developer, name+city. Existing ss_<id>
 * rows: finished → completed; future deliveryDate → active + new readyBy
 * (delayed projects get their real deadline); else untouched. Media stays
 * remote until localize-directory re-run mirrors it to R2.
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

const norm = (s: string): string => s.toLowerCase().replace(/შპს|llc|ltd|inc|·|•|\+/g, " ").replace(/[^a-z0-9ა-ჰ]+/g, "")
const slugify = (s: string): string =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/-{2,}/g, "-").replace(/^-+|-+$/g, "").slice(0, 120)
const logoTextOf = (name: string): string => name.replace(/[^A-Za-z0-9ა-ჰ]/g, "").slice(0, 3).toUpperCase() || "DEV"

interface SsProject {
  projectId: number
  projectName: string
  projectUrl: string
  deliveryDate: string | null
  isFinished: boolean
  image: string
  address: string
  housePlanModel?: { price?: { priceGeo?: number } }[]
  companyId: number
  companyName: string
  companyLogo: string | null
}

async function token(): Promise<string> {
  const res = await fetch("https://account.ss.ge/connect/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: "grant_type=client_credentials&client_id=ssweb&client_secret=t5w42KQQjowNRYkycrrX",
  })
  if (!res.ok) throw new Error(`token HTTP ${res.status}`)
  const j = (await res.json()) as { access_token: string }
  return j.access_token
}

/** "თბილისი, ისანი-სამგორი, რუსთავის გზატკეცილი 18/22" → city/district/address */
function splitAddress(a: string): { city: string; district: string; address: string | null } {
  const parts = a.split(",").map((s) => s.trim()).filter(Boolean)
  return {
    city: (parts[0] || "თბილისი").slice(0, 100),
    district: (parts[1] || "—").slice(0, 120),
    address: parts.slice(2).join(", ").slice(0, 240) || (parts[1] || "").slice(0, 240) || null,
  }
}

async function main() {
  const t = await token()
  const res = await fetch("https://api-gateway.ss.ge/v1/House/project-search", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${t}` },
    body: JSON.stringify({ page: 1, pageSize: 600 }),
  })
  if (!res.ok) throw new Error(`project-search HTTP ${res.status}`)
  const { projects } = (await res.json()) as { projects: SsProject[] }
  console.log(`ss.ge projects fetched: ${projects.length}`)

  const [devs, rows] = await Promise.all([
    db.developerProfile.findMany({ where: { deletedAt: null }, select: { name: true } }),
    db.projectDirectory.findMany({ select: { name: true, developer: true, city: true } }),
  ])
  const devNorms = devs.map((d) => norm(d.name))
  // Dedup keys: name+developer and name+city (developer spelling varies across
  // korter/ss/myhome, same building re-listed).
  const rowKeys = new Set(rows.map((r) => norm(r.name) + "|" + norm(r.developer)))
  const rowCityKeys = new Set(rows.map((r) => norm(r.name) + "|" + norm(r.city)))
  const ssDevSlugs = new Set<string>()

  const year = new Date().getFullYear()
  let newDevs = 0
  let newProjects = 0
  let knownDevProjects = 0
  let refreshes = 0
  let skips = 0

  for (const p of projects) {
    const devName = (p.companyName || "").replace(/•/g, " ").trim()
    if (!devName || !p.projectName) continue
    const n = norm(devName)
    const id = `ss_${p.projectId}`
    const devYear = p.deliveryDate ? new Date(p.deliveryDate).getUTCFullYear() : null
    const devMonth = p.deliveryDate ? new Date(p.deliveryDate).getUTCMonth() + 1 : null
    const devReadyBy = devYear ? `${devYear}${devMonth ? ` Q${Math.ceil(devMonth / 3)}` : ""}` : ""

    // Existing row → refresh deadline/status from ss (delay sweeps), nothing else.
    const existed = await db.projectDirectory.findUnique({ where: { id }, select: { id: true, status: true } })
    if (existed) {
      if (p.isFinished && existed.status !== "completed") {
        await db.projectDirectory.update({
          where: { id },
          data: { status: "completed", ...(devYear ? { readyBy: `გადაცემულია (${devYear})` } : {}) },
        })
        refreshes++
      } else if (!p.isFinished && devYear && devYear >= year && existed.status === "completed") {
        // Delayed: delivery pushed past this year — reopen with the real date.
        await db.projectDirectory.update({ where: { id }, data: { status: "active", readyBy: devReadyBy } })
        refreshes++
      }
      continue
    }

    // New row: skip if the same building already exists under another source.
    const nameKey = norm(p.projectName) + "|" + n
    const cityKey = norm(p.projectName) + "|" + norm(splitAddress(p.address || "").city)
    if (rowKeys.has(nameKey) || rowCityKeys.has(cityKey)) {
      skips++
      continue
    }

    const matched = n.length > 2 && devNorms.some((d) => d === n || (n.length > 5 && (d.includes(n) || n.includes(d))))
    if (matched) knownDevProjects++

    const devSlug = `ss-${slugify(p.companyName || String(p.companyId))}`
    if (!matched && !ssDevSlugs.has(devSlug)) {
      const devExisted = await db.developerProfile.findUnique({ where: { slug: devSlug }, select: { id: true } })
      if (!devExisted) {
        const { city } = splitAddress(p.address || "")
        await db.developerProfile.create({
          data: {
            id: `ss_${p.companyId}`,
            slug: devSlug,
            name: devName.slice(0, 160),
            logoText: logoTextOf(devName).slice(0, 40),
            logoUrl: p.companyLogo ? p.companyLogo.slice(0, 320) : null,
            headquarters: city,
            color: "#2E6BFF",
            description: "",
          },
        })
        newDevs++
      }
      ssDevSlugs.add(devSlug)
      devNorms.push(n)
    }

    const sqm = (p.housePlanModel ?? [])
      .map((h) => h.price?.priceGeo ?? 0)
      .filter((x) => x > 0)
    const { city, district, address } = splitAddress(p.address || "")
    const fullImg = (p.image || "").replace("_Thumb", "")
    const data = {
      name: p.projectName.slice(0, 180),
      developer: devName.slice(0, 180),
      city,
      district,
      address,
      status: p.isFinished ? "completed" : "active",
      readyBy: devReadyBy.slice(0, 80),
      priceFrom: 0,
      pricePerSqmFrom: sqm.length ? Math.min(...sqm) : 0,
      image: fullImg.slice(0, 320),
      gallery: fullImg.startsWith("http") ? [fullImg] : [],
    }
    const slug = slugify(p.projectUrl || p.projectName)
    rowKeys.add(nameKey)
    rowCityKeys.add(cityKey)
    try {
      await db.projectDirectory.create({ data: { id, slug, units: 0, ...data } })
      newProjects++
    } catch {
      try {
        await db.projectDirectory.create({ data: { id, slug: `ss-${slug}`.slice(0, 140), units: 0, ...data } })
        newProjects++
      } catch (e2) {
        console.warn(`  ! ${p.projectUrl}: ${(e2 as Error).message.slice(0, 80)}`)
      }
    }
  }
  console.log(`RESULT knownDevProjects=${knownDevProjects} newDevs=${newDevs} newProjects=${newProjects} refreshes=${refreshes} dupSkips=${skips}`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => db.$disconnect())
