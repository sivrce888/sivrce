/**
 * Host classification + safe origin helpers.
 * Production canonicals are allowlisted — never taken from Host / XFH
 * (host-header / open-redirect defense). Preview/dev never bounce to prod.
 */

import { COM_ORIGIN, GE_ORIGIN, type MarketId, type PathCountryId } from '@/lib/markets'

export { COM_ORIGIN, GE_ORIGIN }

export type HostKind =
  | 'ge'
  | 'com'
  | 'de-cctld'
  | 'ae-cctld'
  | 'admin'
  | 'cdn'
  | 'api'
  | 'legacy-redirect'
  | 'preview'
  | 'dev'

const GE_HOSTS = new Set(['sivrce.ge', 'www.sivrce.ge'])
const COM_HOSTS = new Set(['sivrce.com', 'www.sivrce.com'])
const DE_HOSTS = new Set(['sivrce.de', 'www.sivrce.de'])
const AE_HOSTS = new Set(['sivrce.ae', 'www.sivrce.ae'])

const OWN_EXACT = new Set([
  'sivrce.ge',
  'www.sivrce.ge',
  'sivrce.com',
  'www.sivrce.com',
  'sivrce.de',
  'www.sivrce.de',
  'sivrce.ae',
  'www.sivrce.ae',
  'localhost',
])

const OWN_SUFFIXES = ['.sivrce.ge', '.sivrce.de', '.sivrce.com', '.sivrce.ae'] as const

export function normalizeHostname(raw: string): string {
  return raw.split(',')[0]!.trim().split(':')[0]!.toLowerCase()
}

export function isDevHost(host: string): boolean {
  return host === 'localhost' || host === '127.0.0.1' || host.endsWith('.localhost')
}

export function isPreviewHost(host: string, vercelEnv?: string): boolean {
  if (vercelEnv === 'preview') return true
  if (host.endsWith('.vercel.app')) return true
  return false
}

export function isProdIndexable(vercelEnv?: string): boolean {
  if (vercelEnv && vercelEnv !== 'production') return false
  return true
}

export function hostKind(hostname: string, vercelEnv?: string): HostKind {
  const h = normalizeHostname(hostname)
  if (isDevHost(h)) return 'dev'
  if (isPreviewHost(h, vercelEnv)) return 'preview'
  if (h === 'admin.sivrce.ge' || h === 'admin.localhost') return 'admin'
  if (h === 'cdn.sivrce.ge' || h === 'images.sivrce.ge') return 'cdn'
  if (h === 'api.sivrce.ge' || h === 'api.localhost') return 'api'
  if (h === 'app.sivrce.ge' || h === 'analytics.sivrce.ge') return 'legacy-redirect'
  if (DE_HOSTS.has(h)) return 'de-cctld'
  if (AE_HOSTS.has(h)) return 'ae-cctld'
  if (COM_HOSTS.has(h)) return 'com'
  if (GE_HOSTS.has(h)) return 'ge'
  // Unknown prod-like host: treat as preview so we never bounce strangers to prod.
  return 'preview'
}

export function isOwnHost(hostname: string): boolean {
  const h = normalizeHostname(hostname)
  if (OWN_EXACT.has(h) || isDevHost(h)) return true
  if (h.endsWith('.vercel.app')) return true
  return OWN_SUFFIXES.some((s) => h.endsWith(s))
}

export function isWwwHost(host: string): boolean {
  return host.startsWith('www.')
}

export function apexOriginFor(kind: HostKind): string | null {
  switch (kind) {
    case 'ge':
      return GE_ORIGIN
    case 'com':
    case 'de-cctld':
    case 'ae-cctld':
      return COM_ORIGIN
    default:
      return null
  }
}

export function marketIdForKind(kind: HostKind, pathCountry: PathCountryId | null): MarketId {
  if (pathCountry) return pathCountry
  if (kind === 'com') return 'global'
  if (kind === 'de-cctld') return 'de'
  if (kind === 'ae-cctld') return 'ae'
  return 'ge'
}

export function canonicalOrigin(market: MarketId): string {
  return market === 'ge' ? GE_ORIGIN : COM_ORIGIN
}

/** Production .com (and defensive ccTLDs) vs Georgia. Dev/preview → ge for catalog default. */
export function publicOriginKind(kind: HostKind): 'ge' | 'com' {
  return kind === 'com' || kind === 'de-cctld' || kind === 'ae-cctld' ? 'com' : 'ge'
}

/**
 * Sitemap URL set for this host.
 * Prod splits so each origin only lists itself. Dev/preview keep both so local e2e still sees /de.
 */
export function sitemapScope(kind: HostKind): 'ge' | 'com' | 'all' {
  if (kind === 'dev' || kind === 'preview') return 'all'
  return publicOriginKind(kind)
}

/** Safe URL: origin is allowlisted, path must be a relative site path. */
export function safeRedirectUrl(origin: string, pathname: string, search = ''): URL | null {
  if (origin !== GE_ORIGIN && origin !== COM_ORIGIN) return null
  const path = sanitizePath(pathname)
  if (!path) return null
  const u = new URL(origin)
  u.pathname = path
  u.search = search.startsWith('?') ? search : search ? `?${search}` : ''
  return u
}

/**
 * Reject protocol-relative, backslash, encoded-slash, NULs.
 * Always returns a leading-slash path or null.
 */
export function sanitizePath(pathname: string): string | null {
  if (!pathname) return '/'
  let p = pathname
  try {
    p = decodeURIComponent(pathname)
  } catch {
    return null
  }
  if (!p.startsWith('/') || p.startsWith('//') || p.includes('\\') || p.includes('\0')) return null
  if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(p.slice(1))) return null
  if (p.includes('://')) return null
  // Collapse repeats; drop trailing slash except root (Next default).
  p = p.replace(/\/{2,}/g, '/')
  if (p.length > 1 && p.endsWith('/')) p = p.slice(0, -1)
  return p || '/'
}

export function lowercasePath(pathname: string): string {
  return pathname.replace(/[A-Z]/g, (c) => c.toLowerCase())
}

/* —— compat aliases used by existing checks —— */

export type { MarketId }

/** @deprecated use MARKETS + hostKind; kept for site-host.check + callers */
export interface SiteHost {
  market: 'ge' | 'de'
  apex: string
  defaultLang: 'ka' | 'en'
  defaultCitySlug: string
  homePath: string
}

export function siteHostFor(hostname: string): SiteHost {
  const kind = hostKind(hostname)
  if (kind === 'de-cctld') {
    return {
      market: 'de',
      apex: COM_ORIGIN,
      defaultLang: 'en',
      defaultCitySlug: 'berlin',
      homePath: '/de',
    }
  }
  return {
    market: 'ge',
    apex: GE_ORIGIN,
    defaultLang: 'ka',
    defaultCitySlug: 'tbilisi',
    homePath: '/',
  }
}

export function isDeHost(hostname: string): boolean {
  return DE_HOSTS.has(normalizeHostname(hostname))
}

export function isComHost(hostname: string): boolean {
  return COM_HOSTS.has(normalizeHostname(hostname))
}

export function isAeHost(hostname: string): boolean {
  return AE_HOSTS.has(normalizeHostname(hostname))
}

export const MARKET_HEADER = 'x-sivrce-market'

/**
 * Session-cookie domain for the host serving the request: sessions span each
 * registrable domain + its subdomains (sivrce.ge ↔ admin.sivrce.ge,
 * sivrce.com ↔ www.sivrce.com) but never across .ge ↔ .com — browsers can't
 * share a cookie across those anyway. Host-only for dev/preview/unknown hosts.
 */
export function sessionCookieDomain(hostname: string): string | undefined {
  const h = normalizeHostname(hostname)
  if (h === 'sivrce.ge' || h.endsWith('.sivrce.ge')) return '.sivrce.ge'
  if (h === 'sivrce.com' || h.endsWith('.sivrce.com')) return '.sivrce.com'
  return undefined
}
