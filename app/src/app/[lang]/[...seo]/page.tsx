import type { Metadata } from 'next'
import { cache } from 'react'
import { notFound } from 'next/navigation'
import SeoLanding, { seoMetadata } from '@/components/seo/SeoLanding'
import { isValidLang, type Lang } from '@/lib/i18n/core'
import { filterListings } from '@/lib/listings-db'
import {
  DEALS,
  TYPES,
  generateSeoBuildParams,
  parseSeoSlug,
  type SeoLoc,
} from '@/lib/seo-pages'

/**
 * Programmatic SEO landings for all 9 locales (ka unprefixed, /en…/az prefixed).
 * ponytail: the seo-pages copy corpus exists only for ka/en/ru — the other six
 * locales render English copy under their own URL prefix (urlPrefix) with
 * correct hreflang. Upgrade path: translate lib/seo-pages corpus per locale.
 *
 * ponytail: dynamicParams default (true) — unknown slugs ISR on first request.
 * Build only ka hubs (~38 pages). Sitemap still lists every combo for Google.
 */
export const revalidate = 300
export const maxDuration = 15

export function generateStaticParams() {
  return generateSeoBuildParams().map((seo) => ({ lang: 'ka', seo }))
}

/** Content corpus locale — ka/en/ru have real copy, everything else falls back to English. */
function seoLocOf(lang: Lang): SeoLoc {
  return lang === 'ka' || lang === 'ru' ? lang : 'en'
}

interface PageProps {
  params: Promise<{ lang: string; seo: string[] }>
}

/** Live inventory — cache() dedupes metadata + page in one request. */
const hydrateSeoListings = cache(async (seoPath: string) => {
  const def = parseSeoSlug(seoPath.split('/').filter(Boolean))
  if (!def) return null
  const live = await filterListings({
    dealType: def.dealSlug ? DEALS[def.dealSlug]?.deal : undefined,
    propType: def.typeSlug ? TYPES[def.typeSlug]?.type : undefined,
    city: def.city?.ka,
    district: def.district?.ka,
  }).catch(() => [])
  const listings = !def.rooms
    ? live
    : live.filter((l) => (def.rooms === 4 ? l.rooms >= 4 : l.rooms === def.rooms))
  return { def, listings }
})

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { lang, seo } = await params
  if (!isValidLang(lang)) return {}
  const hydrated = await hydrateSeoListings(seo.join('/'))
  if (!hydrated) return {}
  return seoMetadata(
    { ...hydrated.def, listings: hydrated.listings },
    seoLocOf(lang),
    lang === 'ka' ? '' : `/${lang}`,
  )
}

export default async function SeoLandingPage({ params }: PageProps) {
  const { lang, seo } = await params
  if (!isValidLang(lang)) notFound()
  const hydrated = await hydrateSeoListings(seo.join('/'))
  if (!hydrated) notFound()
  return (
    <SeoLanding
      def={{ ...hydrated.def, listings: hydrated.listings }}
      loc={seoLocOf(lang)}
      urlPrefix={lang === 'ka' ? '' : `/${lang}`}
    />
  )
}
