/**
 * "Around you" amenity grid — one chip per category within walking catchment,
 * from the committed OSM corpus. Server component: the POI JSON stays in
 * server bundles; only this markup reaches the client.
 */
import type { LucideIcon } from 'lucide-react'
import {
  Baby,
  Bus,
  Castle,
  Dumbbell,
  GraduationCap,
  Hospital,
  Landmark,
  Pill,
  ShoppingBag,
  TrainFront,
  TramFront,
  Trees,
} from 'lucide-react'
import type { Lang } from '@/lib/i18n/core'
import { getServerT } from '@/lib/i18n/server'
import { formatMetroDist } from '@/lib/map/metro-format'
import { POI_COLORS, type PoiCategory } from '@/lib/map/poi-constants'
import type { NearAmenity } from '@/lib/map/pois'

const ICON: Record<PoiCategory, LucideIcon> = {
  metro: TrainFront,
  bus: Bus,
  tram: TramFront,
  rail: TrainFront,
  school: GraduationCap,
  university: Landmark,
  park: Trees,
  hospital: Hospital,
  shop: ShoppingBag,
  gym: Dumbbell,
  pharmacy: Pill,
  landmark: Castle,
  kindergarten: Baby,
  bank: Landmark,
}

export function AmenityChips({
  amenities,
  lang,
  max = 8,
  className = '',
}: {
  amenities: NearAmenity[]
  lang: Lang
  max?: number
  className?: string
}) {
  const items = amenities.slice(0, max)
  if (items.length === 0) return null
  const t = getServerT(lang)
  return (
    <ul className={`grid gap-3 sm:grid-cols-2 lg:grid-cols-4 ${className}`}>
      {items.map((a) => {
        const Icon = ICON[a.category]
        return (
          <li
            key={a.category}
            className="flex items-start gap-3 rounded-module border border-sv-ink/[0.06] bg-sv-surface px-4 py-3.5 shadow-card"
          >
            <Icon className="mt-0.5 h-5 w-5 shrink-0" style={{ color: POI_COLORS[a.category] }} aria-hidden />
            <div className="min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-wide text-sv-ink/60">
                {t(`map.poi.${a.category}`)}
              </p>
              <p className="truncate text-[14px] font-extrabold text-sv-ink">{a.name}</p>
              <p className="text-[12px] font-bold text-sv-ink/60">{formatMetroDist(a)}</p>
            </div>
          </li>
        )
      })}
    </ul>
  )
}
