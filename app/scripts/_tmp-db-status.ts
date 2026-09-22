import { config } from "dotenv"
config({ path: ".env.local" })
import { PrismaClient } from "../src/generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
const u = process.env.DATABASE_URL as string
const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: u }) })
async function main() {
  const devs = await db.$queryRawUnsafe<any[]>(`select count(*)::int n, count(logo_url)::int logos, count(website)::int sites from developer_profiles where deleted_at is null`)
  const projects = await db.$queryRawUnsafe<any[]>(`select count(*)::int n, count(nullif(address,''))::int addr, count(nullif(lat,0))::int coords from project_directories where deleted_at is null`)
  console.log("DEV:", JSON.stringify(devs[0]))
  console.log("PRJ:", JSON.stringify(projects[0]))
}
main().finally(() => db.$disconnect())
