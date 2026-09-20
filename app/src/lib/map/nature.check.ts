/**
 * nature.check — the basemap look must survive every style OFM ships.
 *
 * Runs against synthetic styles shaped like the three real ones (Liberty has
 * grass but no city park, Positron has three landcover classes, Dark patterns
 * forests through a sprite it does not ship). No network: the shapes below are
 * the parts of the real styles this transform actually reads.
 *
 * The palette assertions at the end cover floorLayers' ink tables too: both
 * modules paint the same basemap, and floorLayers.check cannot run in prebuild
 * because it fetches the live style from OFM. These are pure, so they run on
 * every build — which is the whole point of having them.
 */

import assert from 'node:assert/strict'
import type { LayerSpecification, StyleSpecification } from 'maplibre-gl'
import { BRAND } from '@/lib/brand'
import { BUILDING_PALETTE, TRANSPORT_INK, WORLD_INK } from '@/lib/map/floorLayers'
import {
  CANOPY_TEX_ID,
  NATURE_FILL_IDS,
  NATURE_PALETTE,
  SHORE_ID,
  canopyImage,
  waterwayWidth,
  withNature,
} from '@/lib/map/nature'

/** Relative luminance — enough to prove a tone separates from its backdrop. */
function luma(hex: string): number {
  const n = Number.parseInt(hex.slice(1), 16)
  return (0.2126 * ((n >> 16) & 255) + 0.7152 * ((n >> 8) & 255) + 0.0722 * (n & 255)) / 255
}

type LookKey = keyof typeof TRANSPORT_INK

const SRC = 'sivrce'

function style(layers: LayerSpecification[]): StyleSpecification {
  return {
    version: 8,
    sources: { [SRC]: { type: 'vector', tiles: ['https://x/{z}/{x}/{y}'] } },
    layers,
  }
}

function fill(id: string, sourceLayer: string, extra: object = {}): LayerSpecification {
  return {
    id,
    type: 'fill',
    source: SRC,
    'source-layer': sourceLayer,
    paint: { 'fill-color': '#000' },
    ...extra,
  } as LayerSpecification
}

function line(id: string, sourceLayer: string): LayerSpecification {
  return { id, type: 'line', source: SRC, 'source-layer': sourceLayer, paint: {} }
}

const LIBERTY = style([
  { id: 'background', type: 'background', paint: {} },
  fill('park', 'park'),
  fill('landuse_residential', 'landuse'),
  fill('landcover_wood', 'landcover'),
  fill('landcover_grass', 'landcover'),
  line('waterway_river', 'waterway'),
  fill('water', 'water'),
  line('road_minor', 'transportation'),
  fill('building', 'building'),
])

const POSITRON = style([
  { id: 'background', type: 'background', paint: {} },
  fill('park', 'park'),
  fill('water', 'water'),
  fill('landcover_wood', 'landcover'),
  line('waterway', 'waterway'),
  line('highway_minor', 'transportation'),
])

const DARK = style([
  { id: 'background', type: 'background', paint: {} },
  fill('water', 'water'),
  fill('landcover_wood', 'landcover', {
    paint: { 'fill-color': 'rgb(32,32,32)', 'fill-pattern': 'wood-pattern' },
  }),
  fill('landuse_park', 'landuse'),
  line('waterway', 'waterway'),
  line('highway_minor', 'transportation'),
])

function ids(s: StyleSpecification): string[] {
  return s.layers.map((l) => l.id)
}

function indexOf(s: StyleSpecification, id: string): number {
  return ids(s).indexOf(id)
}

/* 1. Every look ends up with the same land vocabulary. */
for (const [name, src] of [
  ['liberty', LIBERTY],
  ['positron', POSITRON],
  ['dark', DARK],
] as const) {
  const out = withNature(src)
  for (const id of NATURE_FILL_IDS) {
    assert.ok(indexOf(out, id) >= 0, `${name}: missing land layer ${id}`)
  }
  assert.ok(indexOf(out, SHORE_ID) >= 0, `${name}: missing shoreline`)
  assert.ok(indexOf(out, CANOPY_TEX_ID) >= 0, `${name}: missing canopy`)

  // No duplicates — a style that already draws a class keeps its own layer.
  const seen = new Set<string>()
  for (const id of ids(out)) {
    assert.ok(!seen.has(id), `${name}: duplicate layer ${id}`)
    seen.add(id)
  }
}

/* 2. Draw order, on all three real layouts. Liberty draws land then water;
 *    Positron and Dark draw water first — anchoring on `water` would bury the
 *    injected layers under Dark's own forests. Land joins the land block; the
 *    shoreline and the tree crowns sit over all of it, still under the roads. */
for (const [name, src, road] of [
  ['liberty', LIBERTY, 'road_minor'],
  ['positron', POSITRON, 'highway_minor'],
  ['dark', DARK, 'highway_minor'],
] as const) {
  const out = withNature(src)
  const roadAt = indexOf(out, road)
  const woodAt = indexOf(out, 'landcover_wood')
  for (const id of NATURE_FILL_IDS) {
    assert.ok(indexOf(out, id) < roadAt, `${name}: land ${id} must sit under the roads`)
  }
  for (const id of [SHORE_ID, CANOPY_TEX_ID]) {
    const at = indexOf(out, id)
    assert.ok(at > woodAt, `${name}: ${id} must sit over the forest fill`)
    assert.ok(at < roadAt, `${name}: ${id} must sit under the roads`)
  }
}

/* 2b. Liberty's own order additionally puts every land fill under the water. */
{
  const out = withNature(LIBERTY)
  const water = indexOf(out, 'water')
  for (const id of NATURE_FILL_IDS) {
    assert.ok(indexOf(out, id) < water, `land ${id} must sit under Liberty's water fill`)
  }
  assert.ok(indexOf(out, SHORE_ID) > water, 'shoreline must sit over the water fill')
}

/* 3. Liberty's real gap: city parks (landuse class=park) were never drawn. */
{
  const out = withNature(LIBERTY)
  const injected = out.layers.find((l) => l.id === 'landuse_park')
  assert.ok(injected && 'source-layer' in injected, 'landuse_park injected')
  assert.equal((injected as { 'source-layer': string })['source-layer'], 'landuse')
  assert.deepEqual(
    (injected as { filter?: unknown }).filter,
    ['==', ['get', 'class'], 'park'],
    'city parks filter on landuse class=park',
  )
}

/* 4. Dark's forests: the unshipped sprite is dropped so fill-color can show.
 *    bindMissingImages resolves any missing image to a 1×1 transparent pixel,
 *    and fill-pattern beats fill-color — that is why night forests vanished. */
{
  const out = withNature(DARK)
  const wood = out.layers.find((l) => l.id === 'landcover_wood')
  assert.ok(wood && wood.type === 'fill', 'dark keeps its own wood layer')
  assert.ok(
    !('fill-pattern' in (wood.paint ?? {})),
    'dead wood-pattern must be stripped from dark',
  )
  assert.ok('fill-color' in (wood.paint ?? {}), 'wood keeps a colour to fall back to')
}

/* 5. Idempotent — style swaps re-run loadCleanStyle on a cached spec. */
{
  const once = withNature(LIBERTY)
  assert.deepEqual(ids(withNature(once)), ids(once), 'withNature must be idempotent')
}

/* 6. A style with no OMT vector source is returned untouched (satellite boot). */
{
  const sat: StyleSpecification = {
    version: 8,
    sources: { sat: { type: 'raster', tiles: ['https://x/{z}/{x}/{y}'], tileSize: 256 } },
    layers: [{ id: 'sat-img', type: 'raster', source: 'sat' }],
  }
  assert.deepEqual(withNature(sat), sat, 'no vector source → no injection')
}

/* 7. Rivers are graded by class, ascending with zoom — never one flat width. */
{
  const w = waterwayWidth() as unknown[]
  assert.equal(w[0], 'interpolate')
  const stops: number[] = []
  for (let i = 3; i < w.length; i += 2) stops.push(w[i] as number)
  assert.deepEqual(stops, [...stops].sort((a, b) => a - b), 'zoom stops ascend')
  for (let i = 4; i < w.length; i += 2) {
    const m = w[i] as unknown[]
    assert.equal(m[0], 'match', 'each stop grades by waterway class')
    const river = m[3] as number
    const fallback = m[m.length - 1] as number
    assert.ok(river > fallback, 'a river must outrank a ditch at every zoom')
  }
}

/* 8. Palette: every look defines every tone, as a real hex. */
{
  const keys = Object.keys(NATURE_PALETTE.light) as Array<keyof typeof NATURE_PALETTE.light>
  for (const [look, tone] of Object.entries(NATURE_PALETTE)) {
    for (const k of keys) {
      const v = tone[k]
      assert.match(v, /^#[0-9A-F]{6}$/, `${look}.${k} must be a 6-digit hex`)
    }
    // Forest darker than lawn in daylight, lighter than ground at night —
    // otherwise a wood and a park read as the same flat blob.
    assert.notEqual(tone.wood, tone.grass, `${look}: wood and grass must differ`)
    assert.notEqual(tone.wood, tone.park, `${look}: wood and park must differ`)
  }
}

/* 9. Canopy is texture, never geometry: OMT forest polygons are hillside-scale,
 *    so extruding them yields a flat green mesa instead of crowns. */
for (const src of [LIBERTY, POSITRON, DARK]) {
  const out = withNature(src)
  const added = out.layers.filter((l) => l.id.startsWith('sv-'))
  assert.ok(added.length > 0, 'nature injects its own layers')
  for (const l of added) {
    assert.notEqual(l.type, 'fill-extrusion', `${l.id} must not extrude landcover`)
  }
}

/* 10. Canvas-free environments (this check, SSR) must not throw. */
assert.equal(canopyImage(NATURE_PALETTE.light), null, 'canopyImage is browser-only')

/* 11. Ink tables — see floorLayers.ts. */
{
  // Transport ink must never collapse into the ground it is drawn on.
  //
  // This is the bug it replaced: OFM keys aeroway/pier/rail-sleeper colours to
  // each style's OWN background, and we repaint that background. Dark shipped
  // `#000` aprons and `rgb(12,12,12)` piers against brand navy, so every airport
  // and pier punched a black hole through the night map.
  const GROUND: Record<LookKey, string> = {
    light: '#EEF0E9',
    clean: '#F3F1EC',
    dark: BRAND.colors.navy,
  }
  for (const [name, ink] of Object.entries(TRANSPORT_INK)) {
    const look = name as LookKey
    // Each part is judged against what it is actually drawn on: an apron sits on
    // the land, a runway sits on its apron, a pier sits in the water.
    const backdrop: Record<string, string> = {
      apron: GROUND[look],
      rail: GROUND[look],
      runway: ink.apron,
      pier: NATURE_PALETTE[look].water,
    }
    for (const [part, hex] of Object.entries(ink)) {
      assert.match(hex, /^#[0-9A-Fa-f]{6}$/, `${look}.${part} must be a 6-digit hex`)
      const under = backdrop[part]
      if (!under) continue
      assert.ok(
        Math.abs(luma(hex) - luma(under)) > 0.015,
        `${look}.${part} (${hex}) is indistinguishable from the ${under} it sits on`,
      )
    }
    // Sleepers are drawn over the track; same colour means no rail read at all.
    assert.notEqual(ink.rail, ink.hatch, `${look}: rail and its hatch must differ`)
    // A label has to beat its own halo, whichever direction the look runs.
    assert.ok(
      Math.abs(luma(ink.label) - luma(ink.halo)) > 0.3,
      `${look}: airport label must contrast its halo`,
    )
  }

  // The night map is blue, not grey.
  //
  // This is the assertion that actually catches the bug above, and luma alone
  // does not: `#000` against navy is perfectly *distinguishable*, it just reads
  // as a hole. What made it a hole is that it left the brand's colour family.
  // Every structural night tone stays blue-dominant, so an OFM neutral leaking
  // through (`#000`, `rgb(12,12,12)`, `rgb(35,35,35)`) fails here by
  // construction. Land tones are exempt: a forest or a school is allowed to be
  // green or warm at night — only the neutral surfaces are locked to the family.
  const blueDominant = (hex: string) => {
    const n = Number.parseInt(hex.slice(1), 16)
    return (n & 255) > ((n >> 16) & 255)
  }
  for (const [table, ink] of [
    ['TRANSPORT_INK', TRANSPORT_INK.dark],
    ['WORLD_INK', WORLD_INK.dark],
    ['BUILDING_PALETTE', BUILDING_PALETTE.dark],
  ] as const) {
    for (const [part, value] of Object.entries(ink)) {
      if (typeof value !== 'string') continue
      assert.ok(
        blueDominant(value),
        `${table}.dark.${part} (${value}) is a neutral, not a night tone — ` +
          'an OFM default has leaked through onto the navy ground',
      )
    }
  }

  // Admin ink: country tier must outrank the sub-national tier in every look,
  // and both must clear their halo — this is what makes borders read at globe
  // zoom instead of inheriting whatever the basemap shipped.
  for (const [look, ink] of Object.entries(WORLD_INK)) {
    for (const [part, hex] of Object.entries(ink)) {
      assert.match(hex, /^#[0-9A-Fa-f]{6}$/, `${look}.${part} must be a 6-digit hex`)
    }
    assert.ok(
      Math.abs(luma(ink.country) - luma(ink.halo)) >
        Math.abs(luma(ink.state) - luma(ink.halo)),
      `${look}: country labels must read stronger than state labels`,
    )
    assert.notEqual(ink.line, ink.sub, `${look}: country and sub-national borders must differ`)
  }
}

console.log('nature.check ✓')
