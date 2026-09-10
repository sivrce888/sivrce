/**
 * Pure host+path decision table for the edge proxy.
 *
 * Host disambiguation (lang `de` vs country /de):
 *   sivrce.ge/de  = German locale of the Georgia product
 *   sivrce.com/de = Germany market
 * Preview/dev never bounce to production.
 */

import { MARKETS, canonicalIntent, isPathCountry, type PathCountryId } from '@/lib/markets'
import {
  COM_ORIGIN,
  GE_ORIGIN,
  hostKind,
  isWwwHost,
  lowercasePath,
  sanitizePath,
  type HostKind,
} from '@/lib/site-host'
import { DEFAULT_LANG, PREFIXED_LANGS, stripLangPrefix } from '@/lib/i18n/core'
import type { MarketId } from '@/lib/markets'

export type HostDecision =
  | { type: 'pass'; market: MarketId }
  | { type: 'rewrite'; pathname: string; market: MarketId }
  | { type: 'redirect'; origin: 'same' | typeof COM_ORIGIN | typeof GE_ORIGIN; pathname: string }

const LOCALE_SET = new Set<string>([DEFAULT_LANG, ...PREFIXED_LANGS])

function isDeCity(slug: string): boolean {
  return MARKETS.de.citySlugs.includes(slug)
}
function isAeCity(slug: string): boolean {
  return MARKETS.ae.citySlugs.includes(slug)
}

export function mapCctldPath(cc: PathCountryId, pathname: string): string {
  const clean = sanitizePath(pathname) ?? '/'
  const bare = stripLangPrefix(clean)
  const prefix = MARKETS[cc].pathPrefix
  if (bare === '/') return prefix
  const segs = bare.split('/').filter(Boolean)
  const first = segs[0] ?? ''
  if (first === cc) {
    const rest = segs.slice(1)
    if (rest[0] && isPathCountry(rest[0])) return prefix
    return rest.length ? `${prefix}/${rest.join('/')}` : prefix
  }
  if ((cc === 'de' ? isDeCity(first) : isAeCity(first))) return `${prefix}/${segs.join('/')}`
  const intent = canonicalIntent(first)
  if (intent) {
    const city = segs[1] && (cc === 'de' ? isDeCity(segs[1]) : isAeCity(segs[1]))
      ? segs[1]
      : MARKETS[cc].defaultCitySlug
    return `${prefix}/${city}/${intent}`
  }
  return prefix
}

function afterLocale(pathname: string): { lang: string | null; rest: string } {
  const segs = pathname.split('/').filter(Boolean)
  if (segs[0] && LOCALE_SET.has(segs[0])) {
    return { lang: segs[0], rest: `/${segs.slice(1).join('/')}` || '/' }
  }
  return { lang: null, rest: pathname }
}

export function decideHost(input: { host: string; pathname: string; vercelEnv?: string }): HostDecision {
  const kind: HostKind = hostKind(input.host, input.vercelEnv)
  const local = kind === 'dev' || kind === 'preview'
  const rawPath = sanitizePath(input.pathname) ?? '/'
  const path = lowercasePath(rawPath)

  if (path !== rawPath) {
    return { type: 'redirect', origin: 'same', pathname: path }
  }

  if (kind === 'legacy-redirect') {
    return { type: 'redirect', origin: GE_ORIGIN, pathname: path }
  }

  if (!local && isWwwHost(input.host)) {
    if (kind === 'ge') return { type: 'redirect', origin: GE_ORIGIN, pathname: path }
    if (kind === 'com') return { type: 'redirect', origin: COM_ORIGIN, pathname: path }
  }

  if (!local && kind === 'de-cctld') {
    return { type: 'redirect', origin: COM_ORIGIN, pathname: mapCctldPath('de', path) }
  }
  if (!local && kind === 'ae-cctld') {
    return { type: 'redirect', origin: COM_ORIGIN, pathname: mapCctldPath('ae', path) }
  }

  const { lang, rest } = afterLocale(path)
  const restSegs = rest.split('/').filter(Boolean)
  const restFirst = restSegs[0] ?? ''

  // /en/de/… → canonical country URL (en is the default country language).
  if (lang === 'en' && isPathCountry(restFirst)) {
    return { type: 'redirect', origin: 'same', pathname: rest }
  }

  // Production .ge: keep /de as German locale. Move DE/AE city leftovers to .com.
  if (!local && kind === 'ge') {
    if (isDeCity(restFirst)) {
      const tail = restSegs.join('/')
      return { type: 'redirect', origin: COM_ORIGIN, pathname: `/de/${tail}` }
    }
    if (isAeCity(restFirst)) {
      const tail = restSegs.join('/')
      return { type: 'redirect', origin: COM_ORIGIN, pathname: `/ae/${tail}` }
    }
    if (restFirst === 'ae') {
      return { type: 'redirect', origin: COM_ORIGIN, pathname: rest }
    }
    return { type: 'pass', market: 'ge' }
  }

  // Production .com: global hub + country paths. Everything else → .ge.
  if (!local && kind === 'com') {
    if (path === '/' || path === '/en') {
      return { type: 'rewrite', pathname: '/en', market: 'global' }
    }
    if (isPathCountry(path.split('/').filter(Boolean)[0] ?? '')) {
      const cc = path.split('/').filter(Boolean)[0] as PathCountryId
      return { type: 'rewrite', pathname: `/en${path}`, market: cc }
    }
    if (lang === 'ar' && restFirst === 'ae') {
      return { type: 'pass', market: 'ae' }
    }
    return { type: 'redirect', origin: GE_ORIGIN, pathname: path }
  }

  // Dev/preview: country pages live at /en/de and /ae (ae is not a lang).
  if (restFirst === 'ae' && !lang) {
    return { type: 'rewrite', pathname: `/en${path}`, market: 'ae' }
  }
  if (lang === 'ar' && restFirst === 'ae') {
    return { type: 'pass', market: 'ae' }
  }

  return { type: 'pass', market: 'ge' }
}
