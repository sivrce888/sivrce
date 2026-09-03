/**
 * ONE-SHOT gap import from ss.ge House API (owner-approved 2026-09-03).
 * OAuth client_credentials with the public web client (ssweb) — same creds
 * the ss.ge site itself uses in-browser. Only imports developers NOT already
 * in DB; media stays remote until localize-directory re-run mirrors it to R2.
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

  const devs = await db.developerProfile.findMany({ where: { deletedAt: null }, select: { name: true } })
  const devNorms = devs.map((d) => norm(d.name))
  const ssDevSlugs = new Set<string>()

  let newDevs = 0
  let newProjects = 0
  let skips = 0

  for (const p of projects) {
    const devName = (p.companyName || "").replace(/•/g, " ").trim()
    if (!devName || !p.projectName) continue
    const n = norm(devName)
    if (n.length > 2 && devNorms.some((d) => d === n || (n.length > 5 && (d.includes(n) || n.includes(d))))) {
      skips++
      continue
    }

    const devSlug = `ss-${slugify(p.companyName || String(p.companyId))}`
    if (!ssDevSlugs.has(devSlug)) {
      const existed = await db.developerProfile.findUnique({ where: { slug: devSlug }, select: { id: true } })
      if (!existed) {
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
    const year = p.deliveryDate ? new Date(p.deliveryDate).getUTCFullYear() : null
    const month = p.deliveryDate ? new Date(p.deliveryDate).getUTCMonth() + 1 : null
    const readyBy = year ? `${year}${month ? ` Q${Math.ceil(month / 3)}` : ""}` : ""
    const { city, district, address } = splitAddress(p.address || "")
    const fullImg = (p.image || "").replace("_Thumb", "")
    const data = {
      name: p.projectName.slice(0, 180),
      developer: devName.slice(0, 180),
      city,
      district,
      address,
      status: p.isFinished ? "completed" : "active",
      readyBy: readyBy.slice(0, 80),
      priceFrom: 0,
      pricePerSqmFrom: sqm.length ? Math.min(...sqm) : 0,
      image: fullImg.slice(0, 320),
      gallery: fullImg.startsWith("http") ? [fullImg] : [],
    }
    const slug = slugify(p.projectUrl || p.projectName)
    // Re-run guard: row may already exist under a different slug — pkey id wins.
    if (await db.projectDirectory.findUnique({ where: { id: `ss_${p.projectId}` }, select: { id: true } })) continue
    try {
      await db.projectDirectory.create({ data: { id: `ss_${p.projectId}`, slug, units: 0, ...data } })
      newProjects++
    } catch {
      try {
        await db.projectDirectory.create({ data: { id: `ss_${p.projectId}`, slug: `ss-${slug}`.slice(0, 140), units: 0, ...data } })
        newProjects++
      } catch (e2) {
        console.warn(`  ! ${p.projectUrl}: ${(e2 as Error).message.slice(0, 80)}`)
      }
    }
  }
  console.log(`RESULT devMatchedSkips=${skips} newDevs=${newDevs} newProjects=${newProjects}`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => db.$disconnect())
