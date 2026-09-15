/**
 * Self-check for GEG § 87 Pflichtangaben. Run: npx tsx src/lib/countries/de-geg.check.ts
 *
 * This guards a legal trust boundary: if it goes red, a German seller can
 * publish an ad that earns them an Ordnungswidrigkeit (§ 108 GEG, up to
 * 10.000 €). Treat a failure here as a ship-blocker, not a lint nit.
 */
import assert from 'node:assert/strict'
import {
  DE_GEG_CERT_TYPES,
  DE_GEG_ENERGY_SOURCES,
  DE_GEG_EXEMPTIONS,
  checkGegPflichtangaben,
  energyClassFromKwh,
  gegAppliesTo,
  isResidentialPropertyType,
  parseGegBody,
} from './de-geg'

// Anlage 10 GEG boundaries are inclusive: 30 is still A+, 30.1 is already A.
assert.equal(energyClassFromKwh(0), 'A+', '0 kWh is A+')
assert.equal(energyClassFromKwh(30), 'A+', '30 is the A+ ceiling')
assert.equal(energyClassFromKwh(30.1), 'A', 'just over 30 is A')
assert.equal(energyClassFromKwh(50), 'A', '50 is the A ceiling')
assert.equal(energyClassFromKwh(75), 'B')
assert.equal(energyClassFromKwh(100), 'C')
assert.equal(energyClassFromKwh(130), 'D')
assert.equal(energyClassFromKwh(160), 'E')
assert.equal(energyClassFromKwh(200), 'F')
assert.equal(energyClassFromKwh(250), 'G', '250 is the G ceiling')
assert.equal(energyClassFromKwh(250.1), 'H', 'above 250 is H')
assert.equal(energyClassFromKwh(900), 'H', 'unsanierter Altbau is still H')
// Monotonic: more energy use never improves the class.
let prev = -1
for (let k = 0; k <= 400; k += 1) {
  const idx = ['A+', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'].indexOf(energyClassFromKwh(k))
  assert.ok(idx >= prev, `class must not improve as kWh rises (at ${k})`)
  prev = idx
}

// A bare ad with no energy facts must be rejected, naming all five duties.
const empty = checkGegPflichtangaben({ residential: true })
assert.equal(empty.ok, false, 'no facts must fail')
assert.deepEqual(
  empty.missing,
  ['certType', 'endenergie', 'energySource', 'yearBuilt', 'energyClass'],
  'all five § 87 facts reported missing',
)
assert.equal(empty.disclosure, null, 'no disclosure without facts')

// Nichtwohngebäude owe Nr. 1–3 only.
const nonResidential = checkGegPflichtangaben({ residential: false })
assert.deepEqual(nonResidential.missing, ['certType', 'endenergie', 'energySource'], 'Nichtwohngebäude owe three')

// A complete, consistent Wohngebäude disclosure passes and renders.
const full = checkGegPflichtangaben({
  certType: 'bedarf',
  endenergieKwhSqmYear: 92,
  energySource: 'waermepumpe',
  yearBuilt: 1998,
  energyClass: 'C',
  residential: true,
})
assert.equal(full.ok, true, 'complete disclosure passes')
assert.equal(full.classMismatch, null, '92 kWh is genuinely class C')
assert.ok(full.disclosure?.includes('Energiebedarfsausweis'), 'names the cert kind (Nr. 1)')
assert.ok(full.disclosure?.includes('92 kWh/(m²·a)'), 'names the value (Nr. 2)')
assert.ok(full.disclosure?.includes('Wärmepumpe'), 'names the Energieträger (Nr. 3)')
assert.ok(full.disclosure?.includes('Baujahr 1998'), 'names the Baujahr (Nr. 4)')
assert.ok(full.disclosure?.includes('Energieeffizienzklasse C'), 'names the class (Nr. 5)')

// Nr. 2 wording must follow Nr. 1 — Verbrauchsausweis states Verbrauch.
const verbrauch = checkGegPflichtangaben({
  certType: 'verbrauch',
  endenergieKwhSqmYear: 92,
  energySource: 'gas',
  yearBuilt: 1998,
  energyClass: 'C',
  residential: true,
})
assert.ok(verbrauch.disclosure?.includes('Endenergieverbrauch'), 'Verbrauchsausweis states Verbrauch')
assert.ok(!verbrauch.disclosure?.includes('Endenergiebedarf'), 'and never Bedarf')

// The most common German listing defect: a class that contradicts the value.
const wrongClass = checkGegPflichtangaben({
  certType: 'bedarf',
  endenergieKwhSqmYear: 210,
  energySource: 'oel',
  yearBuilt: 1962,
  energyClass: 'B',
  residential: true,
})
assert.equal(wrongClass.ok, true, 'the Ausweis stays the legal source of truth — surfaced, not blocked')
assert.deepEqual(wrongClass.classMismatch, { declared: 'B', derived: 'G' }, '210 kWh is G (F caps at 200), not B')

// Declared legal exemptions end the duty — and only the declared ones.
for (const ex of DE_GEG_EXEMPTIONS) {
  const v = checkGegPflichtangaben({ exemption: ex, residential: true })
  assert.equal(v.ok, true, `${ex} exempts`)
  assert.equal(v.exempt, true, `${ex} is flagged exempt`)
  assert.equal(v.disclosure, null, `${ex} owes no disclosure line`)
}
assert.equal(
  checkGegPflichtangaben({ exemption: 'kein_bock' as never, residential: true }).ok,
  false,
  'an invented exemption must not pass',
)

// Trust boundary: junk payloads read as missing, never as an accepted claim.
const junk = parseGegBody(
  { certType: 'bedarfsausweis', endenergieKwhSqmYear: '92', energySource: 'atomkraft', yearBuilt: 1500, energyClass: 'Z' },
  true,
)
assert.deepEqual(
  junk,
  { exemption: null, certType: null, endenergieKwhSqmYear: null, energySource: null, yearBuilt: null, energyClass: null, residential: true },
  'every junk field is nulled, not coerced',
)
assert.equal(checkGegPflichtangaben(junk).ok, false, 'junk cannot publish')
assert.equal(parseGegBody(null, true).certType, null, 'a null body does not throw')
assert.equal(parseGegBody({ endenergieKwhSqmYear: 1001 }, true).endenergieKwhSqmYear, null, 'absurd kWh rejected')
assert.equal(parseGegBody({ endenergieKwhSqmYear: 92.44 }, true).endenergieKwhSqmYear, 92.4, 'kWh kept to 0.1')
assert.equal(parseGegBody({ yearBuilt: 2100 }, true).yearBuilt, null, 'far-future Baujahr rejected')

// Scope: only DE sale/rent of a building owes § 87.
assert.equal(gegAppliesTo('DE', 'sale', 'apartment'), true)
assert.equal(gegAppliesTo('DE', 'rent', 'house'), true)
assert.equal(gegAppliesTo('de', 'sale', 'apartment'), true, 'country compare is case-insensitive')
assert.equal(gegAppliesTo('DE', 'daily', 'apartment'), false, 'a nightly stay is not a Vermietung under GEG')
assert.equal(gegAppliesTo('DE', 'sale', 'land'), false, 'bare land has no Energieausweis')
assert.equal(gegAppliesTo('GE', 'sale', 'apartment'), false, 'Georgian ads are out of scope')

assert.equal(isResidentialPropertyType('apartment'), true)
assert.equal(isResidentialPropertyType('commercial'), false, 'commercial is a Nichtwohngebäude')
assert.equal(isResidentialPropertyType('hotel'), false, 'hotel is a Nichtwohngebäude')

// The option lists the wizard renders must stay non-empty and unique.
for (const [name, list] of [
  ['cert types', DE_GEG_CERT_TYPES],
  ['energy sources', DE_GEG_ENERGY_SOURCES],
  ['exemptions', DE_GEG_EXEMPTIONS],
] as const) {
  assert.ok(list.length > 0, `${name} not empty`)
  assert.equal(new Set(list).size, list.length, `${name} unique`)
}

console.log(`de-geg.check: OK ✓ — § 87 GEG enforced, ${DE_GEG_ENERGY_SOURCES.length} Energieträger, Anlage 10 classes verified`)
