'use client'

/**
 * Admin lat/lng + Sivrce MapEmbed click-to-pin.
 */

import { useState } from 'react'
import MapEmbed from '@/components/MapEmbed'
import { MAP_CENTER } from '@/lib/map/buildings'

const inputCls =
  'w-full rounded-[12px] border border-sv-ink/10 bg-white px-3.5 py-2.5 text-[14px] font-semibold text-sv-ink placeholder:text-sv-ink/30 focus:border-sv-blue focus:outline-none focus:ring-2 focus:ring-sv-blue/20'
const labelCls = 'mb-1.5 block text-[12px] font-extrabold text-sv-ink/55'

export function BuildingMapPicker({
  lat: initialLat,
  lng: initialLng,
}: {
  lat?: number | null
  lng?: number | null
}) {
  const [coords, setCoords] = useState<{ lat: number; lng: number }>({
    lat: initialLat ?? MAP_CENTER.lat,
    lng: initialLng ?? MAP_CENTER.lng,
  })

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
      <MapEmbed
        lat={coords.lat}
        lng={coords.lng}
        zoom={15}
        aspect="16/9"
        highlight
        onPick={(lat, lng) => setCoords({ lat, lng })}
      />
      <p className="text-[11px] font-bold text-sv-ink/40">Click map to set pin</p>
    </div>
  )
}
