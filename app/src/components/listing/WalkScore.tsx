'use client'

/**
 * Walk / transit / bike scores. Georgia uses the already-loaded amenity chips
 * (no second 1.1 MB POI import). Everywhere else: one CDN-cached /api/transit
 * fetch. Hide until data lands — never show a fake 25.
 */

import { useEffect, useMemo, useState } from 'react'
import { Footprints, Bus, Bike } from 'lucide-react'
import { inGeorgia } from '@/lib/map/map-geo'
import {
  amenityBbox,
  amenityMeters,
  hasNeighborhoodSignal,
  scoreFromAmenities,
  type AmenityHit,
} from '@/lib/walk-score'
import { lt } from './i18n'
import { useI18n } from '@/lib/i18n/context'

interface WalkScoreProps {
  lat: number
  lng: number
  /** null = parent still loading local POIs; [] = none nearby. */
  amenities: AmenityHit[] | null
  className?: string
}

const LIVE_CATS = 'metro,bus,tram,rail,shop,pharmacy,school,park'

function walkBand(score: number): 'walkParadise' | 'walkVery' | 'walkSome' | 'walkCar' | 'walkAlmost' {
  if (score >= 90) return 'walkParadise'
  if (score >= 70) return 'walkVery'
  if (score >= 50) return 'walkSome'
  if (score >= 25) return 'walkCar'
  return 'walkAlmost'
}

function ScoreBar({ label, icon: Icon, score }: { label: string; icon: typeof Footprints; score: number }) {
  return (
    <div className="flex items-center gap-3">
      <Icon className="h-4 w-4 shrink-0 text-sv-blue" aria-hidden />
      <div className="min-w-0 flex-1">
        <div className="mb-1 flex items-center justify-between">
          <span className="text-[12px] font-bold text-sv-ink/60">{label}</span>
          <span className="text-[13px] font-black text-sv-ink">{score}</span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-sv-ink/[0.06]">
          <div
            className="h-full rounded-full bg-sv-blue transition-[width] duration-700"
            style={{ width: `${score}%` }}
          />
        </div>
      </div>
    </div>
  )
}

export function WalkScore({ lat, lng, amenities, className = '' }: WalkScoreProps) {
  const { lang } = useI18n()
  const [live, setLive] = useState<AmenityHit[] | null>(null)

  useEffect(() => {
    if (amenities === null) return
    if (amenities.length > 0) {
      setLive(null)
      return
    }
    if (inGeorgia(lat, lng) || !Number.isFinite(lat) || !Number.isFinite(lng)) {
      setLive([])
      return
    }
    let cancelled = false
    fetch(`/api/transit?bbox=${amenityBbox(lat, lng)}&cats=${LIVE_CATS}`)
      .then(async (r) => {
        if (!r.ok) throw new Error(String(r.status))
        const body = (await r.json()) as { stops?: { category: string; lat: number; lng: number }[] }
        const hits = (body.stops ?? []).map((s) => ({
          category: s.category,
          meters: Math.round(amenityMeters(lat, lng, s.lat, s.lng)),
        }))
        if (!cancelled) setLive(hits)
      })
      .catch(() => {
        if (!cancelled) setLive([])
      })
    return () => {
      cancelled = true
    }
  }, [amenities, lat, lng])

  const hits = amenities && amenities.length > 0 ? amenities : live
  const scores = useMemo(() => scoreFromAmenities(hits ?? []), [hits])
  const ready = hits !== null && hits !== undefined

  if (!ready) {
    return (
      <div
        className={`rounded-card border border-sv-ink/[0.06] bg-sv-surface p-4 shadow-card ${className}`}
        aria-busy="true"
        aria-label={lt(lang, 'walkTitle')}
      >
        <div className="h-3 w-28 rounded-full bg-sv-ink/[0.06]" />
        <div className="mt-4 space-y-3">
          <div className="h-1.5 rounded-full bg-sv-ink/[0.06]" />
          <div className="h-1.5 rounded-full bg-sv-ink/[0.06]" />
          <div className="h-1.5 rounded-full bg-sv-ink/[0.06]" />
        </div>
      </div>
    )
  }

  if (!hasNeighborhoodSignal(scores)) return null

  return (
    <div className={`rounded-card border border-sv-ink/[0.06] bg-sv-surface p-4 shadow-card ${className}`}>
      <h3 className="mb-1 text-[14px] font-black text-sv-ink">{lt(lang, 'walkTitle')}</h3>
      <p className="mb-4 text-[12px] font-bold text-sv-ink/50">{lt(lang, walkBand(scores.walk))}</p>
      <div className="grid gap-3">
        <ScoreBar label={lt(lang, 'walkWalk')} icon={Footprints} score={scores.walk} />
        <ScoreBar label={lt(lang, 'walkTransit')} icon={Bus} score={scores.transit} />
        <ScoreBar label={lt(lang, 'walkBike')} icon={Bike} score={scores.bike} />
      </div>
    </div>
  )
}
