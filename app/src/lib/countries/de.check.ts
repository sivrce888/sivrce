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
  buyerCostBreakdown,
  DE_CITIES,
  DE_EFFICIENCY_TIERS,
  DE_ENERGY_CLASSES,
  DE_MAKLER_BUYER_PCT,
  grossYieldPct,
  DE_RENTAL_RULES,
  deCityBySlug,
  GRUNDERWERBSTEUER_BY_STATE,
} from './de'
import { MARKETS } from '@/lib/markets'
import { foldGerman, normalizeName, parseIntelQuery, sourcesFor } from '@/lib/intel/core'
import { DEVELOPERS } from '@/data/professionals'
import { NEW_DEVELOPERS_GERMANY } from '@/data/projects-new-germany'
import { getMetrosByCountry } from '@/data/world-metros'
import { worldDevelopers } from '@/data/world-developers'
import { WORLD_PROJECTS } from '@/data/world-projects'

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

// Kaufnebenkosten breakdown: Berlin 500k with Makler = 8% + 3.57%
const full = buyerCostBreakdown(500_000, 'berlin')
assert.equal(full?.transferTax, 30_000, 'berlin tax 6%')
assert.equal(full?.notary, 7_500, 'notary 1.5%')
assert.equal(full?.register, 2_500, 'register 0.5%')
assert.equal(full?.makler, 17_850, 'makler 3.57%')
assert.equal(full?.total, 557_850, 'berlin total with makler')
assert.equal(full?.totalPct, 11.6, 'berlin surcharge pct')
const bare = buyerCostBreakdown(500_000, 'berlin', { withMakler: false })
assert.equal(bare?.makler, 0, 'provisionsfrei → no makler')
assert.equal(bare?.total, 540_000, 'berlin total without makler')
assert.equal(bare?.totalPct, 8, 'berlin surcharge w/o makler')
assert.equal(buyerCostBreakdown(200_000, 'munich')?.transferTax, 7_000, 'bavaria 3.5%')
assert.equal(buyerCostBreakdown(-5, 'berlin'), null, 'negative → null')
assert.equal(buyerCostBreakdown(100_000, 'atlantis'), null, 'unknown city → null')
assert.equal(DE_MAKLER_BUYER_PCT, 3.57, 'makler split rate')

// All 16 Bundesländer covered; launch metros mirror their state rate
assert.equal(Object.keys(GRUNDERWERBSTEUER_BY_STATE).length, 16, '16 states')
assert.equal(GRUNDERWERBSTEUER_BY_STATE.Berlin, 6.0, 'state berlin')
assert.equal(GRUNDERWERBSTEUER_BY_STATE.Bayern, 3.5, 'state bavaria')
for (const c of DE_CITIES) {
  assert.equal(c.transferTaxPct, GRUNDERWERBSTEUER_BY_STATE[c.state], `city mirrors state: ${c.slug}`)
}

// Rental + energy anchors Germans check first
assert.equal(DE_RENTAL_RULES.maxDepositColdRents, 3, 'kaution cap')
assert.equal(DE_RENTAL_RULES.rentBrakePctAboveComparative, 10, 'rent brake')
assert.equal(DE_ENERGY_CLASSES.length, 9, 'A+..H classes')
assert.equal(DE_ENERGY_CLASSES[0], 'A+', 'best class')
assert.equal(DE_ENERGY_CLASSES[8], 'H', 'worst class')
assert.ok(DE_EFFICIENCY_TIERS.includes('EH 40'), 'kfw tier')

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
  assert.ok(!/^\+49 30 000000$/.test(d.phone ?? ''), `no placeholder phone: ${d.slug}`)
  assert.ok(d.unitsDelivered > 0 && d.description.en.length > 40, `substance: ${d.slug}`)
}

// National city coverage: every German Großstadt carries tax + price anchors,
// ka labels stay unique (they are the internal city join key).
assert.ok(DE_CITIES.length >= 75, `großstadt coverage: ${DE_CITIES.length}`)
assert.equal(new Set(DE_CITIES.map((c) => c.ka)).size, DE_CITIES.length, 'ka labels unique')
for (const c of DE_CITIES) {
  assert.ok(c.buyEurSqm >= 1500 && c.buyEurSqm <= 12000, `buy anchor: ${c.slug}`)
  assert.ok(c.rentEurSqm >= 5 && c.rentEurSqm <= 35, `rent anchor: ${c.slug}`)
  const y = grossYieldPct(c)
  assert.ok(y >= 2 && y <= 9, `yield sane: ${c.slug} = ${y}`)
}
assert.equal(grossYieldPct(DE_CITIES[0]!), 3.5, 'berlin yield math')
// City slugs stay globally unique across markets (findCountryByCity depends on it).
const cityOwners = new Map<string, string>()
for (const id of Object.keys(MARKETS) as (keyof typeof MARKETS)[]) {
  for (const s of MARKETS[id].citySlugs) {
    const prev = cityOwners.get(s)
    assert.ok(!prev || prev === id, `cross-market city dup: ${s} (${prev}/${id})`)
    cityOwners.set(s, id)
  }
}
// World layer: no phantom rail systems, every launched metro keeps data,
// developer slugs unique, landmark projects keep substance.
const deSlugs = new Set(DE_CITIES.map((c) => c.slug))
const deMetroSystems = getMetrosByCountry('DE')
assert.ok(deMetroSystems.length >= 16, `rail systems: ${deMetroSystems.length}`)
for (const m of deMetroSystems) {
  assert.ok(deSlugs.has(m.citySlug), `phantom rail city: ${m.citySlug}`)
}
const worldDevSlugs = worldDevelopers.filter((d) => d.cc === 'DE').map((d) => d.slug)
assert.equal(new Set(worldDevSlugs).size, worldDevSlugs.length, 'world DE dev slugs unique')
const deProjects = WORLD_PROJECTS.filter((p) => p.cc === 'DE')
assert.ok(deProjects.length >= 12, `DE projects: ${deProjects.length}`)
for (const p of deProjects) {
  assert.ok(p.description.length > 40, `project substance: ${p.slug}`)
}

console.log(
  `de-adapter: ${BERLIN_BEZIRKE.length} bezirke / ${DE_CITIES.length} cities / +${NEW_DEVELOPERS_GERMANY.length} national devs / ${deMetroSystems.length} rail systems ✓`,
)
