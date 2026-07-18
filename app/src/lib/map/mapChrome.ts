/**
 * Map chrome — quiet ⓘ UI; legal OSM/OMT credit in DOM (expand to read).
 * Compact attribution is the MapLibre/Google-accepted ODbL pattern.
 */

import type { Map as MlMap, StyleSpecification } from 'maplibre-gl'
import {
  MAP_PROXY_PREFIX,
  OFM_ORIGIN,
  toMapProxyUrl,
} from '@/lib/map/map-proxy'

/** Brand label (shown with legal credit when ⓘ is opened). */
export const MAP_CREDIT_PLAIN = 'Sivrce Maps'

/** Required basemap credit — present in DOM, hidden until ⓘ expand. */
export const MAP_CREDIT_LEGAL = '© OpenMapTiles · © OpenStreetMap'

const PLANET_PATH = '/planet'

function rewriteDeep(value: unknown): unknown {
  if (typeof value === 'string') return toMapProxyUrl(value)
  if (Array.isArray(value)) return value.map(rewriteDeep)
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = rewriteDeep(v)
    }
    return out
  }
  return value
}

/** Resolve style/planet fetch URL: browser → proxy; Node self-check → OFM direct. */
function assetFetchUrl(pathOrUrl: string): string {
  if (pathOrUrl.startsWith('http')) return pathOrUrl
  if (typeof window === 'undefined') {
    if (pathOrUrl.startsWith(MAP_PROXY_PREFIX)) {
      return `${OFM_ORIGIN}${pathOrUrl.slice(MAP_PROXY_PREFIX.length)}`
    }
    return pathOrUrl.startsWith('/') ? `${OFM_ORIGIN}${pathOrUrl}` : pathOrUrl
  }
  return pathOrUrl.startsWith('/') ? pathOrUrl : `${MAP_PROXY_PREFIX}/${pathOrUrl}`
}

type PlanetJson = {
  tiles?: string[]
  minzoom?: number
  maxzoom?: number
  bounds?: [number, number, number, number]
}

function fillLegalAttribution(inner: Element) {
  while (inner.firstChild) inner.removeChild(inner.firstChild)

  const brand = document.createElement('span')
  brand.textContent = MAP_CREDIT_PLAIN
  const sep1 = document.createTextNode(' · ')

  const omt = document.createElement('a')
  omt.href = 'https://www.openmaptiles.org/'
  omt.target = '_blank'
  omt.rel = 'noopener noreferrer'
  omt.textContent = '© OpenMapTiles'

  const sep2 = document.createTextNode(' · ')

  const osm = document.createElement('a')
  osm.href = 'https://www.openstreetmap.org/copyright'
  osm.target = '_blank'
  osm.rel = 'noopener noreferrer'
  osm.textContent = '© OpenStreetMap'

  inner.append(brand, sep1, omt, sep2, osm)
}

/** Fetch style; proxy URLs; legal credit lives on the attribution control (not sources). */
export async function loadCleanStyle(styleUrl: string): Promise<StyleSpecification> {
  const usesOfm =
    styleUrl.includes('openfreemap') || styleUrl.startsWith(MAP_PROXY_PREFIX)

  const styleRaw = await fetch(assetFetchUrl(styleUrl)).then((r) => {
    if (!r.ok) throw new Error(`map style ${r.status}`)
    return r.json() as Promise<StyleSpecification>
  })

  let planet: PlanetJson | null = null
  if (usesOfm) {
    const planetRes = await fetch(assetFetchUrl(`${MAP_PROXY_PREFIX}${PLANET_PATH}`))
    if (!planetRes.ok) throw new Error(`map tiles ${planetRes.status}`)
    planet = (await planetRes.json()) as PlanetJson
  }

  const style = rewriteDeep(styleRaw) as StyleSpecification
  const nextSources: StyleSpecification['sources'] = {}
  const renamed: Record<string, string> = {}

  for (const [id, raw] of Object.entries(style.sources ?? {})) {
    if (!raw || typeof raw !== 'object') continue
    const src = { ...raw } as Record<string, unknown>

    const isOmt =
      src.type === 'vector' &&
      (id === 'openmaptiles' ||
        String(src.url ?? '').includes('/planet') ||
        (Array.isArray(src.tiles) &&
          src.tiles.some((t) => String(t).includes('/planet'))))

    if (isOmt && planet) {
      const tiles = (planet.tiles ?? []).map(toMapProxyUrl)
      if (tiles.length) {
        delete src.url
        src.tiles = tiles
        if (planet.minzoom != null) src.minzoom = planet.minzoom
        if (planet.maxzoom != null) src.maxzoom = planet.maxzoom
        if (planet.bounds) src.bounds = planet.bounds
      }
    }

    // Credit is on the control (one place) — clear noisy per-source strings.
    if ('attribution' in src) src.attribution = ''

    const outId = id === 'openmaptiles' ? 'sivrce' : id
    if (outId !== id) renamed[id] = outId
    nextSources[outId] = src as StyleSpecification['sources'][string]
  }

  const layers = (style.layers ?? []).map((layer) => {
    if (!layer || typeof layer !== 'object') return layer
    const src = 'source' in layer ? String((layer as { source?: string }).source ?? '') : ''
    if (src && renamed[src]) {
      return { ...layer, source: renamed[src] }
    }
    return layer
  })

  return { ...style, sources: nextSources, layers }
}

/** Shared Map constructor chrome — compact ⓘ, legal text on expand. */
export function mapChromeOptions() {
  return {
    maplibreLogo: false as const,
    attributionControl: {
      compact: true,
      // Seed string; tightenAttribution replaces with linked legal DOM.
      customAttribution: `${MAP_CREDIT_PLAIN} · ${MAP_CREDIT_LEGAL}`,
    },
  }
}

/**
 * Keep attribution compact (only ⓘ visible). Legal links stay in the DOM
 * so expanding ⓘ satisfies OpenMapTiles + OSM ODbL.
 */
export function tightenAttribution(map: MlMap) {
  const el = map.getContainer().querySelector('.maplibregl-ctrl-attrib')
  if (!el) return
  el.classList.add('maplibregl-compact')
  el.classList.remove('maplibregl-compact-show')
  el.setAttribute('title', MAP_CREDIT_LEGAL)

  const btn = el.querySelector('button.maplibregl-ctrl-attrib-button')
  if (btn) {
    btn.setAttribute('aria-label', `Map data: ${MAP_CREDIT_LEGAL}`)
  }

  const inner = el.querySelector('.maplibregl-ctrl-attrib-inner')
  if (!inner) return

  const text = inner.textContent ?? ''
  const hasLegal =
    /OpenMapTiles/i.test(text) &&
    /OpenStreetMap/i.test(text) &&
    inner.querySelector('a[href*="openstreetmap.org"]') &&
    inner.querySelector('a[href*="openmaptiles.org"]')
  if (!hasLegal) fillLegalAttribution(inner)
}
