/**
 * Tbilisi Architecture Service (tas.ge / docs.tbilisi.gov.ge) — public GIS + permits.
 * WFS: permit shapes (ARCHITECTURE_LR). DWR: public docs + PDF attachments.
 * ponytail: point/cadastral lookup only — no city-wide dump (GeoServer + DWR rate limits).
 */

import { closeRing, geometryRing, ringCentroid, ringContains } from './pick-building'

const UA = 'sivrce-maps/1.0 (sivrce888@gmail.com)'
const WFS =
  (typeof process !== 'undefined' && process.env.TAS_WFS_URL?.replace(/\/$/, '')) ||
  'http://mgis.tbilisi.gov.ge/geoserv/cite/wfs'
const DOCS = 'https://docs.tbilisi.gov.ge'
const DWR = `${DOCS}/docflow/dwr/call/plaincall`

export type TasArchShape = {
  objId: number
  archLrId: number
  statusId: number | null
  statusName: string | null
  ring: [number, number][]
  lat: number
  lng: number
}

export type TasPublicDoc = {
  documentId: number
  documentNo: string
  address: string
  createDateStr: string | null
  documentStatusId: number | null
  publicUrl: string
}

export type TasAttachedFile = {
  attachedFileId: number
  fileName: string
  downloadUrl: string
}

export type TasDocDetail = TasPublicDoc & {
  naprCadCode: string | null
  files: TasAttachedFile[]
}

/** Official public page for a permit application. */
export function tasPublicDocUrl(documentId: number): string {
  return `https://tas.ge/?p=publicpage&documentId=${documentId}`
}

export function tasFileDownloadUrl(attachedFileId: number): string {
  return `${DOCS}/DownloadServlet?downloadCase=2&attachedFileId=${attachedFileId}`
}

/** Decode DWR `"\\u10D7..."` string literals. */
export function dwrUnquote(raw: string): string {
  try {
    return JSON.parse(`"${raw}"`) as string
  } catch {
    return raw.replace(/\\u([0-9a-fA-F]{4})/g, (_, h: string) =>
      String.fromCharCode(parseInt(h, 16)),
    )
  }
}

type GeoFeat = {
  geometry?: GeoJSON.Geometry
  properties?: {
    OBJ_ID?: number
    ARCH_LR_ID?: number
    DOCUMENT_STATUS_ID?: number | null
    DOCUMENT_STATUS_NAME?: string | null
  }
}

/** Pure: GeoJSON FeatureCollection → shapes with closed rings. */
export function shapesFromWfsJson(json: unknown): TasArchShape[] {
  const fc = json as { features?: GeoFeat[] }
  const out: TasArchShape[] = []
  for (const f of fc?.features ?? []) {
    const raw = geometryRing(f.geometry)
    if (!raw) continue
    const ring = closeRing(raw.map(([lng, lat]) => [lng, lat] as [number, number]))
    if (ring.length < 5) continue
    const objId = Number(f.properties?.OBJ_ID)
    if (!Number.isFinite(objId)) continue
    const c = ringCentroid(ring)
    out.push({
      objId,
      archLrId: Number(f.properties?.ARCH_LR_ID) || 0,
      statusId:
        f.properties?.DOCUMENT_STATUS_ID == null
          ? null
          : Number(f.properties.DOCUMENT_STATUS_ID),
      statusName: f.properties?.DOCUMENT_STATUS_NAME ?? null,
      ring,
      lat: c.lat,
      lng: c.lng,
    })
  }
  return out
}

/** Pure: DWR getDocsForPublicInfo reply text → docs. */
export function parsePublicDocsDwr(text: string): TasPublicDoc[] {
  if (!text.includes('isSuccess:true')) return []
  const out: TasPublicDoc[] = []
  // Records interleave fields; scan each `{...documentId...}` chunk roughly.
  const chunks = text.split(/\{(?=[^}]*documentId:)/)
  for (const chunk of chunks) {
    const id = chunk.match(/documentId:(\d+)/)?.[1]
    const no = chunk.match(/documentNo:"((?:\\.|[^"\\])*)"/)?.[1]
    if (!id || !no) continue
    const address = chunk.match(/address:"((?:\\.|[^"\\])*)"/)?.[1] ?? ''
    const createDateStr = chunk.match(/createDateStr:"((?:\\.|[^"\\])*)"/)?.[1] ?? null
    const status = chunk.match(/documentStatusId:(\d+)/)?.[1]
    const documentId = Number(id)
    out.push({
      documentId,
      documentNo: dwrUnquote(no),
      address: dwrUnquote(address),
      createDateStr: createDateStr ? dwrUnquote(createDateStr) : null,
      documentStatusId: status ? Number(status) : null,
      publicUrl: tasPublicDocUrl(documentId),
    })
  }
  return out
}

/** Pure: DWR getUserDocumentLastMotion → files + meta. */
export function parseDocDetailDwr(text: string, documentId: number): TasDocDetail | null {
  if (!text.includes('isSuccess:true')) return null
  const no = text.match(/documentNo:"((?:\\.|[^"\\])*)"/)?.[1]
  if (!no) return null
  const address = text.match(/address:"((?:\\.|[^"\\])*)"/)?.[1] ?? ''
  const cad = text.match(/naprCadCode:"((?:\\.|[^"\\])*)"/)?.[1] ?? null
  const status = text.match(/documentStatusId:(\d+)/)?.[1]
  const createDateStr = text.match(/createDateStr:"((?:\\.|[^"\\])*)"/)?.[1] ?? null
  const files: TasAttachedFile[] = []
  const fileRe =
    /(\w+)\.attachedFileId=(\d+);[\s\S]*?\1\.fileName="((?:\\.|[^"\\])*)"/g
  for (const m of text.matchAll(fileRe)) {
    const attachedFileId = Number(m[2])
    files.push({
      attachedFileId,
      fileName: dwrUnquote(m[3]!),
      downloadUrl: tasFileDownloadUrl(attachedFileId),
    })
  }
  return {
    documentId,
    documentNo: dwrUnquote(no),
    address: dwrUnquote(address),
    createDateStr: createDateStr ? dwrUnquote(createDateStr) : null,
    documentStatusId: status ? Number(status) : null,
    publicUrl: tasPublicDocUrl(documentId),
    naprCadCode: cad ? dwrUnquote(cad) : null,
    files,
  }
}

type DwrSession = { cookie: string; httpSessionId: string; scriptSessionId: string }

function cookieHeader(res: Response): { cookie: string; httpSessionId: string } {
  const any = res.headers as Headers & { getSetCookie?: () => string[] }
  const parts = any.getSetCookie?.() ?? []
  const pairs: string[] = []
  let httpSessionId = ''
  for (const raw of parts) {
    const pair = raw.split(';')[0]
    if (!pair) continue
    pairs.push(pair)
    const [name, val] = pair.split('=')
    if (name && /session/i.test(name) && val) httpSessionId = val
  }
  if (!pairs.length) {
    const one = res.headers.get('set-cookie')
    if (one) {
      const pair = one.split(';')[0]!
      pairs.push(pair)
      const [name, val] = pair.split('=')
      if (name && /session/i.test(name) && val) httpSessionId = val
    }
  }
  return { cookie: pairs.join('; '), httpSessionId }
}

async function openDwrSession(): Promise<DwrSession | null> {
  try {
    const page = await fetch(`${DOCS}/architect/publicInformation.html`, {
      headers: { 'User-Agent': UA },
      signal: AbortSignal.timeout(12_000),
      cache: 'no-store',
    })
    const { cookie, httpSessionId } = cookieHeader(page)
    const body = [
      'callCount=1',
      'windowName=',
      'page=/architect/publicInformation.html',
      'httpSessionId=',
      'scriptSessionId=',
      'c0-scriptName=ArchCommons',
      'c0-methodName=getLayersInGroups',
      'c0-id=0',
      'batchId=0',
    ].join('\n')
    const boot = await fetch(`${DWR}/ArchCommons.getLayersInGroups.dwr`, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain',
        'User-Agent': UA,
        Referer: `${DOCS}/architect/publicInformation.html`,
        ...(cookie ? { Cookie: cookie } : {}),
      },
      body,
      signal: AbortSignal.timeout(12_000),
      cache: 'no-store',
    })
    const text = await boot.text()
    const scriptSessionId = text.match(/handleNewScriptSession\("([A-F0-9]+)"/)?.[1]
    const merged = cookieHeader(boot)
    const cookie2 = [cookie, merged.cookie].filter(Boolean).join('; ')
    if (!scriptSessionId) return null
    return {
      cookie: cookie2,
      httpSessionId: merged.httpSessionId || httpSessionId,
      scriptSessionId,
    }
  } catch {
    return null
  }
}

async function dwrCall(
  session: DwrSession,
  script: string,
  method: string,
  paramLine: string,
  batchId: number,
): Promise<string | null> {
  const body = [
    'callCount=1',
    'windowName=',
    'page=/architect/publicInformation.html',
    `httpSessionId=${session.httpSessionId}`,
    `scriptSessionId=${session.scriptSessionId}`,
    `c0-scriptName=${script}`,
    `c0-methodName=${method}`,
    'c0-id=0',
    paramLine,
    `batchId=${batchId}`,
  ].join('\n')
  try {
    const res = await fetch(`${DWR}/${script}.${method}.dwr`, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain',
        'User-Agent': UA,
        Referer: `${DOCS}/architect/publicInformation.html`,
        Cookie: session.cookie,
      },
      body,
      signal: AbortSignal.timeout(20_000),
      cache: 'no-store',
    })
    if (!res.ok) return null
    return await res.text()
  } catch {
    return null
  }
}

/** უარყოფა last; თანხმობა first. */
export function tasStatusRank(name: string | null): number {
  if (name === 'უარყოფა') return 99
  if (name === 'თანხმობა') return 0
  if (name === 'შუალედური') return 1
  if (name === 'განუხილველი') return 2
  return 3
}

function tasHaversineM(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6_371_000
  const p1 = (lat1 * Math.PI) / 180
  const p2 = (lat2 * Math.PI) / 180
  const dp = ((lat2 - lat1) * Math.PI) / 180
  const dl = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dp / 2) ** 2 + Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) ** 2
  return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function tasBboxHalfM(ring: [number, number][]): number {
  let minLng = Infinity
  let maxLng = -Infinity
  let minLat = Infinity
  let maxLat = -Infinity
  for (const p of ring) {
    const lng = p[0]
    const lat = p[1]
    if (lng === undefined || lat === undefined) continue
    if (lng < minLng) minLng = lng
    if (lng > maxLng) maxLng = lng
    if (lat < minLat) minLat = lat
    if (lat > maxLat) maxLat = lat
  }
  const latC = (minLat + maxLat) / 2
  const w = (maxLng - minLng) * 111_320 * Math.cos((latC * Math.PI) / 180)
  const h = (maxLat - minLat) * 111_320
  return Math.max(w, h) / 2
}

/** Building-scale TAS permits at a pin. Dedupes revisions; skips უარყოფა + district blobs. */
export function pickTasShapesForPin(
  shapes: TasArchShape[],
  lat: number,
  lng: number,
  opts?: { campus?: boolean; maxPinM?: number },
): TasArchShape[] {
  const maxPin = opts?.maxPinM ?? (opts?.campus ? 350 : 220)
  const maxHalf = opts?.campus ? 280 : 150
  type Row = { s: TasArchShape; d: number; contains: boolean; rank: number; half: number }
  const scored: Row[] = []
  for (const s of shapes) {
    const rank = tasStatusRank(s.statusName)
    if (rank >= 99) continue
    const half = tasBboxHalfM(s.ring)
    if (half < 12 || half > maxHalf) continue
    const contains = ringContains(s.ring, lng, lat)
    const d = tasHaversineM(lat, lng, s.lat, s.lng)
    if (!contains && d > maxPin) continue
    scored.push({ s, d, contains, rank, half })
  }
  const byKey = new Map<string, Row>()
  for (const row of scored) {
    const k = `${row.s.lat.toFixed(5)}:${row.s.lng.toFixed(5)}:${Math.round(row.half)}`
    const prev = byKey.get(k)
    if (!prev || row.rank < prev.rank || (row.rank === prev.rank && row.d < prev.d)) {
      byKey.set(k, row)
    }
  }
  const uniq = [...byKey.values()].sort((a, b) => {
    if (a.contains !== b.contains) return a.contains ? -1 : 1
    if (a.rank !== b.rank) return a.rank - b.rank
    if (Math.abs(a.d - b.d) <= 30 && a.s.ring.length !== b.s.ring.length) {
      return b.s.ring.length - a.s.ring.length
    }
    return a.d - b.d
  })
  if (!uniq.length) return []
  const best = uniq[0]!
  // Single pin: one permit. Campus: keep going so a lot outline can yield to towers.
  if (!opts?.campus) return [best.s]
  const parts = uniq.filter(
    (r) => r.half >= 16 && tasHaversineM(best.s.lat, best.s.lng, r.s.lat, r.s.lng) <= 90,
  )
  let picked: Row[] = parts.length >= 2 ? parts : [best]

  // Drop whole-site outlines when building-scale permits exist (m² Highlight, m³ Saburtalo).
  const buildingScale = picked.filter((r) => r.half <= 95)
  if (buildingScale.length >= 1 && picked.some((r) => r.half > 100)) {
    picked = buildingScale
  }

  const dedupeByLoc = (rows: Row[]): Row[] => {
    const byLoc = new Map<string, Row>()
    for (const r of rows) {
      const k = `${r.s.lat.toFixed(4)}:${r.s.lng.toFixed(4)}`
      const prev = byLoc.get(k)
      if (
        !prev ||
        r.rank < prev.rank ||
        (r.rank === prev.rank && r.s.ring.length > prev.s.ring.length)
      ) {
        byLoc.set(k, r)
      }
    }
    return [...byLoc.values()].sort((a, b) => a.d - b.d)
  }

  /** Best-separated medium footprints — twin towers when major blobs overlap (m² Highlight). */
  const pickTwinPair = (candidates: Row[], maxPinM: number): Row[] | null => {
    const twinMaxD = Math.min(55, maxPinM * 0.35)
    const pool = candidates.filter((r) => r.half >= 18 && r.half <= 44 && r.d <= twinMaxD)
    let best: [Row, Row] | null = null
    let bestScore = -Infinity
    for (let i = 0; i < pool.length; i++) {
      for (let j = i + 1; j < pool.length; j++) {
        const a = pool[i]!
        const b = pool[j]!
        const dist = tasHaversineM(a.s.lat, a.s.lng, b.s.lat, b.s.lng)
        const minSep = (a.half + b.half) * 0.3
        if (dist < minSep) continue
        const score = dist - (a.d + b.d) * 0.4
        if (score > bestScore) {
          bestScore = score
          best = [a, b]
        }
      }
    }
    return best
  }

  // Twin-cylinder: compact rings with half ≥45 — but reject when they overlap (TAS site pentagons).
  const compact = picked.filter((r) => r.s.ring.length <= 12 && r.half >= 18 && r.half <= 65)
  const majorTowers = compact.filter((r) => r.half >= 45)
  if (majorTowers.length >= 2) {
    const towers = dedupeByLoc(majorTowers)
    if (towers.length >= 2) {
      const dist = tasHaversineM(towers[0]!.s.lat, towers[0]!.s.lng, towers[1]!.s.lat, towers[1]!.s.lng)
      const minSep = (towers[0]!.half + towers[1]!.half) * 0.35
      if (dist >= minSep) return towers.map((r) => r.s)
    }
  }

  const mediumPool = dedupeByLoc(picked.filter((r) => r.half >= 18 && r.half <= 44))
  const twinPair = pickTwinPair(mediumPool, maxPin)
  if (twinPair) return twinPair.map((r) => r.s)

  if (compact.length >= 2) {
    const towers = dedupeByLoc(compact)
    if (towers.length >= 2) return towers.map((r) => r.s)
  }

  // Large campus: drop shed-sized hits when real blocks exist (m³ Saburtalo).
  if (opts?.campus && picked.length >= 2) {
    const blocks = dedupeByLoc(picked.filter((r) => r.half >= 40 && r.half <= 95))
    if (blocks.length >= 2) return blocks.map((r) => r.s)
    const mid = dedupeByLoc(picked.filter((r) => r.half >= 30 && r.half <= 95))
    if (mid.length >= 2) return mid.map((r) => r.s)
  }

  return picked.map((r) => r.s)
}

async function fetchTasShapesOnce(
  lat: number,
  lng: number,
  padDeg: number,
  maxFeatures: number,
): Promise<TasArchShape[]> {
  const minLng = lng - padDeg
  const minLat = lat - padDeg
  const maxLng = lng + padDeg
  const maxLat = lat + padDeg
  const url =
    `${WFS}?` +
    new URLSearchParams({
      service: 'WFS',
      version: '1.1.0',
      request: 'GetFeature',
      typeName: 'cite:ARCHITECTURE_LR',
      outputFormat: 'application/json',
      srsName: 'EPSG:4326',
      maxFeatures: String(Math.min(Math.max(maxFeatures, 1), 80)),
      bbox: `${minLng},${minLat},${maxLng},${maxLat},EPSG:4326`,
    }).toString()
  const res = await fetch(url, {
    headers: { 'User-Agent': UA },
    signal: AbortSignal.timeout(14_000),
    cache: 'no-store',
  })
  if (!res.ok) return []
  const text = await res.text()
  if (!text || text.startsWith('<?xml') || text.startsWith('<')) return []
  try {
    return shapesFromWfsJson(JSON.parse(text) as unknown)
  } catch {
    return []
  }
}

/** Permit polygons at the pin. Tight bbox first — wide 650 m dumps the first 40 of the city. */
export async function fetchTasShapesAt(
  lat: number,
  lng: number,
  padDeg = 0.0009,
  maxFeatures = 40,
): Promise<TasArchShape[]> {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return []
  const pads = [...new Set([0.00045, padDeg, Math.max(padDeg, 0.0015)])].sort((a, b) => a - b)
  for (let i = 0; i < pads.length; i++) {
    try {
      const shapes = await fetchTasShapesOnce(lat, lng, pads[i]!, maxFeatures)
      if (shapes.length) return shapes
    } catch {
      /* GeoServer 503 / truncated JSON */
    }
    if (i < pads.length - 1) await new Promise((r) => setTimeout(r, 220))
  }
  return []
}

/** Public permit list by NAPR cadastral (dotted). */
export async function fetchTasDocsByCadastral(
  code: string,
  limit = 20,
): Promise<TasPublicDoc[]> {
  const cad = code.trim()
  if (!/^\d{2}(\.\d{2,3}){2,5}$/.test(cad)) return []
  const session = await openDwrSession()
  if (!session) return []
  const param =
    `c0-param0=Object:{applicationId:number:2, naprCadCode:string:${cad}, start:number:0, limit:number:${Math.min(limit, 50)}}`
  const text = await dwrCall(session, 'DocumentManager', 'getDocsForPublicInfo', param, 1)
  return text ? parsePublicDocsDwr(text) : []
}

/** Public permit list by application number (AR1… or digits). */
export async function fetchTasDocsByDocumentNo(
  documentNo: string,
  limit = 10,
): Promise<TasPublicDoc[]> {
  let no = documentNo.trim().toUpperCase()
  if (!no) return []
  if (!no.startsWith('AR1')) no = `AR1${no.replace(/^AR1?/i, '')}`
  const session = await openDwrSession()
  if (!session) return []
  const param =
    `c0-param0=Object:{applicationId:number:2, documentNo:string:${no}, start:number:0, limit:number:${Math.min(limit, 50)}}`
  const text = await dwrCall(session, 'DocumentManager', 'getDocsForPublicInfo', param, 2)
  return text ? parsePublicDocsDwr(text) : []
}

/** Full public wrapper: meta + PDF attachment links (plans / schedules). */
export async function fetchTasDocDetail(
  documentId: number,
): Promise<TasDocDetail | null> {
  if (!Number.isFinite(documentId) || documentId <= 0) return null
  const session = await openDwrSession()
  if (!session) return null
  const text = await dwrCall(
    session,
    'UserMethods',
    'getUserDocumentLastMotion',
    `c0-param0=number:${documentId}`,
    3,
  )
  return text ? parseDocDetailDwr(text, documentId) : null
}

export async function probeTasArch(): Promise<boolean> {
  try {
    const url =
      `${WFS}?` +
      new URLSearchParams({
        service: 'WFS',
        version: '1.1.0',
        request: 'GetCapabilities',
      }).toString()
    const res = await fetch(url, {
      headers: { 'User-Agent': UA },
      signal: AbortSignal.timeout(10_000),
      cache: 'no-store',
    })
    if (!res.ok) return false
    const t = await res.text()
    return t.includes('ARCHITECTURE_LR')
  } catch {
    return false
  }
}
