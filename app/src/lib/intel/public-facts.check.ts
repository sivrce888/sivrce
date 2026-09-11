/**
 * Runnable check: npx tsx src/lib/intel/public-facts.check.ts
 */
import assert from 'node:assert/strict'
import { toPublicFacts, sourcesHeading, type FactLike } from './public-facts'

const base = {
  confidence: 61,
  verification: 'high_confidence',
  freshness: 'recent',
  lastSeenAt: new Date('2026-09-01T10:00:00Z'),
}

const facts: FactLike[] = [
  {
    ...base,
    factType: 'coordinates',
    value: '52.5200066,13.404954',
    evidence: [{ sourceSlug: 'global-osm', url: 'https://overpass-api.de/x', retrievedAt: new Date('2026-09-01') }],
  },
  {
    ...base,
    factType: 'project_status',
    value: 'under_construction',
    verification: 'conflicting',
    alternatives: ['completed', '', 'under_construction'],
    lastVerifiedAt: new Date('2026-08-20T00:00:00Z'),
    evidence: [
      { sourceSlug: 'official-developer', url: 'https://www.example-bau.de/projekt', retrievedAt: new Date('2026-08-30') },
      { sourceSlug: 'de-bplaene', url: null, retrievedAt: new Date('2026-08-10') },
    ],
  },
  { ...base, factType: 'address', value: '  Musterstraße 1  ' },
  // dropped: unknown fact type + empty value
  { ...base, factType: 'not_a_fact', value: 'x' },
  { ...base, factType: 'price', value: '   ' },
]

const en = toPublicFacts(facts, 'en')
assert.deepEqual(en.map((r) => r.fact), ['project_status', 'address', 'coordinates'], 'FACT_TYPES order, junk dropped')

const status = en[0]
assert.equal(status.value, 'Under construction')
assert.equal(status.verificationLabel, 'Sources disagree')
assert.deepEqual(status.alternatives, ['Completed'], 'conflicting value kept, blanks + self dropped')
assert.equal(status.checkedAt, '2026-08-20', 'lastVerifiedAt wins over lastSeenAt')
// newest evidence names the source; official-developer shows the host, not "per-entity"
assert.equal(status.sourceName, 'example-bau.de')
assert.equal(status.sourceUrl, 'https://www.example-bau.de/projekt')

assert.equal(en[1].value, 'Musterstraße 1', 'trimmed')
assert.equal(en[1].sourceName, '', 'no evidence ⇒ no source claim')
assert.equal(en[2].value, '52.5200, 13.4050', 'coords rounded')
assert.equal(en[2].sourceName, 'OpenStreetMap', 'registry name')
assert.equal(en[2].checkedAt, '2026-09-01')

const de = toPublicFacts(facts, 'de')
assert.equal(de[0].label, 'Baustatus')
assert.equal(de[0].value, 'Im Bau')
assert.deepEqual(de[0].alternatives, ['Fertiggestellt'])
assert.equal(de[2].label, 'Koordinaten')

// unknown verification degrades to the weakest claim, never to "verified"
const weird = toPublicFacts([{ ...base, factType: 'address', value: 'A', verification: 'bogus', confidence: 140 }], 'en')
assert.equal(weird[0].verification, 'unverified')
assert.equal(weird[0].confidence, 100, 'confidence clamped')

assert.deepEqual(toPublicFacts([], 'en'), [])
assert.ok(sourcesHeading('de').title.includes('Quellen'))
assert.ok(sourcesHeading('en').note.includes('not official government verification'))

console.log('public-facts.check: ok')
