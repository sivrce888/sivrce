'use client'

/**
 * SIVRCE — Weather badge for listing cards and district/street SEO pages.
 * Shows current temperature + condition icon. Pass `city` (Georgian name) or
 * raw `coords` (district center); `label` overrides the place in the tooltip.
 * Uses Open-Meteo free API via useWeather / useWeatherCoords hooks.
 */

import {
  Cloud,
  CloudDrizzle,
  CloudFog,
  CloudLightning,
  CloudRain,
  CloudSnow,
  CloudSun,
  Snowflake,
  Sun,
  Thermometer,
  type LucideIcon,
} from 'lucide-react'
import { useWeather, useWeatherCoords, weatherIcon, type WeatherIconName } from '@/lib/weather'

const ICONS: Record<WeatherIconName, LucideIcon> = {
  sun: Sun,
  'cloud-sun': CloudSun,
  cloud: Cloud,
  'cloud-fog': CloudFog,
  'cloud-drizzle': CloudDrizzle,
  'cloud-rain': CloudRain,
  'cloud-snow': CloudSnow,
  snowflake: Snowflake,
  'cloud-lightning': CloudLightning,
  thermometer: Thermometer,
}

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

  const Icon = ICONS[weatherIcon(w.code)]

  return (
    <span
      className={`inline-flex items-center gap-1 text-[11px] font-bold tracking-wide ${className}`}
      title={`${w.label}, ${w.temp}°C — ${label ?? city ?? ''}`}
    >
      <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" strokeWidth={2} />
      <span>{w.temp}°C</span>
    </span>
  )
}
