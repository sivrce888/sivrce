/**
 * Sun model — low-precision NOAA/astral solar math, zero dependencies.
 * Accuracy ≈1 minute for sunrise/sunset, well inside what a listing card needs.
 * Georgia has a single timezone (Asia/Tbilisi) — formatSunTime pins to it so a
 * cached ISR page and a live client agree on the rendered HH:mm.
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
 * `sunrise`/`sunset` are null only on polar day/night — impossible in Georgia,
 * but a listing with garbage coords (0,0 defaults) must not crash the UI.
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

/** HH:mm in the site's single timezone (Georgia = Asia/Tbilisi). */
export function formatSunTime(date: Date, lang: string): string {
  try {
    return new Intl.DateTimeFormat(lang, { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Tbilisi' }).format(date)
  } catch {
    return new Intl.DateTimeFormat('en', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Tbilisi' }).format(date)
  }
}

/**
 * Minutes-of-day on the Tbilisi wall clock right now — the sun scrubber's
 * slider lives in listing-local time so a diaspora viewer scrubs the same
 * daylight the listing has.
 * ponytail: Georgia is UTC+4 year-round (DST abolished 2004) — instant built
 * as UTC−4 of the Tbilisi wall date; revisit only if DST ever returns.
 */
export function tbilisiMinutesOfDay(now: Date = new Date()): number {
  const [h, m] = new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'Asia/Tbilisi',
  })
    .format(now)
    .split(':')
    .map(Number)
  return (h ?? 0) * 60 + (m ?? 0)
}

/** Absolute instant at `minutes` past Tbilisi midnight on today's Tbilisi date. */
export function tbilisiInstant(minutes: number, now: Date = new Date()): Date {
  const [m, d, y] = new Intl.DateTimeFormat('en-US', {
    month: '2-digit',
    day: '2-digit',
    year: 'numeric',
    timeZone: 'Asia/Tbilisi',
  })
    .format(now)
    .split('/')
    .map(Number)
  return new Date(Date.UTC(y, (m ?? 1) - 1, d ?? 1, Math.floor(minutes / 60) - 4, minutes % 60))
}
