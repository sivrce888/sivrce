/**
 * NAPR cadastral parcel rings via CadRepGeo ArcGIS (reestri.gov.ge).
 * Legal site polygon — prefer over OSM/basemap mesh when cadastral or pin known.
 * ponytail: http Find/Identify only; no tile cache. Upgrade → NSDI WFS if they open it.
 */

import { parseCadastralCode } from '@/lib/listing-public-id'
import { closeRing, ringCentroid } from './pick-building'

export type NaprParcel = {
  uniqCode: string
  ring: [number, number][]
  lat: number
  lng: number
}

const BASE = 'http://gisappsn.reestri.gov.ge/ArcGIS/rest/services/CadRepGeo/MapServer'
/** Regional ნაკვეთი layers (Tbilisi…Shida Kartli). */
const PARCEL_LAYERS = '10,14,19,24,29,34,39,44,49,54,59'
const UA = 'sivrce-maps/1.0 (sivrce888@gmail.com)'

type EsriRing = number[][]
type EsriGeom = { rings?: EsriRing[] }
type EsriAttrs = {
  UNIQ_CODE?: string | null
  'SHAPE.AREA'?: string | number | null
  SHAPE_Area?: string | number | null
}

/** Digits-only NAPR UNIQ_CODE (dots stripped). Cadastral field — not phone-gated. */
export function naprUniqDigits(code: string): string | null {
  const raw = code.trim()
  if (!raw) return null
  if (/^\d{2}(\.\d{2,3}){2,5}$/.test(raw)) {
    const d = raw.replace(/\D/g, '')
    return d.length >= 8 && d.length <= 15 ? d : null
  }
  const via = parseCadastralCode(raw)
  if (via) {
    const d = via.replace(/\D/g, '')
    return d.length >= 9 && d.length <= 15 ? d : null
  }
  const d = raw.replace(/\D/g, '')
  // ponytail: bare 9–15 digits (Adjara UNIQ can be 9; Tbilisi 12).
  if (d.length >= 9 && d.length <= 15) return d
  return null
}

/** Closed outer ring from ArcGIS polygon (rings[0] = outer; holes ignored). */
export function naprRingsToOuter(rings: EsriRing[] | undefined): [number, number][] | null {
  const raw = rings?.[0]
  if (!raw || raw.length < 4) return null
  const pts: [number, number][] = []
  for (const p of raw) {
    const lng = Number(p[0])
    const lat = Number(p[1])
    if (!Number.isFinite(lng) || !Number.isFinite(lat)) return null
    pts.push([lng, lat])
  }
  const ring = closeRing(pts)
  return ring.length >= 5 ? ring : null
}

function parcelFromResult(
  attrs: EsriAttrs | undefined,
  geometry: EsriGeom | undefined,
): NaprParcel | null {
  const uniq = String(attrs?.UNIQ_CODE ?? '').trim()
  const ring = naprRingsToOuter(geometry?.rings)
  if (!uniq || !ring) return null
  const c = ringCentroid(ring)
  return { uniqCode: uniq, ring, lat: c.lat, lng: c.lng }
}

function areaOf(attrs: EsriAttrs | undefined): number {
  const a = attrs?.['SHAPE.AREA'] ?? attrs?.SHAPE_Area
  const n = typeof a === 'number' ? a : Number(a)
  return Number.isFinite(n) && n > 0 ? n : Number.POSITIVE_INFINITY
}

/** Pure: ArcGIS find/identify JSON → best parcel (smallest known area wins). */
export function pickNaprParcelFromResults(
  results: Array<{ attributes?: EsriAttrs; geometry?: EsriGeom }>,
): NaprParcel | null {
  let best: NaprParcel | null = null
  let bestArea = Number.POSITIVE_INFINITY
  for (const r of results) {
    const p = parcelFromResult(r.attributes, r.geometry)
    if (!p) continue
    const a = areaOf(r.attributes)
    if (!best || a < bestArea) {
      best = p
      bestArea = a
    }
  }
  return best
}

async function naprGet(url: string): Promise<unknown | null> {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': UA },
      signal: AbortSignal.timeout(14_000),
    })
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  }
}

/** Parcel ring by cadastral code (dotted or digits). */
export async function fetchNaprParcelByCode(code: string): Promise<NaprParcel | null> {
  const digits = naprUniqDigits(code)
  if (!digits) return null
  const url =
    `${BASE}/find?` +
    new URLSearchParams({
      searchText: digits,
      contains: 'false',
      searchFields: 'UNIQ_CODE',
      layers: PARCEL_LAYERS,
      returnGeometry: 'true',
      sr: '4326',
      f: 'json',
    }).toString()
  const json = (await naprGet(url)) as { results?: Array<{ attributes?: EsriAttrs; geometry?: EsriGeom }> } | null
  return pickNaprParcelFromResults(json?.results ?? [])
}

/** Parcel under a map pin (Identify). */
export async function fetchNaprParcelAt(
  lat: number,
  lng: number,
): Promise<NaprParcel | null> {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null
  const pad = 0.004
  const url =
    `${BASE}/identify?` +
    new URLSearchParams({
      geometry: `${lng},${lat}`,
      geometryType: 'esriGeometryPoint',
      sr: '4326',
      layers: `all:${PARCEL_LAYERS}`,
      tolerance: '3',
      mapExtent: `${lng - pad},${lat - pad},${lng + pad},${lat + pad}`,
      imageDisplay: '600,600,96',
      returnGeometry: 'true',
      f: 'json',
    }).toString()
  const json = (await naprGet(url)) as { results?: Array<{ attributes?: EsriAttrs; geometry?: EsriGeom }> } | null
  return pickNaprParcelFromResults(json?.results ?? [])
}

/** Code first, else pin — for attribution / listing footprint. */
export async function fetchNaprParcelRing(
  opts: { code?: string | null; lat?: number; lng?: number },
): Promise<[number, number][] | null> {
  if (opts.code) {
    const byCode = await fetchNaprParcelByCode(opts.code)
    if (byCode) return byCode.ring
  }
  if (opts.lat != null && opts.lng != null) {
    const at = await fetchNaprParcelAt(opts.lat, opts.lng)
    if (at) return at.ring
  }
  return null
}
