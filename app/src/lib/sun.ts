/**
 * Sun model — low-precision NOAA/astral solar math, zero dependencies.
 * Accuracy ≈1 minute for sunrise/sunset, well inside what a listing card needs.
 * Display TZ follows the listing: Georgia → Asia/Tbilisi, Germany → Europe/Berlin,
 * else solar Etc/GMT (no DST). ISR + client share the same IANA zone.
 */

const RAD = Math.PI / 180
const DAY_MS = 86_400_000
const J1970 = 2440588
const J2000 = 2451545
const OBLIQUITY = 23.4397 * RAD

/** Sunrise/sunset refraction + solar-disc offset, degrees. */
const HORIZON_ALT = -0.833

const toJulian = (date: Date) => date.valueOf() / DAY_MS - 0.5 + J1970
const fromJulian = (j: number) => new Date((j + 0.5 - J1970) * DAY_MS)
const toDays = (date: Date) => toJulian(date) - J2000

const solarMeanAnomaly = (d: number) => RAD * (357.5291 + 0.98560028 * d)

const eclipticLongitude = (M: number) =>
  M + RAD * (1.9148 * Math.sin(M) + 0.02 * Math.sin(2 * M) + 0.0003 * Math.sin(3 * M)) + RAD * 102.9372 + Math.PI

/** Sun declination from the ecliptic longitude. */
const declination = (L: number) => Math.asin(Math.sin(OBLIQUITY) * Math.sin(L))

export type SunDay = {
  sunrise: Date | null
  sunset: Date | null
  /** Solar noon (sun at max altitude). */
  noon: Date
  /** Sun altitude at noon, degrees above horizon. */
  noonAltitude: number
}

/**
 * Sunrise/sunset for one calendar day at a coordinate.
 * `sunrise`/`sunset` are null only on polar day/night — a listing with garbage
 * coords (0,0 defaults) must not crash the UI.
 */
export function sunTimes(lat: number, lng: number, date: Date): SunDay {
  const lw = RAD * -lng
  const phi = RAD * lat
  const n = Math.round(toDays(date) - 0.0009 - lw / (2 * Math.PI))
  const Js = 0.0009 + lw / (2 * Math.PI) + n
  const M = solarMeanAnomaly(Js)
  const L = eclipticLongitude(M)
  const dec = declination(L)
  // absolute Julian day (days-since-J2000 + epoch) — fromJulian expects absolute
  const noonJ = J2000 + Js + 0.0053 * Math.sin(M) - 0.0069 * Math.sin(2 * L)
  const cosH =
    (Math.sin(HORIZON_ALT * RAD) - Math.sin(phi) * Math.sin(dec)) / (Math.cos(phi) * Math.cos(dec))
  // |cosH| > 1 → sun never crosses the horizon that day (polar day/night)
  const crosses = Math.abs(cosH) <= 1
  const H = Math.acos(Math.min(1, Math.max(-1, cosH)))
  return {
    noon: fromJulian(noonJ),
    sunrise: crosses ? fromJulian(noonJ - H / (2 * Math.PI)) : null,
    sunset: crosses ? fromJulian(noonJ + H / (2 * Math.PI)) : null,
    noonAltitude: 90 - Math.abs(phi - dec) / RAD,
  }
}

/** Sun altitude (degrees above horizon) and azimuth (° clockwise from north) at an instant. */
export function sunPosition(lat: number, lng: number, date: Date): { altitude: number; azimuth: number } {
  const lw = RAD * -lng
  const phi = RAD * lat
  const d = toDays(date)
  const L = eclipticLongitude(solarMeanAnomaly(d))
  const dec = declination(L)
  const ra = Math.atan2(Math.cos(OBLIQUITY) * Math.sin(L), Math.cos(L))
  const sidereal = RAD * (280.16 + 360.9856235 * d) - lw
  const H = sidereal - ra
  const altitude = Math.asin(Math.sin(phi) * Math.sin(dec) + Math.cos(phi) * Math.cos(dec) * Math.cos(H))
  // atan2 convention measures from south (suncalc-style); +180° → clockwise from north
  const azimuth = Math.atan2(Math.sin(H), Math.cos(H) * Math.sin(phi) - Math.tan(dec) * Math.cos(phi)) + Math.PI
  return { altitude: altitude / RAD, azimuth: (azimuth / RAD + 360) % 360 }
}

/** Daylight in whole minutes between sunrise and sunset (0 when the sun stays up/down). */
export function dayLengthMinutes(day: SunDay): number {
  if (!day.sunrise || !day.sunset) return 0
  return Math.round((day.sunset.getTime() - day.sunrise.getTime()) / 60_000)
}

/** 8-point compass index (0=N, 2=E, 4=S, 6=W) for an azimuth in degrees. */
export function compass8(azimuth: number): number {
  return Math.round((((azimuth % 360) + 360) % 360) / 45) % 8
}

/** IANA zone for sun wall-clock. Catalog markets first; solar GMT elsewhere (no DST). */
export function timeZoneFor(lat: number, lng: number): string {
  if (lat >= 40.35 && lat <= 44.25 && lng >= 38.7 && lng <= 47.8) return 'Asia/Tbilisi'
  if (lat >= 46.8 && lat <= 55.6 && lng >= 4.9 && lng <= 16.0) return 'Europe/Berlin'
  const h = Math.max(-12, Math.min(14, Math.round(lng / 15)))
  if (h === 0) return 'UTC'
  return h > 0 ? `Etc/GMT-${h}` : `Etc/GMT+${-h}`
}

/** HH:mm in `timeZone` (default Tbilisi so existing checks stay pinned). */
export function formatSunTime(date: Date, lang: string, timeZone = 'Asia/Tbilisi'): string {
  try {
    return new Intl.DateTimeFormat(lang, {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone,
    }).format(date)
  } catch {
    return new Intl.DateTimeFormat('en', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone,
    }).format(date)
  }
}

/** Minutes-of-day on `timeZone`'s wall clock. */
export function wallMinutesOfDay(now: Date = new Date(), timeZone = 'Asia/Tbilisi'): number {
  const [h, m] = new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone,
  })
    .format(now)
    .split(':')
    .map(Number)
  return ((h ?? 0) % 24) * 60 + (m ?? 0)
}

/** Offset of `timeZone` vs UTC at `date`, milliseconds (DST-aware). */
function tzOffsetMs(date: Date, timeZone: string): number {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-US', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    })
      .formatToParts(date)
      .filter((p) => p.type !== 'literal')
      .map((p) => [p.type, p.value]),
  )
  const hour = Number(parts.hour) % 24
  const asUTC = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    hour,
    Number(parts.minute),
    Number(parts.second),
  )
  return asUTC - date.getTime()
}

/** Absolute instant at `minutes` past `timeZone` midnight on `now`'s wall date. */
export function wallInstant(minutes: number, now: Date = new Date(), timeZone = 'Asia/Tbilisi'): Date {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-US', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    })
      .formatToParts(now)
      .filter((p) => p.type !== 'literal')
      .map((p) => [p.type, p.value]),
  )
  const guess = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Math.floor(minutes / 60),
    minutes % 60,
  )
  return new Date(guess - tzOffsetMs(new Date(guess), timeZone))
}

/** Minutes-of-day on the Tbilisi wall clock. */
export function tbilisiMinutesOfDay(now: Date = new Date()): number {
  return wallMinutesOfDay(now, 'Asia/Tbilisi')
}

/** Absolute instant at `minutes` past Tbilisi midnight on today's Tbilisi date. */
export function tbilisiInstant(minutes: number, now: Date = new Date()): Date {
  return wallInstant(minutes, now, 'Asia/Tbilisi')
}
