/**
 * One-shot: backfill missing LQIP twins for pipeline listing photos.
 *
 * /api/upload writes uploads/YYYY/MM/<uuid>.webp + <uuid>.lqip.webp.
 * Masters uploaded before that (or whose twin was lost) render with a dead
 * blurDataURL. This script HEADs each twin; if missing, downloads the master,
 * regenerates the 16px WebP placeholder with sharp, and uploads it.
 *
 * Usage:  npx tsx scripts/backfill-lqip.ts
 * Re-run safe. Neon free-tier: 2-wide concurrency (P1008 if you bump it).
 */

import { config } from "dotenv"
import { resolve } from "path"

config({ path: resolve(__dirname, "..", ".env.local") })
config({ path: resolve(__dirname, "..", ".env") })

import sharp from "sharp"
import { PrismaClient } from "../src/generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { uploadFile } from "../src/lib/storage"

const connectionString = process.env.DATABASE_URL
if (!connectionString) {
  console.error("DATABASE_URL missing")
  process.exit(1)
}

const db = new PrismaClient({ adapter: new PrismaPg({ connectionString }) })

// Same contract as src/lib/media.ts MASTER_RE — pipeline masters only.
const MASTER_RE = /\/uploads\/\d{4}\/\d{2}\/[0-9a-f-]+\.webp$/

async function backfillOne(url: string): Promise<"ok" | "exists" | "fail"> {
  const lqipUrl = url.replace(/\.webp$/, ".lqip.webp")
  const head = await fetch(lqipUrl, { method: "HEAD" })
  if (head.ok) return "exists"

  const res = await fetch(url)
  if (!res.ok) return "fail"
  const lqip = await sharp(Buffer.from(await res.arrayBuffer()))
    .rotate()
    .resize({ width: 16 })
    .webp({ quality: 30 })
    .toBuffer()
  const key = new URL(url).pathname.replace(/^\//, "").replace(/\.webp$/, ".lqip.webp")
  await uploadFile({ key, body: lqip, contentType: "image/webp" })
  return "ok"
}

async function main() {
  const rows = await db.listingMedia.findMany({
    where: { cdnUrl: { contains: "/uploads/" } },
    select: { cdnUrl: true },
  })
  const urls = [...new Set(rows.map((r) => r.cdnUrl).filter((u): u is string => !!u && MASTER_RE.test(u)))]
  console.log(`backfill-lqip: ${urls.length} pipeline masters (${rows.length} rows)`)

  let ok = 0, exists = 0, fail = 0
  for (let i = 0; i < urls.length; i += 2) {
    const results = await Promise.all(urls.slice(i, i + 2).map(backfillOne))
    for (const r of results) {
      if (r === "ok") ok++
      else if (r === "exists") exists++
      else fail++
    }
    if ((i / 2) % 25 === 0) console.log(`… ${i + 1}/${urls.length}`)
  }
  console.log(`backfill-lqip: done — ${ok} created, ${exists} already existed, ${fail} failed`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exitCode = 1
  })
  .finally(() => db.$disconnect())
