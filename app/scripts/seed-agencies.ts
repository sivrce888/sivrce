/**
 * Seeds the curated agencies (same source as the /agents "Top agencies" strip)
 * into agency_profile so /agencies and /agencies/[slug] reflect the agencies
 * already advertised on /agents and the homepage.
 *
 * Usage: npx tsx scripts/seed-agencies.ts
 * Idempotent: upserts by slug and recomputes team/listing counts from live
 * listing rows. Run again after agent roster changes; admin edits to summary
 * or districts are overwritten — those fields live here until agencies self-manage.
 *
 * ponytail: single-file seed like scripts/seed.ts; upgrade to prisma db seed
 * when more catalog tables need seeding.
 */

import { config } from "dotenv"
import { resolve } from "path"

config({ path: resolve(__dirname, "..", ".env.local") })
config({ path: resolve(__dirname, "..", ".env") })

import { PrismaClient } from "../src/generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { AGENT_PROFILES } from "../src/data/agent-profiles"

const connectionString = process.env.DATABASE_URL
if (!connectionString) {
  console.error("DATABASE_URL is not set. Check .env.local")
  process.exit(1)
}

function withPgSslCompat(url: string) {
  if (/uselibpqcompat=/i.test(url) || /sslmode=disable/i.test(url)) return url
  return `${url}${url.includes("?") ? "&" : "?"}uselibpqcompat=true`
}

const db = new PrismaClient({
  adapter: new PrismaPg({ connectionString: withPgSslCompat(connectionString) }),
})

function slugifyAgency(name: string): string {
  const map: Record<string, string> = {
    "სივრცე პრემიუმ": "sivrce-premium",
    "Capital Estate": "capital-estate",
    "Tbilisi Homes": "tbilisi-homes",
    Adjarinvest: "adjarinvest",
  }
  return map[name] ?? name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
}

const META: Record<string, { districts: string[]; summary: string }> = {
  "სივრცე პრემიუმ": {
    districts: ["ვაკე", "მთაწმინდა", "საბურთალო"],
    summary:
      "სივრცე პრემიუმი — ვერიფიცირებული აგენტების გუნდი თბილისში: პრემიუმ ბინები ვაკესა და მთაწმინდაზე, სრული იურიდიული თანხლება და ინვესტორებისთვის შემოსავლიანი უძრავი ქონების შერჩევა.",
  },
  "Capital Estate": {
    districts: ["საბურთალო", "ვაკე"],
    summary:
      "Capital Estate — საცხოვრებელი უძრავი ქონების ექსპერტი საბურთალოზე და ვაკეზე: 380-ზე მეტი დახურული გარიგება, ინვესტორებისთვის შემოსავლიანი ბინების შერჩევა.",
  },
  "Tbilisi Homes": {
    districts: ["ვაკე", "საბურთალო"],
    summary:
      "Tbilisi Homes — ბინების ყიდვა-გაყიდვა და ქირა თბილისში: პირადი მიდგომა, ბაზრის ანალიზი და გარიგების სრული წარმართვა.",
  },
  Adjarinvest: {
    districts: ["ბათუმი"],
    summary:
      "Adjarinvest — უძრავი ქონება ბათუმში: ზღვისპირა ბინები, ინვესტიციები და განვადებით ნასყიდობები აჭარის წამყვან პროექტებში.",
  },
}

async function main() {
  // Same counting basis as /agents: active listings grouped by agent display name.
  const listings = await db.listing.findMany({
    where: { deletedAt: null, status: "active" },
    select: { agent: true },
    take: 2500,
  })
  const byAgent = new Map<string, number>()
  for (const l of listings) {
    const name = (l.agent as { name?: string } | null)?.name?.trim()
    if (name) byAgent.set(name, (byAgent.get(name) ?? 0) + 1)
  }

  const groups = new Map<
    string,
    { team: string[]; listings: number; city: string; verified: boolean }
  >()
  for (const a of AGENT_PROFILES) {
    const cur = groups.get(a.agency) ?? {
      team: [],
      listings: 0,
      city: a.city,
      verified: a.verified,
    }
    cur.team.push(a.name.ka)
    cur.listings += byAgent.get(a.name.ka) ?? 0
    cur.verified = cur.verified && a.verified
    groups.set(a.agency, cur)
  }

  for (const [name, g] of groups) {
    const slug = slugifyAgency(name)
    const meta = META[name] ?? { districts: [g.city], summary: name }
    const row = {
      id: slug,
      slug,
      name,
      // logoText/color are admin-legacy columns — EntityHeader derives initials
      // and brand hues from the kind, nothing reads these today.
      logoText: name.slice(0, 2),
      color: "",
      verified: g.verified,
      teamSize: g.team.length,
      activeListings: g.listings,
      city: g.city,
      districts: meta.districts,
      summary: meta.summary,
    }
    await db.agencyProfile.upsert({ where: { slug }, create: row, update: row })
    console.log(`upserted ${slug} (team ${row.teamSize}, listings ${row.activeListings})`)
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => db.$disconnect())
