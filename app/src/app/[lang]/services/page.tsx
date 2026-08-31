import type { Metadata } from 'next'
import {
  Paintbrush,
  PenTool,
  Camera,
  Scale,
  Calculator,
  Truck,
  Sparkles,
  KeyRound,
  ArrowRight,
  type LucideIcon,
} from 'lucide-react'
import LocalizedLink from '@/components/LocalizedLink'
import Navbar from '@/components/sections/Navbar'
import CTA from '@/components/sections/CTA'
import Footer from '@/components/sections/Footer'
import { PageHero } from '@/components/PageHero'
import { AdSlot } from '@/components/ads/AdSlot'
import { Reveal } from '@/components/Reveal'
import { ServiceCard } from '@/components/services/ServiceCard'
import { isValidLang } from '@/lib/i18n/core'
import { langAlternates } from '@/lib/i18n/server'
import { jsonLd } from '@/lib/utils'
import {
  pickLocText,
  SERVICE_CATEGORIES,
  type ServiceCategoryId,
} from '@/lib/services'
import { listServiceProviders } from '@/lib/services-db'

export const revalidate = 3600

const HUB = {
  ka: {
    title: 'უძრავი ქონების სერვისები — რემონტი, იურიდიული, ფოტო',
    description:
      'რემონტი, ინტერიერი, ფოტო და 3D, იურისტი, შეფასება, გადატანა, დასუფთავება და ქონების მართვა — ვერიფიცირებული კომპანიები საქართველოში.',
    kicker: 'სერვისები',
    h1: 'ყველაფერი უძრავი ქონებისთვის',
    sub: 'რემონტი, იურიდიული, ფოტო, შეფასება, გადატანა, დასუფთავება, ქონების მართვა. კომპანია აქვეყნებს სერვისს და განცხადებას — ერთ ანგარიშზე.',
    add: 'დაამატე კომპანია',
    count: (n: number) => `${n} კომპანია`,
    featured: 'არჩეული კომპანიები',
  },
  en: {
    title: 'Real-estate services in Georgia — renovation, legal, photo',
    description:
      'Renovation, interiors, photography and 3D, legal, appraisal, moving, cleaning and property management — verified companies in Georgia.',
    kicker: 'Services',
    h1: 'Everything around the property',
    sub: 'Renovation, legal, photo, appraisal, moving, cleaning, management. One account lists a service and a home.',
    add: 'Add your company',
    count: (n: number) => `${n} ${n === 1 ? 'company' : 'companies'}`,
    featured: 'Featured companies',
  },
  ru: {
    title: 'Сервисы для недвижимости в Грузии — ремонт, юристы, фото',
    description:
      'Ремонт, интерьер, фото и 3D, юрист, оценка, переезд, уборка и управление — проверенные компании в Грузии.',
    kicker: 'Сервисы',
    h1: 'Всё для недвижимости',
    sub: 'Ремонт, юрист, фото, оценка, переезд, уборка, управление. Один аккаунт — услуга и объявление.',
    add: 'Добавить компанию',
    count: (n: number) => `${n} ${n === 1 ? 'компания' : 'компаний'}`,
    featured: 'Избранные компании',
  },
} as const

function hubCopy(lang: string) {
  return lang === 'ka' ? HUB.ka : lang === 'ru' ? HUB.ru : HUB.en
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>
}): Promise<Metadata> {
  const { lang: raw } = await params
  const lang = isValidLang(raw) ? raw : 'ka'
  const c = hubCopy(lang)
  return {
    title: c.title,
    description: c.description,
    alternates: { canonical: '/services', languages: langAlternates('/services') },
    openGraph: { title: c.title, description: c.description, type: 'website' },
  }
}

const ICONS: Record<ServiceCategoryId, LucideIcon> = {
  renovation: Paintbrush,
  interior: PenTool,
  photography: Camera,
  legal: Scale,
  appraisal: Calculator,
  moving: Truck,
  cleaning: Sparkles,
  management: KeyRound,
}

export default async function ServicesPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang: raw } = await params
  const lang = isValidLang(raw) ? raw : 'ka'
  const copy = hubCopy(lang)
  const providers = await listServiceProviders()
  const featured = providers.slice(0, 9)

  const listLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: copy.title,
    url: 'https://sivrce.ge/services',
    numberOfItems: SERVICE_CATEGORIES.length,
    itemListElement: SERVICE_CATEGORIES.map((c, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: c.name.en,
      url: `https://sivrce.ge/services/${c.id}`,
    })),
  }

  return (
    <div className="min-h-screen bg-sv-cloud">
      <Navbar />
      <main id="main">
        <PageHero tone="light" kicker={copy.kicker} title={copy.h1} subtitle={copy.sub}>
          <LocalizedLink
            href="/add-service"
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-sv-orange px-6 py-3 text-[14px] font-extrabold text-white shadow-glow-orange transition hover:-translate-y-0.5 hover:shadow-glow-orange-lg"
          >
            {copy.add}
            <ArrowRight className="h-4 w-4" />
          </LocalizedLink>
        </PageHero>
        <AdSlot slot="services" lang={lang} />

        <section className="mx-auto max-w-[1440px] px-5 pb-10 md:px-10">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {SERVICE_CATEGORIES.map((c, i) => {
              const Icon = ICONS[c.id]
              const n = providers.filter((p) => p.category === c.id).length
              return (
                <Reveal key={c.id} delay={i * 0.04} className="h-full">
                  <LocalizedLink
                    href={`/services/${c.id}`}
                    className="group flex h-full flex-col rounded-card border border-sv-ink/[0.06] bg-sv-surface p-6 transition-all duration-500 hover:-translate-y-1.5 hover:border-transparent hover:shadow-card-hover"
                  >
                    <span
                      className="grid h-12 w-12 place-items-center rounded-module"
                      style={{ backgroundColor: c.brand.chipVar, color: c.brand.hue }}
                    >
                      <Icon className="h-5 w-5" />
                    </span>
                    <h2 className="mt-5 text-[18px] font-extrabold tracking-[-0.02em] text-sv-ink">
                      {pickLocText(c.name, lang)}
                    </h2>
                    <p className="mt-2 flex-1 text-[13px] font-medium leading-relaxed text-sv-ink/60">
                      {pickLocText(c.blurb, lang)}
                    </p>
                    <span className="mt-4 text-[12px] font-extrabold" style={{ color: c.brand.hue }}>
                      {copy.count(n)}
                    </span>
                  </LocalizedLink>
                </Reveal>
              )
            })}
          </div>
        </section>

        {featured.length > 0 && (
          <section className="mx-auto max-w-[1440px] px-5 pb-16 md:px-10">
            <h2 className="mb-6 text-[22px] font-black tracking-[-0.02em] text-sv-ink md:text-[26px]">
              {copy.featured}
            </h2>
            <div className="sv-card-grid-3">
              {featured.map((p) => (
                <ServiceCard key={p.slug} p={p} lang={lang} />
              ))}
            </div>
          </section>
        )}
        <CTA lang={lang} />
      </main>
      <Footer />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(listLd) }} />
    </div>
  )
}
