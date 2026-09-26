/**
 * SIVRCE — WeatherPanel (async server component). Apple-Weather-grade live
 * forecast: hero + highlight tiles + 24 h strip + 7-day range bars, rendered
 * straight into SSR HTML from ONE cached Open-Meteo fetch (lib/weather) —
 * zero client JS, zero CLS. Renders nothing on failure. Copy in ka/en/ru/de,
 * other locales fall back to en (same rule as the locations index).
 */

import {
  Droplets,
  Sunrise,
  Sunset,
  Sun,
  Thermometer,
  Umbrella,
  Wind,
  type LucideIcon,
} from 'lucide-react'
import type { Lang } from '@/lib/i18n/core'
import { getWeatherDetail, weatherIcon, type WeatherDay, type WeatherPoint } from '@/lib/weather'
import { WeatherIconSvg } from '@/components/WeatherBadge'

type PanelLang = 'ka' | 'en' | 'ru' | 'de'

const T: Record<PanelLang, {
  title: string
  now: string
  feels: string
  humidity: string
  wind: string
  windUnit: string
  uv: string
  pop: string
  rise: string
  set: string
  today: string
  hourlyAria: string
  weekAria: string
}> = {
  ka: {
    title: 'ამინდი', now: 'ახლა', feels: 'გრძნობადი', humidity: 'ტენიანობა', wind: 'ქარი',
    windUnit: 'კმ/სთ', uv: 'UV ინდექსი', pop: 'ნალექი', rise: 'მზის ამოსვლა', set: 'მზის ჩასვლა',
    today: 'დღეს', hourlyAria: 'საათობრივი პროგნოზი 24 საათზე', weekAria: '7-დღიანი პროგნოზი',
  },
  en: {
    title: 'Weather', now: 'Now', feels: 'Feels like', humidity: 'Humidity', wind: 'Wind',
    windUnit: 'km/h', uv: 'UV index', pop: 'Precipitation', rise: 'Sunrise', set: 'Sunset',
    today: 'Today', hourlyAria: '24-hour forecast', weekAria: '7-day forecast',
  },
  ru: {
    title: 'Погода', now: 'Сейчас', feels: 'Ощущается', humidity: 'Влажность', wind: 'Ветер',
    windUnit: 'км/ч', uv: 'УФ-индекс', pop: 'Осадки', rise: 'Восход', set: 'Закат',
    today: 'Сегодня', hourlyAria: 'Почасовой прогноз', weekAria: 'Прогноз на 7 дней',
  },
  de: {
    title: 'Wetter', now: 'Jetzt', feels: 'Gefühlt', humidity: 'Luftfeuchte', wind: 'Wind',
    windUnit: 'km/h', uv: 'UV-Index', pop: 'Niederschlag', rise: 'Sonnenaufgang', set: 'Sonnenuntergang',
    today: 'Heute', hourlyAria: 'Stündliche Vorhersage', weekAria: '7-Tage-Vorhersage',
  },
}

/** Intl weekday names — full ICU ships in Node ≥16, no tables to maintain. */
const WEEKDAY_LOCALE: Record<PanelLang, string> = { ka: 'ka-GE', en: 'en-US', ru: 'ru-RU', de: 'de-DE' }

function dayName(date: string, lang: PanelLang): string {
  try {
    return new Intl.DateTimeFormat(WEEKDAY_LOCALE[lang], { weekday: 'short' }).format(new Date(`${date}T12:00:00`))
  } catch {
    return date
  }
}

export async function WeatherPanel({
  coords,
  place,
  lang = 'ka',
  className = '',
}: {
  coords: { lat: number; lng: number }
  place: string
  lang?: Lang
  className?: string
}) {
  const d = await getWeatherDetail(coords, lang)
  if (!d) return null
  const pl: PanelLang = lang === 'ka' || lang === 'ru' || lang === 'de' ? lang : 'en'
  const t = T[pl]

  const weekLo = Math.min(...d.days.map((x: WeatherDay) => x.lo))
  const weekHi = Math.max(...d.days.map((x: WeatherDay) => x.hi))
  const span = Math.max(1, weekHi - weekLo)

  const tiles: { icon: LucideIcon; label: string; value: string }[] = [
    { icon: Thermometer, label: t.feels, value: `${d.feels}°` },
    { icon: Droplets, label: t.humidity, value: `${d.humidity}%` },
    { icon: Wind, label: t.wind, value: `${d.wind} ${t.windUnit}` },
    { icon: Sun, label: t.uv, value: `${d.uv}` },
    { icon: Umbrella, label: t.pop, value: `${d.pop}%` },
    d.sunrise ? { icon: Sunrise, label: t.rise, value: d.sunrise } : null,
    d.sunset ? { icon: Sunset, label: t.set, value: d.sunset } : null,
  ].filter((x): x is { icon: LucideIcon; label: string; value: string } => x !== null)

  return (
    <section
      aria-label={`${t.title} — ${place}`}
      className={`overflow-hidden rounded-card border border-sv-ink/[0.06] bg-sv-navy text-white shadow-card ${className}`}
    >
      {/* hero */}
      <div className="flex flex-wrap items-end justify-between gap-4 px-6 pt-6 md:px-8 md:pt-7">
        <div>
          <p className="text-[12px] font-black uppercase tracking-[0.12em] text-white/55">
            {t.title} · {place}
          </p>
          <p className="mt-1 text-[15px] font-bold text-white/80">
            {t.now} — {d.label}
          </p>
        </div>
        <p className="text-[56px] font-black leading-none tracking-[-0.04em] tabular-nums md:text-[68px]">
          {d.temp}°
        </p>
      </div>
      <p className="mt-2 px-6 text-[14px] font-extrabold text-white/70 md:px-8">
        {t.feels} {d.feels}° · {t.today} {d.lo}°–{d.hi}°
      </p>

      {/* highlight tiles */}
      <ul className="grid grid-cols-2 gap-2 px-6 pt-5 sm:grid-cols-3 md:px-8 lg:grid-cols-7">
        {tiles.map(({ icon: Icon, label, value }) => (
          <li key={label} className="rounded-module bg-white/[0.07] px-3.5 py-3">
            <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.08em] text-white/50">
              <Icon className="h-3 w-3" aria-hidden strokeWidth={2.25} />
              {label}
            </span>
            <span className="mt-1 block text-[17px] font-black tabular-nums tracking-tight">{value}</span>
          </li>
        ))}
      </ul>

      {/* 24 h strip */}
      {d.hourly.length > 0 && (
        <ul
          aria-label={t.hourlyAria}
          className="mt-5 flex snap-x gap-1 overflow-x-auto px-6 pb-1 md:px-8 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {d.hourly.map((h: WeatherPoint) => (
            <li
              key={h.t}
              title={`${h.t} — ${h.temp}°, ${h.pop}%`}
              className="w-[4.2rem] shrink-0 snap-start rounded-module px-1 py-2.5 text-center"
            >
              <span className="block text-[11px] font-black tabular-nums text-white/55">{h.t}</span>
              <WeatherIconSvg name={weatherIcon(h.code)} className="mx-auto my-1.5 h-5 w-5 text-white/85" />
              <span className="block text-[14px] font-black tabular-nums">{h.temp}°</span>
              <span className={`block text-[10px] font-extrabold tabular-nums ${h.pop >= 30 ? 'text-sv-blue-light' : 'opacity-0'}`}>
                {h.pop}%
              </span>
            </li>
          ))}
        </ul>
      )}

      {/* 7-day */}
      {d.days.length > 0 && (
        <ul aria-label={t.weekAria} className="mt-3 border-t border-white/10 px-6 py-2 md:px-8">
          {d.days.map((day: WeatherDay, i: number) => (
            <li key={day.date} className="flex items-center gap-3 border-b border-white/[0.06] py-2.5 last:border-none">
              <span className="w-12 shrink-0 text-[14px] font-extrabold">{i === 0 ? t.today : dayName(day.date, pl)}</span>
              <WeatherIconSvg name={weatherIcon(day.code)} className="h-5 w-5 shrink-0 text-white/85" />
              <span className={`w-9 shrink-0 text-[11px] font-black tabular-nums ${day.pop >= 30 ? 'text-sv-blue-light' : 'opacity-0'}`}>
                {day.pop}%
              </span>
              <span className="w-8 shrink-0 text-right text-[14px] font-bold tabular-nums text-white/60">{day.lo}°</span>
              <span
                className="h-1 min-w-1 flex-1 rounded-full bg-gradient-to-r from-sv-blue to-sv-orange"
                style={{
                  marginInlineStart: `${((day.lo - weekLo) / span) * 90}%`,
                  width: `${Math.max(8, ((day.hi - day.lo) / span) * 90)}%`,
                }}
              />
              <span className="w-8 shrink-0 text-[14px] font-black tabular-nums">{day.hi}°</span>
            </li>
          ))}
        </ul>
      )}

      <p className="px-6 pb-4 pt-2 text-[10px] font-bold uppercase tracking-[0.1em] text-white/35 md:px-8">
        Open-Meteo · {d.sunrise && d.sunset ? `${t.rise} ${d.sunrise} · ${t.set} ${d.sunset}` : place}
      </p>
    </section>
  )
}
