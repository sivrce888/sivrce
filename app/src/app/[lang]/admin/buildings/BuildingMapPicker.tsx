'use client'

/**
 * Admin lat/lng + footprint: OSM snap or draw vertices on MapEmbed.
 */

import { useMemo, useState } from 'react'
import MapEmbed, { type MapEmbedPickMode } from '@/components/MapEmbed'
import { MAP_CENTER } from '@/lib/map/buildings'
import {
  closeRing,
  parseFootprintRing,
  ringCentroid,
} from '@/lib/map/pick-building'

const inputCls =
  'w-full rounded-[12px] border border-sv-ink/10 bg-white px-3.5 py-2.5 text-[14px] font-semibold text-sv-ink placeholder:text-sv-ink/30 focus:border-sv-blue focus:outline-none focus:ring-2 focus:ring-sv-blue/20'
const labelCls = 'mb-1.5 block text-[12px] font-extrabold text-sv-ink/55'
const btnCls =
  'rounded-full border border-sv-ink/12 px-3.5 py-1.5 text-[12px] font-extrabold text-sv-ink/70 transition hover:border-sv-blue hover:text-sv-blue disabled:opacity-40'
const btnActive =
  'rounded-full bg-sv-blue px-3.5 py-1.5 text-[12px] font-extrabold text-white'

function ringJson(ring: [number, number][] | null): string {
  if (!ring || ring.length < 4) return ''
  return JSON.stringify({ ring: closeRing(ring) })
}

export function BuildingMapPicker({
  lat: initialLat,
  lng: initialLng,
  polygonCoords,
}: {
  lat?: number | null
  lng?: number | null
  polygonCoords?: unknown
}) {
  const initialRing = useMemo(
    () => parseFootprintRing(polygonCoords),
    [polygonCoords],
  )
  const [coords, setCoords] = useState<{ lat: number; lng: number }>({
    lat: initialLat ?? MAP_CENTER.lat,
    lng: initialLng ?? MAP_CENTER.lng,
  })
  const [pickMode, setPickMode] = useState<MapEmbedPickMode>('snap')
  const [ring, setRing] = useState<[number, number][] | null>(initialRing)
  const [polyText, setPolyText] = useState(() => ringJson(initialRing))
  const [draft, setDraft] = useState<[number, number][]>([])

  const footprint = pickMode === 'draw' && draft.length > 0 ? draft : ring

  function applyRing(next: [number, number][] | null) {
    setRing(next)
    setPolyText(ringJson(next))
  }

  function onPick(lat: number, lng: number, osmRing?: [number, number][] | null) {
    if (pickMode === 'draw') {
      setDraft((d) => [...d, [lng, lat]])
      return
    }
    setCoords({ lat, lng })
    if (osmRing && osmRing.length >= 4) {
      applyRing(closeRing(osmRing))
      setDraft([])
    }
  }

  function closeDraft() {
    if (draft.length < 3) return
    const closed = closeRing(draft)
    applyRing(closed)
    setDraft([])
    setCoords(ringCentroid(closed))
    setPickMode('snap')
  }

  function clearFootprint() {
    applyRing(null)
    setDraft([])
  }

  return (
    <div className="grid gap-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label htmlFor="lat" className={labelCls}>
            Latitude *
          </label>
          <input
            id="lat"
            name="lat"
            type="number"
            step="any"
            required
            value={coords.lat}
            onChange={(e) => setCoords((c) => ({ ...c, lat: Number(e.target.value) }))}
            className={inputCls}
          />
        </div>
        <div>
          <label htmlFor="lng" className={labelCls}>
            Longitude *
          </label>
          <input
            id="lng"
            name="lng"
            type="number"
            step="any"
            required
            value={coords.lng}
            onChange={(e) => setCoords((c) => ({ ...c, lng: Number(e.target.value) }))}
            className={inputCls}
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          className={pickMode === 'snap' ? btnActive : btnCls}
          onClick={() => {
            setPickMode('snap')
            setDraft([])
          }}
        >
          OSM შენობა
        </button>
        <button
          type="button"
          className={pickMode === 'draw' ? btnActive : btnCls}
          onClick={() => {
            setPickMode('draw')
            setDraft(ring && ring.length > 1 ? ring.slice(0, -1) : [])
          }}
        >
          კორპუსის ხატვა
        </button>
        {pickMode === 'draw' ? (
          <>
            <button
              type="button"
              className={btnCls}
              disabled={draft.length < 3}
              onClick={closeDraft}
            >
              დახურვა ({draft.length})
            </button>
            <button type="button" className={btnCls} onClick={() => setDraft([])}>
              გაუქმება
            </button>
          </>
        ) : null}
        {ring ? (
          <button type="button" className={btnCls} onClick={clearFootprint}>
            footprint წაშლა
          </button>
        ) : null}
      </div>

      <MapEmbed
        lat={coords.lat}
        lng={coords.lng}
        zoom={17}
        aspect="16/9"
        highlight
        pickMode={pickMode}
        footprint={footprint}
        onPick={onPick}
      />
      <p className="text-[11px] font-bold text-sv-ink/40">
        {pickMode === 'draw'
          ? 'დააკლიკე კუთხეებს → დახურვა. მშენებარე კორპუსი რომ არ არის OSM-ში.'
          : 'დააკლიკე OSM შენობას — პინი ცენტრში + footprint ავტომატურად.'}
      </p>

      <div>
        <label htmlFor="polygonCoords" className={labelCls}>
          Footprint ring — {'{"ring":[[lng,lat],…]}'}
        </label>
        <textarea
          id="polygonCoords"
          name="polygonCoords"
          rows={2}
          value={polyText}
          onChange={(e) => {
            const raw = e.target.value
            setPolyText(raw)
            const t = raw.trim()
            if (!t) {
              setRing(null)
              return
            }
            try {
              setRing(parseFootprintRing(JSON.parse(t)))
            } catch {
              /* typing mid-JSON */
            }
          }}
          placeholder='{"ring":[[44.7730,41.7086],[44.7734,41.7086],[44.7734,41.7090],[44.7730,41.7086]]}'
          className={`${inputCls} font-mono text-[12px]`}
        />
      </div>
    </div>
  )
}
