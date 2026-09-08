/**
 * SIVRCE — weather badge (async server component). Current temp + condition
 * rendered straight into SSR HTML — no client JS, no pop-in. Renders nothing
 * while weather is unavailable (API failure, unknown city).
 * Pass `coords` (exact point) or `citySlug` (city center); `label` names the
 * place in the tooltip. Styling is caller-owned via `className`.
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
import type { Lang } from '@/lib/i18n/core'
import { cityCoords, getWeather, weatherIcon, type WeatherIconName } from '@/lib/weather'

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

export async function WeatherBadge({
  coords,
  citySlug,
  label,
  lang = 'ka',
  className = '',
  iconClassName = 'h-3.5 w-3.5',
}: {
  coords?: { lat: number; lng: number }
  citySlug?: string
  label?: string
  lang?: Lang
  className?: string
  iconClassName?: string
}) {
  const at = coords ?? cityCoords(citySlug)
  if (!at) return null
  const w = await getWeather(at, lang)
  if (!w) return null

  const Icon = ICONS[weatherIcon(w.code)]

  return (
    <span
      className={`inline-flex items-center gap-1 text-[11px] font-bold tracking-wide ${className}`}
      title={`${w.label}, ${w.temp}°C — ${label ?? citySlug ?? ''}`}
    >
      <Icon className={iconClassName} aria-hidden="true" strokeWidth={2} />
      <span>{w.temp}°</span>
      <span className="sr-only">{w.label}</span>
    </span>
  )
}
