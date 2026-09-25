'use client'

/**
 * Lazy metro line for cards/panels — mounts nothing until the grid resolves,
 * so the 1.1 MB POI JSON stays out of the initial bundle (device-budget lock).
 */
import { TrainFront } from 'lucide-react'
import { formatMetroDist } from '@/lib/map/metro-format'
import { useI18n } from '@/lib/i18n/context'
import { readableName } from '@/lib/ka-latin'
import { useNearestMetro, type MetroChip } from './use-nearest-metro'

export function MetroLine({
  lat,
  lng,
  chip,
  className = 'flex items-center gap-1.5 text-[12px] font-extrabold text-sv-blue',
  truncate = false,
}: {
  lat: number
  lng: number
  chip?: MetroChip | null
  className?: string
  truncate?: boolean
}) {
  const { lang } = useI18n()
  const metro = useNearestMetro(chip, lat, lng)
  if (!metro) return null
  const text = `${readableName(metro.name, lang)} · ${formatMetroDist(metro, lang)}`
  return (
    <p className={className}>
      <TrainFront className="h-3.5 w-3.5 shrink-0" aria-hidden />
      {truncate ? <span className="truncate">{text}</span> : text}
    </p>
  )
}
