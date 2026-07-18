import Link from 'next/link'
import { PartyPopper, KeyRound, Waves, Bath, Palmtree, MountainSnow, PawPrint, Laptop, ArrowUpRight } from 'lucide-react'
import { Reveal } from '@/components/Reveal'
import { CATEGORY_BRAND } from '@/lib/category-brand'
import { getCmsBlock } from '@/lib/cms'

/* Locked collection branding (BRAND.md §3.1): party/selfCheckIn own locked
   rows; pool/jacuzzi reuse locked category hues, same as services do.
   Cards deep-link into /search with the feat vocabulary pre-applied —
   no dedicated pages, /search IS the collection page. */
const COLLECTIONS = [
  {
    icon: PartyPopper,
    label: 'სახლები წვეულებებისთვის',
    sub: 'დღიურად · წვეულებები დასაშვებია',
    brand: CATEGORY_BRAND.partyHouses,
    href: '/search?deal=daily&type=house&feat=add.f.partiesAllowed',
  },
  {
    icon: KeyRound,
    label: 'უკონტაქტო ჩექინი',
    sub: 'გასაღები შეხვედრის გარეშე',
    brand: CATEGORY_BRAND.selfCheckIn,
    href: '/search?deal=daily&feat=add.f.selfCheckIn',
  },
  {
    icon: Waves,
    label: 'აუზით',
    sub: 'დღიური ქირა აუზით',
    brand: CATEGORY_BRAND.hotels,
    href: '/search?deal=daily&feat=add.f.pool',
  },
  {
    icon: Bath,
    label: 'ჯაკუზით',
    sub: 'დასვენება ჯაკუზით',
    brand: CATEGORY_BRAND.houses,
    href: '/search?deal=daily&feat=add.f.jacuzzi',
  },
  {
    icon: Palmtree,
    label: 'ზღვისპირა',
    sub: 'პირველი ზოლი ზღვაზე',
    brand: CATEGORY_BRAND.newProjects,
    href: '/search?deal=daily&feat=add.f.beachfront',
  },
  {
    icon: MountainSnow,
    label: 'სათხილამურო კურორტები',
    sub: 'გუდაური · ბაკურიანი · მესტია',
    brand: CATEGORY_BRAND.land,
    href: '/search?deal=daily&feat=add.f.skiAccess',
  },
  {
    icon: PawPrint,
    label: 'შინაური ცხოველით',
    sub: 'საოჯახო ცხოველები ნებადართულია',
    brand: CATEGORY_BRAND.cottages,
    href: '/search?deal=daily&feat=add.f.petsAllowed',
  },
  {
    icon: Laptop,
    label: 'სამუშაო ადგილით',
    sub: 'დისტანციური მუშაობისთვის',
    brand: CATEGORY_BRAND.apartments,
    href: '/search?deal=daily&feat=add.f.workspace',
  },
]

export default async function Collections() {
  const [title, sub] = await Promise.all([
    getCmsBlock('home.collections.title'),
    getCmsBlock('home.collections.sub'),
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
            <Reveal key={c.label} delay={i * 0.05}>
              <Link
                href={c.href}
                className="group relative flex flex-col items-center gap-3 rounded-card border border-sv-ink/[0.06] bg-sv-surface p-6 text-center transition-all duration-500 hover:-translate-y-2 hover:border-transparent hover:shadow-card-hover"
              >
                <span
                  className="grid h-14 w-14 place-items-center rounded-module transition-transform duration-500 group-hover:scale-110"
                  style={{ backgroundColor: c.brand.chipVar, color: c.brand.hue }}
                >
                  <c.icon className="h-6 w-6" />
                </span>
                <span className="text-[14px] font-extrabold text-sv-ink">{c.label}</span>
                <span className="text-[12px] font-bold text-sv-ink/55">{c.sub}</span>
                <ArrowUpRight className="absolute right-4 top-4 h-4 w-4 text-sv-ink/0 transition-all duration-300 group-hover:text-sv-ink/40" />
              </Link>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
