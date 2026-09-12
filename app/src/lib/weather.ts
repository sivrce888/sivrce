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
}

export function cityCoords(slug?: string): { lat: number; lng: number } | undefined {
  if (!slug) return undefined
  if (CITY_COORDS[slug]) return CITY_COORDS[slug]
  // ponytail: world cities resolve from the server map-city corpus — one source, no dup coords.
  const c = cityBySlug(slug)
  return c ? { lat: c.lat, lng: c.lng } : undefined
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

/**
 * Current weather for a coordinate. Returns null on any failure — the badge
 * is decorative and must never break a page render. No AbortSignal: passing
 * one would opt the request out of the Next data cache.
 */
export async function getWeather(
  coords: { lat: number; lng: number },
  lang: Lang = 'ka',
): Promise<WeatherInfo | null> {
  // 2dp ≈ 1 km — nearby badges (metro stations, streets) share one cached fetch.
  const lat = coords.lat.toFixed(2)
  const lng = coords.lng.toFixed(2)
  try {
    const r = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,weather_code&timezone=auto&forecast_days=1`,
      { next: { revalidate: 1800 } },
    )
    const d = await r.json()
    const temp = d?.current?.temperature_2m
    const code = d?.current?.weather_code
    if (typeof temp !== 'number' || typeof code !== 'number') return null
    return { temp: Math.round(temp), code, label: wmoLabel(code, lang) }
  } catch {
    return null
  }
}
