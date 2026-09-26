import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import LocalizedLink from '@/components/LocalizedLink'
import Navbar from '@/components/sections/Navbar'
import Footer from '@/components/sections/Footer'
import { PageHero } from '@/components/PageHero'
import { AdSlot } from '@/components/ads/AdSlot'
import { ServiceCard } from '@/components/services/ServiceCard'
import { RenovationCalc } from '@/components/services/RenovationCalc'
import { isValidLang } from '@/lib/i18n/core'
import { pageAlternates } from "@/lib/i18n/server"
import { jsonLd } from '@/lib/utils'
import {
  isServiceCategoryId,
  pickLocText,
  SERVICE_CATEGORIES,
  SERVICE_CITIES,
  type ServiceCategoryId,
} from '@/lib/services'
import { listServiceProviders } from '@/lib/services-db'

export const revalidate = 3600

export function generateStaticParams() {
  return SERVICE_CATEGORIES.map((c) => ({ lang: 'ka', category: c.id }))
}

interface PageProps {
  params: Promise<{ lang: string; category: string }>
  searchParams: Promise<{ city?: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { lang: raw, category } = await params
  if (!isServiceCategoryId(category)) return {}
  const lang = isValidLang(raw) ? raw : 'ka'
  const c = SERVICE_CATEGORIES.find((x) => x.id === category)!
  const name = pickLocText(c.name, lang)
  const seo = pickLocText(c.seo, lang)
  return {
    title: `${name} — ${lang === 'ru' ? 'сервисы недвижимости' : lang === 'ka' ? 'უძრავი ქონების სერვისები' : lang === 'de' ? 'Immobilien-Services' : 'real-estate services'}`,
    description: seo,
    alternates: pageAlternates(`/services/${category}`, lang),
    openGraph: {
      title: `${name}`,
      description: seo,
      type: 'website',
    },
  }
}

export default async function ServiceCategoryPage({ params, searchParams }: PageProps) {
  const { lang: raw, category } = await params
  if (!isServiceCategoryId(category)) notFound()
  const lang = isValidLang(raw) ? raw : 'ka'
  const cat = SERVICE_CATEGORIES.find((x) => x.id === category)!
  // Allowlist the query — unknown ?city= values render the unfiltered list.
  const { city: rawCity } = await searchParams
  const city = SERVICE_CITIES.find((c) => c === rawCity)
  const all = await listServiceProviders(category as ServiceCategoryId)
  const providers = city ? all.filter((p) => p.city === city) : all

  const listLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: cat.name.en,
    url: `https://sivrce.ge/services/${category}`,
    numberOfItems: all.length,
    itemListElement: all.map((p, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: p.name.en,
      url: `https://sivrce.ge/services/${category}/${p.slug}`,
    })),
  }

  const homeLabel = lang === 'ka' ? 'მთავარი' : lang === 'ru' ? 'Главная' : lang === 'de' ? 'Startseite' : 'Home'
  const hubLabel = lang === 'ka' ? 'სერვისები' : lang === 'ru' ? 'Сервисы' : 'Services'
  const catName = pickLocText(cat.name, lang)
  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: homeLabel, item: 'https://sivrce.ge' },
      { '@type': 'ListItem', position: 2, name: hubLabel, item: 'https://sivrce.ge/services' },
      { '@type': 'ListItem', position: 3, name: catName, item: `https://sivrce.ge/services/${category}` },
    ],
  }

  return (
    <div className="min-h-screen bg-sv-cloud">
      <Navbar />
      <main id="main">
        <PageHero
          tone="light"
          kicker={lang === 'ru' ? 'Сервисы' : lang === 'ka' ? 'სერვისები' : 'Services'}
          title={pickLocText(cat.name, lang)}
          subtitle={pickLocText(cat.seo, lang)}
        >
          <LocalizedLink
            href="/add-service"
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-sv-orange px-6 py-3 text-[14px] font-extrabold text-sv-ink shadow-glow-orange transition hover:-translate-y-0.5"
          >
            {lang === 'ru' ? 'Добавить компанию' : lang === 'ka' ? 'დაამატე კომპანია' : lang === 'de' ? 'Firma hinzufügen' : 'Add your company'}
          </LocalizedLink>
        </PageHero>
        <AdSlot slot="services" lang={lang} />

        {category === 'renovation' && (
          <section className="mx-auto max-w-[1100px] px-5 pb-12 md:px-10">
            <h2 className="mb-5 text-[22px] font-black tracking-[-0.02em] text-sv-ink">
              {lang === 'ru' ? 'Бюджет ремонта' : lang === 'ka' ? 'რემონტის ბიუჯეტი' : lang === 'de' ? 'Renovierungsbudget' : 'Renovation budget'}
            </h2>
            <RenovationCalc />
          </section>
        )}

        <section className="mx-auto max-w-[1440px] px-5 pb-20 md:px-10">
          <nav aria-label={lang === 'ru' ? 'Города' : lang === 'ka' ? 'ქალაქები' : 'Cities'} className="mb-7 flex flex-wrap gap-2">
            <LocalizedLink
              href={`/services/${category}`}
              aria-current={city ? undefined : 'true'}
              className={`rounded-full border px-4 py-2 text-[13px] font-extrabold transition ${
                city
                  ? 'border-sv-ink/[0.08] bg-sv-surface text-sv-ink hover:border-sv-ink/25'
                  : 'border-sv-ink bg-sv-ink text-sv-cloud'
              }`}
            >
              {lang === 'ru' ? 'Все города' : lang === 'ka' ? 'ყველა ქალაქი' : lang === 'de' ? 'Alle Städte' : 'All cities'}
              <span className="ml-1.5 font-bold opacity-60">{all.length}</span>
            </LocalizedLink>
            {SERVICE_CITIES.map((c) => {
              const n = all.filter((p) => p.city === c).length
              if (n === 0) return null
              const on = city === c
              return (
                <LocalizedLink
                  key={c}
                  href={`/services/${category}?city=${encodeURIComponent(c)}`}
                  aria-current={on ? 'true' : undefined}
                  className={`rounded-full border px-4 py-2 text-[13px] font-extrabold transition ${
                    on
                      ? 'border-sv-ink bg-sv-ink text-sv-cloud'
                      : 'border-sv-ink/[0.08] bg-sv-surface text-sv-ink hover:border-sv-ink/25'
                  }`}
                >
                  {c}
                  <span className="ml-1.5 font-bold opacity-60">{n}</span>
                </LocalizedLink>
              )
            })}
          </nav>
          {providers.length === 0 ? (
            <p className="text-[15px] font-semibold text-sv-ink/60">
              {lang === 'ru'
                ? 'В этой категории пока нет компаний. '
                : lang === 'ka'
                  ? 'ამ კატეგორიაში კომპანია ჯერ არ არის. '
                  : lang === 'de'
                    ? 'In dieser Kategorie gibt es noch keine Firmen. '
                    : 'No companies in this category yet. '}
              <LocalizedLink href="/add-service" className="font-extrabold text-sv-blue">
                {lang === 'ru' ? 'Добавить первую' : lang === 'ka' ? 'დაამატე პირველი' : lang === 'de' ? 'Erste hinzufügen' : 'Add the first'}
              </LocalizedLink>
              .
            </p>
          ) : (
            <div className="sv-card-grid-3">
              {providers.map((p) => (
                <ServiceCard key={p.slug} p={p} lang={lang} />
              ))}
            </div>
          )}
        </section>
      </main>
      <Footer />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(listLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(breadcrumbLd) }} />
    </div>
  )
}
