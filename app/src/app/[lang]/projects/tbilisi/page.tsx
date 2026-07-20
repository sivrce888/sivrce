import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { projectsLive } from '@/lib/directory-live'
import { dirLoc, PROJECT_HUBS } from '@/lib/directory-seo'
import { isValidLang } from '@/lib/i18n/core'
import { ProjectHub, projectHubMetadata } from '@/components/seo/ProjectHub'

export const revalidate = 3600

const PATH = '/projects/tbilisi'

interface PageProps {
  params: Promise<{ lang: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { lang: raw } = await params
  if (!isValidLang(raw)) return {}
  return projectHubMetadata(PATH, raw, PROJECT_HUBS.tbilisi[dirLoc(raw)])
}

export default async function ProjectsTbilisiPage({ params }: PageProps) {
  const { lang: raw } = await params
  if (!isValidLang(raw)) notFound()
  const loc = dirLoc(raw)
  const projects = (await projectsLive()).filter((p) => p.city === 'თბილისი')
  return <ProjectHub loc={loc} c={PROJECT_HUBS.tbilisi[loc]} projects={projects} />
}
