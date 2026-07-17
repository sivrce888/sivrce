import Link from 'next/link'
import { Building, Home, TreePalm, Map, Briefcase, CalendarClock, Hotel, Sparkles, ArrowUpRight } from 'lucide-react'
import { Reveal } from '@/components/Reveal'
import { CATEGORY_BRAND } from '@/lib/category-brand'

/* Locked per-category branding (BRAND.md §3.1) — every category owns its
   hue + chip from CATEGORY_BRAND. Never inline new tints here. */
const CATS = [
  { icon: Building, label: 'ბინები', count: '28,400', brand: CATEGORY_BRAND.apartments, href: '/sale/apartments' },
  { icon: Home, label: 'სახლები', count: '9,850', brand: CATEGORY_BRAND.houses, href: '/sale/houses' },
  { icon: TreePalm, label: 'აგარაკები', count: '2,130', brand: CATEGORY_BRAND.cottages, href: '/sale/houses' },
  { icon: Map, label: 'მიწის ნაკვეთები', count: '4,720', brand: CATEGORY_BRAND.land, href: '/sale/land' },
  { icon: Briefcase, label: 'კომერციული', count: '5,310', brand: CATEGORY_BRAND.commercial, href: '/sale/commercial' },
  { icon: CalendarClock, label: 'დღიური ქირა', count: '1,940', brand: CATEGORY_BRAND.dailyRent, href: '/rent' },
  { icon: Hotel, label: 'სასტუმროები', count: '180', brand: CATEGORY_BRAND.hotels, href: '/rent/commercial' },
  { icon: Sparkles, label: 'ახალი პროექტები', count: '136', brand: CATEGORY_BRAND.newProjects, href: '/projects' },
]

export default function Categories() {
  return (
    <section className="bg-sv-surface pb-20 md:pb-28">
      <div className="mx-auto max-w-[1440px] px-5 md:px-10">
        <Reveal className="mb-10 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-balance text-[30px] font-black tracking-[-0.02em] text-sv-ink md:text-[40px]">
              რას ეძებ?
            </h2>
            <p className="mt-2 text-[15px] font-semibold text-sv-ink/65 md:text-[16px]">
              ყველა ტიპის უძრავი ქონება — ერთ სივრცეში
            </p>
          </div>
        </Reveal>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-8">
          {CATS.map((c, i) => (
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
                <span className="text-[12px] font-bold text-sv-ink/55">{c.count}</span>
                <ArrowUpRight className="absolute right-4 top-4 h-4 w-4 text-sv-ink/0 transition-all duration-300 group-hover:text-sv-ink/40" />
              </Link>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
