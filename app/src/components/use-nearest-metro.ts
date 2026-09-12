'use client'

/**
 * Nearest metro for client components — server chip wins instantly (zero
 * bytes); static/local coords fall back to a lazily-imported Tbilisi grid so
 * the 1.1 MB POI JSON never joins the initial bundle (device-budget lock).
 * Reserved rows stay mounted while loading — no layout shift, Apple-style.
 */
import { useEffect, useState } from 'react'
import { formatMetroDist, type NearMetro } from '@/lib/map/metro-format'

export { formatMetroDist, type NearMetro }

export interface MetroChip {
  n: string
  m: number
  w: number
}

export function useNearestMetro(
  chip: MetroChip | null | undefined,
  lat: number,
  lng: number,
): NearMetro | null {
  const [local, setLocal] = useState<NearMetro | null>(null)
  useEffect(() => {
    if (chip || !Number.isFinite(lat) || !Number.isFinite(lng)) return
    let live = true
    void import('@/lib/map/pois').then((m) => {
      if (live) setLocal(m.nearestMetro(lat, lng))
    })
    return () => {
      live = false
    }
  }, [chip, lat, lng])
  if (chip) return { name: chip.n, meters: chip.m, walkMin: chip.w }
  return local
}
