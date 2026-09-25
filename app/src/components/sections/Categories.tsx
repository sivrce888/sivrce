import LocalizedLink from '@/components/LocalizedLink'
import {
  Building,
  Home,
  TreePalm,
  Map,
  Briefcase,
  CalendarClock,
  Hotel,
  Sparkles,
  ArrowUpRight,
  KeyRound,
  Waves,
  Mountain,
  PawPrint,
  Laptop,
  Crown,
  Gem,
  Trees,
  Bath,
  Compass,
  type LucideIcon,
} from 'lucide-react'
import { Reveal } from '@/components/Reveal'
import { PartyHouseIcon } from '@/components/PartyHouseIcon'
import { CATEGORY_BRAND } from '@/lib/category-brand'
import { getCmsBlock } from '@/lib/cms'
import type { CmsBlockKey } from '@/lib/cms-blocks'
import { db } from '@/lib/db'
import { buildDbWhere } from '@/lib/search-filters'
import { unstable_cache } from 'next/cache'
import type { Lang } from '@/lib/i18n/core'

/** Daily listings tagged as houses for parties — events, birthdays. */
export const PARTY_HOUSES_HREF = '/search?deal=daily&feat=add.f.partiesAllowed'

type CatKey =
  | 'apartments'
  | 'houses'
  | 'cottages'
  | 'land'
  | 'commercial'
  | 'dailyRent'
  | 'partyHouses'
  | 'selfCheckIn'
  | 'hotels'
  | 'newProjects'
  | 'pools'
  | 'jacuzzi'
  | 'seaView'
  | 'ski'
  | 'petFriendly'
  | 'workspace'
  | 'penthouses'
  | 'cabins'
  | 'luxury'

const CATS: {
  key: CatKey
  icon: LucideIcon
  labelKey: CmsBlockKey
  brand: (typeof CATEGORY_BRAND)[keyof typeof CATEGORY_BRAND]
  href: string
}[] = [
  { key: 'apartments', icon: Building, labelKey: 'home.categories.apartments', brand: CATEGORY_BRAND.apartments, href: '/sale/apartments' },
  { key: 'houses', icon: Home, labelKey: 'home.categories.houses', brand: CATEGORY_BRAND.houses, href: '/sale/houses' },
  { key: 'cottages', icon: TreePalm, labelKey: 'home.categories.cottages', brand: CATEGORY_BRAND.cottages, href: '/search?type=villa' },
  { key: 'luxury', icon: Gem, labelKey: 'home.categories.luxury', brand: CATEGORY_BRAND.luxury, href: '/search?life=luxury&sort=price-desc' },
  { key: 'land', icon: Map, labelKey: 'home.categories.land', brand: CATEGORY_BRAND.land, href: '/sale/land' },
  { key: 'commercial', icon: Briefcase, labelKey: 'home.categories.commercial', brand: CATEGORY_BRAND.commercial, href: '/sale/commercial' },
  { key: 'dailyRent', icon: CalendarClock, labelKey: 'home.categories.dailyRent', brand: CATEGORY_BRAND.dailyRent, href: '/daily/apartments' },
  { key: 'partyHouses', icon: PartyHouseIcon, labelKey: 'home.categories.partyHouses', brand: CATEGORY_BRAND.partyHouses, href: PARTY_HOUSES_HREF },
  { key: 'selfCheckIn', icon: KeyRound, labelKey: 'home.categories.selfCheckIn', brand: CATEGORY_BRAND.selfCheckIn, href: '/search?deal=daily&feat=add.f.selfCheckIn' },
  { key: 'seaView', icon: Compass, labelKey: 'home.categories.seaView', brand: CATEGORY_BRAND.seaView, href: '/search?feat=add.f.seaView' },
  { key: 'pools', icon: Waves, labelKey: 'home.categories.pools', brand: CATEGORY_BRAND.pools, href: '/search?feat=add.f.pool' },
  { key: 'jacuzzi', icon: Bath, labelKey: 'home.categories.jacuzzi', brand: CATEGORY_BRAND.jacuzzi, href: '/search?feat=add.f.jacuzzi' },
  { key: 'ski', icon: Mountain, labelKey: 'home.categories.ski', brand: CATEGORY_BRAND.ski, href: '/search?feat=add.f.skiAccess' },
  { key: 'petFriendly', icon: PawPrint, labelKey: 'home.categories.petFriendly', brand: CATEGORY_BRAND.petFriendly, href: '/search?feat=add.f.petsAllowed' },
  { key: 'workspace', icon: Laptop, labelKey: 'home.categories.workspace', brand: CATEGORY_BRAND.workspace, href: '/search?feat=add.f.workspace' },
  { key: 'penthouses', icon: Crown, labelKey: 'home.categories.penthouses', brand: CATEGORY_BRAND.penthouses, href: '/search?feat=add.f.penthouse' },
  { key: 'cabins', icon: Trees, labelKey: 'home.categories.cabins', brand: CATEGORY_BRAND.cabins, href: '/search?type=house&feat=add.f.wooden' },
  { key: 'hotels', icon: Hotel, labelKey: 'home.categories.hotels', brand: CATEGORY_BRAND.hotels, href: '/hotels' },
  { key: 'newProjects', icon: Sparkles, labelKey: 'home.categories.newProjects', brand: CATEGORY_BRAND.newProjects, href: '/projects' },
]

function formatCount(n: number, explore: string): string {
  if (n <= 0) return explore
  return n.toLocaleString('en-US')
}

const ZERO: Record<CatKey, number> = {
  apartments: 0,
  houses: 0,
  cottages: 0,
  land: 0,
  commercial: 0,
  dailyRent: 0,
  partyHouses: 0,
  selfCheckIn: 0,
  hotels: 0,
  newProjects: 0,
  pools: 0,
  jacuzzi: 0,
  seaView: 0,
  ski: 0,
  petFriendly: 0,
  workspace: 0,
  penthouses: 0,
  cabins: 0,
  luxury: 0,
}

/** Live facet counts — never invent inventory numbers. Scoped to the market
 *  (sivrce.ge counts Georgia only) and cached 5 min: 12 counts per ISR render
 *  was the home's heaviest DB fan-out. A throw is never cached — the next
 *  render retries instead of pinning "Browse" on every tile for 5 minutes. */
const readCategoryCounts = unstable_cache(
  async (country: string): Promise<Record<CatKey, number>> => {
    const live = { deletedAt: null, status: 'active' as const, ...(country !== '*' ? { country } : {}) }
    const withFeature = (f: string, extra: Record<string, unknown> = {}) =>
      db.listing.count({ where: { ...live, ...extra, features: { has: f } } })
    const [byProp, daily, partyHouses, selfCheckIn, pools, jacuzzi, seaView, ski, petFriendly, workspace, penthouses, cabins, luxury] =
      await Promise.all([
        db.listing.groupBy({ by: ['propertyType'], where: { ...live, dealType: 'buy' }, _count: { _all: true } }),
        db.listing.count({ where: { ...live, dealType: 'daily' } }),
        withFeature('add.f.partiesAllowed', { dealType: 'daily' }),
        withFeature('add.f.selfCheckIn', { dealType: 'daily' }),
        withFeature('add.f.pool'),
        withFeature('add.f.jacuzzi'),
        withFeature('add.f.seaView'),
        withFeature('add.f.skiAccess'),
        withFeature('add.f.petsAllowed'),
        withFeature('add.f.workspace'),
        withFeature('add.f.penthouse'),
        withFeature('add.f.wooden', { propertyType: 'house' }),
        // Same where as /search?life=luxury — the tile count can't disagree with the results page.
        db.listing.count({ where: buildDbWhere({ luxury: true, country: country !== '*' ? country : undefined }) }),
      ])
    const byType = Object.fromEntries(byProp.map((r) => [r.propertyType, r._count._all]))
    return {
      ...ZERO,
      apartments: byType.apartment ?? 0,
      houses: byType.house ?? 0,
      cottages: byType.villa ?? 0,
      land: byType.land ?? 0,
      commercial: byType.commercial ?? 0,
      // ponytail: home Hotels tile → GDS /hotels, not for-sale hotel buildings.
      // Listing count would lie. Sale inventory stays on search type=hotel.
      dailyRent: daily,
      partyHouses,
      selfCheckIn,
      pools,
      jacuzzi,
      seaView,
      ski,
      petFriendly,
      workspace,
      penthouses,
      cabins,
      luxury,
    }
  },
  ['home-category-counts-v3'],
  { revalidate: 300 },
)

export default async function Categories({
  lang = 'ka',
  country = 'GE',
  projectsTotal = 0,
}: {
  lang?: Lang
  /** ISO market, '*' = worldwide hub. */
  country?: string
  /** Same scoped catalog count the projects rail links to — one number per page. */
  projectsTotal?: number
}) {
  const [title, sub, listingCounts, explore, ...labels] = await Promise.all([
    getCmsBlock('home.categories.title', lang),
    getCmsBlock('home.categories.sub', lang),
    readCategoryCounts(country).catch(() => ZERO), // DB down — soft labels via formatCount(0)
    getCmsBlock('home.categories.explore', lang),
    ...CATS.map((c) => getCmsBlock(c.labelKey, lang)),
  ])
  const counts = { ...listingCounts, newProjects: projectsTotal }
  return (
    <section className="bg-sv-cloud pb-20 md:pb-28">
      <div className="mx-auto max-w-[1440px] px-5 md:px-10">
        <Reveal className="mb-6 flex md:mb-10 flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="sv-h2 text-[clamp(1.75rem,1.2rem+1.8vw,2.5rem)] text-sv-ink">
              {title}
            </h2>
            <p className="mt-2 text-[15px] font-semibold text-sv-ink/65 md:text-[16px]">
              {sub}
            </p>
          </div>
        </Reveal>

        <div className="grid grid-cols-3 gap-2 sm:gap-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-9">
          {CATS.map((c, i) => (
            <Reveal key={c.key} delay={i * 0.03} className="h-full">
              <LocalizedLink
                href={c.key === 'newProjects' && country !== '*' ? `${c.href}?country=${country}` : c.href}
                className="group relative flex h-full flex-col items-center gap-2 rounded-card border border-sv-ink/[0.06] bg-sv-surface px-2 py-4 text-center sm:gap-2.5 sm:p-5 transition-all duration-300 hover:-translate-y-1.5 hover:border-transparent hover:shadow-card-hover"
              >
                <span
                  className="grid h-11 w-11 place-items-center rounded-module transition-transform sm:h-12 sm:w-12 duration-300 group-hover:scale-110"
                  style={{ backgroundColor: c.brand.chipVar, color: c.brand.hue }}
                >
                  <c.icon className="h-5.5 w-5.5" />
                </span>
                <span className="line-clamp-2 min-h-[2.5em] text-[12.5px] font-extrabold sm:text-[13.5px] leading-[1.25] text-sv-ink">{labels[i]}</span>
                <span className="mt-auto text-[11.5px] font-bold text-sv-ink/60">{formatCount(counts[c.key], explore)}</span>
                <ArrowUpRight className="absolute right-3 top-3 hidden h-3.5 w-3.5 sm:block text-sv-ink/0 transition-all duration-300 group-hover:text-sv-ink/60" />
              </LocalizedLink>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
