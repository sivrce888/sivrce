/**
 * SIVRCE Global Tier-1: Top 50 World Metros
 * Canonical registry for geographic expansion (2026 Q3+).
 */

export interface Metro {
  code: string
  countryCode: string
  city: string
  cityLocal?: string
  lat: number
  lng: number
  population: number
  timezone: string
  osm: { buildings: number; streets: number; pois: number }
  coverage: {
    poiIngested: boolean
    buildingsIngested: boolean
    developersResearched: boolean
    projectsCatalogued: boolean
    rendersCollected: boolean
  }
  languages: string[]
  primaryListingSource?: string
  currencies: string[]
  tier: 1 | 2 | 3
  lastUpdated?: string
  dataCompleteness: number
  developerCount?: number
}

export const WORLD_METROS: Metro[] = [
  // TIER 1
  { code: "nyc", countryCode: "US", city: "New York", lat: 40.7128, lng: -74.006, population: 20100000, timezone: "America/New_York", osm: { buildings: 284000, streets: 92000, pois: 18000 }, coverage: { poiIngested: false, buildingsIngested: false, developersResearched: false, projectsCatalogued: false, rendersCollected: false }, languages: ["en"], primaryListingSource: "realtor.com", currencies: ["USD"], tier: 1, dataCompleteness: 0 },
  { code: "lon", countryCode: "GB", city: "London", lat: 51.5074, lng: -0.1278, population: 15000000, timezone: "Europe/London", osm: { buildings: 185000, streets: 64000, pois: 14000 }, coverage: { poiIngested: false, buildingsIngested: false, developersResearched: false, projectsCatalogued: false, rendersCollected: false }, languages: ["en"], primaryListingSource: "rightmove.co.uk", currencies: ["GBP"], tier: 1, dataCompleteness: 0 },
  { code: "tyo", countryCode: "JP", city: "Tokyo", cityLocal: "東京", lat: 35.6762, lng: 139.6503, population: 37800000, timezone: "Asia/Tokyo", osm: { buildings: 412000, streets: 128000, pois: 22000 }, coverage: { poiIngested: false, buildingsIngested: false, developersResearched: false, projectsCatalogued: false, rendersCollected: false }, languages: ["ja"], primaryListingSource: "suumo.jp", currencies: ["JPY"], tier: 1, dataCompleteness: 0 },
  { code: "sin", countryCode: "SG", city: "Singapore", lat: 1.3521, lng: 103.8198, population: 5900000, timezone: "Asia/Singapore", osm: { buildings: 28000, streets: 12000, pois: 3500 }, coverage: { poiIngested: false, buildingsIngested: false, developersResearched: false, projectsCatalogued: false, rendersCollected: false }, languages: ["en", "zh", "ms", "ta"], primaryListingSource: "propertysguru.com.sg", currencies: ["SGD"], tier: 1, dataCompleteness: 0 },
  { code: "dxb", countryCode: "AE", city: "Dubai", lat: 25.2048, lng: 55.2708, population: 3600000, timezone: "Asia/Dubai", osm: { buildings: 94000, streets: 32000, pois: 8000 }, coverage: { poiIngested: false, buildingsIngested: false, developersResearched: false, projectsCatalogued: false, rendersCollected: false }, languages: ["ar", "en"], primaryListingSource: "dubizzle.com", currencies: ["AED"], tier: 1, dataCompleteness: 0 },
  { code: "syd", countryCode: "AU", city: "Sydney", lat: -33.8688, lng: 151.2093, population: 5300000, timezone: "Australia/Sydney", osm: { buildings: 124000, streets: 48000, pois: 9200 }, coverage: { poiIngested: false, buildingsIngested: false, developersResearched: false, projectsCatalogued: false, rendersCollected: false }, languages: ["en"], primaryListingSource: "domain.com.au", currencies: ["AUD"], tier: 1, dataCompleteness: 0 },
  { code: "ber", countryCode: "DE", city: "Berlin", lat: 52.52, lng: 13.405, population: 3600000, timezone: "Europe/Berlin", osm: { buildings: 184000, streets: 68000, pois: 11400 }, coverage: { poiIngested: true, buildingsIngested: true, developersResearched: true, projectsCatalogued: true, rendersCollected: true }, languages: ["de", "en"], primaryListingSource: "immobilienscout24.de", currencies: ["EUR"], tier: 1, dataCompleteness: 75 },
  { code: "par", countryCode: "FR", city: "Paris", lat: 48.8566, lng: 2.3522, population: 12300000, timezone: "Europe/Paris", osm: { buildings: 156000, streets: 54000, pois: 10200 }, coverage: { poiIngested: false, buildingsIngested: false, developersResearched: false, projectsCatalogued: false, rendersCollected: false }, languages: ["fr"], primaryListingSource: "seloger.com", currencies: ["EUR"], tier: 1, dataCompleteness: 0 },
  { code: "mad", countryCode: "ES", city: "Madrid", lat: 40.4168, lng: -3.7038, population: 6700000, timezone: "Europe/Madrid", osm: { buildings: 124000, streets: 46000, pois: 8600 }, coverage: { poiIngested: false, buildingsIngested: false, developersResearched: false, projectsCatalogued: false, rendersCollected: false }, languages: ["es"], primaryListingSource: "idealista.com", currencies: ["EUR"], tier: 1, dataCompleteness: 0 },
  { code: "tor", countryCode: "CA", city: "Toronto", lat: 43.6629, lng: -79.3957, population: 6400000, timezone: "America/Toronto", osm: { buildings: 142000, streets: 52000, pois: 9400 }, coverage: { poiIngested: false, buildingsIngested: false, developersResearched: false, projectsCatalogued: false, rendersCollected: false }, languages: ["en", "fr"], primaryListingSource: "realtor.ca", currencies: ["CAD"], tier: 1, dataCompleteness: 0 },

  // TIER 2
  { code: "lax", countryCode: "US", city: "Los Angeles", lat: 34.0522, lng: -118.2437, population: 18700000, timezone: "America/Los_Angeles", osm: { buildings: 268000, streets: 88000, pois: 16400 }, coverage: { poiIngested: false, buildingsIngested: false, developersResearched: false, projectsCatalogued: false, rendersCollected: false }, languages: ["en"], primaryListingSource: "zillow.com", currencies: ["USD"], tier: 2, dataCompleteness: 0 },
  { code: "mow", countryCode: "RU", city: "Moscow", cityLocal: "Москва", lat: 55.7558, lng: 37.6173, population: 12600000, timezone: "Europe/Moscow", osm: { buildings: 156000, streets: 64000, pois: 10200 }, coverage: { poiIngested: false, buildingsIngested: false, developersResearched: false, projectsCatalogued: false, rendersCollected: false }, languages: ["ru"], primaryListingSource: "avito.ru", currencies: ["RUB"], tier: 2, dataCompleteness: 0 },
  { code: "ist", countryCode: "TR", city: "Istanbul", cityLocal: "İstanbul", lat: 41.0082, lng: 28.9784, population: 15500000, timezone: "Europe/Istanbul", osm: { buildings: 184000, streets: 72000, pois: 11600 }, coverage: { poiIngested: false, buildingsIngested: false, developersResearched: false, projectsCatalogued: false, rendersCollected: false }, languages: ["tr"], primaryListingSource: "sahibinden.com", currencies: ["TRY"], tier: 2, dataCompleteness: 0 },
  { code: "bkk", countryCode: "TH", city: "Bangkok", cityLocal: "กรุงเทพ", lat: 13.7563, lng: 100.5018, population: 10200000, timezone: "Asia/Bangkok", osm: { buildings: 148000, streets: 56000, pois: 9400 }, coverage: { poiIngested: false, buildingsIngested: false, developersResearched: false, projectsCatalogued: false, rendersCollected: false }, languages: ["th"], primaryListingSource: "ddproperty.com", currencies: ["THB"], tier: 2, dataCompleteness: 0 },
  { code: "sel", countryCode: "KR", city: "Seoul", cityLocal: "서울", lat: 37.5665, lng: 126.978, population: 9700000, timezone: "Asia/Seoul", osm: { buildings: 224000, streets: 76000, pois: 13200 }, coverage: { poiIngested: false, buildingsIngested: false, developersResearched: false, projectsCatalogued: false, rendersCollected: false }, languages: ["ko"], primaryListingSource: "naver.com", currencies: ["KRW"], tier: 2, dataCompleteness: 0 },
  { code: "bcs", countryCode: "ES", city: "Barcelona", lat: 41.3851, lng: 2.1734, population: 5600000, timezone: "Europe/Madrid", osm: { buildings: 94000, streets: 42000, pois: 7400 }, coverage: { poiIngested: false, buildingsIngested: false, developersResearched: false, projectsCatalogued: false, rendersCollected: false }, languages: ["es", "ca"], primaryListingSource: "idealista.com", currencies: ["EUR"], tier: 2, dataCompleteness: 0 },
  { code: "ams", countryCode: "NL", city: "Amsterdam", lat: 52.3676, lng: 4.9041, population: 2400000, timezone: "Europe/Amsterdam", osm: { buildings: 68000, streets: 28000, pois: 5200 }, coverage: { poiIngested: false, buildingsIngested: false, developersResearched: false, projectsCatalogued: false, rendersCollected: false }, languages: ["nl", "en"], primaryListingSource: "funda.nl", currencies: ["EUR"], tier: 2, dataCompleteness: 0 },
  { code: "rom", countryCode: "IT", city: "Rome", lat: 41.9028, lng: 12.4964, population: 4800000, timezone: "Europe/Rome", osm: { buildings: 72000, streets: 32000, pois: 6400 }, coverage: { poiIngested: false, buildingsIngested: false, developersResearched: false, projectsCatalogued: false, rendersCollected: false }, languages: ["it"], primaryListingSource: "immobiliare.it", currencies: ["EUR"], tier: 2, dataCompleteness: 0 },
  { code: "lis", countryCode: "PT", city: "Lisbon", lat: 38.7223, lng: -9.1393, population: 3000000, timezone: "Europe/Lisbon", osm: { buildings: 48000, streets: 22000, pois: 4200 }, coverage: { poiIngested: false, buildingsIngested: false, developersResearched: false, projectsCatalogued: false, rendersCollected: false }, languages: ["pt"], primaryListingSource: "idealista.pt", currencies: ["EUR"], tier: 2, dataCompleteness: 0 },
  { code: "prg", countryCode: "CZ", city: "Prague", lat: 50.0755, lng: 14.4378, population: 2400000, timezone: "Europe/Prague", osm: { buildings: 54000, streets: 24000, pois: 4800 }, coverage: { poiIngested: false, buildingsIngested: false, developersResearched: false, projectsCatalogued: false, rendersCollected: false }, languages: ["cs"], primaryListingSource: "realitymix.cz", currencies: ["CZK"], tier: 2, dataCompleteness: 0 },

  // TIER 3
  { code: "sfr", countryCode: "US", city: "San Francisco", lat: 37.7749, lng: -122.4194, population: 7700000, timezone: "America/Los_Angeles", osm: { buildings: 112000, streets: 42000, pois: 8200 }, coverage: { poiIngested: false, buildingsIngested: false, developersResearched: false, projectsCatalogued: false, rendersCollected: false }, languages: ["en"], primaryListingSource: "zillow.com", currencies: ["USD"], tier: 3, dataCompleteness: 0 },
  { code: "chi", countryCode: "US", city: "Chicago", lat: 41.8781, lng: -87.6298, population: 9500000, timezone: "America/Chicago", osm: { buildings: 168000, streets: 62000, pois: 10800 }, coverage: { poiIngested: false, buildingsIngested: false, developersResearched: false, projectsCatalogued: false, rendersCollected: false }, languages: ["en"], primaryListingSource: "zillow.com", currencies: ["USD"], tier: 3, dataCompleteness: 0 },
  { code: "mia", countryCode: "US", city: "Miami", lat: 25.7617, lng: -80.1918, population: 6200000, timezone: "America/New_York", osm: { buildings: 84000, streets: 32000, pois: 6800 }, coverage: { poiIngested: false, buildingsIngested: false, developersResearched: false, projectsCatalogued: false, rendersCollected: false }, languages: ["en", "es"], primaryListingSource: "zillow.com", currencies: ["USD"], tier: 3, dataCompleteness: 0 },
  { code: "van", countryCode: "CA", city: "Vancouver", lat: 49.2827, lng: -123.1207, population: 2600000, timezone: "America/Vancouver", osm: { buildings: 52000, streets: 22000, pois: 4200 }, coverage: { poiIngested: false, buildingsIngested: false, developersResearched: false, projectsCatalogued: false, rendersCollected: false }, languages: ["en", "fr"], primaryListingSource: "realtor.ca", currencies: ["CAD"], tier: 3, dataCompleteness: 0 },
  { code: "mel", countryCode: "AU", city: "Melbourne", lat: -37.8136, lng: 144.9631, population: 5200000, timezone: "Australia/Melbourne", osm: { buildings: 112000, streets: 44000, pois: 8400 }, coverage: { poiIngested: false, buildingsIngested: false, developersResearched: false, projectsCatalogued: false, rendersCollected: false }, languages: ["en"], primaryListingSource: "domain.com.au", currencies: ["AUD"], tier: 3, dataCompleteness: 0 },
]

export function getMetroByCode(code: string): Metro | undefined {
  return WORLD_METROS.find((m) => m.code === code)
}

export function getMetrosByCountry(countryCode: string): Metro[] {
  return WORLD_METROS.filter((m) => m.countryCode === countryCode)
}

export function getMetrosByTier(tier: 1 | 2 | 3): Metro[] {
  return WORLD_METROS.filter((m) => m.tier === tier)
}

export const METRO_CODES = WORLD_METROS.map((m) => m.code)
export const METRO_CITIES = WORLD_METROS.map((m) => m.city)
export const METRO_COUNTRIES = [...new Set(WORLD_METROS.map((m) => m.countryCode))]
