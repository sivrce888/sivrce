/**
 * Geodata: OSM amenities for the map POI layer (every developer/project/
 * building page "nearby" + /map toggles).
 * Run: npx --yes tsx scripts/fetch-pois.ts
 * Source: OpenStreetMap via Overpass (ODbL — attribution in map footer).
 * ponytail: top-3 markets committed as JSON, no runtime fetch; base vector
 * tiles cover the rest of the country. Ceiling: Rustavi/Poti boxes + bank/ATM
 * layer when map traffic outside the big three warrants it.
 */

import { writeFileSync } from 'node:fs'

const UA = 'sivrce-maps/1.0 (sivrce888@gmail.com)'
const ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
]

/** Top-3 listing markets — covers the bulk of inventory + map traffic. */
const BOXES = {
  tbilisi: { s: 41.62, w: 44.65, n: 41.86, e: 45.08 },
  batumi: { s: 41.59, w: 41.57, n: 41.7, e: 41.74 },
  kutaisi: { s: 42.22, w: 42.66, n: 42.3, e: 42.76 },
} as const

type BoxKey = keyof typeof BOXES

export type PoiCategory =
  | 'metro'
  | 'pharmacy'
  | 'school'
  | 'university'
  | 'park'
  | 'shop'
  | 'gym'
  | 'hospital'
  | 'landmark'

type Poi = {
  id: string
  category: PoiCategory
  name: string
  lat: number
  lng: number
  city: BoxKey
  osmType: 'node' | 'way' | 'relation'
  osmId: number
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

function bb(b: { s: number; w: number; n: number; e: number }) {
  return `${b.s},${b.w},${b.n},${b.e}`
}

async function overpass(query: string): Promise<any[]> {
  const data = `[out:json][timeout:180];${query}`
  for (const ep of ENDPOINTS) {
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const res = await fetch(ep, {
          method: 'POST',
          headers: { 'User-Agent': UA, 'Content-Type': 'application/x-www-form-urlencoded' },
          body: `data=${encodeURIComponent(data)}`,
          signal: AbortSignal.timeout(200_000),
        })
        if (res.status === 429 || res.status === 504 || res.status === 509) {
          await sleep(8000 * (attempt + 1))
          continue
        }
        if (!res.ok) throw new Error(`http ${res.status}`)
        const json = await res.json()
        return json.elements ?? []
      } catch (e) {
        console.warn(`${ep} attempt ${attempt + 1}:`, e)
        await sleep(3000 * (attempt + 1))
      }
    }
  }
  return []
}

function elCoords(el: any): { lat: number; lng: number } | null {
  if (typeof el.lat === 'number' && typeof el.lon === 'number') {
    return { lat: el.lat, lng: el.lon }
  }
  if (el.center && typeof el.center.lat === 'number' && typeof el.center.lon === 'number') {
    return { lat: el.center.lat, lng: el.center.lon }
  }
  return null
}

function nameOf(tags: Record<string, string> | undefined): string {
  if (!tags) return ''
  return (
    tags.name?.trim() ||
    tags['name:ka']?.trim() ||
    tags['name:en']?.trim() ||
    tags['name:ru']?.trim() ||
    ''
  )
}

function classify(tags: Record<string, string> | undefined): PoiCategory | null {
  if (!tags) return null
  if (tags.station === 'subway' || tags.subway === 'yes') return 'metro'
  if (tags.railway === 'station' && tags.station === 'subway') return 'metro'
  if (tags.amenity === 'pharmacy') return 'pharmacy'
  if (tags.amenity === 'university' || tags.amenity === 'college') {
    const n = nameOf(tags) || 'უნივერსიტეტი'
    // same HE filter as runtime keepUniversityPoi
    const he =
      /უნივერსიტეტ|university|აკადემი|academy|კონსერვატორ|კოლეჯ|college|ინსტიტუტ|institute|უნი|თსუ|თსსუ|\bTSU\b|\bGTU\b|\bISU\b|ილიაუნი|ილიას/i
    if (/ფაკულტეტ/i.test(n) && !he.test(n)) return null
    if (/(სკოლა|school|kindergarten)/i.test(n) && !he.test(n)) return null
    if (!he.test(n)) return null
    return 'university'
  }
  if (tags.amenity === 'school' || tags.amenity === 'kindergarten') return 'school'
  // named parks only — unnamed leisure=park floods (~thousands)
  if (tags.leisure === 'park' && nameOf(tags)) return 'park'
  // ponytail: supermarket+mall+convenience only — bare shop=* floods the map.
  if (tags.shop === 'supermarket' || tags.shop === 'mall') return 'shop'
  if (tags.shop === 'convenience' || tags.shop === 'department_store') {
    return nameOf(tags) ? 'shop' : null
  }
  if (tags.leisure === 'fitness_centre' || tags.amenity === 'gym') return 'gym'
  if (tags.amenity === 'hospital' || tags.amenity === 'clinic') return 'hospital'
  // landmarks / highlights / important locations — named only, else noise.
  // ponytail: artwork excluded — memorial plaques flood (~1k dots), not highlights.
  if (
    tags.tourism === 'attraction' ||
    tags.tourism === 'museum' ||
    tags.tourism === 'viewpoint' ||
    tags.tourism === 'gallery'
  ) {
    return nameOf(tags) ? 'landmark' : null
  }
  if (tags.amenity === 'place_of_worship' || tags.amenity === 'theatre') {
    return nameOf(tags) ? 'landmark' : null
  }
  // ponytail: memorial/plaque excluded — person-name plaques (~800 dots), not highlights.
  if (
    tags.historic &&
    /^(castle|church|monastery|monument|ruins|archaeological_site|battlefield|fort|citywalls|city_gate|manor|heritage|wayside_shrine)$/.test(
      tags.historic,
    ) &&
    nameOf(tags)
  ) {
    return 'landmark'
  }
  return null
}

function toPoi(el: any, city: BoxKey): Poi | null {
  const c = elCoords(el)
  if (!c) return null
  const category = classify(el.tags)
  if (!category) return null
  const osmType = el.type as Poi['osmType']
  if (osmType !== 'node' && osmType !== 'way' && osmType !== 'relation') return null
  const name = nameOf(el.tags) || fallbackName(category)
  return {
    id: `${osmType}/${el.id}`,
    category,
    name,
    lat: c.lat,
    lng: c.lng,
    city,
    osmType,
    osmId: el.id,
  }
}

function fallbackName(cat: PoiCategory): string {
  switch (cat) {
    case 'metro':
      return 'მეტრო'
    case 'pharmacy':
      return 'აფთიაქი'
    case 'school':
      return 'სკოლა'
    case 'university':
      return 'უნივერსიტეტი'
    case 'park':
      return 'პარკი'
    case 'shop':
      return 'მაღაზია'
    case 'gym':
      return 'სპორტდარბაზი'
    case 'hospital':
      return 'კლინიკა'
    case 'landmark':
      return 'ღირსშესანიშნაობა'
    default: {
      const _exhaustive: never = cat
      return _exhaustive
    }
  }
}

async function main() {
  const byId = new Map<string, Poi>()
  for (const [city, box] of Object.entries(BOXES) as [BoxKey, (typeof BOXES)[BoxKey]][]) {
    const t = bb(box)
    // one union per city — Overpass prefers a single round-trip each
    const query = `
(
  // Tbilisi metro only — Georgia-wide subway tags pick up Abkhazia noise.
  node["railway"="station"]["station"="subway"](${t});
  node["public_transport"="station"]["subway"="yes"](${t});
  nwr["amenity"="pharmacy"](${t});
  nwr["amenity"="school"](${t});
  nwr["amenity"="kindergarten"](${t});
  nwr["amenity"="university"](${t});
  nwr["amenity"="college"](${t});
  nwr["leisure"="park"]["name"](${t});
  nwr["shop"="supermarket"](${t});
  nwr["shop"="mall"](${t});
  nwr["shop"="convenience"](${t});
  nwr["shop"="department_store"](${t});
  nwr["leisure"="fitness_centre"](${t});
  nwr["amenity"="gym"](${t});
  nwr["amenity"="hospital"](${t});
  nwr["amenity"="clinic"](${t});
  nwr["tourism"~"^(attraction|museum|viewpoint|gallery)$"](${t});
  nwr["amenity"="place_of_worship"](${t});
  nwr["amenity"="theatre"](${t});
  nwr["historic"~"^(castle|church|monastery|monument|ruins|archaeological_site|battlefield|fort|citywalls|city_gate|manor|heritage|wayside_shrine)$"](${t});
);
out center tags;`

    console.log(`fetching ${city} POIs from Overpass…`)
    const elements = await overpass(query)
    console.log(`${city} raw elements: ${elements.length}`)

    for (const el of elements) {
      const p = toPoi(el, city)
      if (!p) continue
      // prefer named over fallback
      const prev = byId.get(p.id)
      if (!prev || (prev.name === fallbackName(prev.category) && p.name !== fallbackName(p.category))) {
        byId.set(p.id, p)
      }
    }
  }

  const pois = [...byId.values()].sort((a, b) =>
    a.category === b.category ? a.name.localeCompare(b.name, 'ka') : a.category.localeCompare(b.category),
  )

  const counts: Record<string, number> = {}
  const byCity: Record<string, Record<string, number>> = {}
  for (const p of pois) {
    counts[p.category] = (counts[p.category] ?? 0) + 1
    byCity[p.city] ??= {}
    byCity[p.city]![p.category] = (byCity[p.city]![p.category] ?? 0) + 1
  }
  console.log('counts:', counts)
  console.log('byCity:', byCity)

  const out = new URL('../src/data/georgia-pois.json', import.meta.url)
  writeFileSync(
    out,
    JSON.stringify(
      {
        attribution: '© OpenStreetMap contributors (ODbL)',
        fetchedAt: new Date().toISOString().slice(0, 10),
        bbox: BOXES,
        counts,
        byCity,
        pois,
      },
      null,
      1,
    ),
  )
  console.log(`wrote ${pois.length} pois → ${out.pathname}`)
}

main()
