'use client'

/**
 * Floor explorer for /buildings/[slug] — 3D stack + floor strip.
 * Filters the server-rendered grid via one scoped CSS rule: progressive
 * enhancement (no-JS shows everything) and the page stays fully static.
 */

import { useState, type ReactNode } from 'react'
import { BuildingFloorsMapLazy } from './BuildingFloorsMapLazy'
import type { FloorInfo } from '@/lib/map/floors'

interface BuildingFloorExplorerProps {
  label: string
  center: { lat: number; lng: number }
  geojson: GeoJSON.FeatureCollection
  floors: FloorInfo[]
  children: ReactNode
}

export default function BuildingFloorExplorer({
  label,
  center,
  geojson,
  floors,
  children,
}: BuildingFloorExplorerProps) {
  const [floor, setFloor] = useState<number | null>(null)

  return (
    <div>
      <div className="relative h-[300px] overflow-hidden rounded-card bg-sv-navy md:h-[400px]">
        <BuildingFloorsMapLazy
          geojson={geojson}
          floors={floors}
          center={center}
          selectedFloor={floor}
          onSelectFloor={(n) => setFloor((cur) => (cur === n ? null : n))}
          label={label}
        />
      </div>

      <div
        className="mt-4 flex gap-1.5 overflow-x-auto scrollbar-hide"
        role="group"
        aria-label="სართულები"
      >
        {floors.map((f) => {
          const isActive = floor === f.n
          return (
            <button
              key={f.n}
              type="button"
              onClick={() => setFloor(isActive ? null : f.n)}
              aria-pressed={isActive}
              className={`flex min-h-11 shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-[12px] font-extrabold transition ${
                isActive
                  ? 'bg-sv-blue text-white shadow-glow-blue-sm'
                  : 'bg-sv-cloud text-sv-ink/60 hover:text-sv-ink'
              }`}
            >
              სართ. {f.n}
              <span
                className={
                  isActive
                    ? 'text-white/85'
                    : f.available > 0
                      ? 'text-sv-blue'
                      : 'text-sv-ink/30'
                }
              >
                {f.available > 0 ? f.available : '—'}
              </span>
            </button>
          )
        })}
      </div>

      <div data-floor-scope className="mt-6">
        {floor != null && (
          <style>{`[data-floor-scope] [data-card-floor]:not([data-card-floor="${floor}"]) { display: none }`}</style>
        )}
        {children}
      </div>
    </div>
  )
}
