/** Read-only spot check: seeded floor inventory is live and shaped for the map. */
import { config } from "dotenv"
import { resolve } from "path"

config({ path: resolve(__dirname, "..", ".env.local") })
config({ path: resolve(__dirname, "..", ".env") })

import { PrismaClient } from "../src/generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"

const db = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL as string }),
})

async function main() {
  const total = await db.buildingFloor.count()
  const stocked = await db.buildingFloor.count({ where: { availableUnits: { gt: 0 } } })
  const sample = await db.buildingFloor.findMany({
    where: { building3D: { mapBuilding: { slug: "chavchavadze-47" } }, availableUnits: { gt: 0 } },
    select: {
      floorNumber: true,
      availableUnits: true,
      forSaleCount: true,
      forRentCount: true,
      pricePerSqmMin: true,
    },
    orderBy: { floorNumber: "asc" },
  })
  console.log("total floor rows:", total, "| floors with stock:", stocked)
  console.log("chavchavadze-47:", JSON.stringify(sample))
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => db.$disconnect())
