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

/* WMO weather codes → simple emoji label (brand forbids emoji in UI but these are data viz) */
const WMO_ICON: Record<number, string> = {
  0: '☀️',
  1: '🌤️',
  2: '⛅',
  3: '☁️',
  45: '🌫️',
  48: '🌫️',
  51: '🌦️',
  53: '🌦️',
  55: '🌧️',
  61: '🌧️',
  63: '🌧️',
  65: '🌧️',
  71: '🌨️',
  73: '🌨️',
  75: '❄️',
  80: '🌦️',
  81: '🌧️',
  82: '⛈️',
  95: '⛈️',
  96: '⛈️',
  99: '⛈️',
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

/** Shared fetch/cache loop. No-op (null) when coords are unknown. */
function useWeatherAt(key: string, lat?: number, lng?: number): WeatherData | null {
  const [data, setData] = useState<WeatherData | null>(() => (lat === undefined ? null : cached(key)))

  useEffect(() => {
    if (lat === undefined || lng === undefined) return
    // Already have fresh cached data
    const existing = cached(key)
    // eslint-disable-next-line react-hooks/set-state-in-effect -- sync from sessionStorage cache is the point
    if (existing) { setData(existing); return }
    // Fetch once per session
    let cancelled = false
    fetchWeather(lat, lng).then((d) => {
      if (cancelled || !d) return
      cacheIt(key, d)
      setData(d)
    })
    return () => { cancelled = true }
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

export function weatherIcon(code: number): string {
  return WMO_ICON[code] ?? '🌡️'
}
