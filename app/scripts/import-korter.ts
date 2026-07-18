/**
 * CLI wrapper for korter directory sync.
 * Usage: npx tsx scripts/import-korter.ts
 * Cron: GET /api/cron/sync-korter (daily via vercel.json)
 */

import { config } from "dotenv"
import { resolve } from "path"

config({ path: resolve(__dirname, "..", ".env.local") })
config({ path: resolve(__dirname, "..", ".env") })

import { PrismaClient } from "../src/generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { syncKorterDirectory } from "../src/lib/directory/sync-korter"

const connectionString = process.env.DATABASE_URL
if (!connectionString) {
  console.error("DATABASE_URL is not set. Check .env.local")
  process.exit(1)
}

const db = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
})

syncKorterDirectory(db, { log: console.log })
  .then((r) => {
    console.log("—")
    console.log(r)
  })
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => db.$disconnect())
