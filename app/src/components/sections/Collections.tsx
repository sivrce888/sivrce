import Link from 'next/link'
import { PartyPopper, KeyRound, Waves, Bath, Palmtree, MountainSnow, PawPrint, Laptop, ArrowUpRight, type LucideIcon } from 'lucide-react'
import { Reveal } from '@/components/Reveal'
import { CATEGORY_BRAND, type CategoryBrand } from '@/lib/category-brand'
import { getCmsBlock } from '@/lib/cms'
import { getServerT } from '@/lib/i18n/server'
import { localizedHref, type Lang } from '@/lib/i18n/core'
import type { DictKey } from '@/lib/i18n/ka'

/* Locked collection branding (BRAND.md §3.1). Cards deep-link /search with feat vocabulary. */
const COLLECTIONS: {
  icon: LucideIcon
  label: DictKey
  sub: DictKey
  brand: CategoryBrand
  href: string
}[] = [
  {
    icon: PartyPopper,
    label: 'col.party',
    sub: 'col.party.sub',
    brand: CATEGORY_BRAND.partyHouses,
    href: '/search?deal=daily&type=house&feat=add.f.partiesAllowed',
  },
  {
    icon: KeyRound,
    label: 'col.selfCheckIn',
    sub: 'col.selfCheckIn.sub',
    brand: CATEGORY_BRAND.selfCheckIn,
    href: '/search?deal=daily&feat=add.f.selfCheckIn',
  },
  {
    icon: Waves,
    label: 'col.pool',
    sub: 'col.pool.sub',
    brand: CATEGORY_BRAND.hotels,
    href: '/search?deal=daily&feat=add.f.pool',
  },
  {
    icon: Bath,
    label: 'col.jacuzzi',
    sub: 'col.jacuzzi.sub',
    brand: CATEGORY_BRAND.houses,
    href: '/search?deal=daily&feat=add.f.jacuzzi',
  },
  {
    icon: Palmtree,
    label: 'col.beach',
    sub: 'col.beach.sub',
    brand: CATEGORY_BRAND.newProjects,
    href: '/search?deal=daily&feat=add.f.beachfront',
  },
  {
    icon: MountainSnow,
    label: 'col.ski',
    sub: 'col.ski.sub',
    brand: CATEGORY_BRAND.land,
    href: '/search?deal=daily&feat=add.f.skiAccess',
  },
  {
    icon: PawPrint,
    label: 'col.pets',
    sub: 'col.pets.sub',
    brand: CATEGORY_BRAND.cottages,
    href: '/search?deal=daily&feat=add.f.petsAllowed',
  },
  {
    icon: Laptop,
    label: 'col.workspace',
    sub: 'col.workspace.sub',
    brand: CATEGORY_BRAND.apartments,
    href: '/search?deal=daily&feat=add.f.workspace',
  },
]

export default async function Collections({ lang = 'ka' }: { lang?: Lang }) {
  const t = getServerT(lang)
  const [title, sub] = await Promise.all([
    getCmsBlock('home.collections.title', lang),
    getCmsBlock('home.collections.sub', lang),
  ])
  return (
    <section className="bg-sv-cloud pb-20 md:pb-28">
      <div className="mx-auto max-w-[1440px] px-5 md:px-10">
        <Reveal className="mb-10">
          <h2 className="text-balance text-[30px] font-black tracking-[-0.02em] text-sv-ink md:text-[40px]">
            {title}
          </h2>
          <p className="mt-2 text-[15px] font-semibold text-sv-ink/65 md:text-[16px]">
            {sub}
          </p>
        </Reveal>

        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {COLLECTIONS.map((c, i) => (
            <Reveal key={c.label} delay={i * 0.05} className="h-full">
              <Link
                href={localizedHref(c.href, lang)}
                className="group relative flex h-full flex-col items-center gap-3 rounded-card border border-sv-ink/[0.06] bg-sv-surface p-6 text-center transition-all duration-500 hover:-translate-y-2 hover:border-transparent hover:shadow-card-hover"
              >
                <span
                  className="grid h-14 w-14 place-items-center rounded-module transition-transform duration-500 group-hover:scale-110"
                  style={{ backgroundColor: c.brand.chipVar, color: c.brand.hue }}
                >
                  <c.icon className="h-6 w-6" />
                </span>
                <span className="line-clamp-2 min-h-[2.5em] text-[14px] font-extrabold leading-snug text-sv-ink">{t(c.label)}</span>
                <span className="mt-auto line-clamp-2 min-h-[2.25em] text-[12px] font-bold leading-snug text-sv-ink/55">{t(c.sub)}</span>
                <ArrowUpRight className="absolute right-4 top-4 h-4 w-4 text-sv-ink/0 transition-all duration-300 group-hover:text-sv-ink/40" />
              </Link>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
