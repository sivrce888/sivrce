/**
 * Self-check: /api/suggest city aliasing — one town, one city row.
 * Run: npx tsx src/app/api/suggest/route.check.ts
 */
import { GET, CITY_ALIASES } from './route'
import { GEO_CITIES } from '@/data/georgia-locations'

type Sug = { kind: string; ka: string; slug?: string; city?: string }

async function suggest(q: string): Promise<Sug[]> {
  const res = await GET(new Request(`https://sivrce.ge/api/suggest?q=${encodeURIComponent(q)}`))
  return ((await res.json()) as { suggestions: Sug[] }).suggestions
}

async function main() {
  // An alias must never also be a catalog city — the ყაზბეგი/სტეფანწმინდა duplicate regression.
  for (const [city, aliases] of Object.entries(CITY_ALIASES)) {
    if (!GEO_CITIES.includes(city)) throw new Error(`alias target not a city: ${city}`)
    for (const a of aliases) {
      if (GEO_CITIES.includes(a)) throw new Error(`alias also listed as a city: ${a}`)
      const hits = await suggest(a)
      if (!hits.some((s) => s.kind === 'city' && s.ka === city)) {
        throw new Error(`"${a}" did not resolve to city "${city}"`)
      }
    }
  }

  // The canonical name itself still resolves as a city.
  if (!(await suggest('ყაზბეგი')).some((s) => s.kind === 'city' && s.ka === 'ყაზბეგი')) {
    throw new Error('canonical city ყაზბეგი missing from suggest')
  }

  async function deSuggest(q: string, city?: string): Promise<Sug[]> {
    const sp = new URLSearchParams({ q, mkt: 'de' })
    if (city) sp.set('city', city)
    const res = await GET(new Request(`https://sivrce.com/api/suggest?${sp}`))
    return ((await res.json()) as { suggestions: Sug[] }).suggestions
  }
  const kreuzberg = await deSuggest('Kreuzberg')
  if (!kreuzberg.some((s) => s.kind === 'district' && s.ka === 'Kreuzberg')) {
    throw new Error('mkt=de Kreuzberg missing')
  }
  const geLeak = await suggest('Kreuzberg')
  if (geLeak.some((s) => s.ka === 'Kreuzberg')) {
    throw new Error('DE name leaked into GE suggest')
  }
  const berlinOnly = await deSuggest('Tor', 'Berlin')
  if (berlinOnly.length === 0) throw new Error('Berlin street prefix empty')

  // Developers suggestion check (e.g. Archi, m2)
  const archiHits = await suggest('Archi')
  if (!archiHits.some((s) => s.kind === 'developer' || s.kind === 'project')) {
    throw new Error('developer or project suggestion for "Archi" missing')
  }

  // Building suggestion check (e.g. Axis Towers)
  const axisHits = await suggest('აქსის თაუერსი')
  if (!axisHits.some((s) => s.kind === 'building' || s.kind === 'project')) {
    throw new Error('building suggestion for "აქსის თაუერსი" missing')
  }

  // Country suggestion check (e.g. Germany)
  const germanyHits = await suggest('Germany')
  if (!germanyHits.some((s) => s.kind === 'country')) {
    throw new Error('country suggestion for "Germany" missing')
  }

  // POI suggestion (georgia-pois catalog) + city scoping never crosses cities.
  const poiHits = await suggest('აკვა ცენტრი და ფიტნესი')
  if (!poiHits.some((s) => s.kind === 'poi')) throw new Error('POI suggestion for "აკვა ცენტრი და ფიტნესი" missing')
  const poiScoped = await GET(new Request('https://sivrce.ge/api/suggest?q=' + encodeURIComponent('აკვა') + '&city=' + encodeURIComponent('ბათუმი')))
  const scoped = ((await poiScoped.json()) as { suggestions: Sug[] }).suggestions
  if (scoped.some((s) => s.kind === 'poi' && s.city !== 'ბათუმი')) {
    throw new Error('POI from another city leaked into ბათუმი scope')
  }

  // Metro stations: Tbilisi slug navigates, world stations resolve by name.
  // (Station names shared with projects/buildings — e.g. ვარკეთილი — rank below them; that's fine.)
  const metroHits = await suggest('გოცირიძე')
  if (!metroHits.some((s) => s.kind === 'metro' && s.slug === 'gotsiridze')) {
    throw new Error('Tbilisi metro station suggestion missing')
  }
  const seoulHits = await suggest('Gangnam')
  if (!seoulHits.some((s) => s.kind === 'metro' && s.city === 'სეული')) {
    throw new Error('world metro station suggestion missing')
  }

  console.log('suggest route ok: aliases resolve, developers, projects, buildings, countries, POIs, metro & DE market isolated')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
