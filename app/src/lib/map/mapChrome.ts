/**
 * MapLibre chrome — no MapLibre/OpenFreeMap logos, compact legal credit only.
 * OFM docs: OpenFreeMap name is optional; OpenMapTiles + OSM are required.
 */

import type { Map as MlMap, StyleSpecification } from 'maplibre-gl'

/** Compact credit — no OpenFreeMap / MapLibre names. */
export const MAP_CREDIT_PLAIN = '© OpenMapTiles · © OpenStreetMap'

const PLANET_TILEJSON = 'https://tiles.openfreemap.org/planet'

type TileJson = {
  tiles?: string[]
  minzoom?: number
  maxzoom?: number
  bounds?: [number, number, number, number]
}

/** Fetch OFM style and rewrite source attributions so vendor names never appear. */
export async function loadCleanStyle(styleUrl: string): Promise<StyleSpecification> {
  const [style, planet] = await Promise.all([
    fetch(styleUrl).then((r) => {
      if (!r.ok) throw new Error(`map style ${r.status}`)
      return r.json() as Promise<StyleSpecification>
    }),
    fetch(PLANET_TILEJSON).then((r) => {
      if (!r.ok) throw new Error(`map tiles ${r.status}`)
      return r.json() as Promise<TileJson>
    }),
  ])

  const sources = { ...(style.sources ?? {}) }
  for (const [id, raw] of Object.entries(sources)) {
    if (!raw || typeof raw !== 'object') continue
    const src = { ...raw } as Record<string, unknown>

    if (src.type === 'vector' && (src.url === PLANET_TILEJSON || id === 'openmaptiles')) {
      const tiles = planet.tiles
      if (tiles?.length) {
        delete src.url
        src.tiles = tiles
        if (planet.minzoom != null) src.minzoom = planet.minzoom
        if (planet.maxzoom != null) src.maxzoom = planet.maxzoom
        if (planet.bounds) src.bounds = planet.bounds
      }
      src.attribution = MAP_CREDIT_PLAIN
    } else if ('attribution' in src) {
      // Raster / other — drop OFM marketing, keep legal floor via map credit.
      src.attribution = ''
    }

    sources[id] = src as StyleSpecification['sources'][string]
  }

  return { ...style, sources, /* strip style-level vendor strings if any */ }
}

/** Shared Map constructor chrome — call after loadCleanStyle. */
export function mapChromeOptions() {
  return {
    maplibreLogo: false as const,
    attributionControl: {
      compact: true,
      // Override MapLibre default ("MapLibre | …"); source credit comes from loadCleanStyle.
      customAttribution: '',
    },
  }
}

/** After setStyle/load: collapse attribution to ⓘ (Google/Apple-style). */
export function tightenAttribution(map: MlMap) {
  const el = map.getContainer().querySelector('.maplibregl-ctrl-attrib')
  if (!el) return
  el.classList.add('maplibregl-compact')
  el.classList.remove('maplibregl-compact-show')
  // Kill any leftover "MapLibre |" / OpenFreeMap text from default merges.
  const inner = el.querySelector('.maplibregl-ctrl-attrib-inner')
  if (!inner || !/OpenFreeMap|MapLibre/i.test(inner.textContent ?? '')) return
  while (inner.firstChild) inner.removeChild(inner.firstChild)
  const omt = document.createElement('a')
  omt.href = 'https://www.openmaptiles.org/'
  omt.target = '_blank'
  omt.rel = 'noopener'
  omt.textContent = '© OpenMapTiles'
  const sep = document.createTextNode(' · ')
  const osm = document.createElement('a')
  osm.href = 'https://www.openstreetmap.org/copyright'
  osm.target = '_blank'
  osm.rel = 'noopener'
  osm.textContent = '© OpenStreetMap'
  inner.append(omt, sep, osm)
}
