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
  Wind,
  type LucideIcon,
} from 'lucide-react'
import type { Lang } from '@/lib/i18n/core'
import { aqiBand, cityCoords, getAirQuality, getWeather, weatherIcon, type WeatherIconName } from '@/lib/weather'

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

/* AirBadge — European AQI chip, same server-rendered contract as WeatherBadge
   (renders nothing on failure). Labels in all 10 UI languages — adopted on the
   Georgian surfaces first (Tbilisi PM2.5 is a real decision factor).
   Colors are brand tokens only (sv-success/orange family). */

const AQI_TEXT: Record<ReturnType<typeof aqiBand>, string> = {
  good: 'text-sv-success',
  moderate: 'text-sv-orange',
  poor: 'text-sv-orange-deep',
  bad: 'text-sv-orange-deep',
}

const AIR_LABEL: Record<Lang, Record<ReturnType<typeof aqiBand>, string>> = {
  ka: { good: 'ჰაერის ხარისხი: კარგი', moderate: 'ჰაერის ხარისხი: საშუალო', poor: 'ჰაერის ხარისხი: ცუდი', bad: 'ჰაერის ხარისხი: ძალიან ცუდი' },
  en: { good: 'Air quality: good', moderate: 'Air quality: moderate', poor: 'Air quality: poor', bad: 'Air quality: very poor' },
  ru: { good: 'Качество воздуха: хорошее', moderate: 'Качество воздуха: среднее', poor: 'Качество воздуха: плохое', bad: 'Качество воздуха: очень плохое' },
  de: { good: 'Luftqualität gut', moderate: 'Luftqualität mäßig', poor: 'Luftqualität schlecht', bad: 'Luftqualität sehr schlecht' },
  tr: { good: 'Hava kalitesi: iyi', moderate: 'Hava kalitesi: orta', poor: 'Hava kalitesi: kötü', bad: 'Hava kalitesi: çok kötü' },
  he: { good: 'איכות האוויר: טובה', moderate: 'איכות האוויר: בינונית', poor: 'איכות האוויר: גרועה', bad: 'איכות האוויר: גרועה מאוד' },
  ar: { good: 'جودة الهواء: جيدة', moderate: 'جودة الهواء: متوسطة', poor: 'جودة الهواء: سيئة', bad: 'جودة الهواء: سيئة جداً' },
  uk: { good: 'Якість повітря: добра', moderate: 'Якість повітря: середня', poor: 'Якість повітря: погана', bad: 'Якість повітря: дуже погана' },
  hy: { good: 'Օդի որակը՝ լավ', moderate: 'Օդի որակը՝ միջին', poor: 'Օդի որակը՝ վատ', bad: 'Օդի որակը՝ շատ վատ' },
  az: { good: 'Hava keyfiyyəti: yaxşı', moderate: 'Hava keyfiyyəti: orta', poor: 'Hava keyfiyyəti: pis', bad: 'Hava keyfiyyəti: çox pis' },
}

export async function AirBadge({
  coords,
  citySlug,
  lang = 'en',
  className = '',
  iconClassName = 'h-3.5 w-3.5',
}: {
  coords?: { lat: number; lng: number }
  citySlug?: string
  lang?: Lang
  className?: string
  iconClassName?: string
}) {
  const at = coords ?? cityCoords(citySlug)
  if (!at) return null
  const air = await getAirQuality(at)
  if (!air) return null
  const band = aqiBand(air.aqi)
  const label = AIR_LABEL[lang][band]
  const text = AQI_TEXT[band]
  return (
    <span
      className={`inline-flex items-center gap-1 text-[11px] font-bold tracking-wide ${className}`}
      title={`${label} — PM2.5 ${air.pm25} µg/m³ (EAQI)`}
    >
      <Wind className={`${iconClassName} ${text}`} aria-hidden="true" strokeWidth={2} />
      <span className={text}>AQI {air.aqi}</span>
      <span className="sr-only">{label}</span>
    </span>
  )
}
