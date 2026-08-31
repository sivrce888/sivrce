import LocalizedLink from '@/components/LocalizedLink'
import { Calculator, Camera, Landmark, Paintbrush, FileText, Map, ArrowUpRight } from 'lucide-react'
import { Reveal } from '@/components/Reveal'
import { SERVICE_BRAND } from '@/lib/category-brand'
import { getCmsBlock } from '@/lib/cms'
import { getServerT } from '@/lib/i18n/server'
import type { Lang } from '@/lib/i18n/core'

/* Core services — tools live here, not as heavy homepage widgets (vs MyHome/SS).
   Copy lives in CMS blocks (home.services.*) — localized per lang. */
const SERVICES = [
  { icon: Landmark, titleKey: 'home.services.mortgage.title', textKey: 'home.services.mortgage.text', brand: SERVICE_BRAND.mortgage, href: '/mortgage-calculator' },
  { icon: Paintbrush, titleKey: 'home.services.renovation.title', textKey: 'home.services.renovation.text', brand: SERVICE_BRAND.renovation, href: '/services/renovation' },
  { icon: Map, titleKey: 'home.services.map.title', textKey: 'home.services.map.text', brand: SERVICE_BRAND.agents, href: '/map' },
  { icon: Camera, titleKey: 'home.services.tour.title', textKey: 'home.services.tour.text', brand: SERVICE_BRAND.developers, href: '/services/photography' },
  { icon: Calculator, titleKey: 'home.services.price.title', textKey: 'home.services.price.text', brand: SERVICE_BRAND.agents, href: '/services/appraisal' },
  { icon: FileText, titleKey: 'home.services.docs.title', textKey: 'home.services.docs.text', brand: SERVICE_BRAND.agents, href: '/services/legal' },
] as const

export default async function Services({ lang = 'ka' }: { lang?: Lang }) {
  const t = getServerT(lang)
  const [title, sub, cta, ...cards] = await Promise.all([
    getCmsBlock('home.services.title', lang),
    getCmsBlock('home.services.sub', lang),
    getCmsBlock('home.services.cta', lang),
    ...SERVICES.flatMap((s) => [
      getCmsBlock(s.titleKey, lang),
      getCmsBlock(s.textKey, lang),
    ]),
  ])
  return (
    <section id="services" className="bg-sv-surface py-20 md:py-28">
      <div className="mx-auto max-w-[1440px] px-5 md:px-10">
        <Reveal className="mb-12 text-center">
          <h2 className="sv-h2 text-sv-ink">
            {title}
          </h2>
          <p className="mx-auto mt-3 max-w-[560px] text-[15px] font-semibold text-sv-ink/65 md:text-[16px]">
            {sub}
          </p>
        </Reveal>

        <div className="sv-card-grid-3">
          {SERVICES.map((s, i) => (
            <Reveal key={s.titleKey} delay={i * 0.08} className="h-full">
              <LocalizedLink
                href={s.href}
                className="group relative flex h-full flex-col overflow-hidden rounded-card border border-sv-ink/[0.06] bg-gradient-to-b from-sv-cloud to-sv-surface p-7 transition-all duration-500 hover:-translate-y-2 hover:border-transparent hover:shadow-card-hover"
              >
                <span
                  className="grid h-14 w-14 place-items-center rounded-module transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3"
                  style={{ backgroundColor: s.brand.chipVar, color: s.brand.hue }}
                >
                  <s.icon className="h-6 w-6" />
                </span>
                <h3 className="mt-6 text-[18px] font-extrabold leading-snug text-sv-ink">{cards[i * 2]}</h3>
                <p className="mt-2.5 flex-1 text-[14px] font-medium leading-relaxed text-sv-ink/60">{cards[i * 2 + 1]}</p>
                <span className="mt-6 flex items-center gap-1.5 text-[14px] font-extrabold" style={{ color: s.brand.hue }}>
                  {cta}
                  <ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </span>
                <span
                  className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-20"
                  style={{ backgroundColor: s.brand.hue }}
                />
              </LocalizedLink>
            </Reveal>
          ))}
        </div>
        <div className="mt-10 text-center">
          <LocalizedLink
            href="/services"
            className="inline-flex items-center gap-2 rounded-full border border-sv-ink/10 bg-sv-surface px-6 py-3 text-[14px] font-extrabold text-sv-ink transition hover:border-sv-blue/40 hover:text-sv-blue"
          >
            {t('nav.services')}
            <ArrowUpRight className="h-4 w-4" />
          </LocalizedLink>
        </div>
      </div>
    </section>
  )
}
