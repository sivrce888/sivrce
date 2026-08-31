/**
 * Tbilisi Architecture Service (tas.ge / docs.tbilisi.gov.ge) — public GIS + permits.
 * WFS: permit shapes (ARCHITECTURE_LR). DWR: public docs + PDF attachments.
 * ponytail: point/cadastral lookup only — no city-wide dump (GeoServer + DWR rate limits).
 */

import { closeRing, geometryRing, ringCentroid } from './pick-building'

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

/** Permit polygons near a pin (ARCHITECTURE_LR WFS). */
export async function fetchTasShapesAt(
  lat: number,
  lng: number,
  /** ~650 m — permit parcels often sit off the marketing pin. */
  padDeg = 0.006,
): Promise<TasArchShape[]> {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return []
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
      maxFeatures: '40',
      bbox: `${minLng},${minLat},${maxLng},${maxLat},EPSG:4326`,
    }).toString()
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': UA },
      signal: AbortSignal.timeout(14_000),
      cache: 'no-store',
    })
    if (!res.ok) return []
    return shapesFromWfsJson(await res.json())
  } catch {
    return []
  }
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
