'use client'

/**
 * SIVRCE — Weather via Open-Meteo (free, no API key, no CORS).
 * Shows current temp + condition for a listing's city.
 * ponytail: fetch-on-demand per city, cached 30min in sessionStorage.
 * Upgrade path: SSR fetch + Redis cache if page-load waterfall matters.
 */

import { useEffect, useState } from 'react'

/* ---- city coordinates ---- */
const CITY_COORDS: Record<string, { lat: number; lng: number }> = {
  თბილისი: { lat: 41.7151, lng: 44.8271 },
  ბათუმი: { lat: 41.6102, lng: 41.6198 },
  ქუთაისი: { lat: 42.2491, lng: 42.7001 },
}

/* WMO → Lucide icon name (brand: no emoji in UI) */
export type WeatherIconName =
  | 'sun'
  | 'cloud-sun'
  | 'cloud'
  | 'cloud-fog'
  | 'cloud-drizzle'
  | 'cloud-rain'
  | 'cloud-snow'
  | 'snowflake'
  | 'cloud-lightning'
  | 'thermometer'

const WMO_ICON: Record<number, WeatherIconName> = {
  0: 'sun',
  1: 'cloud-sun',
  2: 'cloud-sun',
  3: 'cloud',
  45: 'cloud-fog',
  48: 'cloud-fog',
  51: 'cloud-drizzle',
  53: 'cloud-drizzle',
  55: 'cloud-rain',
  61: 'cloud-rain',
  63: 'cloud-rain',
  65: 'cloud-rain',
  71: 'cloud-snow',
  73: 'cloud-snow',
  75: 'snowflake',
  80: 'cloud-drizzle',
  81: 'cloud-rain',
  82: 'cloud-lightning',
  95: 'cloud-lightning',
  96: 'cloud-lightning',
  99: 'cloud-lightning',
}

export interface WeatherData {
  temp: number       // °C
  code: number       // WMO code
  label: string      // human readable (KA)
}

const CACHE_PREFIX = 'sivrce:weather:'
const CACHE_TTL = 30 * 60 * 1000 // 30 min

function cached(city: string): WeatherData | null {
  try {
    const raw = sessionStorage.getItem(CACHE_PREFIX + city)
    if (!raw) return null
    const { data, ts } = JSON.parse(raw)
    if (Date.now() - ts > CACHE_TTL) return null
    return data as WeatherData
  } catch {
    return null
  }
}

function cacheIt(city: string, data: WeatherData) {
  try { sessionStorage.setItem(CACHE_PREFIX + city, JSON.stringify({ data, ts: Date.now() })) } catch { /* noop */ }
}

function wmoLabel(code: number): string {
  if (code === 0) return 'ნათელი'
  if (code <= 3) return 'ღრუბლიანი'
  if (code <= 48) return 'ნისლიანი'
  if (code <= 55) return 'წვიმა'
  if (code <= 65) return 'წვიმა'
  if (code <= 75) return 'თოვლი'
  if (code <= 82) return 'წვიმა'
  return 'ჭექა'
}

async function fetchWeather(lat: number, lng: number): Promise<WeatherData | null> {
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,weather_code&timezone=auto&forecast_days=1`
    const r = await fetch(url)
    const d = await r.json()
    const temp = d?.current?.temperature_2m
    const code = d?.current?.weather_code
    if (typeof temp !== 'number' || typeof code !== 'number') return null
    return { temp: Math.round(temp), code, label: wmoLabel(code) }
  } catch {
    return null
  }
}

/* In-flight dedupe: N widgets mounting on cold boot share ONE request per city.
   Failures are not memoized — the next mount retries. */
const inflight = new Map<string, Promise<WeatherData | null>>()

function fetchWeatherOnce(key: string, lat: number, lng: number): Promise<WeatherData | null> {
  let p = inflight.get(key)
  if (!p) {
    p = fetchWeather(lat, lng).then((d) => {
      if (d) cacheIt(key, d)
      inflight.delete(key)
      return d
    })
    inflight.set(key, p)
  }
  return p
}

/** Shared fetch/cache loop. No-op (null) when coords are unknown. */
function useWeatherAt(key: string, lat?: number, lng?: number): WeatherData | null {
  // Always null on first paint — sessionStorage in useState caused SSR/client mismatch
  const [data, setData] = useState<WeatherData | null>(null)

  useEffect(() => {
    if (lat === undefined || lng === undefined) return
    const existing = cached(key)
    if (existing) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- sessionStorage cache hit on mount; lazy useState init caused SSR mismatch before
      setData(existing)
      return
    }
    let cancelled = false
    const run = () =>
      fetchWeatherOnce(key, lat, lng).then((d) => {
        if (cancelled || !d) return
        setData(d)
      })
    const ric: Window['requestIdleCallback'] | undefined = window.requestIdleCallback
    if (ric) {
      const id = ric.call(window, run, { timeout: 3000 })
      return () => {
        cancelled = true
        window.cancelIdleCallback(id)
      }
    }
    const id = window.setTimeout(run, 2000)
    return () => {
      cancelled = true
      window.clearTimeout(id)
    }
  }, [key, lat, lng])

  return data
}

/**
 * Returns weather for a Georgian city. Cached in sessionStorage for 30 min.
 * Returns null for unknown cities or fetch failures.
 */
export function useWeather(city: string): WeatherData | null {
  const c = CITY_COORDS[city]
  return useWeatherAt(city, c?.lat, c?.lng)
}

/**
 * Same as useWeather but keyed by raw coordinates (district-level badges).
 * Returns null until coords are known; cache key is the rounded coord pair.
 */
export function useWeatherCoords(lat?: number, lng?: number): WeatherData | null {
  const key = lat !== undefined && lng !== undefined ? `${lat.toFixed(3)},${lng.toFixed(3)}` : 'unknown'
  return useWeatherAt(key, lat, lng)
}

export function weatherIcon(code: number): WeatherIconName {
  return WMO_ICON[code] ?? 'thermometer'
}
