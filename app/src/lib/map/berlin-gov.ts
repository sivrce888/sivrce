/**
 * Berlin public data + government services (sivrce.de).
 * ALKIS parcels/buildings + B-Pläne via GDI Berlin WFS; everything else is a
 * verified registry entry (no guessed endpoints — WFS slugs below were read
 * from live GetCapabilities 2026-09; BORIS stays portal until confirmed).
 * License: Datenlizenz Deutschland – Zero – 2.0 (dl-de-zero-2.0).
 * ponytail: point/bbox WFS only; upgrade → Geofabrik PBF dump for full-city mass ingest.
 */

import { officialBplanPdf } from './berlin-pdf'
import { closeRing, geometryRing, ringCentroid } from './pick-building'

export { officialBplanPdf }

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

/** Verified 2026-09: daten.berlin.de → gdi.berlin.de/services/wfs/step_wo_2040 GetCapabilities. */
export const STEP_WFS =
  (typeof process !== 'undefined' && process.env.BERLIN_WFS_STEP?.replace(/\/$/, '')) ||
  'https://gdi.berlin.de/services/wfs/step_wo_2040'

/** Verified FeatureType Names from live GetCapabilities (never invent). */
export const STEP_LAYERS = {
  potential: 'step_wo_2040:h_step_wo_2040_wobau_fertig',
  gemeinwohl: 'step_wo_2040:i_step_wo_2040_wobau_gemeinw',
  quartier: 'step_wo_2040:j_step_wo_2040_neustadtquar',
  priority: 'step_wo_2040:g_step_wo_2040_vorkulinnentw',
  konzept: 'step_wo_2040:k_step_wo_2040_innentwkonz',
} as const

export type StepLayerKey = keyof typeof STEP_LAYERS

/** Verified 2026-09: gdi.berlin.de/services/wfs/bplan GetCapabilities. */
export const BPLAN_WFS =
  (typeof process !== 'undefined' && process.env.BERLIN_WFS_BPLAN?.replace(/\/$/, '')) ||
  'https://gdi.berlin.de/services/wfs/bplan'

/**
 * Live FeatureType Names. Skip `bplan:c_bp_ak` (außer Kraft) — repealed plans
 * would look like current zoning.
 */
export const BPLAN_LAYERS = {
  festgesetzt: 'bplan:b_bp_fs',
  verfahren: 'bplan:a_bp_iv',
} as const

export type BplanLayerKey = keyof typeof BPLAN_LAYERS

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
  /** Official Geschosse oberirdisch (aog) when present. */
  floors: number | null
  /**
   * Height meters: official `hoh` wins; else aog×3.0 (standard storey).
   * Never invent LoD2 roofs here.
   */
  heightM: number | null
  /** Where heightM came from — for provenance UI. */
  heightSource: 'hoh' | 'aog_x3' | null
}

/** Pure: ALKIS props → height. hoh official; else floors×3. */
export function alkisHeightM(p: Record<string, unknown>): {
  floors: number | null
  heightM: number | null
  heightSource: 'hoh' | 'aog_x3' | null
} {
  const floors = num(p.aog)
  const hoh = num(p.hoh)
  if (hoh != null) return { floors, heightM: hoh, heightSource: 'hoh' }
  if (floors != null) return { floors, heightM: floors * 3, heightSource: 'aog_x3' }
  return { floors: null, heightM: null, heightSource: null }
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

/** Pure: WFS GeoJSON → all parcels (ingest / MVT seed). */
export function alkisParcelsFromFC(fc: WfsFC | null | undefined): AlkisParcel[] {
  const feats = fc?.features
  if (!Array.isArray(feats)) return []
  const out: AlkisParcel[] = []
  const seen = new Set<string>()
  for (const f of feats) {
    const ring = geometryRing(f.geometry)
    if (!ring) continue
    const p = f.properties ?? {}
    const kennzeichen =
      str(p.fsko) ?? ([str(p.zae), str(p.nen)].every(Boolean) ? `${p.zae}/${p.nen}` : null)
    if (!kennzeichen || seen.has(kennzeichen)) continue
    const closed = closeRing(ring)
    if (closed.length < 5) continue
    const c = ringCentroid(closed)
    seen.add(kennzeichen)
    out.push({
      kennzeichen,
      areaM2: num(p.afl),
      ring: closed,
      lat: c.lat,
      lng: c.lng,
      source: 'alkis',
    })
  }
  return out
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
    const h = alkisHeightM(p)
    out.push({
      id: str(p.uuid) ?? str(p.gml_id) ?? (f.id != null ? String(f.id) : null),
      ring: closed,
      lat: c.lat,
      lng: c.lng,
      name: str(p.nam) ?? str(p.name) ?? str(p.hnr),
      funktion: str(p.bezbat) ?? str(p.bezbwf) ?? str(p.bezart) ?? str(p.funktion),
      floors: h.floors,
      heightM: h.heightM,
      heightSource: h.heightSource,
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

/** ALKIS parcels in a bbox → geo_features / MVT seed. */
export async function fetchAlkisParcelsInBbox(
  bbox: { west: number; south: number; east: number; north: number },
  count = 500,
): Promise<AlkisParcel[]> {
  return alkisParcelsFromFC(await wfsGetFeature(PARCEL_SVC, PARCEL_TYPE, bbox, count))
}

export type StepFeature = {
  id: string
  name: string | null
  layer: StepLayerKey
  geometry: GeoJSON.Geometry
  props: Record<string, unknown>
}

/** Pure: StEP WFS GeoJSON → typed features (official fields only). */
export function stepFeaturesFromFC(
  fc: WfsFC | null | undefined,
  layer: StepLayerKey,
): StepFeature[] {
  const feats = fc?.features
  if (!Array.isArray(feats)) return []
  const out: StepFeature[] = []
  for (const f of feats) {
    const g = f.geometry
    if (!g || (g.type !== 'Point' && g.type !== 'Polygon' && g.type !== 'MultiPolygon')) continue
    const p = f.properties ?? {}
    const gisid = str(p.gisid) ?? (f.id != null ? String(f.id) : null)
    if (!gisid) continue
    out.push({
      id: gisid,
      name: str(p.bez) ?? str(p.name),
      layer,
      geometry: g,
      props: {
        gisid,
        we_kat: str(p.we_kat),
        leg_fertig: str(p.leg_fertig),
        kat: str(p.kat),
        status: str(p.leg_fertig) ?? str(p.kat),
      },
    })
  }
  return out
}

async function stepWfsGetFeature(typeName: string, count = 2000): Promise<WfsFC | null> {
  const url =
    `${STEP_WFS}?service=WFS&version=2.0.0&request=GetFeature` +
    `&typeNames=${encodeURIComponent(typeName)}&srsName=EPSG:4326` +
    `&outputFormat=application/json&count=${count}`
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': UA, Accept: 'application/json' },
      signal: AbortSignal.timeout(30_000),
      cache: 'no-store',
    })
    if (!res.ok) return null
    return (await res.json()) as WfsFC
  } catch {
    return null
  }
}

/** Full StEP Wohnen 2040 layer pull (small official sets — hits verified ≤1055). */
export async function fetchStepLayer(layer: StepLayerKey): Promise<StepFeature[]> {
  return stepFeaturesFromFC(await stepWfsGetFeature(STEP_LAYERS[layer]), layer)
}

export type BplanFeature = {
  id: string
  name: string | null
  layer: BplanLayerKey
  geometry: GeoJSON.Geometry
  props: Record<string, unknown>
}

/** Pure: B-Plan WFS GeoJSON → typed features (official fields only). */
export function bplanFeaturesFromFC(
  fc: WfsFC | null | undefined,
  layer: BplanLayerKey,
): BplanFeature[] {
  const feats = fc?.features
  if (!Array.isArray(feats)) return []
  const out: BplanFeature[] = []
  for (const f of feats) {
    const g = f.geometry
    if (!g || (g.type !== 'Polygon' && g.type !== 'MultiPolygon')) continue
    const p = f.properties ?? {}
    const gisid = str(p.gisid) ?? str(p.planid) ?? (f.id != null ? String(f.id) : null)
    if (!gisid) continue
    const pdf = officialBplanPdf(p.scan_www)
    out.push({
      id: gisid,
      name: str(p.planname) ?? str(p.planid),
      layer,
      geometry: g,
      props: {
        gisid,
        planid: str(p.planid),
        planart: str(p.planartname),
        status: str(p.bp_rechtsstand),
        bezirk: str(p.bezirk),
        inhalt: str(p.inhalt),
        festsg_am: str(p.festsg_am),
        doc: pdf,
      },
    })
  }
  return out
}

async function bplanWfsGetFeature(typeName: string, count = 4000): Promise<WfsFC | null> {
  const url =
    `${BPLAN_WFS}?service=WFS&version=2.0.0&request=GetFeature` +
    `&typeNames=${encodeURIComponent(typeName)}&srsName=EPSG:4326` +
    `&outputFormat=application/json&count=${count}`
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': UA, Accept: 'application/json' },
      signal: AbortSignal.timeout(45_000),
      cache: 'no-store',
    })
    if (!res.ok) return null
    return (await res.json()) as WfsFC
  } catch {
    return null
  }
}

/** Full B-Plan layer (festgesetzt ~2.8k, im Verfahren ~1.2k — verified 2026-09). */
export async function fetchBplanLayer(layer: BplanLayerKey): Promise<BplanFeature[]> {
  return bplanFeaturesFromFC(await bplanWfsGetFeature(BPLAN_LAYERS[layer]), layer)
}

/** B-Plan polygons in a bbox (sample seed). */
export async function fetchBplanInBbox(
  layer: BplanLayerKey,
  bbox: { west: number; south: number; east: number; north: number },
  count = 200,
): Promise<BplanFeature[]> {
  return bplanFeaturesFromFC(await wfsGetFeature('bplan', BPLAN_LAYERS[layer], bbox, count), layer)
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
    use: 'Authoritative footprints — geo_features + osm_buildings city=berlin.',
  },
  {
    key: 'step-wohnen-2040',
    name: 'StEP Wohnen 2040 (WFS)',
    publisher: 'Senatsverwaltung für Stadtentwicklung, Bauen und Wohnen',
    license: 'dl-de-zero-2.0',
    wfs: STEP_WFS,
    typeName: STEP_LAYERS.potential,
    portal: 'https://daten.berlin.de/datensaetze/stadtentwicklungsplan-step-wohnen-2040-wfs-6e11830a',
    use: 'Official housing-development potentials + Neue Stadtquartiere (verified typeNames).',
  },
  {
    key: 'lod2',
    name: '3D-Gebäudemodelle LoD2',
    publisher: 'Senatsverwaltung für Stadtentwicklung, Bauen und Wohnen',
    license: 'dl-de-zero-2.0',
    portal: 'https://daten.berlin.de/datensaetze/3d-gebaudemodelle-im-level-of-detail-2-lod-2-3c7c49af',
    use: 'Roof shapes + ridge heights for 3D massing (CityGML download — bulk, not WFS).',
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
    name: 'Bebauungspläne (GDI WFS)',
    publisher: 'Senatsverwaltung für Stadtentwicklung, Bauen und Wohnen',
    license: 'dl-de-zero-2.0',
    wfs: BPLAN_WFS,
    typeName: BPLAN_LAYERS.festgesetzt,
    portal: 'https://daten.berlin.de/',
    use: 'Binding + in-procedure zoning polygons (verified typeNames 2026-09). Repealed layer skipped.',
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
