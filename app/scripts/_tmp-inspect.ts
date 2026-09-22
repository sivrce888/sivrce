import { config } from "dotenv"
config({ path: ".env.local" })
import { PrismaClient } from "../src/generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
const u = process.env.DATABASE_URL as string
const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: u }) })
async function main() {
  const p = await db.$queryRawUnsafe<any[]>(`select slug, status, ready_by, units, address, developer, image like '%sivrce%' own from project_directories where slug='luqs-taueri'`)
  console.log("LUQS:", JSON.stringify(p[0]))
  const d = await db.$queryRawUnsafe<any[]>(`select slug, projects_count, completed_count, headquarters, logo_url is not null logo from developer_profiles where slug='lattice-development'`)
  console.log("LATTICE_DB:", JSON.stringify(d))
  const lp = await db.$queryRawUnsafe<any[]>(`select count(*)::int n from project_directories where developer ilike '%lattice%' and deleted_at is null`)
  console.log("LATTICE_PRJ:", JSON.stringify(lp[0]))
  const stale = await db.$queryRawUnsafe<any[]>(`select count(*)::int n from project_directories where deleted_at is null and status='active' and ready_by ~ '20(1[0-9]|2[0-5])'`)
  console.log("STALE_ACTIVE_readyby<=2025:", JSON.stringify(stale[0]))
}
main().finally(() => db.$disconnect())
