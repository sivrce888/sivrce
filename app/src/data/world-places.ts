/**
 * World capitals + major metros for map pins.
 * Merged with INVENTORY_CITIES in user-place.ts; world-places fills global gaps.
 * Geo: center coordinates per metro; ka: Georgian transliteration (approximate).
 */

export interface WorldPlace {
  slug: string
  ka: string
  en: string
  lat: number
  lng: number
  cc: string
}

export const WORLD_PLACES: readonly WorldPlace[] = [
  // TIER 1 (10 metros)
  { slug: 'new-york', ka: 'ნიუ-იორკი', en: 'New York', lat: 40.7128, lng: -74.006, cc: 'US' },
  { slug: 'london', ka: 'ლონდონი', en: 'London', lat: 51.5074, lng: -0.1278, cc: 'GB' },
  { slug: 'tokyo', ka: 'ტოკიო', en: 'Tokyo', lat: 35.6762, lng: 139.6503, cc: 'JP' },
  { slug: 'singapore', ka: 'სინგაპური', en: 'Singapore', lat: 1.3521, lng: 103.8198, cc: 'SG' },
  { slug: 'dubai', ka: 'დუბაი', en: 'Dubai', lat: 25.2048, lng: 55.2708, cc: 'AE' },
  { slug: 'sydney', ka: 'სიდნეი', en: 'Sydney', lat: -33.8688, lng: 151.2093, cc: 'AU' },
  { slug: 'paris', ka: 'პარიზი', en: 'Paris', lat: 48.8566, lng: 2.3522, cc: 'FR' },
  { slug: 'madrid', ka: 'მადრიდი', en: 'Madrid', lat: 40.4168, lng: -3.7038, cc: 'ES' },
  { slug: 'toronto', ka: 'ტორონტო', en: 'Toronto', lat: 43.6629, lng: -79.3957, cc: 'CA' },

  // TIER 2 (10 metros)
  { slug: 'los-angeles', ka: 'ლოს-ანჯელესი', en: 'Los Angeles', lat: 34.0522, lng: -118.2437, cc: 'US' },
  { slug: 'moscow', ka: 'მოსკოვი', en: 'Moscow', lat: 55.7558, lng: 37.6173, cc: 'RU' },
  { slug: 'istanbul', ka: 'სტამბოლი', en: 'Istanbul', lat: 41.0082, lng: 28.9784, cc: 'TR' },
  { slug: 'bangkok', ka: 'ბანკოკი', en: 'Bangkok', lat: 13.7563, lng: 100.5018, cc: 'TH' },
  { slug: 'seoul', ka: 'სეული', en: 'Seoul', lat: 37.5665, lng: 126.978, cc: 'KR' },
  { slug: 'barcelona', ka: 'ბარსელონა', en: 'Barcelona', lat: 41.3851, lng: 2.1734, cc: 'ES' },
  { slug: 'amsterdam', ka: 'ამსტერდამი', en: 'Amsterdam', lat: 52.3676, lng: 4.9041, cc: 'NL' },
  { slug: 'rome', ka: 'რომი', en: 'Rome', lat: 41.9028, lng: 12.4964, cc: 'IT' },
  { slug: 'lisbon', ka: 'ლისაბონი', en: 'Lisbon', lat: 38.7223, lng: -9.1393, cc: 'PT' },
  { slug: 'prague', ka: 'პრაგა', en: 'Prague', lat: 50.0755, lng: 14.4378, cc: 'CZ' },

  // TIER 3 (25 metros — subset for MVP)
  { slug: 'san-francisco', ka: 'სან-ფრანცისკო', en: 'San Francisco', lat: 37.7749, lng: -122.4194, cc: 'US' },
  { slug: 'chicago', ka: 'ჩიკაგო', en: 'Chicago', lat: 41.8781, lng: -87.6298, cc: 'US' },
  { slug: 'miami', ka: 'მიამი', en: 'Miami', lat: 25.7617, lng: -80.1918, cc: 'US' },
  { slug: 'vancouver', ka: 'ვანკუვერი', en: 'Vancouver', lat: 49.2827, lng: -123.1207, cc: 'CA' },
  { slug: 'melbourne', ka: 'მელბურნი', en: 'Melbourne', lat: -37.8136, lng: 144.9631, cc: 'AU' },
  { slug: 'stockholm', ka: 'სტოკჰოლმი', en: 'Stockholm', lat: 59.3293, lng: 18.0686, cc: 'SE' },
  { slug: 'vienna', ka: 'ვენა', en: 'Vienna', lat: 48.2082, lng: 16.3738, cc: 'AT' },
  { slug: 'hong-kong', ka: 'ჰონგ-კონგი', en: 'Hong Kong', lat: 22.3193, lng: 114.1694, cc: 'HK' },
  { slug: 'shanghai', ka: 'შანხაი', en: 'Shanghai', lat: 31.2304, lng: 121.4737, cc: 'CN' },
  { slug: 'delhi', ka: 'დელი', en: 'Delhi', lat: 28.7041, lng: 77.1025, cc: 'IN' },
  { slug: 'mumbai', ka: 'მუმბაი', en: 'Mumbai', lat: 19.076, lng: 72.8777, cc: 'IN' },
  { slug: 'sao-paulo', ka: 'სან-პაულო', en: 'São Paulo', lat: -23.5505, lng: -46.6333, cc: 'BR' },
  { slug: 'mexico-city', ka: 'მეხიკოს-სიტი', en: 'Mexico City', lat: 19.4326, lng: -99.1332, cc: 'MX' },
  { slug: 'johannesburg', ka: 'იოჰანესბურგი', en: 'Johannesburg', lat: -26.2023, lng: 28.0436, cc: 'ZA' },
]
