'use client'

/**
 * SIVRCE — locale-aware Link.
 * Prefixes internal hrefs with the active locale (ka stays unprefixed).
 * Skips: external URLs, /api + /auth (root-mounted by design), and hrefs that
 * already carry a locale prefix (SeoLanding chips pass urlPrefix'd paths).
 * SSR renders the prefixed URL directly — I18nProvider pins the URL locale.
 */
import Link from 'next/link'
import type { ComponentProps } from 'react'
import { useI18n, localizedHref, stripLangPrefix } from '@/lib/i18n/context'

/** /map pulls Map3D + NAPR/footprint geo JSON (~190KiB) — load on navigation,
 * never prefetch it from idle pages (navbar/footer render it sitewide). */
const HEAVY_ROUTES = /^\/(map)(\/|$)/

export function localizeHref(href: string, lang: Parameters<typeof localizedHref>[1]): string {
  if (!href.startsWith('/')) return href
  if (href.startsWith('/api') || href.startsWith('/auth')) return href
  if (stripLangPrefix(href) !== href) return href
  return localizedHref(href, lang)
}

export default function LocalizedLink({ href, prefetch, ...rest }: ComponentProps<typeof Link>) {
  const { lang } = useI18n()
  const resolved = typeof href === 'string' ? localizeHref(href, lang) : href
  const heavy = typeof resolved === 'string' && HEAVY_ROUTES.test(stripLangPrefix(resolved))
  return (
    <Link
      href={resolved}
      prefetch={prefetch ?? (heavy ? false : undefined)}
      {...rest}
    />
  )
}
