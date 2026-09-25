import { config } from "dotenv"
config({ path: ".env.local" })
import { PrismaClient } from "../src/generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
const u = process.env.DATABASE_URL as string
const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: /uselibpqcompat=/i.test(u) ? u : `${u}${u.includes("?") ? "&" : "?"}uselibpqcompat=true` }) })
async function main() {
  const proj = await db.projectDirectory.count({ where: { deletedAt: null } })
  const byPrefix: Record<string, number> = {}
  const rows = await db.projectDirectory.findMany({ where: { deletedAt: null }, select: { id: true } })
  for (const r of rows) {
    const p = r.id.split(/[-_]/)[0]
    byPrefix[p] = (byPrefix[p] ?? 0) + 1
  }
  const devs = await db.developerProfile.count({ where: { deletedAt: null } })
  const aliases = await db.entityAlias.count()
  const rels = await db.entityRelationship.count()
  const prov = await db.dataProvenance.count()
  const queue = await db.reviewQueueItem.count({ where: { resolvedAt: null } })
  const sources = await db.dataSource.findMany({ where: { country: "GE" }, select: { slug: true, isActive: true, lastFetchedAt: true } })
  console.log(JSON.stringify({ proj, byPrefix, devs, aliases, rels, prov, openReview: queue, sources }, null, 1))
  await db.$disconnect()
}
main()
