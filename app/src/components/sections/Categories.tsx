import Link from 'next/link'
import { Building, Home, TreePalm, Map, Briefcase, CalendarClock, Hotel, Sparkles, ArrowUpRight } from 'lucide-react'
import { Reveal } from '@/components/Reveal'
import { CATEGORY_BRAND } from '@/lib/category-brand'
import { getCmsBlock } from '@/lib/cms'
import { db } from '@/lib/db'
import { projectsLive } from '@/lib/directory-live'
import type { Lang } from '@/lib/i18n/core'

type CatKey =
  | 'apartments'
  | 'houses'
  | 'cottages'
  | 'land'
  | 'commercial'
  | 'dailyRent'
  | 'hotels'
  | 'newProjects'

const CATS: {
  key: CatKey
  icon: typeof Building
  label: string
  brand: (typeof CATEGORY_BRAND)[keyof typeof CATEGORY_BRAND]
  href: string
}[] = [
  { key: 'apartments', icon: Building, label: 'ბინები', brand: CATEGORY_BRAND.apartments, href: '/sale/apartments' },
  { key: 'houses', icon: Home, label: 'სახლები', brand: CATEGORY_BRAND.houses, href: '/sale/houses' },
  { key: 'cottages', icon: TreePalm, label: 'აგარაკები', brand: CATEGORY_BRAND.cottages, href: '/search?type=villa' },
  { key: 'land', icon: Map, label: 'მიწის ნაკვეთები', brand: CATEGORY_BRAND.land, href: '/sale/land' },
  { key: 'commercial', icon: Briefcase, label: 'კომერციული', brand: CATEGORY_BRAND.commercial, href: '/sale/commercial' },
  { key: 'dailyRent', icon: CalendarClock, label: 'დღიური ქირა', brand: CATEGORY_BRAND.dailyRent, href: '/daily' },
  { key: 'hotels', icon: Hotel, label: 'სასტუმროები', brand: CATEGORY_BRAND.hotels, href: '/search?type=hotel' },
  { key: 'newProjects', icon: Sparkles, label: 'ახალი პროექტები', brand: CATEGORY_BRAND.newProjects, href: '/projects' },
]

function formatCount(n: number): string {
  if (n <= 0) return 'იხილე'
  return n.toLocaleString('en-US')
}

/** Live facet counts — never invent inventory numbers. */
async function categoryCounts(): Promise<Record<CatKey, number>> {
  const empty: Record<CatKey, number> = {
    apartments: 0,
    houses: 0,
    cottages: 0,
    land: 0,
    commercial: 0,
    dailyRent: 0,
    hotels: 0,
    newProjects: 0,
  }
  try {
    const [byProp, daily, projects] = await Promise.all([
      db.listing.groupBy({
        by: ['propertyType'],
        where: { deletedAt: null, status: 'active', dealType: 'buy' },
        _count: { _all: true },
      }),
      db.listing.count({
        where: { deletedAt: null, status: 'active', dealType: 'daily' },
      }),
      projectsLive().then((ps) => ps.length).catch(() => 0),
    ])
    for (const row of byProp) {
      const n = row._count._all
      if (row.propertyType === 'apartment') empty.apartments = n
      else if (row.propertyType === 'house') empty.houses = n
      else if (row.propertyType === 'villa') empty.cottages = n
      else if (row.propertyType === 'land') empty.land = n
      else if (row.propertyType === 'commercial') empty.commercial = n
      else if (row.propertyType === 'hotel') empty.hotels = n
    }
    empty.dailyRent = daily
    empty.newProjects = projects
  } catch {
    /* DB down — show soft labels via formatCount(0) */
  }
  return empty
}

export default async function Categories({ lang = 'ka' }: { lang?: Lang }) {
  const [title, sub, counts] = await Promise.all([
    getCmsBlock('home.categories.title', lang),
    getCmsBlock('home.categories.sub', lang),
    categoryCounts(),
  ])
  return (
    <section className="bg-sv-surface pb-20 md:pb-28">
      <div className="mx-auto max-w-[1440px] px-5 md:px-10">
        <Reveal className="mb-10 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-balance text-[30px] font-black tracking-[-0.02em] text-sv-ink md:text-[40px]">
              {title}
            </h2>
            <p className="mt-2 text-[15px] font-semibold text-sv-ink/65 md:text-[16px]">
              {sub}
            </p>
          </div>
        </Reveal>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-8">
          {CATS.map((c, i) => (
            <Reveal key={c.label} delay={i * 0.05} className="h-full">
              <Link
                href={c.href}
                className="group relative flex h-full flex-col items-center gap-3 rounded-card border border-sv-ink/[0.06] bg-sv-surface p-6 text-center transition-all duration-500 hover:-translate-y-2 hover:border-transparent hover:shadow-card-hover"
              >
                <span
                  className="grid h-14 w-14 place-items-center rounded-module transition-transform duration-500 group-hover:scale-110"
                  style={{ backgroundColor: c.brand.chipVar, color: c.brand.hue }}
                >
                  <c.icon className="h-6 w-6" />
                </span>
                <span className="line-clamp-2 min-h-[2.5em] text-[14px] font-extrabold leading-snug text-sv-ink">{c.label}</span>
                <span className="mt-auto text-[12px] font-bold text-sv-ink/55">{formatCount(counts[c.key])}</span>
                <ArrowUpRight className="absolute right-4 top-4 h-4 w-4 text-sv-ink/0 transition-all duration-300 group-hover:text-sv-ink/40" />
              </Link>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
