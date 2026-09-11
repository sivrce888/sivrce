/**
 * Self-check for the per-market buyer-cost + rental-rule model (no network).
 * Run: npx tsx src/lib/countries/costs.check.ts
 *
 * Guards the two ways this file rots: a market city added without its local
 * rate, and a rate here drifting from the copy that quotes it on the page.
 */
import assert from 'node:assert/strict'
import {
  bandedTax,
  buyerCosts,
  cityFact,
  cityRateRows,
  countryFacts,
  marketMoney,
  marketTrust,
  MARKET_COSTS,
} from './costs'
import { buyerCostBreakdown, DE_CITIES, GRUNDERWERBSTEUER_BY_STATE } from './de'
import { COUNTRY_IDS, MARKETS } from '@/lib/markets'
import { cityPack } from '@/lib/country-copy'

// Every launched market is modelled, and every market city has an explicit
// local rate — no silent fallback to the country default on a live page.
for (const cc of COUNTRY_IDS) {
  const m = MARKET_COSTS[cc]
  assert.ok(m, `no cost model: ${cc}`)
  assert.ok(m.closer.length > 2, `closer: ${cc}`)
  assert.ok(m.cashLabel.length > 8, `cashLabel: ${cc}`)
  assert.ok(m.taxLabel.length > 2, `taxLabel: ${cc}`)
  assert.ok(m.note.length > 80, `thin note: ${cc}`)
  assert.equal(m.rentRules.length, 3, `3 rent rules: ${cc}`)
  assert.equal(m.trust.length, 3, `3 trust items: ${cc}`)
  assert.ok(m.citiesTitle.length > 8 && m.citiesSub.length > 40, `cities band copy: ${cc}`)
  for (const slug of MARKETS[cc].citySlugs) {
    const f = m.cities[slug]
    assert.ok(f, `missing local rate: ${cc}/${slug}`)
    assert.ok(f.chip.length > 0 && f.chipTitle.length > 8, `chip copy: ${cc}/${slug}`)
    assert.ok(f.region.length > 1, `region: ${cc}/${slug}`)
    assert.ok(f.pct !== null || f.bands, `rate or bands: ${cc}/${slug}`)
    if (f.pct !== null) assert.ok(f.pct >= 0 && f.pct <= 15, `sane rate: ${cc}/${slug}`)
  }
  // Germany computes its facts band from the live catalog; everyone else is static.
  if (cc !== 'de') assert.equal(countryFacts(cc).length, 4, `4 facts: ${cc}`)
  assert.deepEqual(marketTrust(cc), m.trust, `trust accessor: ${cc}`)
}

// Progressive slice tax (UK). Hand-computed against the published bands.
assert.equal(bandedTax(100_000, MARKET_COSTS.gb.cities.london!.bands!), 0, 'sdlt under nil band')
assert.equal(bandedTax(500_000, MARKET_COSTS.gb.cities.london!.bands!), 15_000, 'sdlt 500k')
// 2,500 + 33,750 + 57,500 + 60,000 across the five slices.
assert.equal(bandedTax(2_000_000, MARKET_COSTS.gb.cities.london!.bands!), 153_750, 'sdlt 2m top slice')
assert.equal(bandedTax(500_000, MARKET_COSTS.gb.cities.edinburgh!.bands!), 23_350, 'lbtt 500k')
assert.ok(
  bandedTax(500_000, MARKET_COSTS.gb.cities.edinburgh!.bands!) >
    bandedTax(500_000, MARKET_COSTS.gb.cities.london!.bands!),
  'lbtt bites earlier than sdlt',
)

// England carries the non-resident surcharge; Scotland does not.
assert.equal(cityFact('gb', 'london').surchargePct, 2, 'england non-resident surcharge')
assert.equal(cityFact('gb', 'glasgow').surchargePct, undefined, 'no scottish non-resident surcharge')
assert.equal(cityFact('gb', 'edinburgh').chip, 'LBTT', 'scotland is a different tax')
assert.equal(cityFact('gb', 'leeds').chip, 'SDLT', 'england is sdlt')

// Germany is derived, never re-typed: costs.ts must agree with the audited table.
for (const c of DE_CITIES) {
  assert.equal(cityFact('de', c.slug).pct, GRUNDERWERBSTEUER_BY_STATE[c.state], `de mirrors state: ${c.slug}`)
}
const deHere = buyerCosts('de', 'berlin', 500_000)
const deThere = buyerCostBreakdown(500_000, 'berlin')
assert.equal(deHere?.total, deThere?.total, 'de total agrees with de.ts')
assert.equal(deHere?.totalPct, deThere?.totalPct, 'de surcharge agrees with de.ts')

// Spain: the regional spread is the whole point of the city band.
assert.equal(cityFact('es', 'madrid').pct, 6, 'madrid itp')
assert.equal(cityFact('es', 'barcelona').pct, 10, 'catalonia itp')
assert.equal(cityFact('es', 'malaga').pct, 7, 'andalucia itp')
assert.equal(cityFact('es', 'seville').pct, 7, 'andalucia itp (seville)')
assert.equal(cityFact('es', 'valencia').pct, 10, 'valencia itp')
assert.equal(cityFact('es', 'alicante').pct, 10, 'alicante itp')
const bcn = buyerCosts('es', 'barcelona')
const mad = buyerCosts('es', 'madrid')
assert.equal(bcn?.lines[0]?.amount, 30_000, 'barcelona itp on the €300k sample')
assert.equal(mad?.lines[0]?.amount, 18_000, 'madrid itp on the €300k sample')
assert.equal((bcn?.total ?? 0) - (mad?.total ?? 0), 12_000, 'the €12k regional gap the copy claims')

// Alberta charges no transfer tax — the model must emit no tax line at all.
assert.equal(cityFact('ca', 'calgary').pct, 0, 'alberta zero ltt')
assert.ok(
  !buyerCosts('ca', 'calgary')?.lines.some((l) => l.label.includes('Land transfer')),
  'no phantom alberta transfer-tax line',
)
assert.ok(
  (buyerCosts('ca', 'toronto')?.total ?? 0) > (buyerCosts('ca', 'calgary')?.total ?? 0),
  'toronto closes dearer than calgary',
)

// UAE: the transfer fee changes at the emirate border.
assert.equal(cityFact('ae', 'dubai').pct, 4, 'dubai dld')
assert.equal(cityFact('ae', 'abu-dhabi').pct, 2, 'abu dhabi dmt')
assert.equal(cityFact('ae', 'sharjah').pct, 2, 'sharjah')

// Turkey has no stable nominal anchor: percent-only rendering, never fake dirham-style totals.
const tr = buyerCosts('tr', 'istanbul')
assert.equal(tr?.percentOnly, true, 'TRY renders percentages only')
assert.equal(tr?.price, 100, 'percent-only base is 100')
assert.equal(cityFact('tr', 'bodrum').pct, 4, 'national tapu fee')

// A banded market still produces a usable worked example.
const gb = buyerCosts('gb', 'london', 500_000)
assert.equal(gb?.lines[0]?.amount, 15_000, 'sdlt line')
assert.equal(gb?.lines[1]?.amount, 10_000, 'non-resident surcharge line')
assert.equal(gb?.total, 528_000, 'uk cash at completion')
assert.equal(gb?.totalPct, 5.6, 'uk surcharge pct')

// Guard rails on the pure function.
assert.equal(buyerCosts('fr', 'paris', 0), null, 'zero price → null')
assert.equal(buyerCosts('fr', 'paris', -1), null, 'negative price → null')
assert.ok((buyerCosts('fr', 'paris')?.totalPct ?? 0) >= 6.5, 'french frais de notaire ≈7%')
assert.ok((buyerCosts('fr', 'paris')?.totalPct ?? 0) <= 8, 'french frais de notaire not inflated')

// City rows are market-ordered and skip cities with no published copy.
const rows = cityRateRows('es', (s) => cityPack('es', s)?.name ?? null)
assert.equal(rows.length, MARKETS.es.citySlugs.length, 'every ES city has copy + a rate')
assert.equal(rows[0]?.slug, MARKETS.es.citySlugs[0], 'market order preserved')
assert.equal(cityRateRows('es', () => null).length, 0, 'no copy → no row')

// Money formatter speaks the market's currency, not GEL.
assert.ok(marketMoney('gb')(1000).includes('£'), 'gbp symbol')
assert.ok(marketMoney('us')(1000).includes('$'), 'usd symbol')

// A hub must never invent a national average: the country default mirrors the
// flagship city's real rate, which is what MarketHome renders and names.
for (const cc of COUNTRY_IDS) {
  const flagship = MARKETS[cc].defaultCitySlug
  assert.deepEqual(
    MARKET_COSTS[cc].defaultCity,
    MARKET_COSTS[cc].cities[flagship],
    `default must mirror flagship city: ${cc}/${flagship}`,
  )
}

const cities = COUNTRY_IDS.reduce((n, cc) => n + MARKETS[cc].citySlugs.length, 0)
console.log(`costs.check: ${COUNTRY_IDS.length} markets / ${cities} cities priced ✓`)
