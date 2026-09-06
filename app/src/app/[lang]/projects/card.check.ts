/**
 * Self-check for the /projects filter logic (card.ts).
 * Run: npx tsx "src/app/[lang]/projects/card.check.ts"
 */
import assert from 'node:assert/strict'

import {
  EMPTY_Q,
  HANDOVER_BUCKETS,
  OTHER_CITY,
  facetCities,
  facetCounts,
  facetDevs,
  isQActive,
  matchesCard,
  parseQ,
  priceM2,
  qToSearch,
  sortCards,
  type ProjectCard,
} from './card'

const card = (over: Partial<ProjectCard>): ProjectCard => ({
  slug: 'x',
  name: 'X',
  img: '/images/x.webp',
  location: 'თბილისი',
  city: 'თბილისი',
  developerSlug: 'dev-a',
  devName: 'Dev A',
  priceFromM2: '$1,500',
  done: 50,
  finish: '2027 Q2',
  year: 2027,
  flats: 100,
  rating: 4.5,
  delivered: false,
  ...over,
})

const tbilisi = card({})
const batumi = card({ slug: 'b', city: 'ბათუმი', priceFromM2: '$2,500', year: 2028, finish: '2028 Q1' })
const doneRow = card({ slug: 'd', done: 100, delivered: true, finish: 'გადაცემულია (2024)', year: 2024 })
const noPrice = card({ slug: 'n', priceFromM2: '' })
const gudauri = card({ slug: 'g', city: 'გუდაური' })
const rows = [tbilisi, batumi, doneRow, noPrice, gudauri]

// priceM2 parsing — '$1,450' → 1450, junk/'' → 0
assert.equal(priceM2(tbilisi), 1500)
assert.equal(priceM2(noPrice), 0)

// status filter — build excludes delivered, done excludes building
assert.ok(matchesCard(tbilisi, { ...EMPTY_Q, status: 'build' }, new Set()))
assert.ok(!matchesCard(doneRow, { ...EMPTY_Q, status: 'build' }, new Set()))
assert.ok(matchesCard(doneRow, { ...EMPTY_Q, status: 'done' }, new Set()))

// handover buckets never match delivered rows and respect year bounds
for (const b of HANDOVER_BUCKETS) {
  assert.ok(!matchesCard(doneRow, { ...EMPTY_Q, handover: b.key }, new Set()), `delivered matched ${b.key}`)
}
assert.ok(matchesCard(tbilisi, { ...EMPTY_Q, handover: 'mid' }, new Set())) // 2027
assert.ok(!matchesCard(tbilisi, { ...EMPTY_Q, handover: 'late' }, new Set()))
assert.ok(matchesCard(batumi, { ...EMPTY_Q, handover: 'late' }, new Set())) // 2028

// price buckets — bounds are [min, max), unpriced rows never match
assert.ok(matchesCard(tbilisi, { ...EMPTY_Q, price: '1500-2000' }, new Set()))
assert.ok(!matchesCard(tbilisi, { ...EMPTY_Q, price: '1000-1500' }, new Set()))
assert.ok(!matchesCard(noPrice, { ...EMPTY_Q, price: 'lt1000' }, new Set()))

// city: exact match + OTHER_CITY folds the long tail (keep=2 leaves გუდაური out)
const cities = facetCities(rows, 2)
assert.deepEqual(
  cities.map((c) => c.value),
  ['თბილისი', 'ბათუმი', OTHER_CITY],
)
assert.equal(cities.find((c) => c.value === OTHER_CITY)?.count, 1)
const topSet = new Set(['თბილისი', 'ბათუმი'])
assert.ok(matchesCard(batumi, { ...EMPTY_Q, city: 'ბათუმი' }, topSet))
assert.ok(!matchesCard(batumi, { ...EMPTY_Q, city: OTHER_CITY }, topSet))
assert.ok(matchesCard(gudauri, { ...EMPTY_Q, city: OTHER_CITY }, topSet))

// dev facet: label falls back to slug when devName is ''; empty slugs are skipped
const devs = facetDevs([tbilisi, card({ slug: 'x2', devName: '', developerSlug: 'db-only' }), card({ slug: 'x3', devName: '', developerSlug: '' })])
assert.equal(devs.length, 2)
assert.ok(devs.find((d) => d.slug === 'db-only')?.label, 'db-only')
assert.ok(!devs.some((d) => d.slug === ''))

// facetCounts single pass
const f = facetCounts(rows)
assert.equal(f.build, 4)
assert.equal(f.done, 1)
assert.equal(f.city.get('თბილისი'), 3)
assert.equal(f.handover.get('mid'), 3) // tbilisi, noPrice, gudauri — all 2027
assert.equal(f.handover.get('late'), 1) // batumi 2028

// sort: price asc with unpriced last; handover with delivered last
const priced = sortCards([noPrice, batumi, tbilisi], 'price')
assert.deepEqual(priced.map((p) => p.slug), ['x', 'b', 'n'])
const handed = sortCards([doneRow, batumi, tbilisi], 'handover')
assert.deepEqual(handed.map((p) => p.slug), ['x', 'b', 'd'])

// URL round-trip: parse(qToSearch(q)) === q; junk params degrade to defaults
const q: typeof EMPTY_Q = { city: 'ბათუმი', status: 'build', price: '1000-1500', handover: 'mid', dev: 'dev-a', sort: 'price' }
assert.deepEqual(parseQ(new URLSearchParams(qToSearch(q))), q)
assert.deepEqual(parseQ(new URLSearchParams(qToSearch(EMPTY_Q))), EMPTY_Q)
assert.deepEqual(
  parseQ(new URLSearchParams('status=hax&price=free&sort=steal&city=' + 'x'.repeat(500))),
  { ...EMPTY_Q, city: 'x'.repeat(60) },
)
assert.ok(!isQActive(EMPTY_Q))
assert.ok(isQActive({ ...EMPTY_Q, sort: 'price' }))

console.log('projects card.check ✓')
