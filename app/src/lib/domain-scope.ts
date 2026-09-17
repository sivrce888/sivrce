/**
 * Domain constitution — one platform, two surfaces.
 *
 * sivrce.ge  = Georgia-only inventory (server-enforced)
 * sivrce.com = global; country from URL, never IP
 *
 * ponytail: Host allowlist is the trust boundary. Client `country=` / spoofed
 * `x-sivrce-market` cannot widen a .ge query. Ceiling: new ccTLDs need a
 * hostKind arm; upgrade: MarketContext module if a third consumer surface ships.
 */

import { LANGS, DEFAULT_LANG, type Lang } from '@/lib/i18n/core'
import { COM_ORIGIN, GE_ORIGIN, MARKET_COUNTRY_ISOS } from '@/lib/markets'
import { hostKind, publicOriginKind, type HostKind } from '@/lib/site-host'

export type DomainId = 'ge' | 'com'

export function hostFromRequest(req: { headers: Headers }): string {
  const raw = req.headers.get('x-forwarded-host') || req.headers.get('host') || ''
  return raw.split(',')[0]!.trim().split(':')[0]!.toLowerCase()
}

export function domainFromHost(host: string, vercelEnv?: string): DomainId {
  return publicOriginKind(hostKind(host, vercelEnv))
}

export function requestKind(host: string, vercelEnv?: string): HostKind {
  return hostKind(host, vercelEnv)
}

/**
 * Inventory ISO the query may see.
 * Production sivrce.ge → always GE (ignore client country=DE/ALL).
 * Dev/preview honor the requested ISO so local global search still works.
 * sivrce.com → requested launched ISO, else worldwide (undefined).
 */
export function enforcedCountry(
  kind: HostKind,
  requested?: string | null,
): string | undefined {
  if (kind === 'ge') return 'GE'
  const iso = requested?.trim().toUpperCase()
  if (iso && iso !== 'ALL' && MARKET_COUNTRY_ISOS.has(iso)) return iso
  return undefined
}

/** Public path prefix for Georgia catalog on sivrce.com (`/ge/sale`). Empty on .ge. */
export function surfacePathPrefix(domain: DomainId, market: string): string {
  return domain === 'com' && market === 'ge' ? '/ge' : ''
}

export function surfaceOrigin(domain: DomainId): string {
  return domain === 'com' ? COM_ORIGIN : GE_ORIGIN
}

function langPath(path: string, lang: Lang): string {
  return lang === DEFAULT_LANG ? path : `/${lang}${path === '/' ? '' : path}`
}

function geAbs(path: string): string {
  return `${GE_ORIGIN}${path === '/' ? '' : path}`
}

function comGeAbs(path: string): string {
  if (path === '/') return `${COM_ORIGIN}/ge`
  return `${COM_ORIGIN}/ge${path}`
}

/** Dual-surface hreflang for a Georgian listing. Each URL self-canonicalizes. */
export function georgiaListingAlternates(
  path: string,
  lang: Lang,
  domain: DomainId,
): { canonical: string; languages: Record<string, string> } {
  const abs = (d: DomainId, l: Lang) => {
    const p = langPath(path, l)
    return d === 'com' ? comGeAbs(p) : `${GE_ORIGIN}${p}`
  }
  const languages: Record<string, string> = {}
  for (const l of LANGS) languages[l] = abs(domain, l)
  languages['ka-GE'] = geAbs(path)
  languages['en-001'] = comGeAbs(langPath(path, 'en'))
  languages['x-default'] = domain === 'com' ? comGeAbs(langPath(path, DEFAULT_LANG)) : geAbs(path)
  return { canonical: abs(domain, lang), languages }
}
