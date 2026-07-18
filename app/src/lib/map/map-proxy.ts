/**
 * First-party map tile allowlist — browser only talks to /api/map/*, never OFM.
 * ponytail: obscurity ≠ auth; real listing data still SSR. Upgrade: signed tiles if scraped.
 */

const ROOTS = new Set(['styles', 'sprites', 'fonts', 'planet', 'natural_earth'])

/** Safe relative path under /api/map/[...path]. */
export function mapProxyPathOk(path: string): boolean {
  if (!path || path.includes('..') || path.startsWith('/') || path.includes('\\')) {
    return false
  }
  const root = path.split('/')[0]
  return Boolean(root && ROOTS.has(root))
}

export const OFM_ORIGIN = 'https://tiles.openfreemap.org'
export const MAP_PROXY_PREFIX = '/api/map'

/** Absolute origin for MapLibre workers (relative /api/map fails in Request). */
export function mapProxyOrigin(): string {
  if (typeof window !== 'undefined') return window.location.origin
  return ''
}

/** Rewrite OpenFreeMap absolute URLs → same-origin proxy (absolute when in browser). */
export function toMapProxyUrl(url: string): string {
  let path: string
  if (url.startsWith(`${OFM_ORIGIN}/`)) {
    path = `${MAP_PROXY_PREFIX}${url.slice(OFM_ORIGIN.length)}`
  } else if (url === OFM_ORIGIN) {
    path = MAP_PROXY_PREFIX
  } else if (url.startsWith(MAP_PROXY_PREFIX)) {
    path = url
  } else if (/^https?:\/\/[^/]+\/api\/map(\/|$)/.test(url)) {
    return url
  } else {
    return url
  }
  const origin = mapProxyOrigin()
  return origin ? `${origin}${path}` : path
}
