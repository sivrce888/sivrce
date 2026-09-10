/**
 * Multi-apex host → market map.
 * sivrce.ge = Georgia (canonical). sivrce.de = Germany soft launch (Berlin first).
 * sivrce.com already 308s at the Vercel edge to .ge — not handled here.
 *
 * ponytail: host table only. Full DE locale (`de`) + inventory come later;
 * .de defaults to `en` until a de dictionary exists.
 */

import type { Lang } from '@/lib/i18n/core'

export type MarketId = 'ge' | 'de'

export interface SiteHost {
  market: MarketId
  /** Canonical public origin for this host (no trailing slash). */
  apex: string
  /** Locale injected for unprefixed URLs on this host. */
  defaultLang: Lang
  /** Soft-launch city slug (SEO path segment). */
  defaultCitySlug: string
  /** First-paint path after `/` on this host (locale-prefixed when needed). */
  homePath: string
}

const GE: SiteHost = {
  market: 'ge',
  apex: 'https://sivrce.ge',
  defaultLang: 'ka',
  defaultCitySlug: 'tbilisi',
  homePath: '/',
}

const DE: SiteHost = {
  market: 'de',
  apex: 'https://sivrce.de',
  defaultLang: 'en',
  defaultCitySlug: 'berlin',
  // Berlin-first: land on the city sale hub (ISR; empty until listings land).
  homePath: '/en/sale/apartments/berlin',
}

/** Hosts that serve the DE market on this deployment. */
const DE_HOSTS = new Set(['sivrce.de', 'www.sivrce.de'])

/** First-party hosts — not treated as external acquisition referrers. */
const OWN_SUFFIXES = ['.sivrce.ge', '.sivrce.de', '.sivrce.com'] as const

export function siteHostFor(hostname: string): SiteHost {
  const host = hostname.toLowerCase()
  if (DE_HOSTS.has(host)) return DE
  return GE
}

export function isOwnHost(hostname: string): boolean {
  const h = hostname.toLowerCase()
  if (h === 'localhost' || h === 'sivrce.ge' || h === 'sivrce.de' || h === 'sivrce.com') {
    return true
  }
  return OWN_SUFFIXES.some((s) => h.endsWith(s))
}

export function isDeHost(hostname: string): boolean {
  return DE_HOSTS.has(hostname.toLowerCase())
}
