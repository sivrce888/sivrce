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

/**
 * Rewrite style/planet JSON for same-origin tiles without breaking JSON.
 * Prior bug: regex-stripping OSM/OMT HTML attribution mangled quotes → invalid TileJSON.
 * MAP_JSON_CACHE_VER busts sticky CDN/browser caches when scrub logic changes.
 */
export const MAP_JSON_CACHE_VER = '3'

export function scrubMapJson(text: string, origin: string): string {
  const proxied = text.split(OFM_ORIGIN).join(`${origin}${MAP_PROXY_PREFIX}`)
  try {
    const data: unknown = JSON.parse(proxied)
    scrubVendorFields(data)
    bustPlanetUrls(data)
    return JSON.stringify(data)
  } catch {
    // Non-JSON (shouldn't happen on this path) — return host rewrite only.
    return proxied
  }
}

function bustPlanetUrls(node: unknown): void {
  if (!node || typeof node !== 'object') return
  if (Array.isArray(node)) {
    for (const item of node) bustPlanetUrls(item)
    return
  }
  const obj = node as Record<string, unknown>
  if (typeof obj.url === 'string' && /\/api\/map\/planet\/?$/.test(obj.url.split('?')[0]!)) {
    obj.url = `${obj.url.split('?')[0]}?v=${MAP_JSON_CACHE_VER}`
  }
  for (const v of Object.values(obj)) bustPlanetUrls(v)
}

function scrubVendorFields(node: unknown): void {
  if (!node || typeof node !== 'object') return
  if (Array.isArray(node)) {
    for (const item of node) scrubVendorFields(item)
    return
  }
  const obj = node as Record<string, unknown>
  if (typeof obj.attribution === 'string') obj.attribution = ''
  if (
    typeof obj.name === 'string' &&
    /openfreemap|openmaptiles|maplibre|openstreetmap/i.test(obj.name)
  ) {
    obj.name = ''
  }
  if (typeof obj.description === 'string' && /openfreemap|openmaptiles/i.test(obj.description)) {
    obj.description = ''
  }
  for (const v of Object.values(obj)) scrubVendorFields(v)
}
