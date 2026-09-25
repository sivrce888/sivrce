/** Invariants for project-insights — tsx src/lib/project-insights.check.ts */
import assert from 'node:assert/strict'
import type { Project } from '@/data/professionals'
import { marketPosition, priceM2Currency, priceM2Number, rowPriceM2, splitPortfolio, trackRecord } from './project-insights'

const base: Project = {
  slug: 'x', name: 'X', img: '/x.webp', location: 'a', city: 'თბილისი', district: 'ვაკე',
  priceFromM2: '$1,000', done: 40, finish: '2027 Q2', flats: 100, rating: 0,
  description: { ka: '', en: '', ru: '' }, coords: { lat: 41.7, lng: 44.7 },
}
const mk = (slug: string, over: Partial<Project>): Project => ({ ...base, slug, ...over })

// Parsing: separators, currencies, the on-request marker.
assert.equal(priceM2Number('$1 950'), 1950)
assert.equal(priceM2Number('9,999 ₾'), 9999)
assert.equal(priceM2Number('მოთხოვნით'), null)
assert.equal(priceM2Number(''), null)
assert.equal(priceM2Currency('₾4,224'), 'GEL')
assert.equal(priceM2Currency('€5,200'), 'EUR')
assert.equal(priceM2Currency('$900'), 'USD')

// District scope once it has MIN_PEERS priced peers; other currencies never mix in.
const vake = [800, 900, 1100, 1200, 1300].map((v, i) => mk(`v${i}`, { priceFromM2: `$${v}` }))
const noise = [mk('gel', { priceFromM2: '₾100' }), mk('onreq', { priceFromM2: 'მოთხოვნით' })]
const pos = marketPosition(base, [base, ...vake, ...noise])!
assert.equal(pos.scope, 'district')
assert.equal(pos.peers, 5)
assert.equal(pos.median, 1100)
assert.equal(pos.deltaPct, -9)
assert.ok(pos.pct >= 5 && pos.pct <= 95)

// Too few district peers → falls back to the city; too few overall → null (no noise percentile).
const cityPeers = [700, 800, 900, 1500, 1600].map((v, i) => mk(`c${i}`, { district: 'საბურთალო', priceFromM2: `$${v}` }))
assert.equal(marketPosition(base, [...cityPeers, vake[0]])!.scope, 'city')
assert.equal(marketPosition(base, vake.slice(0, 3)), null)
assert.equal(marketPosition(mk('r', { priceFromM2: 'მოთხოვნით' }), vake), null)

// Track record + portfolio order.
const done = mk('d', { done: 100, finish: 'ჩაბარებული (2021)', flats: 50 })
const soon = mk('s', { finish: '2026 Q4' })
const late = mk('l', { finish: '2029 Q1', flats: Number.NaN })
const tr = trackRecord([done, soon, late])
assert.deepEqual(tr, { total: 3, delivered: 1, building: 2, flats: 150, cities: 1 })
const split = splitPortfolio([late, done, soon])
assert.deepEqual(split.building.map((p) => p.slug), ['s', 'l'])
assert.deepEqual(split.delivered.map((p) => p.slug), ['d'])

// DB rows: SS.ge imports store lari (House API priceGeo); korter/myhome/owner rows are USD.
assert.equal(rowPriceM2({ id: 'ss_4821', pricePerSqmFrom: 3496 }), '₾3,496')
assert.equal(rowPriceM2({ id: 'korter_77', pricePerSqmFrom: 1400 }), '$1,400')
assert.equal(rowPriceM2({ pricePerSqmFrom: 0 }), '')

console.log('project-insights.check ✓')
