/**
 * Stale-deadline maintenance (owner rule 2026-09): a project_directory row
 * whose readyBy year has fully passed but is still not 'completed' is a stale
 * import — mark it delivered. Multi-phase strings ('Block C 2025 Q3 /
 * Block A → 2027 Q2') are judged by the MAX year, so a live later phase keeps
 * the row active. Also flips korter `status:ready` rows (construction done,
 * move-in ready) to delivered. Run after any directory import (import-korter /
 * -ssgap / -myhome-gap): those write readyBy verbatim from competitor sites.
 *
 * Dry-run by default; `--apply` to write.
 */
import { config } from "dotenv"
import { resolve } from "path"

config({ path: resolve(__dirname, "..", ".env.local") })
config({ path: resolve(__dirname, "..", ".env") })

import { PrismaClient } from "../src/generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { finishMaxYear } from "../src/data/professionals"

const db = new PrismaClient({
  adapter: new PrismaPg({
    connectionString: process.env.DATABASE_URL as string,
  }),
})

const apply = process.argv.includes("--apply")

async function main() {
  const rows = await db.projectDirectory.findMany({
    where: { status: { not: "completed" }, deletedAt: null },
    select: { id: true, slug: true, name: true, readyBy: true, features: true },
  })
  const year = new Date().getFullYear()
  const stale = rows.filter((r) => {
    const y = finishMaxYear(r.readyBy as string)
    if (y !== null && y < year) return true
    return (r.features ?? []).includes("status:ready")
  })
  for (const r of stale) {
    const y = (finishMaxYear(r.readyBy as string) as number | null) ?? year
    const yearStale = (finishMaxYear(r.readyBy as string) ?? 9999) < year
    const why = !yearStale && (r.features ?? []).includes("status:ready") ? " (korteri: ready)" : ""
    const line = `${r.name} | ${r.readyBy || "—"}${why} → გადაცემულია (${y})`
    if (apply) {
      await db.projectDirectory.update({
        where: { id: r.id },
        data: { status: "completed", readyBy: `გადაცემულია (${y})` },
      })
      console.log(`✓ ${line}`)
    } else {
      console.log(`· ${line}`)
    }
  }
  console.log(`${stale.length} stale of ${rows.length} active-with-readyBy${apply ? " — APPLIED" : " (dry-run, use --apply)"}`)
}

main()
  .then(() => db.$disconnect())
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
