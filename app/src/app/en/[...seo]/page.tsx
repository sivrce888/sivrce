import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import SeoLanding, { seoMetadata } from '@/components/seo/SeoLanding'
import { generateAllSeoParams, parseSeoSlug } from '@/lib/seo-pages'

// English SSR twins of the ka programmatic SEO pages (/en/sale/apartments/tbilisi…).
// Middleware lets deal/city roots through to this route; everything else under
// /en still rewrites to the ka app with client-side i18n.
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
  return seoMetadata(def, 'en')
}

export default async function SeoLandingPageEn({ params }: PageProps) {
  const { seo } = await params
  const def = parseSeoSlug(seo)
  if (!def) notFound()
  return <SeoLanding def={def} loc="en" />
}
