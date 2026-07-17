import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import SeoLanding, { seoMetadata } from '@/components/seo/SeoLanding'
import { generateAllSeoParams, parseSeoSlug } from '@/lib/seo-pages'

// Russian SSR twins of the ka programmatic SEO pages (/ru/sale/apartments/tbilisi…).
export function generateStaticParams() {
  return generateAllSeoParams().map((seo) => ({ seo }))
}

interface PageProps {
  params: Promise<{ seo: string[] }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { seo } = await params
  const def = parseSeoSlug(seo)
  if (!def) return {}
  return seoMetadata(def, 'ru')
}

export default async function SeoLandingPageRu({ params }: PageProps) {
  const { seo } = await params
  const def = parseSeoSlug(seo)
  if (!def) notFound()
  return <SeoLanding def={def} loc="ru" />
}
