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
import { langAlternates } from '@/lib/i18n/server'
import { jsonLd } from '@/lib/utils'
import {
  isServiceCategoryId,
  pickLocText,
  SERVICE_CATEGORIES,
  type ServiceCategoryId,
} from '@/lib/services'
import { listServiceProviders } from '@/lib/services-db'

export const revalidate = 3600

export function generateStaticParams() {
  return SERVICE_CATEGORIES.map((c) => ({ lang: 'ka', category: c.id }))
}

interface PageProps {
  params: Promise<{ lang: string; category: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { lang: raw, category } = await params
  if (!isServiceCategoryId(category)) return {}
  const lang = isValidLang(raw) ? raw : 'ka'
  const c = SERVICE_CATEGORIES.find((x) => x.id === category)!
  const name = pickLocText(c.name, lang)
  const seo = pickLocText(c.seo, lang)
  return {
    title: `${name} — ${lang === 'ru' ? 'сервисы недвижимости' : lang === 'ka' ? 'უძრავი ქონების სერვისები' : 'real-estate services'}`,
    description: seo,
    alternates: {
      canonical: `/services/${category}`,
      languages: langAlternates(`/services/${category}`),
    },
    openGraph: {
      title: `${name} | sivrce`,
      description: seo,
      type: 'website',
    },
  }
}

export default async function ServiceCategoryPage({ params }: PageProps) {
  const { lang: raw, category } = await params
  if (!isServiceCategoryId(category)) notFound()
  const lang = isValidLang(raw) ? raw : 'ka'
  const cat = SERVICE_CATEGORIES.find((x) => x.id === category)!
  const providers = await listServiceProviders(category as ServiceCategoryId)

  const listLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: cat.name.en,
    url: `https://sivrce.ge/services/${category}`,
    numberOfItems: providers.length,
    itemListElement: providers.map((p, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: p.name.en,
      url: `https://sivrce.ge/services/${category}/${p.slug}`,
    })),
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
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-sv-orange px-6 py-3 text-[14px] font-extrabold text-white shadow-glow-orange transition hover:-translate-y-0.5"
          >
            {lang === 'ru' ? 'Добавить компанию' : lang === 'ka' ? 'დაამატე კომპანია' : 'Add your company'}
          </LocalizedLink>
        </PageHero>
        <AdSlot slot="services" lang={lang} />

        {category === 'renovation' && (
          <section className="mx-auto max-w-[1100px] px-5 pb-12 md:px-10">
            <h2 className="mb-5 text-[22px] font-black tracking-[-0.02em] text-sv-ink">
              {lang === 'ru' ? 'Бюджет ремонта' : lang === 'ka' ? 'რემონტის ბიუჯეტი' : 'Renovation budget'}
            </h2>
            <RenovationCalc />
          </section>
        )}

        <section className="mx-auto max-w-[1440px] px-5 pb-20 md:px-10">
          {providers.length === 0 ? (
            <p className="text-[15px] font-semibold text-sv-ink/55">
              {lang === 'ru'
                ? 'В этой категории пока нет компаний. '
                : lang === 'ka'
                  ? 'ამ კატეგორიაში კომპანია ჯერ არ არის. '
                  : 'No companies in this category yet. '}
              <LocalizedLink href="/add-service" className="font-extrabold text-sv-blue">
                {lang === 'ru' ? 'Добавить первую' : lang === 'ka' ? 'დაამატე პირველი' : 'Add the first'}
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
    </div>
  )
}
