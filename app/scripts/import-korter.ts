/**
 * ONE-SHOT offline import — owner-approved 2026-09-03 (coverage audit:
 * 424 korter developers vs 119 in DB). Runtime cron stays retired (410);
 * after this runs, `npm run directory:localize` must mirror all new media
 * to cdn.sivrce.ge and clear sourceUrl so runtime never depends on korter.
 */
import { config } from "dotenv"
import { resolve } from "path"

config({ path: resolve(__dirname, "..", ".env.local") })
config({ path: resolve(__dirname, "..", ".env") })

import { PrismaClient } from "../src/generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { syncKorterDirectory } from "../src/lib/directory/sync-korter"

const u = process.env.DATABASE_URL as string
if (!u) {
  console.error("DATABASE_URL missing")
  process.exit(1)
}
const db = new PrismaClient({
  adapter: new PrismaPg({
    connectionString: /uselibpqcompat=/i.test(u) ? u : `${u}${u.includes("?") ? "&" : "?"}uselibpqcompat=true`,
  }),
})

syncKorterDirectory(db, { log: (m) => console.log(m) })
  .then((r) => {
    console.log("RESULT", JSON.stringify(r, null, 2))
    console.log("Next: npm run directory:localize  (mirror media → cdn.sivrce.ge, clear sourceUrl)")
  })
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => db.$disconnect())
