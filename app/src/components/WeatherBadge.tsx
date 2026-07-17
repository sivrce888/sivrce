'use client'

/**
 * SIVRCE — Weather badge for listing cards.
 * Shows current temperature + condition icon for the listing's city.
 * Uses Open-Meteo free API via useWeather hook.
 */

import { useWeather, weatherIcon } from '@/lib/weather'

export function WeatherBadge({ city, className = '' }: { city: string; className?: string }) {
  const w = useWeather(city)

  // Nothing to show while loading or if city unsupported
  if (!w) return null

  return (
    <span
      className={`inline-flex items-center gap-1 text-[11px] font-bold tracking-wide ${className}`}
      title={`${w.label}, ${w.temp}°C — ${city}`}
    >
      <span className="text-[13px] leading-none" aria-hidden="true">
        {weatherIcon(w.code)}
      </span>
      <span>{w.temp}°C</span>
    </span>
  )
}
