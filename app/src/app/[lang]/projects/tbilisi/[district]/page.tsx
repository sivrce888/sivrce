import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { projectsLive } from '@/lib/directory-live'
import { dirLoc, districtHubCopy, PROJECT_DISTRICTS } from '@/lib/directory-seo'
import { isValidLang } from '@/lib/i18n/core'
import { ProjectHub, projectHubMetadata } from '@/components/seo/ProjectHub'

export const revalidate = 3600

interface PageProps {
  params: Promise<{ lang: string; district: string }>
}

const bySlug = (slug: string) => PROJECT_DISTRICTS.find((d) => d.slug === slug)

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { lang: raw, district } = await params
  if (!isValidLang(raw)) return {}
  const d = bySlug(district)
  if (!d) return {}
  const count = (await projectsLive()).filter(
    (p) => p.city === 'თბილისი' && p.location.includes(d.ka),
  ).length
  return projectHubMetadata(`/projects/tbilisi/${d.slug}`, raw, districtHubCopy(dirLoc(raw), d, count))
}

export default async function ProjectsTbilisiDistrictPage({ params }: PageProps) {
  const { lang: raw, district } = await params
  if (!isValidLang(raw)) notFound()
  const d = bySlug(district)
  if (!d) notFound()
  const loc = dirLoc(raw)
  const projects = (await projectsLive()).filter(
    (p) => p.city === 'თბილისი' && p.location.includes(d.ka),
  )
  return <ProjectHub loc={loc} c={districtHubCopy(loc, d, projects.length)} projects={projects} />
}
