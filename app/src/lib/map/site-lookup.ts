/**
 * Site lookup: corpus DB → OSM Overpass → NAPR parcel + TAS permits.
 * Display ring prefers building (corpus/OSM); cadastral / legal lot from NAPR.
 * Write-through: live Overpass hits land in osm_buildings.
 * ponytail: no tile cache. Upgrade → national scheduled ingest only.
 */

import {
  corpusCityAt,
  fetchCorpusBuildingNear,
  upsertCorpusBuilding,
} from './osm-corpus'
import { fetchAlkisParcelAt, type AlkisParcel } from './berlin-gov'
import { inGermany } from './map-geo'
import { fetchNaprParcelAt, fetchNaprParcelByCode, type NaprParcel } from './napr-parcel'
import { fetchOsmBuilding, type OsmBuildingHit } from './osm-building-ring'
import {
  fetchTasDocsByCadastral,
  fetchTasShapesAt,
  pickTasShapesForPin,
  type TasArchShape,
  type TasPublicDoc,
} from './tas-arch'

export type SiteLookup = {
  lat: number
  lng: number
  parcel: NaprParcel | null
  /** Berlin legal lot (ALKIS Flurstück) — NAPR equivalent for DE pins. */
  alkisParcel: AlkisParcel | null
  building: OsmBuildingHit | null
  /** Best contour for map paint: building → TAS permit → cadastral lot. */
  ring: [number, number][] | null
  ringSource: 'osm' | 'tas' | 'napr' | 'corpus' | 'alkis' | null
  /** TAS Architecture Service permit polygons near pin (Tbilisi). */
  tasShapes: TasArchShape[]
  /** TAS public permits when cadastral known. */
  tasDocs: TasPublicDoc[]
}

export async function lookupSite(opts: {
  code?: string | null
  lat?: number
  lng?: number
}): Promise<SiteLookup | null> {
  const code = opts.code?.trim() || null
  let parcel: NaprParcel | null = null
  let lat = opts.lat
  let lng = opts.lng

  if (code) {
    parcel = await fetchNaprParcelByCode(code)
    if (parcel) {
      lat = parcel.lat
      lng = parcel.lng
    }
  }

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null

  // NAPR/TAS are Georgia-only; Berlin pins use ALKIS instead.
  const de = inGermany(lat!, lng!)

  // ponytail: don't block OSM/TAS if maps.gov.ge is slow (ceiling ~6s).
  const parcelWait =
    parcel || de
      ? Promise.resolve(parcel)
      : Promise.race([
          fetchNaprParcelAt(lat!, lng!),
          new Promise<null>((r) => setTimeout(() => r(null), 6_000)),
        ])

  const alkisWait = de
    ? Promise.race([
        fetchAlkisParcelAt(lat!, lng!),
        new Promise<null>((r) => setTimeout(() => r(null), 6_000)),
      ])
    : Promise.resolve(null)

  const [parcelPin, alkisParcel, corpus, tasShapes, tasDocsEarly] = await Promise.all([
    parcelWait,
    alkisWait,
    fetchCorpusBuildingNear(lat!, lng!),
    de ? Promise.resolve([]) : fetchTasShapesAt(lat!, lng!),
    code && !de ? fetchTasDocsByCadastral(code) : Promise.resolve([] as TasPublicDoc[]),
  ])

  parcel = parcel ?? parcelPin

  let building: OsmBuildingHit | null = corpus
  let ringSource: SiteLookup['ringSource'] = corpus ? 'corpus' : null

  if (!building) {
    building = await fetchOsmBuilding(lat!, lng!)
    if (building) {
      ringSource = 'osm'
      void upsertCorpusBuilding(building, corpusCityAt(lat!, lng!))
    }
  }

  let tasDocs = tasDocsEarly
  const parcelCode = parcel?.uniqCode?.trim() || null
  if (!tasDocs.length && parcelCode && parcelCode !== code) {
    tasDocs = await fetchTasDocsByCadastral(parcelCode)
  }

  if (!building && !parcel && !alkisParcel && !tasShapes.length && !tasDocs.length) {
    return {
      lat: lat!,
      lng: lng!,
      parcel: null,
      alkisParcel: null,
      building: null,
      ring: null,
      ringSource: null,
      tasShapes: [],
      tasDocs: [],
    }
  }

  const tasBest = pickTasShapesForPin(tasShapes, lat!, lng!)[0]
  const ring = building?.ring ?? tasBest?.ring ?? parcel?.ring ?? alkisParcel?.ring ?? null
  if (!ringSource) {
    ringSource = building ? 'osm' : tasBest ? 'tas' : parcel ? 'napr' : alkisParcel ? 'alkis' : null
  }

  return {
    lat: lat!,
    lng: lng!,
    parcel,
    alkisParcel,
    building,
    ring,
    ringSource,
    tasShapes,
    tasDocs,
  }
}
