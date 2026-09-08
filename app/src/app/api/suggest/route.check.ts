/**
 * Self-check: /api/suggest city aliasing — one town, one city row.
 * Run: npx tsx src/app/api/suggest/route.check.ts
 */
import { GET, CITY_ALIASES } from './route'
import { GEO_CITIES } from '@/data/georgia-locations'

type Sug = { kind: string; ka: string }

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

  console.log('suggest route ok: aliases resolve, no duplicate city rows')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
