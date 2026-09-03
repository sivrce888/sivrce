import type { Metadata } from 'next'
import Navbar from '@/components/sections/Navbar'
import CTA from '@/components/sections/CTA'
import Footer from '@/components/sections/Footer'
import { FaqSection } from '@/components/seo/FaqSection'
import type { Project } from '@/data/professionals'
import { jsonLd } from '@/lib/utils'
import { langAlternates, OG_LOCALE } from '@/lib/i18n/server'
import type { Lang } from '@/lib/i18n/core'
import {
  faqPageLd,
  type DirLoc,
  type DirectoryHubCopy,
} from '@/lib/directory-seo'
import { PER_PAGE, Pager, ProjectsGrid } from '@/app/[lang]/projects/ProjectsGrid'

/**
 * Shared new-build hub page — identical card/prose/FAQ pattern to
 * app/[lang]/projects/page.tsx, driven by a filtered project list + hub copy.
 * Used by /projects/tbilisi, /projects/batumi, /projects/batumi/sea-view,
 * /projects/installment, /projects/ready and /projects/tbilisi/[district].
 * Slices to PER_PAGE and renders a pager; `page ≥ 2` comes from the
 * [hub]/page/[pg] route.
 */
export function projectHubMetadata(path: string, lang: Lang, c: DirectoryHubCopy): Metadata {
  return {
    title: c.title,
    description: c.description,
    alternates: { canonical: path, languages: langAlternates(path) },
    openGraph: {
      title: c.ogTitle,
      description: c.description,
      type: 'website',
      url: `https://sivrce.ge${path}`,
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

export function ProjectHub({
  loc,
  c,
  projects,
  basePath = '/projects',
  page = 1,
}: {
  loc: DirLoc
  c: DirectoryHubCopy
  projects: Project[]
  /** Canonical prefix the pager links into: `${basePath}/page/N`. */
  basePath?: string
  page?: number
}) {
  const totalPages = Math.max(1, Math.ceil(projects.length / PER_PAGE))
  const pageProjects = projects.slice((page - 1) * PER_PAGE, page * PER_PAGE)
  const listLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    numberOfItems: pageProjects.length,
    itemListElement: pageProjects.map((p, i) => ({
      '@type': 'ListItem',
      position: (page - 1) * PER_PAGE + i + 1,
      name: p.name,
      url: `https://sivrce.ge/projects/${p.slug}`,
      image: p.img.startsWith('http') ? p.img : `https://sivrce.ge${p.img}`,
    })),
  }

  return (
    <div className="min-h-screen bg-sv-surface">
      <Navbar />
      <main id="main" className="pt-16">
        <section className="mx-auto max-w-[1440px] px-5 py-12 md:px-10 md:py-16">
          <h1 className="text-balance text-[30px] font-black tracking-[-0.02em] text-sv-ink md:text-[40px]">
            {c.h1}
          </h1>
          <p className="mt-2 max-w-2xl text-[15px] font-semibold text-sv-ink/65 md:text-[16px]">
            {c.sub}
          </p>
          <ProjectsGrid projects={pageProjects} loc={loc} />
          <Pager page={page} totalPages={totalPages} loc={loc} basePath={basePath} />
        </section>

        {/* SEO prose — hub keyword block */}
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
