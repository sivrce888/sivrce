import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { projectsLive } from '@/lib/directory-live'
import { MICRO, PROJECT_HUBS, dirLoc } from '@/lib/directory-seo'
import { isValidLang, type Lang } from '@/lib/i18n/core'
import { langAlternates, OG_LOCALE } from '@/lib/i18n/server'
import { ProjectHub } from '@/components/seo/ProjectHub'
import { SUB_HUBS } from '../../../subhubs'

export const revalidate = 3600

interface PageProps {
  params: Promise<{ lang: string; slug: string; pg: string }>
}

/** Only integers ≥ 2 land here — page 1 is the canonical sub-hub. */
function parsePg(raw: string): number {
  const n = Number(raw)
  return Number.isInteger(n) && n >= 2 ? n : 0
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { lang: raw, slug: hub, pg: rawPg } = await params
  const entry = SUB_HUBS[hub]
  const pg = parsePg(rawPg)
  if (!entry || !pg || !isValidLang(raw)) return {}
  const loc = dirLoc(raw)
  const c = PROJECT_HUBS[entry.hub][loc]
  const path = `${entry.path}/page/${pg}`
  const title = `${c.title} — ${MICRO[loc].page(pg)}`
  return {
    title,
    description: c.description,
    alternates: { canonical: path, languages: langAlternates(path) },
    openGraph: {
      title,
      description: c.description,
      type: 'website',
      url: `https://sivrce.ge${path}`,
      siteName: 'sivrce',
      locale: OG_LOCALE[raw as Lang],
      images: [{ url: 'https://sivrce.ge/images/og-brand.png', alt: c.ogTitle }],
    },
  }
}

export default async function ProjectSubHubPage({ params }: PageProps) {
  const { lang: raw, slug: hub, pg: rawPg } = await params
  const entry = SUB_HUBS[hub]
  const pg = parsePg(rawPg)
  if (!entry || !pg || !isValidLang(raw)) notFound()
  const loc = dirLoc(raw)
  const projects = (await projectsLive()).filter(entry.filter)
  return (
    <ProjectHub
      loc={loc}
      c={PROJECT_HUBS[entry.hub][loc]}
      projects={projects}
      basePath={entry.path}
      page={pg}
    />
  )
}
