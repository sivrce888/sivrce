/**
 * Self-check for the Germany country adapter + national seed (no network).
 * Run: npx tsx src/lib/countries/de.check.ts
 */
import assert from 'node:assert/strict'
import {
  acquisitionCostEstimate,
  BERLIN_BEZIRKE,
  bezirkKaLabel,
  bezirkSlugOfOrtsteil,
  DE_CITIES,
  deCityBySlug,
} from './de'
import { MARKETS } from '@/lib/markets'
import { foldGerman, normalizeName, parseIntelQuery, sourcesFor } from '@/lib/intel/core'
import { DEVELOPERS } from '@/data/professionals'
import { NEW_DEVELOPERS_GERMANY } from '@/data/projects-new-germany'

// 12 official Bezirke, unique slugs
assert.equal(BERLIN_BEZIRKE.length, 12, 'bezirke count')
assert.equal(new Set(BERLIN_BEZIRKE.map((b) => b.slug)).size, 12, 'bezirke unique')
assert.equal(bezirkKaLabel('mitte'), 'მიტე', 'mitte ka')

// Ortsteil → Bezirk (umlaut-tolerant)
assert.equal(bezirkSlugOfOrtsteil('Kreuzberg'), 'friedrichshain-kreuzberg', 'kreuzberg')
assert.equal(bezirkSlugOfOrtsteil('Neukölln'), 'neukoelln', 'neukolln fold')
assert.equal(bezirkSlugOfOrtsteil('Prenzlauer Berg'), 'pankow', 'pberg')
assert.equal(bezirkSlugOfOrtsteil('Buckow'), 'neukoelln', 'buckow')
assert.equal(bezirkSlugOfOrtsteil('Mitte'), 'mitte', 'mitte')
assert.equal(bezirkSlugOfOrtsteil('Nowherehausen'), null, 'unknown → null')

// City set mirrors the market registry 1:1 (no phantom metros)
const marketCities = new Set(MARKETS.de.citySlugs)
assert.equal(DE_CITIES.length, marketCities.size, 'city count mirrors markets')
for (const c of DE_CITIES) assert.ok(marketCities.has(c.slug), `market city: ${c.slug}`)
for (const c of DE_CITIES) {
  assert.ok(c.transferTaxPct >= 3.5 && c.transferTaxPct <= 6.5, `tax range: ${c.slug}`)
  assert.ok(Math.abs(c.center.lat) <= 90 && Math.abs(c.center.lng) <= 180, `coords: ${c.slug}`)
}
assert.equal(deCityBySlug('berlin')?.transferTaxPct, 6.0, 'berlin tax')
assert.equal(deCityBySlug('munich')?.transferTaxPct, 3.5, 'bavaria tax')
assert.equal(acquisitionCostEstimate(100_000, 'berlin'), 108_000, 'acquisition math')
assert.equal(acquisitionCostEstimate(-5, 'berlin'), null, 'negative → null')
assert.equal(acquisitionCostEstimate(100_000, 'atlantis'), null, 'unknown city → null')

// German normalization: umlauts fold, legal suffixes drop
assert.equal(foldGerman('müller straße'), 'muller strasse', 'fold')
assert.equal(normalizeName('Müller GmbH'), normalizeName('Muller'), 'gmbh dropped')
assert.equal(normalizeName('LEG Immobilien AG'), normalizeName('leg immobilien'), 'ag dropped')

// DE registry covers permits + identity; intel queries understand Berlin
assert.ok(sourcesFor('DE', 'permit_status').some((s) => s.slug === 'de-alkis'), 'alkis permits')
assert.ok(sourcesFor('DE', 'price').some((s) => s.slug === 'de-boris'), 'boris prices')
assert.ok(sourcesFor('DE', 'company_identity').some((s) => s.slug === 'de-handelsregister'), 'register identity')
const berlin = parseIntelQuery('Show me every active development in Berlin')
assert.equal(berlin?.city, 'ბერლინი', 'berlin city')
assert.equal(berlin?.status, 'active', 'berlin active')
const kreuzberg = parseIntelQuery('Neubauwohnungen in Kreuzberg unter €500k')
assert.equal(kreuzberg?.district, 'კროიცბერგი', 'kreuzberg district')
assert.equal(kreuzberg?.maxPrice, 500_000, 'euro money')

// National seed: wired, unique, official sites only, no placeholder phones
const devSlugs = DEVELOPERS.map((d) => d.slug)
assert.equal(new Set(devSlugs).size, devSlugs.length, 'dev slugs unique')
for (const d of NEW_DEVELOPERS_GERMANY) {
  assert.ok(devSlugs.includes(d.slug), `wired: ${d.slug}`)
  assert.ok(d.website?.startsWith('https://'), `official site: ${d.slug}`)
  assert.equal(d.verified, false, `unverified until review: ${d.slug}`)
  assert.ok(!/^\+49 30 000000$/.test(d.phone), `no placeholder phone: ${d.slug}`)
  assert.ok(d.unitsDelivered > 0 && d.description.en.length > 40, `substance: ${d.slug}`)
}

console.log(
  `de-adapter: ${BERLIN_BEZIRKE.length} bezirke / ${DE_CITIES.length} cities / +${NEW_DEVELOPERS_GERMANY.length} national devs ✓`,
)
