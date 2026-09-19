/**
 * Nature stack — the land half of the basemap, guaranteed on every look.
 *
 * OpenFreeMap serves one planet tileset (full OpenMapTiles schema) behind three
 * styles that paint wildly different subsets of it: Liberty draws grass, sand,
 * wetland and six landuse classes but has **no city-park layer**; Positron draws
 * three landcover classes and nothing else; Dark draws forests through a
 * `wood-pattern` sprite it does not ship, so `bindMissingImages` blanks it to a
 * 1×1 transparent pixel and every forest at night renders invisible.
 *
 * The tiles already hold all of it. `withNature` injects the missing layers from
 * the same vector source (no extra request, no new dependency) so all four looks
 * expose the same land vocabulary, and `paintNature` is then the single place
 * that colours it per theme.
 *
 * Hex here is a third-party basemap mimic — the BRAND.md exception that already
 * covers `floorLayers` road/land paints and OSM massing.
 *
 * ponytail: one style transform + one paint pass, no per-layer abstraction.
 * Ceiling: if a market ever needs bespoke land classes, give NATURE_FILLS a
 * per-country override map rather than forking the transform.
 */

import type {
  DataDrivenPropertyValueSpecification,
  ExpressionSpecification,
  LayerSpecification,
  Map as MlMap,
  StyleSpecification,
} from 'maplibre-gl'

/**
 * Canopy texture over forest polygons.
 *
 * ponytail: texture, not geometry. Extruding OMT `landcover` was tried and cut:
 * those polygons are hillside-scale, so a crown height turns a whole ridge into
 * one flat green mesa — worse than no trees, and a 3D pass for the privilege.
 * Neither Google nor Apple extrudes OSM forest either. Ceiling: real per-tree
 * volume needs a per-tree dataset (OSM `natural=tree` is not in OpenMapTiles),
 * so revisit only if tree points ever enter the tile schema.
 */
export const CANOPY_TEX_ID = 'sv-canopy-tex'
/** Shoreline — the one line that makes water read as water and not as a hole. */
export const SHORE_ID = 'sv-shore'
/** Sprite key for the generated canopy tile. Regenerated per theme. */
const CANOPY_IMAGE_ID = 'sv-canopy'

/** OMT `landcover.class` → layer id. Liberty's ids, so existing styles no-op. */
const LANDCOVER: ReadonlyArray<readonly [id: string, cls: string]> = [
  ['landcover_wood', 'wood'],
  ['landcover_grass', 'grass'],
  ['landcover_wetland', 'wetland'],
  ['landcover_sand', 'sand'],
  ['landcover_ice', 'ice'],
]

/** OMT `landuse.class` → layer id. `park` is the city park Liberty forgets. */
const LANDUSE: ReadonlyArray<readonly [id: string, cls: string]> = [
  ['landuse_park', 'park'],
  ['landuse_cemetery', 'cemetery'],
  ['landuse_pitch', 'pitch'],
  ['landuse_track', 'track'],
  ['landuse_hospital', 'hospital'],
  ['landuse_school', 'school'],
]

/** Protected-area polygons live in their own source-layer, not in `landuse`. */
const PARK_ID = 'park'

/** The three OMT source-layers that make up the land block of any basemap. */
const LAND_SOURCE_LAYERS: ReadonlySet<string> = new Set(['park', 'landuse', 'landcover'])

/** Every land id this module owns, in draw order. */
export const NATURE_FILL_IDS: readonly string[] = [
  PARK_ID,
  ...LANDUSE.map(([id]) => id),
  ...LANDCOVER.map(([id]) => id),
]

type Tone = {
  wood: string
  grass: string
  wetland: string
  sand: string
  ice: string
  park: string
  cemetery: string
  pitch: string
  track: string
  hospital: string
  school: string
  water: string
  shore: string
  river: string
  /** Canopy blobs: the shaded side of a crown and the lit side. */
  canopyLo: string
  canopyHi: string
}

/**
 * Three reads of the same land. Light is the Google-familiar streets map,
 * clean is Apple's warm paper, dark is the brand navy night. Greens are tiered
 * so a forest, a lawn and a ball court never collapse into one flat blob.
 */
export const NATURE_PALETTE: Readonly<Record<'light' | 'clean' | 'dark', Tone>> = {
  light: {
    wood: '#B4D3A0',
    grass: '#CBE3B8',
    wetland: '#C7DDCB',
    sand: '#F2E8C9',
    ice: '#E4EEF2',
    park: '#C8E6C9',
    cemetery: '#C5DFB5',
    pitch: '#B2DFB0',
    track: '#DEE3CD',
    hospital: '#F8D7DA',
    school: '#FFF3C4',
    water: '#AADAFF',
    shore: '#7FB6E6',
    river: '#AADAFF',
    canopyLo: '#8FBE7C',
    canopyHi: '#A9D392',
  },
  clean: {
    wood: '#CEDDC2',
    grass: '#DCE7CF',
    wetland: '#D2DFD4',
    sand: '#EDE4CB',
    ice: '#E8EEF0',
    park: '#D5E4C8',
    cemetery: '#D8E2CC',
    pitch: '#CFE0C4',
    track: '#E2E0D6',
    hospital: '#EFDCDC',
    school: '#EDE7CF',
    water: '#AFCDE6',
    shore: '#8FB4D2',
    river: '#9FC0DD',
    canopyLo: '#B6CBA8',
    canopyHi: '#C7D9BA',
  },
  dark: {
    wood: '#0F3220',
    grass: '#16402A',
    wetland: '#123528',
    sand: '#33323C',
    ice: '#2A3A55',
    park: '#143D28',
    cemetery: '#15341F',
    pitch: '#17422B',
    track: '#262B3A',
    hospital: '#3A2430',
    school: '#33301F',
    water: '#12355F',
    shore: '#27578C',
    river: '#1B4F8A',
    canopyLo: '#0B2717',
    canopyHi: '#16482C',
  },
}

export type NatureKey = keyof typeof NATURE_PALETTE | 'satellite'

/* ── style transform ─────────────────────────────────────────────────────── */

function sourceLayerOf(layer: LayerSpecification | undefined): string {
  return layer && 'source-layer' in layer
    ? String((layer as { 'source-layer'?: string })['source-layer'] ?? '')
    : ''
}

function fillLayer(
  id: string,
  source: string,
  sourceLayer: string,
  cls: string | null,
): LayerSpecification {
  return {
    id,
    type: 'fill',
    source,
    'source-layer': sourceLayer,
    ...(cls ? { filter: ['==', ['get', 'class'], cls] as ExpressionSpecification } : {}),
    paint: {
      // Landcover blobs are huge and edge-to-edge; antialiasing them costs a
      // pass for nothing. A park or a school has a visible boundary — keep it.
      'fill-antialias': sourceLayer === 'landcover' ? false : true,
      'fill-color': 'transparent',
    },
  }
}

/** Vector source carrying the OMT planet, under either id this repo uses. */
function omtSource(style: StyleSpecification): string | null {
  if (style.sources?.sivrce) return 'sivrce'
  if (style.sources?.openmaptiles) return 'openmaptiles'
  return null
}

/**
 * Inject every land layer the style omits, plus the canopy and the shoreline.
 *
 * Land joins the style's own land block; the canopy and the shoreline go over
 * it and under the roads. Ids match Liberty's, so a style that already draws a
 * class keeps its own layer and is only repainted — never duplicated.
 */
export function withNature(style: StyleSpecification): StyleSpecification {
  const source = omtSource(style)
  if (!source) return style

  const layers = [...(style.layers ?? [])]
  const have = new Set(layers.map((l) => l?.id).filter(Boolean) as string[])

  const land: LayerSpecification[] = []
  if (!have.has(PARK_ID)) land.push(fillLayer(PARK_ID, source, 'park', null))
  for (const [id, cls] of LANDUSE) {
    if (!have.has(id)) land.push(fillLayer(id, source, 'landuse', cls))
  }
  for (const [id, cls] of LANDCOVER) {
    if (!have.has(id)) land.push(fillLayer(id, source, 'landcover', cls))
  }
  if (!have.has(CANOPY_TEX_ID)) {
    land.push({
      id: CANOPY_TEX_ID,
      type: 'fill',
      source,
      'source-layer': 'landcover',
      minzoom: 11,
      filter: ['==', ['get', 'class'], 'wood'],
      paint: { 'fill-opacity': 0 },
    })
  }

  const top: LayerSpecification[] = []
  if (!have.has(SHORE_ID)) {
    top.push({
      id: SHORE_ID,
      type: 'line',
      source,
      'source-layer': 'water',
      minzoom: 5,
      filter: ['!=', ['get', 'brunnel'], 'tunnel'],
      layout: { 'line-join': 'round' },
      paint: { 'line-color': 'transparent', 'line-width': 0 },
    })
  }
  // Join the style's own land block rather than assuming where it is: Liberty
  // draws land then water, Positron and Dark draw water first. Anchoring on
  // `water` would bury Dark's injected layers under its own forests.
  const roadAt = layers.findIndex((l) => sourceLayerOf(l) === 'transportation')
  const waterAt = layers.findIndex((l) => l?.type === 'fill' && sourceLayerOf(l) === 'water')
  let landAt = -1
  for (let i = 0; i < layers.length; i++) {
    if (LAND_SOURCE_LAYERS.has(sourceLayerOf(layers[i]))) landAt = i + 1
  }
  if (landAt < 0) landAt = waterAt >= 0 ? waterAt + 1 : roadAt >= 0 ? roadAt : layers.length
  // Shoreline and tree crowns belong over the land, still under the roads.
  const topAt = Math.max(roadAt >= 0 ? roadAt : layers.length, landAt)

  // Splice the later anchor first so the earlier index stays valid.
  if (top.length) layers.splice(topAt, 0, ...top)
  if (land.length) layers.splice(landAt, 0, ...land)

  // Dark ships `landcover_wood` with `fill-pattern: wood-pattern` and no such
  // sprite, so the missing-image resolver blanks it and night forests vanish.
  // Our own canopy texture replaces it — drop the dead pattern key.
  const cleaned = layers.map((l) =>
    l?.id === 'landcover_wood' && l.type === 'fill' && l.paint && 'fill-pattern' in l.paint
      ? { ...l, paint: Object.fromEntries(
          Object.entries(l.paint).filter(([k]) => k !== 'fill-pattern'),
        ) as typeof l.paint }
      : l,
  )

  return { ...style, layers: cleaned }
}

/* ── canopy texture ──────────────────────────────────────────────────────── */

const CANOPY_PX = 64
const CANOPY_BLOBS = 17
/** Fixed seed — the canopy must be identical on every reload and every device. */
const CANOPY_SEED = 0x51_1f_ce_01

/** Deterministic PRNG — the pattern must be byte-identical across reloads. */
function lcg(seed: number): () => number {
  let s = seed >>> 0
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0
    return s / 0x100000000
  }
}

/**
 * Procedural tree canopy, 64×64 seamless, drawn at runtime.
 *
 * ponytail: generated, not shipped — zero asset bytes and it retints per theme.
 * Ceiling: a hand-drawn sprite if the blob read ever stops selling "forest".
 */
export function canopyImage(tone: Tone): ImageData | null {
  if (typeof document === 'undefined') return null
  const c = document.createElement('canvas')
  c.width = CANOPY_PX
  c.height = CANOPY_PX
  const ctx = c.getContext('2d', { willReadFrequently: true })
  if (!ctx) return null

  const rand = lcg(CANOPY_SEED)
  for (let i = 0; i < CANOPY_BLOBS; i++) {
    const x = rand() * CANOPY_PX
    const y = rand() * CANOPY_PX
    const r = 3.2 + rand() * 3.4
    ctx.fillStyle = rand() < 0.45 ? tone.canopyLo : tone.canopyHi
    // Nine wrapped copies keep the tile seamless when MapLibre repeats it.
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        ctx.beginPath()
        ctx.arc(x + dx * CANOPY_PX, y + dy * CANOPY_PX, r, 0, Math.PI * 2)
        ctx.fill()
      }
    }
  }
  return ctx.getImageData(0, 0, CANOPY_PX, CANOPY_PX)
}

function ensureCanopyImage(map: MlMap, tone: Tone): boolean {
  const img = canopyImage(tone)
  if (!img) return false
  const payload = { width: img.width, height: img.height, data: img.data }
  try {
    if (map.hasImage(CANOPY_IMAGE_ID)) map.updateImage(CANOPY_IMAGE_ID, payload)
    else map.addImage(CANOPY_IMAGE_ID, payload)
    return true
  } catch {
    return false
  }
}

/* ── paint ───────────────────────────────────────────────────────────────── */

function set(map: MlMap, id: string, prop: string, value: unknown) {
  if (!map.getLayer(id)) return
  try {
    map.setPaintProperty(
      id,
      prop as Parameters<MlMap['setPaintProperty']>[1],
      value as Parameters<MlMap['setPaintProperty']>[2],
    )
  } catch {
    /* style mid-swap */
  }
}

/**
 * River width by OMT class. A canal is not a drainage ditch and neither is the
 * Rhine; one flat width is why most vector maps read as plumbing diagrams.
 */
export function waterwayWidth(): DataDrivenPropertyValueSpecification<number> {
  const byClass = (river: number, canal: number, minor: number): ExpressionSpecification => [
    'match',
    ['get', 'class'],
    'river',
    river,
    ['canal', 'drain'],
    canal,
    minor,
  ]
  return [
    'interpolate',
    ['exponential', 1.3],
    ['zoom'],
    8,
    byClass(0.7, 0.3, 0.2),
    12,
    byClass(1.6, 0.9, 0.6),
    15,
    byClass(4.5, 2.6, 1.4),
    18,
    byClass(14, 8, 4),
  ]
}

/**
 * Colour the land for one look. Safe to call on any style: every write is
 * guarded, so a look that genuinely lacks a layer simply skips it.
 *
 * `lite` drops the canopy volume (an extra extrusion pass over forest polygons)
 * but keeps the texture, so a low-end phone still sees trees.
 */
export function paintNature(map: MlMap, key: NatureKey, lite = false): void {
  // Hybrid is photography — real trees, real water, real shoreline already.
  if (key === 'satellite') return
  const t = NATURE_PALETTE[key]

  set(map, PARK_ID, 'fill-color', t.park)
  set(map, PARK_ID, 'fill-opacity', key === 'dark' ? 0.9 : 0.75)
  // Protected-area edge: one step deeper than the fill so the boundary reads
  // without a second colour in the palette. `pitch` is that step.
  set(map, 'park_outline', 'line-color', t.pitch)

  set(map, 'landuse_park', 'fill-color', t.park)
  set(map, 'landuse_park', 'fill-opacity', 1)
  set(map, 'landuse_cemetery', 'fill-color', t.cemetery)
  set(map, 'landuse_pitch', 'fill-color', t.pitch)
  set(map, 'landuse_track', 'fill-color', t.track)
  set(map, 'landuse_hospital', 'fill-color', t.hospital)
  set(map, 'landuse_school', 'fill-color', t.school)
  for (const [id] of LANDUSE) set(map, id, 'fill-opacity', 1)

  set(map, 'landcover_wood', 'fill-color', t.wood)
  set(map, 'landcover_wood', 'fill-opacity', key === 'dark' ? 0.9 : 0.8)
  set(map, 'landcover_grass', 'fill-color', t.grass)
  set(map, 'landcover_grass', 'fill-opacity', 0.75)
  // Liberty hatches wetland with a sprite it really does ship, and a marsh hatch
  // beats a flat green — leave that pattern alone. The colour is what the other
  // looks fall back to, where the layer is ours and has no pattern at all.
  set(map, 'landcover_wetland', 'fill-color', t.wetland)
  set(map, 'landcover_wetland', 'fill-opacity', 0.7)
  set(map, 'landcover_sand', 'fill-color', t.sand)
  set(map, 'landcover_sand', 'fill-opacity', 1)
  for (const id of ['landcover_ice', 'landcover_glacier', 'landcover_ice_shelf']) {
    set(map, id, 'fill-color', t.ice)
    set(map, id, 'fill-opacity', 0.85)
  }

  set(map, 'water', 'fill-color', t.water)
  for (const id of ['waterway', 'waterway_river', 'waterway_other', 'waterway_tunnel']) {
    set(map, id, 'line-color', t.river)
    set(map, id, 'line-width', waterwayWidth())
  }

  // Shoreline: a darker hairline that grows with zoom. Apple's water reads as a
  // body with an edge; a bare fill reads as a cut-out.
  set(map, SHORE_ID, 'line-color', t.shore)
  set(map, SHORE_ID, 'line-opacity', key === 'dark' ? 0.75 : 0.6)
  set(map, SHORE_ID, 'line-width', [
    'interpolate',
    ['linear'],
    ['zoom'],
    5,
    0.4,
    11,
    0.9,
    16,
    1.8,
  ])

  // Trees. The pattern is screen-constant, so the crowns read as canopy at the
  // zooms where a forest is a forest and thin out to a dapple in the street.
  if (!lite && ensureCanopyImage(map, t)) {
    const peak = key === 'dark' ? 0.5 : 0.6
    set(map, CANOPY_TEX_ID, 'fill-pattern', CANOPY_IMAGE_ID)
    set(map, CANOPY_TEX_ID, 'fill-opacity', [
      'interpolate',
      ['linear'],
      ['zoom'],
      11,
      0,
      13,
      peak,
      17,
      peak,
      19,
      peak * 0.55,
    ])
  } else {
    // Lite devices skip the texture upload entirely; the forest fill carries.
    set(map, CANOPY_TEX_ID, 'fill-opacity', 0)
  }
}
