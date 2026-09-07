import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Navbar from '@/components/sections/Navbar'
import CTA from '@/components/sections/CTA'
import Footer from '@/components/sections/Footer'
import { PageHero } from '@/components/PageHero'
import { AdSlot } from '@/components/ads/AdSlot'
import { FaqSection } from '@/components/seo/FaqSection'
import { projectsLive } from '@/lib/directory-live'
import { altName } from '@/lib/bilingual'
import { jsonLd } from '@/lib/utils'
import { langAlternates, OG_LOCALE } from '@/lib/i18n/server'
import { isValidLang, type Lang } from '@/lib/i18n/core'
import { PROJECTS_HUB, dirLoc, faqPageLd } from '@/lib/directory-seo'
import { toCard } from './card'
import { PER_PAGE, Pager } from './ProjectsGrid'
import { ProjectsExplorer } from './ProjectsExplorer'

export const revalidate = 3600

interface PageProps {
  params: Promise<{ lang: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { lang: raw } = await params
  const lang: Lang = isValidLang(raw) ? raw : 'ka'
  const c = PROJECTS_HUB[dirLoc(lang)]
  return {
    title: c.title,
    description: c.description,
    alternates: { canonical: '/projects', languages: langAlternates('/projects') },
    openGraph: {
      title: c.ogTitle,
      description: c.description,
      type: 'website',
      url: 'https://sivrce.ge/projects',
      siteName: 'sivrce',
      locale: OG_LOCALE[lang],
      images: [{ url: 'https://sivrce.ge/images/og-brand.png', alt: c.ogTitle }],
    },
    twitter: {
      card: 'summary_large_image',
      title: c.ogTitle,
      description: c.description,
      images: ['https://sivrce.ge/images/og-brand.png'],
    },
  }
}

export default async function ProjectsPage({ params }: PageProps) {
  const { lang: raw } = await params
  if (!isValidLang(raw)) notFound()
  const loc = dirLoc(raw)
  const c = PROJECTS_HUB[loc]

  const projects = await projectsLive()
  const totalPages = Math.max(1, Math.ceil(projects.length / PER_PAGE))
  const pageSlice = projects.slice(0, PER_PAGE)
  // Nested item = Google carousel spec; alternateName carries the other script.
  const listLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    numberOfItems: pageSlice.length,
    itemListElement: pageSlice.map((p, i) => {
      const n = loc === 'ka' && p.nameKa ? p.nameKa : p.name
      const url = `https://sivrce.ge/projects/${p.slug}`
      return {
        '@type': 'ListItem',
        position: i + 1,
        name: n,
        url,
        image: p.img.startsWith('http') ? p.img : `https://sivrce.ge${p.img}`,
        item: {
          '@type': 'ApartmentComplex',
          name: n,
          alternateName: [...new Set([p.name, p.nameKa, altName(p.name)])].filter(
            (v) => v && v !== n,
          ),
          url,
        },
      }
    }),
  }

  return (
    <div className="min-h-screen bg-sv-cloud">
      <Navbar />
      <main id="main">
        <PageHero
          tone="light"
          kicker={loc === 'ka' ? 'მშენებარე ბინები' : loc === 'ru' ? 'Новостройки' : 'New developments'}
          title={c.h1}
          subtitle={c.sub}
        />
        <AdSlot slot="projects" lang={raw} />
        <section className="mx-auto max-w-[1440px] px-5 pb-16 md:px-10">
          <ProjectsExplorer
            projects={projects.map((p) => toCard(p, loc))}
            loc={loc}
            pager={<Pager page={1} totalPages={totalPages} loc={loc} />}
          />
        </section>

        {/* SEO prose — hub keyword block (მშენებარე ბინები თბილისი/ბათუმი, ფასები 2026) */}
        <section className="mx-auto max-w-[1440px] px-5 pb-12 md:px-10">
          <div className="rounded-card border border-sv-ink/[0.06] bg-sv-surface p-6 shadow-card md:p-10">
            <h2 className="text-[20px] font-black tracking-[-0.02em] text-sv-ink md:text-[24px]">
              {c.proseTitle}
            </h2>
            {c.prose.map((para, i) => (
              <p
                key={i}
                className="mt-4 max-w-[860px] text-[15px] font-medium leading-[1.75] text-sv-ink/65"
              >
                {para}
              </p>
            ))}
          </div>
        </section>

        <FaqSection
          title={c.faqTitle}
          items={c.faqs}
          className="mx-auto max-w-[1440px] px-5 pb-16 md:px-10"
        />
        <CTA />
      </main>
      <Footer />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(listLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(faqPageLd(c.faqs)) }} />
    </div>
  )
}
