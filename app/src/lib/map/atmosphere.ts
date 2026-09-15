/**
 * Map atmosphere — globe projection, sun-accurate sky, sun-accurate light,
 * reduced-motion camera timing. One `applyAtmosphere` call per style mount.
 *
 * Why it lives here and not in the style JSON: the basemap style is swapped on
 * every theme/terrain change, which resets projection + sky + light. These are
 * derived from live state (theme, map centre, wall-clock sun), so they are
 * re-applied imperatively after each `style.load`.
 *
 * ponytail: pure helpers + one imperative apply; no scene-graph abstraction.
 */

import type {
  LightSpecification,
  Map as MlMap,
  ProjectionSpecification,
  SkySpecification,
} from 'maplibre-gl'
import { BRAND } from '@/lib/brand'
import { sunPosition } from '@/lib/sun'
import { MIN_ALTITUDE, mixHex, sunLight, sunSky } from '@/lib/map/sun-shadow'

/**
 * Globe below ~z6, mercator above — MapLibre's `globe` shorthand animates the
 * transition. A world-zoom mercator map with renderWorldCopies:false is a flat
 * rectangle on grey; the planet is the honest read for a worldwide product.
 */
export const GLOBE_PROJECTION: ProjectionSpecification = { type: 'globe' }
export const FLAT_PROJECTION: ProjectionSpecification = { type: 'mercator' }

/** Globe costs an extra render pass — lite devices stay flat. */
export function mapProjection(lite: boolean): ProjectionSpecification {
  return lite ? FLAT_PROJECTION : GLOBE_PROJECTION
}

export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/**
 * Camera duration honouring the OS motion setting. 0 makes MapLibre jump, which
 * is what "reduce motion" means for a camera fly — the destination is the point,
 * the travel is the vestibular trigger.
 */
export function camMs(ms: number, reduce = prefersReducedMotion()): number {
  return reduce ? 0 : ms
}

/** Night sky — brand navy, never pure black (banding on OLED at low bitrate). */
const NIGHT_SKY = BRAND.colors.navy
const NIGHT_HORIZON = '#1B2A63'
/** Backdrop behind the planet at globe zooms. Brand navy doubles as space. */
const SPACE = BRAND.colors.navy

export type AtmosphereInput = {
  /** User's chosen theme, not the real time of day. */
  dark: boolean
  lat: number
  lng: number
  date?: Date
}

/**
 * Sky + aerial perspective. Atmosphere fades in with zoom-out so the globe
 * carries a real limb glow while street zoom stays clear.
 */
export function skyFor({ dark, lat, lng, date = new Date() }: AtmosphereInput): SkySpecification {
  const { altitude } = sunPosition(lat, lng, date)
  const day = Math.min(1, Math.max(0, altitude / 25))
  const sun = sunSky(altitude)
  // Dark theme is a user choice — honour it even at local noon, but keep the
  // sun's warmth in the horizon band so dusk still reads as dusk.
  const skyColor = dark ? NIGHT_SKY : sun['sky-color']
  const horizonColor = dark ? mixHex(NIGHT_HORIZON, sun['horizon-color'], 0.25 * day) : sun['horizon-color']
  return {
    // sky-color is also the backdrop *behind* the globe. A day-blue or page-white
    // void around the planet reads as a broken render; space is space. It fades
    // back to the real sky by the time the globe has handed off to mercator.
    'sky-color': ['interpolate', ['linear'], ['zoom'], 0, SPACE, 3, SPACE, 6, skyColor],
    'horizon-color': horizonColor,
    'sky-horizon-blend': ['interpolate', ['linear'], ['zoom'], 0, 0.9, 6, 0.8, 12, 0.6],
    'atmosphere-blend': ['interpolate', ['linear'], ['zoom'], 0, 1, 6, 0.8, 11, 0.5, 15, 0.28],
    // ponytail: no *-transition keys — this MapLibre build rejects them on sky
    // ("unknown property"). Sky repaints are debounced to settled moves anyway.
  }
}

/**
 * Extrusion light pinned to the real sun. `anchor: 'map'` is the whole point —
 * a viewport-anchored light spins with the compass and the façade that was lit
 * at noon goes dark when you rotate.
 */
export function lightFor({ dark, lat, lng, date = new Date() }: AtmosphereInput): LightSpecification {
  const { altitude, azimuth } = sunPosition(lat, lng, date)
  const sun = sunLight(altitude, azimuth)
  if (!dark) return { anchor: 'map', ...sun }
  // Night: keep the sun's direction (moonlight roughly opposes it anyway at the
  // scale that matters here) but drop to a cool, low-contrast key so dark-theme
  // massing separates by edge rather than by glare.
  return {
    anchor: 'map',
    position: sun.position,
    color: BRAND.colors.blueLight,
    intensity: altitude < MIN_ALTITUDE ? 0.1 : 0.18,
  }
}

/**
 * Apply projection + sky + light. Safe to call on every style mount; each write
 * is guarded because a style swap can land mid-call.
 */
export function applyAtmosphere(
  map: MlMap,
  opts: AtmosphereInput & { lite?: boolean },
): void {
  try {
    map.setProjection(mapProjection(opts.lite ?? false))
  } catch {
    /* projection unsupported / style mid-swap */
  }
  try {
    map.setSky(skyFor(opts))
  } catch {
    /* style mid-swap */
  }
  try {
    map.setLight(lightFor(opts))
  } catch {
    /* style mid-swap */
  }
}
