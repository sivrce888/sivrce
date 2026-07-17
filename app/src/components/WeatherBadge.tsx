'use client'

/**
 * SIVRCE — Weather badge for listing cards and district/street SEO pages.
 * Shows current temperature + condition icon. Pass `city` (Georgian name) or
 * raw `coords` (district center); `label` overrides the place in the tooltip.
 * Uses Open-Meteo free API via useWeather / useWeatherCoords hooks.
 */

import { useWeather, useWeatherCoords, weatherIcon } from '@/lib/weather'

export function WeatherBadge({
  city,
  coords,
  label,
  className = '',
}: {
  city?: string
  coords?: { lat: number; lng: number }
  label?: string
  className?: string
}) {
  // Both hooks run (rules of hooks); the unused one is a cache-less no-op.
  const byCity = useWeather(city ?? '')
  const byCoords = useWeatherCoords(coords?.lat, coords?.lng)
  const w = city ? byCity : byCoords

  // Nothing to show while loading or if city/coords unsupported
  if (!w) return null

  return (
    <span
      className={`inline-flex items-center gap-1 text-[11px] font-bold tracking-wide ${className}`}
      title={`${w.label}, ${w.temp}°C — ${label ?? city ?? ''}`}
    >
      <span className="text-[13px] leading-none" aria-hidden="true">
        {weatherIcon(w.code)}
      </span>
      <span>{w.temp}°C</span>
    </span>
  )
}
