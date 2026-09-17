/**
 * Pure host+path decision table for the edge proxy.
 *
 * Host disambiguation (lang `de` vs country /de):
 *   sivrce.ge/de  = German locale of the Georgia product
 *   sivrce.com/de = Germany market
 * Preview/dev never bounce to production.
 */

import {
  COUNTRY_ALIAS,
  MARKETS,
  canonicalIntent,
  findCountryByCity,
  isComPageSeg,
  isCountryAlias,
  isPathCountry,
  type PathCountryId,
} from '@/lib/markets'
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

/** Segments mounted at the root (never under /[lang]) — /ge/<seg>/… must
 * rewrite to /<seg>/… instead of the locale path or it 404s. */
const ROOT_MOUNTED = new Set(['auth', 'api', 'llms.txt', 'llms-full.txt', '.well-known'])

function isMarketCity(cc: PathCountryId, slug: string): boolean {
  return MARKETS[cc].citySlugs.includes(slug)
}

function swapPathSeg(pathname: string, from: string, to: string): string {
  const segs = pathname.split('/').filter(Boolean)
  const i = segs.findIndex((s) => s === from)
  if (i < 0) return pathname
  segs[i] = to
  return `/${segs.join('/')}`
}

export function mapCctldPath(cc: PathCountryId, pathname: string): string {
  const clean = sanitizePath(pathname) ?? '/'
  const bare = stripLangPrefix(clean)
  // German visitors land on native German pages: /de/de/… (lang `de` + market
  // `de`). Deep subpaths are preserved — the route decides page vs 404, an
  // honest answer beats silently collapsing every deep link to the market hub.
  if (cc === 'de') {
    return bare === '/' ? '/de/de' : `/de/de${bare}`
  }
  const prefix = MARKETS[cc].pathPrefix
  if (bare === '/') return prefix
  const segs = bare.split('/').filter(Boolean)
  const first = segs[0] ?? ''
  if (first === cc) {
    const rest = segs.slice(1)
    if (rest[0] && isPathCountry(rest[0])) return prefix
    return rest.length ? `${prefix}/${rest.join('/')}` : prefix
  }
  if (isMarketCity(cc, first)) return `${prefix}/${segs.join('/')}`
  const intent = canonicalIntent(first)
  if (intent) {
    const city = segs[1] && isMarketCity(cc, segs[1])
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

  // sivrce.ge is Georgia-only. Every country-market URL form — /en/de,
  // /de/de/berlin, /ar/ae — belongs to sivrce.com; serving them here put the
  // same page on two origins and split its ranking. Only the forms a country
  // market actually publishes redirect: /ru/de stays the Georgian product's
  // Russian locale.
  if (!local && kind === 'ge' && isPathCountry(restFirst)) {
    const cc = restFirst as PathCountryId
    if (lang === 'en' || lang === cc || (lang === 'ar' && cc === 'ae')) {
      return { type: 'redirect', origin: COM_ORIGIN, pathname: lang === 'en' ? rest : path }
    }
  }

  // /en/de/… is the internal rewrite target. On sivrce.com the public URL
  // is /de/… (308). Locally keep /en/de so it does not collide with German /de.
  if (lang === 'en' && isPathCountry(restFirst)) {
    if (!local && kind === 'com') {
      return { type: 'redirect', origin: 'same', pathname: rest }
    }
    return { type: 'pass', market: restFirst as PathCountryId }
  }

  // Locale == country code (/de/de/berlin, /tr/tr/…): the only non-en locale
  // a country market publishes (German Germany, Turkish Türkiye). Keep the
  // locale — path is already the internal [lang]/<cc>/… form on both hosts.
  if (lang && lang === restFirst && isPathCountry(restFirst)) {
    return { type: 'pass', market: restFirst as PathCountryId }
  }

  // Production .ge: locale prefixes (incl. /de, /tr, /uk) stay. Bare country
  // paths and leftover country-city slugs move to .com. /ge and /georgia
  // (the .com mirror forms) fold to the unprefixed canonical URL.
  if (!local && kind === 'ge') {
    if (restFirst === 'ge' || restFirst === 'georgia') {
      const tail = restSegs.slice(1)
      return { type: 'redirect', origin: 'same', pathname: tail.length ? `/${tail.join('/')}` : '/' }
    }
    const cityCountry = findCountryByCity(restFirst)
    if (cityCountry) {
      const tail = restSegs.join('/')
      return { type: 'redirect', origin: COM_ORIGIN, pathname: `${MARKETS[cityCountry].pathPrefix}/${tail}` }
    }
    if (!lang && isPathCountry(restFirst) && !LOCALE_SET.has(restFirst)) {
      return { type: 'redirect', origin: COM_ORIGIN, pathname: rest }
    }
    // The all-countries directory is the worldwide index: it already
    // canonicalises to sivrce.com, so serving it here only spends .ge crawl
    // budget on a page that is not Georgia. Other COM_PAGE_SEGS (about, blog,
    // faq…) are genuine Georgian pages and stay.
    if (restFirst === 'countries') {
      return { type: 'redirect', origin: COM_ORIGIN, pathname: '/countries' }
    }
    return { type: 'pass', market: 'ge' }
  }

  // Production .com: global hub + country paths + company pages + map.
  // Georgian catalog lives at /ge (full mirror of sivrce.ge). Each surface
  // self-canonicalizes; hreflang pairs them — never a blind cross-domain canonical.
  if (!local && kind === 'com') {
    if (path === '/' || path === '/en') {
      return { type: 'rewrite', pathname: '/en', market: 'global' }
    }
    const segs = path.split('/').filter(Boolean)
    const first = segs[0] ?? ''
    const aliasKey = isCountryAlias(first) ? first : lang && isCountryAlias(restFirst) ? restFirst : null
    if (aliasKey) {
      let dest = swapPathSeg(path, aliasKey, COUNTRY_ALIAS[aliasKey])
      if (dest.startsWith('/en/')) {
        const after = dest.slice(4).split('/')[0] ?? ''
        if (isPathCountry(after)) dest = dest.slice(3)
      }
      return { type: 'redirect', origin: 'same', pathname: dest }
    }
    // /ge/<locale?>/path → app path, market ge. /ge/ka/… folds to /ge/….
    if (first === 'ge') {
      const tail = segs.slice(1)
      const lo = tail[0] && LOCALE_SET.has(tail[0]) ? tail[0] : null
      const body = lo ? tail.slice(1) : tail
      if (body[0] && ROOT_MOUNTED.has(body[0])) {
        return { type: 'rewrite', pathname: `/${body.join('/')}`, market: 'ge' }
      }
      if (lo === DEFAULT_LANG) {
        return { type: 'redirect', origin: 'same', pathname: body.length ? `/ge/${body.join('/')}` : '/ge' }
      }
      // 1:1 mirror by construction: /ge/<p> must do exactly what sivrce.ge
      // does with /<p>. Recurse the decision table on the .ge host; redirects
      // become same-origin — into .com-native space (country paths, cities,
      // /countries) as-is, back under /ge when they target Georgia paths
      // (the /ge fold, lowercase). PASS on .ge = serve here under /ge.
      const inner = decideHost({ host: 'sivrce.ge', pathname: `/${tail.join('/')}`, vercelEnv: input.vercelEnv })
      if (inner.type === 'redirect') {
        if (inner.origin === COM_ORIGIN) {
          return { type: 'redirect', origin: 'same', pathname: inner.pathname }
        }
        return {
          type: 'redirect',
          origin: 'same',
          pathname: inner.pathname === '/' ? '/ge' : `/ge${inner.pathname}`,
        }
      }
      const target = lo ?? DEFAULT_LANG
      return { type: 'rewrite', pathname: `/${target}${body.length ? `/${body.join('/')}` : ''}`, market: 'ge' }
    }
    // /en/ge/x (internal-form leak) → public mirror form /ge/en/x.
    if (lang && restFirst === 'ge') {
      const tail = restSegs.slice(1)
      const prefix = lang === DEFAULT_LANG ? '/ge' : `/ge/${lang}`
      return { type: 'redirect', origin: 'same', pathname: tail.length ? `${prefix}/${tail.join('/')}` : prefix }
    }
    const mapSeg = first === 'en' ? segs[1] : first
    if (mapSeg === 'map') {
      const mapped = first === 'en' ? path : `/en${path}`
      return { type: 'rewrite', pathname: mapped, market: 'global' }
    }
    // Arabic UAE (/ar/ae/…) before the country test: `ar` is also Argentina's
    // path, so /ar/ae used to serve Argentina — on a URL llms.txt advertises.
    // Argentina's own paths (/ar, /ar/<city>) never start with a country code.
    if (lang === 'ar' && restFirst === 'ae') {
      return { type: 'pass', market: 'ae' }
    }
    if (isPathCountry(first)) {
      return { type: 'rewrite', pathname: `/en${path}`, market: first }
    }
    const pageSeg = lang ? restFirst : first
    if (isComPageSeg(pageSeg)) {
      return { type: 'rewrite', pathname: lang ? path : `/en${path}`, market: 'global' }
    }
    // Bare Georgian catalog path: keep the visitor on .com under /ge (308,
    // canonical still consolidates to sivrce.ge — no cross-domain hop).
    const restPath = rest === '/' ? '' : rest
    const mirror = lang && lang !== DEFAULT_LANG ? `/ge/${lang}${restPath}` : `/ge${restPath}`
    return { type: 'redirect', origin: 'same', pathname: mirror }
  }

  // Dev/preview: /uae → /ae, /uk → /gb (same as prod, keep /en prefix locally).
  const localAlias = isCountryAlias(path.split('/').filter(Boolean)[0] ?? '')
    ? (path.split('/').filter(Boolean)[0] as 'uae' | 'uk')
    : lang && isCountryAlias(restFirst)
      ? restFirst
      : null
  if (localAlias) {
    return { type: 'redirect', origin: 'same', pathname: swapPathSeg(path, localAlias, COUNTRY_ALIAS[localAlias]) }
  }

  // Dev/preview: /ge mirror works like prod — strip to the app path (ka default).
  if (!lang && restFirst === 'ge') {
    const tail = restSegs.slice(1)
    const lo = tail[0] && LOCALE_SET.has(tail[0]) ? tail[0] : null
    const body = lo ? tail.slice(1) : tail
    if (body[0] && ROOT_MOUNTED.has(body[0])) {
      return { type: 'rewrite', pathname: `/${body.join('/')}`, market: 'ge' }
    }
    const target = lo ?? DEFAULT_LANG
    return { type: 'rewrite', pathname: `/${target}${body.length ? `/${body.join('/')}` : ''}`, market: 'ge' }
  }

  // Dev/preview: country pages live at /en/<cc>, plus bare /<cc> for codes
  // that are not locale prefixes (ae, fr, es, it, gb, us, ca — not de/tr).
  if (!lang && isPathCountry(restFirst) && !LOCALE_SET.has(restFirst)) {
    return { type: 'rewrite', pathname: `/en${path}`, market: restFirst }
  }
  if (lang === 'ar' && restFirst === 'ae') {
    return { type: 'pass', market: 'ae' }
  }

  return { type: 'pass', market: 'ge' }
}
