import 'server-only'
import type { Lang } from '@/lib/i18n/core'
import { cityBySlug } from '@/lib/map/user-place.server'

/**
 * SIVRCE — server-side weather via Open-Meteo (free, no API key, no CORS).
 * RSC pages await getWeather() and render the badge straight into SSR HTML;
 * the Next data cache dedupes by URL, so badges sharing a rounded coordinate
 * cost ONE upstream request per 30 min (build-time params included).
 * ponytail: replaced the client hook (lib/weather.tsx) — zero client JS,
 * no pop-in CLS. Upgrade path: Redis cache if the data cache ever leaves
 * the serverless function.
 */

export interface WeatherInfo {
  temp: number // °C
  code: number // WMO code
  label: string // localized condition label (tooltip / screen readers)
}

/** City centers keyed by slug (source of truth: CITIES in lib/seo-pages). */
export const CITY_COORDS: Record<string, { lat: number; lng: number }> = {
  tbilisi: { lat: 41.7151, lng: 44.8271 },
  batumi: { lat: 41.6102, lng: 41.6198 },
  kutaisi: { lat: 42.2491, lng: 42.7001 },
  rustavi: { lat: 41.5495, lng: 44.9931 },
  poti: { lat: 42.1494, lng: 41.6656 },
  zugdidi: { lat: 42.5088, lng: 41.8709 },
  telavi: { lat: 41.9198, lng: 45.4736 },
  gori: { lat: 41.9842, lng: 44.1163 },
  mtskheta: { lat: 41.8434, lng: 44.7144 },
  bakuriani: { lat: 41.751, lng: 43.5292 },
  kobuleti: { lat: 41.8214, lng: 41.7753 },
  borjomi: { lat: 41.8375, lng: 43.3944 },
  gudauri: { lat: 42.475, lng: 44.4769 },
  mestia: { lat: 43.0456, lng: 42.7278 },
  sighnaghi: { lat: 41.6103, lng: 45.9219 },
  tskaltubo: { lat: 42.3267, lng: 42.5975 },
  kazbegi: { lat: 42.6575, lng: 44.6411 },
  chakvi: { lat: 41.7185, lng: 41.7351 },
  shekvetili: { lat: 41.9345, lng: 41.7674 },
  bakhmaro: { lat: 41.8513, lng: 42.3245 },
  goderdzi: { lat: 41.6382, lng: 42.4912 },
  akhaltsikhe: { lat: 41.6369, lng: 42.9825 },
  ozurgeti: { lat: 41.9247, lng: 42.0064 },
  ambrolauri: { lat: 42.3819, lng: 43.0483 },
  marneuli: { lat: 41.4753, lng: 44.845 },
  zestafoni: { lat: 42.0992, lng: 43.0503 },
  khashuri: { lat: 41.9972, lng: 43.5811 },
  gurjaani: { lat: 41.8472, lng: 45.8061 },
  kvareli: { lat: 41.9489, lng: 45.8206 },
  dusheti: { lat: 42.0897, lng: 44.7197 },
  abastumani: { lat: 41.7514, lng: 42.8083 },
  surami: { lat: 41.9953, lng: 43.5311 },
  ureki: { lat: 41.9772, lng: 41.7528 },
  gonio: { lat: 41.5986, lng: 41.6402 },
  kvariati: { lat: 41.5836, lng: 41.6317 },
  tsikhisdziri: { lat: 41.78, lng: 41.7353 },
  anaklia: { lat: 42.3947, lng: 41.5644 },
  // DE soft launch — sivrce.de Berlin-first hub.
  berlin: { lat: 52.52, lng: 13.405 },
  hamburg: { lat: 53.5511, lng: 9.9937 },
  munich: { lat: 48.1351, lng: 11.582 },
  cologne: { lat: 50.9375, lng: 6.9603 },
  frankfurt: { lat: 50.1109, lng: 8.6821 },
  stuttgart: { lat: 48.7758, lng: 9.1829 },
  duesseldorf: { lat: 51.2277, lng: 6.7735 },
  leipzig: { lat: 51.3397, lng: 12.3731 },
  dortmund: { lat: 51.5136, lng: 7.4653 },
  essen: { lat: 51.4556, lng: 7.0116 },
  bremen: { lat: 53.0793, lng: 8.8017 },
  dresden: { lat: 51.0504, lng: 13.7373 },
  hanover: { lat: 52.3759, lng: 9.732 },
  nuremberg: { lat: 49.4521, lng: 11.0767 },
  duisburg: { lat: 51.4344, lng: 6.7623 },
  bochum: { lat: 51.4818, lng: 7.2162 },
  dubai: { lat: 25.2048, lng: 55.2708 },
  'abu-dhabi': { lat: 24.4539, lng: 54.3773 },
  sharjah: { lat: 25.3463, lng: 55.4209 },
  'ras-al-khaimah': { lat: 25.7895, lng: 55.9432 },
}

export function cityCoords(slug?: string): { lat: number; lng: number } | undefined {
  if (!slug) return undefined
  if (CITY_COORDS[slug]) return CITY_COORDS[slug]
  // ponytail: world cities resolve from the server map-city corpus — one source, no dup coords.
  const c = cityBySlug(slug)
  return c ? { lat: c.lat, lng: c.lng } : undefined
}

/** Georgia towns absent from the GeoNames corpus (small munis, Abkhazia) —
    ka name → 2 dp coords. Lat/lng verified against Open-Meteo geocoding
    2026-09; 'აფხაზეთი' as a catalog entry resolves to Sukhumi. */
export const GE_TOWN_COORDS: Record<string, { lat: number; lng: number }> = {
  'ქედა': { lat: 41.6, lng: 41.94 },
  'შუახევი': { lat: 41.63, lng: 42.19 },
  'ხელვაჩაური': { lat: 41.58, lng: 41.67 },
  'ხულო': { lat: 41.65, lng: 42.31 },
  'ლანჩხუთი': { lat: 42.09, lng: 42.04 },
  'ჩოხატაური': { lat: 42.02, lng: 42.24 },
  'ბაღდათი': { lat: 42.07, lng: 42.83 },
  'ვანი': { lat: 42.08, lng: 42.51 },
  'ტყიბული': { lat: 42.35, lng: 43.01 },
  'ჭიათურა': { lat: 42.3, lng: 43.3 },
  'ახმეტა': { lat: 42.03, lng: 45.21 },
  'დედოფლისწყარო': { lat: 41.47, lng: 46.1 },
  'ლაგოდეხი': { lat: 41.83, lng: 46.27 },
  'საგარეჯო': { lat: 41.74, lng: 45.33 },
  'წნორი': { lat: 41.62, lng: 45.98 },
  'ახალგორი': { lat: 42.12, lng: 44.48 },
  'მანგლისი': { lat: 41.7, lng: 44.38 },
  'პასანაური': { lat: 42.35, lng: 44.69 },
  'ხევსურეთი': { lat: 42.66, lng: 45.16 },
  'წეროვანი': { lat: 41.88, lng: 44.68 },
  'ჩხოროწყუ': { lat: 42.52, lng: 42.13 },
  'წალენჯიხა': { lat: 42.61, lng: 42.07 },
  'ადიგენი': { lat: 41.68, lng: 42.7 },
  'ვალე': { lat: 41.68, lng: 43.0 },
  'კოჯორი': { lat: 41.66, lng: 44.7 },
  'ქარელი': { lat: 42.02, lng: 43.9 },
  'ცხინვალი': { lat: 42.19, lng: 43.94 },
  'ჯავა': { lat: 42.39, lng: 43.92 },
  'აგარა': { lat: 42.04, lng: 43.82 },
  'აფხაზეთი': { lat: 43.01, lng: 40.99 },
  'ახალ ათონი': { lat: 43.08, lng: 40.82 },
  'ბიჭვინთა': { lat: 43.16, lng: 40.34 },
  'გაგრა': { lat: 43.28, lng: 40.27 },
  'გალი': { lat: 42.63, lng: 41.74 },
  'გუდაუთა': { lat: 43.1, lng: 40.62 },
  'გულრიფში': { lat: 42.93, lng: 41.1 },
  'ლესელიძე': { lat: 43.39, lng: 40.01 },
  'ოჩამჩირე': { lat: 42.71, lng: 41.47 },
  'სოხუმი': { lat: 43.01, lng: 40.99 },
  'ტყვარჩელი': { lat: 42.84, lng: 41.68 },
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

type WeatherGroup = 'clear' | 'cloudy' | 'fog' | 'rain' | 'snow' | 'storm'

const GROUP_ICON: Record<WeatherGroup, WeatherIconName> = {
  clear: 'sun',
  cloudy: 'cloud-sun',
  fog: 'cloud-fog',
  rain: 'cloud-rain',
  snow: 'cloud-snow',
  storm: 'cloud-lightning',
}

/** Full WMO code space collapsed to 6 condition groups (labels + icon fallback). */
function wmoGroup(code: number): WeatherGroup {
  if (code === 0) return 'clear'
  if (code <= 3) return 'cloudy'
  if (code <= 48) return 'fog'
  if (code <= 67) return 'rain'
  if (code <= 77) return 'snow'
  if (code <= 82) return 'rain'
  if (code <= 86) return 'snow'
  return 'storm'
}

export function weatherIcon(code: number): WeatherIconName {
  return WMO_ICON[code] ?? GROUP_ICON[wmoGroup(code)]
}

/* Condition labels per locale — the badge shows icon + temp; this feeds the
   tooltip and screen readers. All 10 site locales, ka first. */
const WMO_LABELS: Record<WeatherGroup, Record<Lang, string>> = {
  clear: { ka: 'ნათელი', en: 'Clear', ru: 'Ясно', he: 'מתבהר', ar: 'صافٍ', tr: 'Açık', uk: 'Ясно', hy: 'Պարզ', az: 'Açıq', de: 'Klar' },
  cloudy: { ka: 'ღრუბლიანი', en: 'Cloudy', ru: 'Облачно', he: 'מעונן', ar: 'غائم', tr: 'Bulutlu', uk: 'Хмарно', hy: 'Ամպամած', az: 'Buludlu', de: 'Bewölkt' },
  fog: { ka: 'ნისლიანი', en: 'Fog', ru: 'Туман', he: 'ערפל', ar: 'ضباب', tr: 'Puslu', uk: 'Туман', hy: 'Մառախուղ', az: 'Dumanlı', de: 'Nebel' },
  rain: { ka: 'წვიმა', en: 'Rain', ru: 'Дождь', he: 'גשם', ar: 'مطر', tr: 'Yağmurlu', uk: 'Дощ', hy: 'Անձրև', az: 'Yağışlı', de: 'Regen' },
  snow: { ka: 'თოვლი', en: 'Snow', ru: 'Снег', he: 'שלג', ar: 'ثلج', tr: 'Karlı', uk: 'Сніг', hy: 'Ձյուն', az: 'Qarlı', de: 'Schnee' },
  storm: { ka: 'ჭექა-ქუხილი', en: 'Thunderstorm', ru: 'Гроза', he: 'סערה', ar: 'عاصفة رعدية', tr: 'Gök gürültülü', uk: 'Гроза', hy: 'Որոտ', az: 'Tufan', de: 'Gewitter' },
}

export function wmoLabel(code: number, lang: Lang = 'ka'): string {
  return WMO_LABELS[wmoGroup(code)][lang]
}

/* ── Canonical forecast fetch — one upstream shape for every surface ──
   The badge chip, WeatherPanel (hero / highlight tiles / 24 h / 7-day) and any
   future surface all derive from THIS single cached request per rounded
   coordinate, so adding a surface never adds an upstream call. */

export interface WeatherPoint {
  t: string // 'HH:mm' — place-local
  temp: number // °C
  code: number // WMO code
  pop: number // precipitation probability %
}

export interface WeatherDay {
  date: string // 'YYYY-MM-DD'
  code: number
  hi: number
  lo: number
  pop: number
}

export interface WeatherDetail extends WeatherInfo {
  feels: number // apparent °C
  hi: number // today max °C
  lo: number // today min °C
  humidity: number // %
  wind: number // km/h
  pop: number // today max precipitation probability %
  uv: number // today max UV index
  sunrise: string // 'HH:mm'
  sunset: string // 'HH:mm'
  hourly: WeatherPoint[] // next 24 h
  days: WeatherDay[] // 7-day forecast
}

const FORECAST_PARAMS =
  'current=temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,wind_speed_10m' +
  '&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,uv_index_max,precipitation_probability_max' +
  '&hourly=temperature_2m,weather_code,precipitation_probability&forecast_days=7&timezone=auto'

const num = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v)

/** Minimal Open-Meteo response shape — loose where arrays mix numbers/ISO strings. */
interface OpenMeteoPayload {
  current?: {
    time?: string
    temperature_2m?: number
    apparent_temperature?: number
    relative_humidity_2m?: number
    weather_code?: number
    wind_speed_10m?: number
  }
  daily?: Record<string, (string | number)[] | undefined>
  hourly?: Record<string, (string | number)[] | undefined>
}

/** API returns place-local ISO ('2026-09-26T07:32') — cut, never Date-parsed
    (a server TZ shift would show the wrong sun). */
const hhmm = (v: unknown): string => (typeof v === 'string' && v.length >= 16 ? v.slice(11, 16) : '')

/** Parse the canonical payload. Pure — offline-checked in weather.check. */
export function parseWeatherDetail(d: unknown, lang: Lang = 'ka'): WeatherDetail | null {
  const j = d as OpenMeteoPayload | null
  const cur = j?.current
  const daily = j?.daily
  const hourly = j?.hourly
  if (!j || !num(cur?.temperature_2m) || !num(cur?.weather_code) || !Array.isArray(daily?.time)) return null
  const temp = cur.temperature_2m as number
  const code = cur.weather_code as number
  // hourly window: first slot at/after now, 24 h out (arrays start at place-local 00:00)
  let from = 0
  const curTime = cur?.time
  if (typeof curTime === 'string' && Array.isArray(hourly?.time)) {
    const i = (hourly.time as string[]).findIndex((t) => t >= curTime)
    if (i > 0) from = i
  }
  const hours: WeatherPoint[] = []
  for (let k = 0; k < 24 && hourly; k++) {
    const t = hourly.time?.[from + k]
    const tp = hourly.temperature_2m?.[from + k]
    const c = hourly.weather_code?.[from + k]
    const pop = hourly.precipitation_probability?.[from + k]
    if (typeof t !== 'string' || !num(tp) || !num(c) || !num(pop)) break
    hours.push({ t: t.slice(11, 16), temp: Math.round(tp), code: c, pop })
  }
  const days: WeatherDay[] = []
  for (let k = 0; k < 7; k++) {
    const date = daily.time?.[k]
    const hi = daily.temperature_2m_max?.[k]
    const lo = daily.temperature_2m_min?.[k]
    const c = daily.weather_code?.[k]
    const pop = daily.precipitation_probability_max?.[k]
    if (typeof date !== 'string' || !num(hi) || !num(lo) || !num(c) || !num(pop)) break
    days.push({ date, code: c, hi: Math.round(hi), lo: Math.round(lo), pop })
  }
  return {
    temp: Math.round(temp),
    code,
    label: wmoLabel(code, lang),
    feels: num(cur.apparent_temperature) ? Math.round(cur.apparent_temperature) : Math.round(temp),
    hi: num(daily.temperature_2m_max?.[0]) ? Math.round(daily.temperature_2m_max[0]) : Math.round(temp),
    lo: num(daily.temperature_2m_min?.[0]) ? Math.round(daily.temperature_2m_min[0]) : Math.round(temp),
    humidity: num(cur.relative_humidity_2m) ? Math.round(cur.relative_humidity_2m) : 0,
    wind: num(cur.wind_speed_10m) ? Math.round(cur.wind_speed_10m) : 0,
    pop: num(daily.precipitation_probability_max?.[0]) ? Math.round(daily.precipitation_probability_max[0]) : 0,
    uv: num(daily.uv_index_max?.[0]) ? Math.round(daily.uv_index_max[0]) : 0,
    sunrise: hhmm(daily.sunrise?.[0]),
    sunset: hhmm(daily.sunset?.[0]),
    hourly: hours,
    days,
  }
}

/**
 * Current weather + full forecast for a coordinate. Returns null on any
 * failure — weather is decorative and must never break a page render. No
 * AbortSignal: passing one would opt the request out of the Next data cache.
 */
export async function getWeatherDetail(
  coords: { lat: number; lng: number },
  lang: Lang = 'ka',
): Promise<WeatherDetail | null> {
  // 2dp ≈ 1 km — nearby surfaces (metro stations, streets) share one cached fetch.
  const lat = coords.lat.toFixed(2)
  const lng = coords.lng.toFixed(2)
  try {
    const r = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&${FORECAST_PARAMS}`,
      { next: { revalidate: 1800 } },
    )
    return parseWeatherDetail(await r.json(), lang)
  } catch {
    return null
  }
}

/** Badge chip view — derived from the same cached fetch as the full panel. */
export async function getWeather(
  coords: { lat: number; lng: number },
  lang: Lang = 'ka',
): Promise<WeatherInfo | null> {
  const d = await getWeatherDetail(coords, lang)
  return d ? { temp: d.temp, code: d.code, label: d.label } : null
}

/* ── Batch — the locations index asks EVERY region, city and municipality in
   ONE upstream call via Open-Meteo's multi-coordinate comma lists (response is
   an array, same order as the request). 1 call / 30 min for ~120 places. ── */

function parseWeatherNow(j: unknown, lang: Lang): WeatherInfo | null {
  const cur = (j as OpenMeteoPayload | null)?.current
  if (!num(cur?.temperature_2m) || !num(cur?.weather_code)) return null
  return {
    temp: Math.round(cur.temperature_2m as number),
    code: cur.weather_code as number,
    label: wmoLabel(cur.weather_code as number, lang),
  }
}

/** Pure batch parser — aligns an array (or single-object) response to keys. */
export function parseWeatherBatch(d: unknown, lang: Lang = 'ka'): (WeatherInfo | null)[] {
  const arr = Array.isArray(d) ? d : [d]
  return arr.map((j) => parseWeatherNow(j, lang))
}

export async function getWeatherBatch(
  points: Record<string, { lat: number; lng: number }>,
  lang: Lang = 'ka',
): Promise<Record<string, WeatherInfo | null>> {
  const out: Record<string, WeatherInfo | null> = {}
  // dedupe by the same 2dp rounding the single fetch caches on
  const groups = new Map<string, { lat: string; lng: string; keys: string[] }>()
  for (const k of Object.keys(points)) {
    const lat = points[k]!.lat.toFixed(2)
    const lng = points[k]!.lng.toFixed(2)
    const g = groups.get(`${lat},${lng}`)
    if (g) g.keys.push(k)
    else groups.set(`${lat},${lng}`, { lat, lng, keys: [k] })
  }
  const list = [...groups.values()]
  if (list.length === 0) return out
  for (const k of Object.keys(points)) out[k] = null
  try {
    const r = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${list.map((g) => g.lat).join(',')}` +
        `&longitude=${list.map((g) => g.lng).join(',')}&current=temperature_2m,weather_code&timezone=auto&forecast_days=1`,
      { next: { revalidate: 1800 } },
    )
    parseWeatherBatch(await r.json(), lang).forEach((w, i) => {
      for (const k of list[i]?.keys ?? []) out[k] = w
    })
  } catch {
    // leave nulls — chips render nothing
  }
  return out
}

/* ── European AQI (Open-Meteo air-quality, keyless) — same server-chip contract:
   decorative, renders nothing on failure, must never break a page. ── */

export interface AirInfo {
  aqi: number // European AQI, lower is better
  pm25: number // µg/m³
}

/** Full EU scale (0–20 sehr gut … >100 extrem) collapsed to 4 bands. */
export type AqiBand = 'good' | 'moderate' | 'poor' | 'bad'

export function aqiBand(aqi: number): AqiBand {
  if (aqi <= 40) return 'good'
  if (aqi <= 60) return 'moderate'
  if (aqi <= 80) return 'poor'
  return 'bad'
}

export async function getAirQuality(coords: { lat: number; lng: number }): Promise<AirInfo | null> {
  const lat = coords.lat.toFixed(2)
  const lng = coords.lng.toFixed(2)
  try {
    const r = await fetch(
      `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lng}&current=european_aqi,pm2_5`,
      { next: { revalidate: 1800 } },
    )
    const d = await r.json()
    const aqi = d?.current?.european_aqi
    const pm25 = d?.current?.pm2_5
    if (typeof aqi !== 'number' || typeof pm25 !== 'number') return null
    return { aqi: Math.round(aqi), pm25: Math.round(pm25 * 10) / 10 }
  } catch {
    return null
  }
}
