import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import SeoLanding, { seoMetadata } from '@/components/seo/SeoLanding'
import { isValidLang, type Lang } from '@/lib/i18n/core'
import { generateAllSeoParams, parseSeoSlug, type SeoLoc } from '@/lib/seo-pages'

/**
 * Programmatic SEO landings for all 9 locales (ka unprefixed, /en…/az prefixed).
 * ponytail: the seo-pages copy corpus exists only for ka/en/ru — the other six
 * locales render English copy under their own URL prefix (urlPrefix) with
 * correct hreflang. Upgrade path: translate lib/seo-pages corpus per locale.
 *
 * ponytail: dynamicParams default (true) — unknown slugs render on demand and
 * hit notFound() below; `false` crashes `next start` (NoFallbackError) on any
 * unmatched asset request. Static params stay limited to ka/en/ru (today's
 * build surface); the other locales prerender on first request.
 */
const SSG_LANGS: readonly Lang[] = ['ka', 'en', 'ru']

export function generateStaticParams() {
  // Next 16 types want sync params including parent `lang` for nested catch-alls.
  return SSG_LANGS.flatMap((lang) =>
    generateAllSeoParams().map((seo) => ({ lang, seo })),
  )
}

/** Content corpus locale — ka/en/ru have real copy, everything else falls back to English. */
function seoLocOf(lang: Lang): SeoLoc {
  return lang === 'ka' || lang === 'ru' ? lang : 'en'
}

interface PageProps {
  params: Promise<{ lang: string; seo: string[] }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { lang, seo } = await params
  if (!isValidLang(lang)) return {}
  const def = parseSeoSlug(seo)
  if (!def) return {}
  return seoMetadata(def, seoLocOf(lang), lang === 'ka' ? '' : `/${lang}`)
}

export default async function SeoLandingPage({ params }: PageProps) {
  const { lang, seo } = await params
  if (!isValidLang(lang)) notFound()
  const def = parseSeoSlug(seo)
  if (!def) notFound()
  return (
    <SeoLanding
      def={def}
      loc={seoLocOf(lang)}
      urlPrefix={lang === 'ka' ? '' : `/${lang}`}
    />
  )
}
