import { config } from "dotenv"
config({ path: ".env.local" })
import { PrismaClient } from "../src/generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
const u = process.env.DATABASE_URL as string
const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: u }) })
async function main() {
  const rows = await db.$queryRawUnsafe<any[]>(`select slug, name, city from project_directories where created_at > now() - interval '3 hours' and deleted_at is null order by created_at desc limit 5`)
  console.log(JSON.stringify(rows, null, 1))
}
main().finally(() => db.$disconnect())
