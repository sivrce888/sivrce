import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Navbar from '@/components/sections/Navbar'
import CTA from '@/components/sections/CTA'
import Footer from '@/components/sections/Footer'
import { PageHero } from '@/components/PageHero'
import { AdSlot } from '@/components/ads/AdSlot'
import { projectsLive } from '@/lib/directory-live'
import { jsonLd } from '@/lib/utils'
import { langAlternates, OG_LOCALE } from '@/lib/i18n/server'
import { isValidLang, type Lang } from '@/lib/i18n/core'
import { MICRO, PROJECTS_HUB, dirLoc } from '@/lib/directory-seo'
import { PER_PAGE, Pager, ProjectsGrid } from '../../ProjectsGrid'

export const revalidate = 3600

interface PageProps {
  params: Promise<{ lang: string; pg: string }>
}

/** Only integers ≥ 2 land here — page 1 is the canonical /projects. */
function parsePg(raw: string): number {
  const n = Number(raw)
  return Number.isInteger(n) && n >= 2 ? n : 0
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { lang: raw, pg: rawPg } = await params
  const lang: Lang = isValidLang(raw) ? raw : 'ka'
  const pg = parsePg(rawPg)
  const loc = dirLoc(lang)
  const c = PROJECTS_HUB[loc]
  const path = `/projects/page/${pg}`
  const title = pg ? `${c.title} — ${MICRO[loc].page(pg)}` : c.title
  return {
    title,
    description: c.description,
    alternates: { canonical: pg ? path : '/projects', languages: langAlternates(path) },
    openGraph: {
      title,
      description: c.description,
      type: 'website',
      url: `https://sivrce.ge${pg ? path : '/projects'}`,
      siteName: 'sivrce',
      locale: OG_LOCALE[lang],
      images: [{ url: 'https://sivrce.ge/images/og-brand.png', alt: c.ogTitle }],
    },
  }
}

export default async function ProjectsPageN({ params }: PageProps) {
  const { lang: raw, pg: rawPg } = await params
  if (!isValidLang(raw)) notFound()
  const pg = parsePg(rawPg)
  if (!pg) notFound()
  const loc = dirLoc(raw)
  const c = PROJECTS_HUB[loc]

  const projects = await projectsLive()
  const totalPages = Math.max(1, Math.ceil(projects.length / PER_PAGE))
  if (pg > totalPages) notFound()
  const pageProjects = projects.slice((pg - 1) * PER_PAGE, pg * PER_PAGE)
  const listLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    numberOfItems: pageProjects.length,
    itemListElement: pageProjects.map((p, i) => ({
      '@type': 'ListItem',
      position: (pg - 1) * PER_PAGE + i + 1,
      name: p.name,
      url: `https://sivrce.ge/projects/${p.slug}`,
      image: p.img.startsWith('http') ? p.img : `https://sivrce.ge${p.img}`,
    })),
  }

  return (
    <div className="min-h-screen bg-sv-cloud">
      <Navbar />
      <main id="main">
        <PageHero tone="light" kicker="ახალი პროექტები" title={c.h1} subtitle={c.sub} />
        <AdSlot slot="projects" lang={raw} />
        <section className="mx-auto max-w-[1440px] px-5 pb-16 md:px-10">
          <ProjectsGrid projects={pageProjects} loc={loc} />
          <Pager page={pg} totalPages={totalPages} loc={loc} />
        </section>
        <CTA />
      </main>
      <Footer />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(listLd) }} />
    </div>
  )
}
