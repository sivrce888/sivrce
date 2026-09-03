import type { Metadata } from 'next'
import LocalizedLink from '@/components/LocalizedLink'
import Navbar from '@/components/sections/Navbar'
import CTA from '@/components/sections/CTA'
import Footer from '@/components/sections/Footer'
import { PageHero } from '@/components/PageHero'
import { AdSlot } from '@/components/ads/AdSlot'
import { isValidLang } from '@/lib/i18n/core'
import { EntityCard } from '@/components/entities/EntityCard'
import { db } from '@/lib/db'
import { safeQuery } from '@/lib/guards'
import { jsonLd } from '@/lib/utils'
import { pageMeta } from '@/lib/i18n/server'
import { roleSignupHref } from '@/lib/auth-roles'
import { ArrowRight } from 'lucide-react'

export const revalidate = 3600

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>
}): Promise<Metadata> {
  const { lang: raw } = await params
  const lang = isValidLang(raw) ? raw : 'ka'
  return {
    ...pageMeta('/agencies', lang, {
      ka: {
        title: 'უძრავი ქონების სააგენტოები — გუნდი, განცხადებები, სანდოობა',
        description:
          'უძრავი ქონების სააგენტოების კატალოგი საქართველოში: გუნდის ზომა, აქტიური განცხადებები, საპასუხო მაჩვენებელი და ვერიფიკაციის სტატუსი — აირჩიე შენი სააგენტო.',
      },
      en: {
        title: 'Real Estate Agencies in Georgia — Teams, Listings, Trust',
        description:
          'Directory of real estate agencies in Georgia: team size, active listings, response rate and verification status — choose your agency.',
      },
      ru: {
        title: 'Агентства недвижимости в Грузии — команда, объявления, доверие',
        description:
          'Каталог агентств недвижимости в Грузии: размер команды, активные объявления, показатель ответов и верификация — выберите своё агентство.',
      },
    }),
    openGraph: {
      title: 'უძრავი ქონების სააგენტოები',
      description: 'სააგენტოების კატალოგი — გუნდით, განცხადებებითა და სანდოობის სიგნალებით.',
      type: 'website',
    },
  }
}

export default async function AgenciesPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang: raw } = await params
  const lang = isValidLang(raw) ? raw : 'ka'

  // ponytail: denormalized activeListings/teamSize columns decide the order —
  // live listing joins when agencies outgrow one page.
  const rows = await safeQuery(
    () =>
      db.agencyProfile.findMany({
        where: { deletedAt: null },
        select: {
          slug: true,
          name: true,
          city: true,
          verified: true,
          teamSize: true,
          activeListings: true,
          districts: true,
        },
        orderBy: [{ activeListings: 'desc' }, { teamSize: 'desc' }, { name: 'asc' }],
        take: 120,
      }),
    [],
  )

  const listLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: rows.map((a, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: a.name,
      url: `https://sivrce.ge/agencies/${a.slug}`,
    })),
  }

  return (
    <div className="min-h-screen bg-sv-cloud">
      <Navbar />
      <main id="main">
        <PageHero
          tone="light"
          kicker="დირექტორია"
          title="სააგენტოები"
          subtitle="გუნდის ზომითა და აქტიური განცხადებებით — ვერიფიცირებული სააგენტოები სანდოობის სიგნალებით"
        >
          <LocalizedLink
            href={roleSignupHref('agency')}
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-sv-orange px-6 py-3 text-[14px] font-extrabold text-white shadow-glow-orange transition hover:-translate-y-0.5 hover:shadow-glow-orange-lg"
          >
            დაარეგისტრირე შენი სააგენტო
            <ArrowRight className="h-4 w-4" />
          </LocalizedLink>
        </PageHero>
        <AdSlot slot="agencies" lang={lang} />
        <section className="mx-auto max-w-[1440px] px-5 pb-16 md:px-10">
          {rows.length === 0 ? (
            <p className="mt-10 text-[15px] font-semibold text-sv-ink/55">
              კატალოგი ივსება — შენი სააგენტო შეიძლება იყოს პირველი.
            </p>
          ) : (
            <div className="mt-10 sv-card-grid-3">
              {rows.map((a) => (
                <EntityCard
                  key={a.slug}
                  kind="agency"
                  slug={a.slug}
                  name={{ ka: a.name, en: a.name, ru: a.name }}
                  city={a.city}
                  listingsCount={a.activeListings}
                  verified={a.verified}
                  aggregate={null}
                  subtitle={a.districts.slice(0, 2).join(' · ')}
                />
              ))}
            </div>
          )}
        </section>
        <CTA lang={lang} />
      </main>
      <Footer />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(listLd) }} />
    </div>
  )
}
