/**
 * Map chrome prefs — cookie primary, localStorage migrate/fallback.
 * ponytail: document.cookie + LS; no prefs lib.
 */

import type { MapTerrain } from '@/lib/map/floorLayers'

export const MAP_UI_COOKIE = 'sivrce_map_ui'
export const MAP_UI_LS_KEY = 'sivrce.map.ui'
/** 1 year */
const MAX_AGE = 60 * 60 * 24 * 365

export type MapUiSave = {
  terrain?: MapTerrain
  view3d?: boolean
  deal?: string
  status?: string
}

export function parseTerrain(v: unknown): MapTerrain {
  return v === 'clean' || v === 'satellite' || v === 'streets' ? v : 'streets'
}

export function parseMapUiJson(raw: unknown): MapUiSave {
  if (!raw || typeof raw !== 'object') return {}
  const o = raw as Record<string, unknown>
  const terrain =
    o.terrain === 'bright' ? 'streets' : parseTerrainLoose(o.terrain)
  return {
    ...(terrain ? { terrain } : {}),
    ...(typeof o.view3d === 'boolean' ? { view3d: o.view3d } : {}),
    ...(typeof o.deal === 'string' ? { deal: o.deal } : {}),
    ...(typeof o.status === 'string' ? { status: o.status } : {}),
  }
}

function parseTerrainLoose(v: unknown): MapTerrain | undefined {
  return v === 'clean' || v === 'satellite' || v === 'streets' ? v : undefined
}

export function parseMapUiRaw(s: string | null | undefined): MapUiSave {
  if (!s) return {}
  try {
    return parseMapUiJson(JSON.parse(s))
  } catch {
    return {}
  }
}

export function serializeMapUi(ui: MapUiSave): string {
  return JSON.stringify(ui)
}

export function mapUiHasPrefs(ui: MapUiSave): boolean {
  return (
    ui.terrain != null ||
    ui.view3d != null ||
    ui.deal != null ||
    ui.status != null
  )
}

function readDocCookie(name: string): string | null {
  if (typeof document === 'undefined') return null
  const esc = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const m = document.cookie.match(new RegExp(`(?:^|; )${esc}=([^;]*)`))
  return m ? decodeURIComponent(m[1]) : null
}

function writeDocCookie(name: string, value: string) {
  if (typeof document === 'undefined') return
  document.cookie = `${name}=${encodeURIComponent(value)};path=/;max-age=${MAX_AGE};samesite=lax`
}

/** Client: cookie → else migrate localStorage → cookie. */
export function readMapUi(): MapUiSave {
  if (typeof window === 'undefined') return {}
  const fromCookie = parseMapUiRaw(readDocCookie(MAP_UI_COOKIE))
  if (mapUiHasPrefs(fromCookie)) return fromCookie
  try {
    const fromLs = parseMapUiRaw(localStorage.getItem(MAP_UI_LS_KEY))
    if (mapUiHasPrefs(fromLs)) {
      persistMapUi(fromLs)
      return fromLs
    }
  } catch {
    /* private mode */
  }
  return {}
}

export function writeMapUi(patch: MapUiSave) {
  if (typeof window === 'undefined') return
  persistMapUi({ ...readMapUi(), ...patch })
}

function persistMapUi(ui: MapUiSave) {
  const raw = serializeMapUi(ui)
  try {
    localStorage.setItem(MAP_UI_LS_KEY, raw)
  } catch {
    /* private mode */
  }
  try {
    writeDocCookie(MAP_UI_COOKIE, raw)
  } catch {
    /* cookie blocked */
  }
}
