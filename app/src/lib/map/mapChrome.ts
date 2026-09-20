/**
 * Map chrome — quiet ⓘ UI; legal OSM/OMT credit in DOM (expand to read).
 * Compact attribution is the MapLibre/Google-accepted ODbL pattern.
 */

import type {
  DataDrivenPropertyValueSpecification,
  FillExtrusionLayerSpecification,
  Map as MlMap,
  PropertyValueSpecification,
  StyleSpecification,
} from 'maplibre-gl'
import {
  MAP_PROXY_PREFIX,
  OFM_ORIGIN,
  MAP_JSON_CACHE_VER,
  toMapProxyUrl,
} from '@/lib/map/map-proxy'
import { withNature } from '@/lib/map/nature'

/** Brand label (shown with legal credit when ⓘ is opened). */
export const MAP_CREDIT_PLAIN = 'Sivrce Maps'

/** Required basemap credit — present in DOM, hidden until ⓘ expand. */
export const MAP_CREDIT_LEGAL = '© OpenMapTiles · © OpenStreetMap'

function creditLink(href: string, text: string): string {
  return `<a href="${href}" target="_blank" rel="noopener noreferrer">${text}</a>`
}

/**
 * Basemap credit MapLibre renders itself (it sanitizes, keeps anchors, and
 * lists only sources it is actually drawing). Every other credit — Esri
 * satellite, Berlin dl-de geodata, Overpass transit — rides on its own source,
 * so a Berlin map never claims Georgian parcels and vice versa.
 */
export const MAP_CREDIT_HTML = [
  MAP_CREDIT_PLAIN,
  creditLink('https://www.openmaptiles.org/', '© OpenMapTiles'),
  creditLink('https://www.openstreetmap.org/copyright', '© OpenStreetMap'),
].join(' · ')

/** NAPR footprints/parcels — only on maps that draw Georgian cadastre geometry. */
export const MAP_CREDIT_NAPR = creditLink('https://napr.gov.ge/', 'NAPR')

const PLANET_PATH = '/planet'

/** OSM city massing — Liberty ships this; dark/positron/satellite do not. */
export const OSM_BUILDING_3D_ID = 'building-3d'

/** Zoom the basemap massing starts fading in; below it the flat `building` fill carries. */
export const BUILDING_3D_MIN_ZOOM = 13
/** Fully opaque by here — the flat fill hands over without a visible pop. */
export const BUILDING_3D_FULL_ZOOM = 14.2

/**
 * Height-graded tone. Apple and Google both let a skyline read from above: a
 * tall tower catches more sky than a courtyard block, so the tone lifts with
 * `render_height`. Two stops only — more is noise at map scale.
 *
 * ponytail: data-driven colour costs one packed attribute per building vertex
 * (~4 B), so lite devices take the flat `lo` tone. Upgrade path if that ever
 * matters on mid devices too: drop the ramp and lean on the key light alone.
 */
export function buildingTone(
  lo: string,
  hi: string,
  ramp = true,
): DataDrivenPropertyValueSpecification<string> {
  if (!ramp) return lo
  return [
    'interpolate',
    ['linear'],
    ['to-number', ['coalesce', ['get', 'render_height'], 0]],
    6,
    lo,
    90,
    hi,
  ]
}

/** Width of the fade, so a later start (hybrid) keeps the same ramp, ascending. */
const BUILDING_FADE_ZOOMS = BUILDING_3D_FULL_ZOOM - BUILDING_3D_MIN_ZOOM

/** Fade the massing in across the handover zooms instead of popping it on. */
export function buildingFade(
  peak: number,
  from = BUILDING_3D_MIN_ZOOM,
): PropertyValueSpecification<number> {
  return ['interpolate', ['linear'], ['zoom'], from, 0, from + BUILDING_FADE_ZOOMS, peak]
}

export function building3dLayer(source: string): FillExtrusionLayerSpecification {
  return {
    id: OSM_BUILDING_3D_ID,
    type: 'fill-extrusion',
    source,
    'source-layer': 'building',
    minzoom: BUILDING_3D_MIN_ZOOM,
    filter: ['!=', ['get', 'hide_3d'], true],
    paint: {
      'fill-extrusion-base': ['coalesce', ['get', 'render_min_height'], 0],
      // ponytail: untagged OSM footprints still read as 10 m boxes; real height wins.
      'fill-extrusion-height': [
        'case',
        ['>', ['to-number', ['get', 'render_height']], 0],
        ['get', 'render_height'],
        10,
      ],
      // Theme paints (applyBrandPaints) restate colour + opacity per basemap.
      'fill-extrusion-color': buildingTone('#E3E1DC', '#F1EFEA'),
      'fill-extrusion-opacity': buildingFade(0.88),
      'fill-extrusion-vertical-gradient': true,
    },
  }
}

function layerSourceLayer(layer: StyleSpecification['layers'][number]): string {
  return layer && typeof layer === 'object' && 'source-layer' in layer
    ? String((layer as { 'source-layer'?: string })['source-layer'] ?? '')
    : ''
}

/** Dark/positron are 2D-only from OFM — inject city extrusions after `building`. */
export function withBuilding3d(style: StyleSpecification): StyleSpecification {
  const layers = style.layers ?? []
  if (
    layers.some(
      (l) => l?.type === 'fill-extrusion' && layerSourceLayer(l) === 'building',
    )
  ) {
    return style
  }
  const source = style.sources?.sivrce
    ? 'sivrce'
    : style.sources?.openmaptiles
      ? 'openmaptiles'
      : null
  if (!source) return style
  const layer = building3dLayer(source)
  const idx = layers.findIndex((l) => l?.id === 'building')
  const next = [...layers]
  if (idx >= 0) next.splice(idx + 1, 0, layer)
  else next.push(layer)
  return { ...style, layers: next }
}

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

/**
 * Parsed-style cache — theme toggle back is instant (no fetch/rewrite).
 * ponytail: structuredClone on hit; MapLibre must not mutate the cached spec.
 */
const styleCache = new Map<string, StyleSpecification>()

/** OFM US-only shield layers ship null filters (console spam) — dead in Georgia. */
const DEAD_SHIELD_LAYERS = new Set([
  'highway-shield-non-us',
  'highway-shield-us-interstate',
  'road_shield_us',
])

/** Fetch style; proxy URLs; legal credit lives on the attribution control (not sources). */
export async function loadCleanStyle(styleUrl: string): Promise<StyleSpecification> {
  const cached = styleCache.get(styleUrl)
  if (cached) return structuredClone(cached)

  const usesOfm =
    styleUrl.includes('openfreemap') || styleUrl.startsWith(MAP_PROXY_PREFIX)

  // ponytail: 5s browser / 20s Node — OFM hang used to leave search map white forever
  const fetchMs = typeof window === 'undefined' ? 20_000 : 5_000
  const styleRaw = await fetch(assetFetchUrl(styleUrl), {
    cache: 'no-store',
    signal: AbortSignal.timeout(fetchMs),
  }).then((r) => {
    if (!r.ok) throw new Error(`map style ${r.status}`)
    return r.json() as Promise<StyleSpecification>
  })

  let planet: PlanetJson | null = null
  if (usesOfm) {
    const planetRes = await fetch(
      assetFetchUrl(`${MAP_PROXY_PREFIX}${PLANET_PATH}?v=${MAP_JSON_CACHE_VER}`),
      { cache: 'no-store', signal: AbortSignal.timeout(fetchMs) },
    )
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

  const layers = (style.layers ?? [])
    .filter((layer) => !layer || typeof layer !== 'object' || !DEAD_SHIELD_LAYERS.has(layer.id))
    .map((layer) => {
      if (!layer || typeof layer !== 'object') return layer
      const src = 'source' in layer ? String((layer as { source?: string }).source ?? '') : ''
      if (src && renamed[src]) {
        return { ...layer, source: renamed[src] }
      }
      return layer
    })

  const out = withNature(withBuilding3d({ ...style, sources: nextSources, layers }))
  styleCache.set(styleUrl, out)
  return structuredClone(out)
}

/**
 * Shared Map constructor chrome — compact ⓘ, linked legal credit on expand.
 * `napr` adds the Georgian cadastre credit; pass it only where NAPR-derived
 * geometry is drawn (cadastre map, Georgia market).
 */
export function mapChromeOptions({ napr = false }: { napr?: boolean } = {}) {
  return {
    maplibreLogo: false as const,
    attributionControl: {
      compact: true,
      customAttribution: napr ? `${MAP_CREDIT_HTML} · ${MAP_CREDIT_NAPR}` : MAP_CREDIT_HTML,
    },
  }
}

/**
 * Keep attribution compact (only ⓘ visible) and labelled. The credit list
 * itself is MapLibre's: it re-renders on every style/source change and only
 * lists sources it is drawing, so rewriting that DOM here would drop the
 * per-source credits (Esri, dl-de Berlin, ODbL transit) the licence requires.
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
}
