/**
 * Cadastral parcel helpers — pure + isomorphic (no React, no network).
 * Rings come from /api/napr (NaprParcel.ring, [lng, lat] WGS84).
 * Palette is BRAND.tokens only — see BRAND.md v1.17 (never raw hex).
 */

import { BRAND } from '@/lib/brand'

export type CadastreStatus = 'active' | 'sold' | 'pending' | 'expired' | 'withdrawn'

export type CadastreParcel = {
  /** Dotted NAPR UNIQ_CODE as returned by /api/napr. */
  code: string
  /** [lng, lat][], unclosed or closed. */
  ring: [number, number][]
  lat: number
  lng: number
  status: CadastreStatus
}

/** Close a ring; null when it can't form a polygon. */
export function closedRing(ring: [number, number][] | undefined): [number, number][] | null {
  if (!ring || ring.length < 3) return null
  const first = ring[0]
  const last = ring[ring.length - 1]
  if (first[0] === last[0] && first[1] === last[1]) {
    return ring.length >= 4 ? ring : null
  }
  return [...ring, first]
}

export function parcelFeature(
  p: CadastreParcel,
  selectedCode?: string | null,
): GeoJSON.Feature<GeoJSON.Polygon, { code: string; status: CadastreStatus; selected: boolean }> | null {
  const ring = closedRing(p.ring)
  if (!ring) return null
  const selected = p.code === selectedCode
  return {
    type: 'Feature',
    geometry: { type: 'Polygon', coordinates: [ring] },
    properties: { code: p.code, status: p.status, selected },
  }
}

export function parcelsFC(
  parcels: CadastreParcel[],
  selectedCode?: string | null,
): GeoJSON.FeatureCollection<GeoJSON.Polygon, { code: string; status: CadastreStatus; selected: boolean }> {
  const features = parcels
    .map((p) => parcelFeature(p, selectedCode))
    .filter((f): f is NonNullable<typeof f> => f !== null)
  return { type: 'FeatureCollection', features }
}

/** Equirectangular shoelace — accurate at parcel scale (≤ few km). */
export function parcelAreaM2(ring: [number, number][] | undefined): number | null {
  const closed = closedRing(ring)
  if (!closed) return null
  const R = 6_371_000
  const lat0 = closed.reduce((s, [, lat]) => s + lat, 0) / closed.length
  const k = (Math.PI / 180) * R * Math.cos((lat0 * Math.PI) / 180)
  let sum = 0
  for (let i = 0; i < closed.length - 1; i++) {
    const [x1, y1] = closed[i]
    const [x2, y2] = closed[i + 1]
    sum += x1 * k * (y2 * (Math.PI / 180) * R) - x2 * k * (y1 * (Math.PI / 180) * R)
  }
  return Math.abs(sum) / 2
}

/** Brand-locked parcel paints — muted by opacity, never new hexes. */
export function statusPaint(status: CadastreStatus): { fill: string; line: string } {
  switch (status) {
    case 'active':
      return { fill: BRAND.colors.success, line: BRAND.colors.success }
    case 'pending':
      return { fill: BRAND.colors.orange, line: BRAND.colors.orange }
    case 'sold':
    case 'expired':
    case 'withdrawn':
      return { fill: BRAND.colors.ink, line: BRAND.colors.ink }
  }
}

/** Parse `extendedFields.cadastral` payloads (string or {code}). */
export function cadastralFromExtended(v: unknown): string | null {
  if (typeof v === 'string') return v.trim() || null
  if (v && typeof v === 'object') {
    const code = (v as { code?: unknown }).code
    if (typeof code === 'string') return code.trim() || null
  }
  return null
}
