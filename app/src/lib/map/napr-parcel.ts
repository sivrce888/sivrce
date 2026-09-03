/**
 * NAPR cadastral parcel rings — maps.gov.ge first, CadRepGeo fallback.
 * Legal site polygon — prefer over OSM/basemap mesh when cadastral or pin known.
 * ponytail: maps.gov.ge JSON/WKT; NSDI catalog is login-gated — skip until public WFS.
 */

import { cadastralVariants, parseCadastralCode } from '@/lib/listing-public-id'
import { closeRing, ringCentroid } from './pick-building'

export type NaprParcel = {
  uniqCode: string
  ring: [number, number][]
  lat: number
  lng: number
  /** Which backend answered. */
  source?: 'maps.gov.ge' | 'CadRepGeo'
}

const MAPS_ORIGIN =
  (typeof process !== 'undefined' && process.env.NAPR_MAPS_URL?.replace(/\/$/, '')) ||
  'https://maps.gov.ge'
/** Override when CadRepGeo moves hosts (ops: NAPR_CADREP_URL). */
const CADREP_BASE =
  (typeof process !== 'undefined' && process.env.NAPR_CADREP_URL?.replace(/\/$/, '')) ||
  'http://gisappsn.reestri.gov.ge/ArcGIS/rest/services/CadRepGeo/MapServer'
/** Regional ნაკვეთი layers (Tbilisi…Shida Kartli). */
const PARCEL_LAYERS = '10,14,19,24,29,34,39,44,49,54,59'
const UA = 'sivrce-maps/1.1 (sivrce888@gmail.com)'

type EsriRing = number[][]
type EsriGeom = { rings?: EsriRing[] }
type EsriAttrs = {
  UNIQ_CODE?: string | null
  'SHAPE.AREA'?: string | number | null
  SHAPE_Area?: string | number | null
}

type MapsHit = {
  id?: number | string
  name?: string
  proj?: string
  shape?: string
  shape_format?: string
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

/** Dotted keyword maps.gov.ge search accepts (digits-only returns []). */
export function naprSearchKeyword(code: string): string | null {
  const variants = cadastralVariants(code)
  const dotted = variants.find((v) => v.includes('.'))
  if (dotted) return dotted
  if (code.includes('.')) return code.trim()
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

/**
 * WKT POLYGON / MULTIPOLYGON → closed outer ring [lng,lat][].
 * ponytail: first exterior only; holes ignored.
 */
export function wktPolygonToRing(wkt: string): [number, number][] | null {
  const s = wkt.trim()
  if (!s) return null
  const m = s.match(/POLYGON\s*\(\s*\(([^)]+)\)/i)
  if (!m?.[1]) return null
  const pts: [number, number][] = []
  for (const part of m[1].split(',')) {
    const [a, b] = part.trim().split(/\s+/)
    const lng = Number(a)
    const lat = Number(b)
    if (!Number.isFinite(lng) || !Number.isFinite(lat)) return null
    pts.push([lng, lat])
  }
  const ring = closeRing(pts)
  return ring.length >= 5 ? ring : null
}

function parcelFromMapsHit(hit: MapsHit | undefined): NaprParcel | null {
  const uniq = String(hit?.name ?? '').trim()
  const ring = hit?.shape ? wktPolygonToRing(hit.shape) : null
  if (!uniq || !ring) return null
  const c = ringCentroid(ring)
  return { uniqCode: uniq, ring, lat: c.lat, lng: c.lng, source: 'maps.gov.ge' }
}

function parcelFromEsri(
  attrs: EsriAttrs | undefined,
  geometry: EsriGeom | undefined,
): NaprParcel | null {
  const uniq = String(attrs?.UNIQ_CODE ?? '').trim()
  const ring = naprRingsToOuter(geometry?.rings)
  if (!uniq || !ring) return null
  const c = ringCentroid(ring)
  return { uniqCode: uniq, ring, lat: c.lat, lng: c.lng, source: 'CadRepGeo' }
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
    const p = parcelFromEsri(r.attributes, r.geometry)
    if (!p) continue
    const a = areaOf(r.attributes)
    if (!best || a < bestArea) {
      best = p
      bestArea = a
    }
  }
  return best
}

/** Pure: maps.gov.ge getinfo JSON → first parcel with shape. */
export function pickMapsParcelFromPayload(json: unknown): NaprParcel | null {
  const data = (json as { data?: MapsHit[] } | null)?.data
  if (!Array.isArray(data)) return null
  for (const hit of data) {
    const p = parcelFromMapsHit(hit)
    if (p) return p
  }
  return null
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

type GetOk = { ok: true; json: unknown }
type GetFail = { ok: false; down: boolean }

async function httpJson(
  url: string,
  init?: RequestInit & { retries?: number; mapsReferer?: boolean },
): Promise<GetOk | GetFail> {
  const retries = init?.retries ?? 2
  const { retries: _r, mapsReferer, ...req } = init ?? {}
  let sawDown = false
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, {
        ...req,
        headers: {
          'User-Agent': UA,
          Accept: 'application/json',
          ...(mapsReferer ? { Referer: `${MAPS_ORIGIN}/map/portal/` } : {}),
          ...(req.headers ?? {}),
        },
        signal: AbortSignal.timeout(14_000),
        cache: 'no-store',
      })
      if (res.status === 503 || res.status === 502 || res.status === 504) {
        sawDown = true
        await sleep(300 * (attempt + 1))
        continue
      }
      if (!res.ok) {
        if (res.status >= 500) sawDown = true
        return { ok: false, down: sawDown || res.status >= 500 }
      }
      const text = await res.text()
      if (text.trimStart().startsWith('<')) {
        sawDown = true
        await sleep(300 * (attempt + 1))
        continue
      }
      return { ok: true, json: JSON.parse(text) as unknown }
    } catch {
      sawDown = true
      await sleep(300 * (attempt + 1))
    }
  }
  return { ok: false, down: sawDown }
}

/** maps.gov.ge identify-at-pin (coords order: lng,lat). */
async function mapsParcelAt(lat: number, lng: number): Promise<NaprParcel | null> {
  const pad = 0.004
  const bbox = `${lng - pad},${lat - pad},${lng + pad},${lat + pad}`
  // ponytail: maps.gov.ge 500s/HTML if commas in coords/bbox are %2C-encoded.
  const url =
    `${MAPS_ORIGIN}/lr/bo/mg/getinfo?lang=ka` +
    `&coords=${lng},${lat}` +
    `&zoom=18&fmt=json&res=shp&projection=EPSG:4326&bbox=${bbox}`
  const hit = await httpJson(url, { retries: 1, mapsReferer: true })
  if (!hit.ok) return null
  return pickMapsParcelFromPayload(hit.json)
}

/** maps.gov.ge search → geometry_link → WKT parcel. */
async function mapsParcelByCode(code: string): Promise<NaprParcel | null> {
  const keyword = naprSearchKeyword(code)
  if (!keyword) return null
  const body = new URLSearchParams({
    keyword,
    keyword_description: '',
  }).toString()
  const search = await httpJson(`${MAPS_ORIGIN}/map/portal/search`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
    retries: 1,
    mapsReferer: true,
  })
  if (!search.ok) return null
  const results = (search.json as { status?: boolean; result?: Array<{
    name?: string
    details?: { geometry_link?: string }
  }> })?.result
  if (!Array.isArray(results) || results.length === 0) return null

  const digits = naprUniqDigits(code)
  const match =
    results.find((r) => naprUniqDigits(String(r.name ?? '')) === digits) ?? results[0]
  const geomPath = match?.details?.geometry_link?.trim()
  if (!geomPath) return null
  const geomUrl = geomPath.startsWith('http')
    ? geomPath
    : `${MAPS_ORIGIN}${geomPath.startsWith('/') ? '' : '/'}${geomPath}`
  const sep = geomUrl.includes('?') ? '&' : '?'
  const hit = await httpJson(
    `${geomUrl}${sep}fmt=json&projection=EPSG:4326&lang=ka`,
    { retries: 1, mapsReferer: true },
  )
  if (!hit.ok) return null
  return pickMapsParcelFromPayload(hit.json)
}

async function cadrepGet(url: string): Promise<GetOk | GetFail> {
  return httpJson(url, { retries: 1 })
}

/** True when maps.gov.ge (or CadRepGeo) answers parcel JSON. */
export async function probeNaprCadRep(): Promise<boolean> {
  // pin + known code — WAF sometimes HTML-blanks the first getinfo hit.
  if (await mapsParcelAt(41.7225, 44.7525)) return true
  if (await mapsParcelByCode('01.10.10.025.115')) return true
  const hit = await cadrepGet(`${CADREP_BASE}?f=json`)
  if (!hit.ok) return false
  const j = hit.json as { layers?: unknown } | null
  return Array.isArray(j?.layers)
}

async function cadrepByCode(code: string): Promise<NaprParcel | null> {
  const digits = naprUniqDigits(code)
  if (!digits) return null
  const url =
    `${CADREP_BASE}/find?` +
    new URLSearchParams({
      searchText: digits,
      contains: 'false',
      searchFields: 'UNIQ_CODE',
      layers: PARCEL_LAYERS,
      returnGeometry: 'true',
      sr: '4326',
      f: 'json',
    }).toString()
  const hit = await cadrepGet(url)
  if (!hit.ok) return null
  const json = hit.json as { results?: Array<{ attributes?: EsriAttrs; geometry?: EsriGeom }> }
  return pickNaprParcelFromResults(json?.results ?? [])
}

async function cadrepAt(lat: number, lng: number): Promise<NaprParcel | null> {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null
  const pad = 0.004
  const url =
    `${CADREP_BASE}/identify?` +
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
  const hit = await cadrepGet(url)
  if (!hit.ok) return null
  const json = hit.json as { results?: Array<{ attributes?: EsriAttrs; geometry?: EsriGeom }> }
  return pickNaprParcelFromResults(json?.results ?? [])
}

/** Parcel ring by cadastral code (dotted or digits). */
export async function fetchNaprParcelByCode(code: string): Promise<NaprParcel | null> {
  const maps = await mapsParcelByCode(code)
  if (maps) return maps
  return cadrepByCode(code)
}

/** Parcel under a map pin. */
export async function fetchNaprParcelAt(
  lat: number,
  lng: number,
): Promise<NaprParcel | null> {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null
  const maps = await mapsParcelAt(lat, lng)
  if (maps) return maps
  return cadrepAt(lat, lng)
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
