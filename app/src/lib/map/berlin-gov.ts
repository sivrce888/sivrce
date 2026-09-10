/**
 * Berlin public data + government services (sivrce.de).
 * ALKIS parcels/buildings via GDI Berlin WFS; everything else is a verified
 * registry entry (no guessed endpoints — WFS slugs below were read from live
 * GetCapabilities 2026-09; BORIS/B-Pläne stay portal links until their WFS
 * slugs are confirmed the same way).
 * License: Datenlizenz Deutschland – Zero – 2.0 (dl-de-zero-2.0).
 * ponytail: point/bbox WFS only; upgrade → Geofabrik PBF dump for full-city mass ingest.
 */

import { closeRing, geometryRing, ringCentroid } from './pick-building'

const UA = 'sivrce-maps/1.0 (sivrce888@gmail.com)'

/** Berlin city bbox [w,s,e,n] — ingest tiles + service-area checks. */
export const BERLIN_BBOX = { west: 13.08, south: 52.32, east: 13.77, north: 52.68 } as const

export function inBerlin(lat: number, lng: number): boolean {
  return lat >= BERLIN_BBOX.south && lat <= BERLIN_BBOX.north && lng >= BERLIN_BBOX.west && lng <= BERLIN_BBOX.east
}

const WFS_BASE =
  (typeof process !== 'undefined' && process.env.BERLIN_WFS_BASE?.replace(/\/$/, '')) ||
  'https://gdi.berlin.de/services/wfs'
/** Verified 2026-09: GetCapabilities → alkis_flurstuecke:flurstuecke. */
const PARCEL_SVC =
  (typeof process !== 'undefined' && process.env.BERLIN_WFS_PARCELS) || 'alkis_flurstuecke'
const PARCEL_TYPE =
  (typeof process !== 'undefined' && process.env.BERLIN_WFS_PARCEL_TYPE) ||
  'alkis_flurstuecke:flurstuecke'
/** Verified 2026-09: GetCapabilities → alkis_gebaeude:gebaeude. */
const BUILDING_SVC =
  (typeof process !== 'undefined' && process.env.BERLIN_WFS_BUILDINGS) || 'alkis_gebaeude'
const BUILDING_TYPE =
  (typeof process !== 'undefined' && process.env.BERLIN_WFS_BUILDING_TYPE) ||
  'alkis_gebaeude:gebaeude'

export type AlkisParcel = {
  /** Flurstückskennzeichen (fsko) — legal lot id, NAPR UNIQ_CODE equivalent. */
  kennzeichen: string
  areaM2: number | null
  ring: [number, number][]
  lat: number
  lng: number
  source: 'alkis'
}

export type AlkisBuilding = {
  id: string | null
  ring: [number, number][]
  lat: number
  lng: number
  name: string | null
  funktion: string | null
}

type WfsFC = { features?: Array<{ id?: string | number; geometry?: GeoJSON.Geometry | null; properties?: Record<string, unknown> | null }> }

function str(v: unknown): string | null {
  const s = String(v ?? '').trim()
  return s || null
}

function num(v: unknown): number | null {
  const n = typeof v === 'number' ? v : Number(v)
  return Number.isFinite(n) && n > 0 ? n : null
}

/** Pure: WFS GeoJSON → best parcel (smallest amtliche Fläche wins, mirrors NAPR). */
export function pickAlkisParcelFromFC(fc: WfsFC | null | undefined): AlkisParcel | null {
  const feats = fc?.features
  if (!Array.isArray(feats)) return null
  let best: AlkisParcel | null = null
  let bestArea = Number.POSITIVE_INFINITY
  for (const f of feats) {
    const ring = geometryRing(f.geometry)
    if (!ring) continue
    const p = f.properties ?? {}
    // Field names: ALKIS Berlin Datenformatbeschreibung (fsko, afl, zae/nen).
    const kennzeichen =
      str(p.fsko) ?? ([str(p.zae), str(p.nen)].every(Boolean) ? `${p.zae}/${p.nen}` : null)
    if (!kennzeichen) continue
    const closed = closeRing(ring)
    if (closed.length < 5) continue
    const c = ringCentroid(closed)
    const area = num(p.afl)
    if (best && (area ?? Number.POSITIVE_INFINITY) >= bestArea) continue
    bestArea = area ?? Number.POSITIVE_INFINITY
    best = { kennzeichen, areaM2: area, ring: closed, lat: c.lat, lng: c.lng, source: 'alkis' }
  }
  return best
}

/** Pure: WFS GeoJSON → building footprints (largest polygon per feature). */
export function alkisBuildingsFromFC(fc: WfsFC | null | undefined): AlkisBuilding[] {
  const feats = fc?.features
  if (!Array.isArray(feats)) return []
  const out: AlkisBuilding[] = []
  for (const f of feats) {
    const ring = geometryRing(f.geometry)
    if (!ring) continue
    const closed = closeRing(ring)
    if (closed.length < 5) continue
    const p = f.properties ?? {}
    const c = ringCentroid(closed)
    out.push({
      id: str(p.uuid) ?? str(p.gml_id) ?? (f.id != null ? String(f.id) : null),
      ring: closed,
      lat: c.lat,
      lng: c.lng,
      name: str(p.nam) ?? str(p.name),
      funktion: str(p.bezbwf) ?? str(p.bezart) ?? str(p.funktion),
    })
  }
  return out
}

async function wfsGetFeature(
  svc: string,
  typeName: string,
  bbox: { west: number; south: number; east: number; north: number },
  count = 20,
): Promise<WfsFC | null> {
  const url =
    `${WFS_BASE}/${svc}?service=WFS&version=2.0.0&request=GetFeature` +
    `&typeNames=${encodeURIComponent(typeName)}&srsName=EPSG:4326` +
    `&bbox=${bbox.west},${bbox.south},${bbox.east},${bbox.north},EPSG:4326` +
    `&outputFormat=application/json&count=${count}`
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': UA, Accept: 'application/json' },
      signal: AbortSignal.timeout(14_000),
      cache: 'no-store',
    })
    if (!res.ok) return null
    return (await res.json()) as WfsFC
  } catch {
    return null
  }
}

/** ALKIS parcel under a Berlin pin (legal lot — NAPR equivalent). */
export async function fetchAlkisParcelAt(lat: number, lng: number): Promise<AlkisParcel | null> {
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || !inBerlin(lat, lng)) return null
  const pad = 0.0004 // ~30 m
  const fc = await wfsGetFeature(PARCEL_SVC, PARCEL_TYPE, {
    west: lng - pad,
    south: lat - pad,
    east: lng + pad,
    north: lat + pad,
  })
  return pickAlkisParcelFromFC(fc)
}

/** ALKIS building footprints in a bbox (corpus ingest / map paint). */
export async function fetchAlkisBuildingsInBbox(
  bbox: { west: number; south: number; east: number; north: number },
  count = 500,
): Promise<AlkisBuilding[]> {
  return alkisBuildingsFromFC(await wfsGetFeature(BUILDING_SVC, BUILDING_TYPE, bbox, count))
}

/**
 * Every Berlin public-data / government source sivrce.de reads.
 * `wfs` = live GetFeature path; `portal` = human/official entry point.
 * Only URLs seen live are listed — nothing guessed.
 */
export type BerlinSource = {
  key: string
  name: string
  publisher: string
  license: string
  wfs?: string
  typeName?: string
  portal: string
  use: string
}

export const BERLIN_SOURCES: BerlinSource[] = [
  {
    key: 'alkis-parcels',
    name: 'ALKIS Berlin Flurstücke',
    publisher: 'Senatsverwaltung für Stadtentwicklung, Bauen und Wohnen',
    license: 'dl-de-zero-2.0',
    wfs: `${WFS_BASE}/${PARCEL_SVC}`,
    typeName: PARCEL_TYPE,
    portal: 'https://daten.berlin.de/datensaetze/alkis-berlin-flurstucke-wfs-1bc014d7',
    use: 'Legal lot polygon for any Berlin pin (NAPR equivalent).',
  },
  {
    key: 'alkis-buildings',
    name: 'ALKIS Berlin Gebäude',
    publisher: 'Senatsverwaltung für Stadtentwicklung, Bauen und Wohnen',
    license: 'dl-de-zero-2.0',
    wfs: `${WFS_BASE}/${BUILDING_SVC}`,
    typeName: BUILDING_TYPE,
    portal: 'https://daten.berlin.de/datensaetze/alkis-berlin-gebaude-wfs-728b368a',
    use: 'Authoritative footprints — seeds osm_buildings city=berlin.',
  },
  {
    key: 'lod2',
    name: '3D-Gebäudemodelle LoD2',
    publisher: 'Senatsverwaltung für Stadtentwicklung, Bauen und Wohnen',
    license: 'dl-de-zero-2.0',
    portal: 'https://daten.berlin.de/datensaetze/3d-gebaudemodelle-im-level-of-detail-2-lod-2-3c7c49af',
    use: 'Roof shapes + ridge heights for 3D massing (CityGML download).',
  },
  {
    key: 'boris',
    name: 'BORIS Berlin Bodenrichtwerte',
    publisher: 'Gutachterausschuss für Grundstückswerte in Berlin',
    license: 'dl-de-zero-2.0',
    portal: 'https://fbinter.stadt-berlin.de/boris',
    use: 'Official land values since 1964 — price context per lot.',
  },
  {
    key: 'bplaene',
    name: 'Bebauungspläne (FIS-Broker)',
    publisher: 'Senatsverwaltung für Stadtentwicklung, Bauen und Wohnen',
    license: 'dl-de-zero-2.0',
    portal: 'https://fbinter.stadt-berlin.de/',
    use: 'Binding zoning per lot — what may be built (development pipeline).',
  },
  {
    key: 'osm',
    name: 'OpenStreetMap Berlin',
    publisher: 'OpenStreetMap contributors (ODbL)',
    license: 'ODbL',
    portal: 'https://download.geofabrik.de/europe/germany/berlin.html',
    use: 'Buildings/POIs/geocoding — Overpass live + Geofabrik bulk.',
  },
  {
    key: 'statistik',
    name: 'Amt für Statistik Berlin-Brandenburg',
    publisher: 'AfS Berlin-Brandenburg',
    license: 'dl-de-zero-2.0',
    portal: 'https://www.statistik-berlin-brandenburg.de/',
    use: 'Baugenehmigungen / Baufertigstellungen — supply pipeline stats.',
  },
  {
    key: 'mietspiegel',
    name: 'Berliner Mietspiegel',
    publisher: 'Senatsverwaltung für Stadtentwicklung, Bauen und Wohnen',
    license: 'dl-de-zero-2.0',
    portal: 'https://www.berlin.de/sen/wohnen/service/mietspiegel/',
    use: 'Regulated rent benchmarks — rent estimates per district.',
  },
  {
    key: 'opendata',
    name: 'Berlin Open Data (alle Datensätze)',
    publisher: 'Land Berlin',
    license: 'dl-de-zero-2.0',
    portal: 'https://daten.berlin.de/',
    use: 'Index for Denkmale, LOR, Energieatlas/Solaratlas, Bauvorhaben.',
  },
]
