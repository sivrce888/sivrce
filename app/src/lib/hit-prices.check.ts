/**
 * Self-check: GEL hits must not be treated as USD (×2.7 bug); derive m² when missing.
 * Run: npx tsx src/lib/hit-prices.check.ts
 */
import assert from 'node:assert/strict'
import { hitPrices } from './hit-prices'

const gel = hitPrices({ price: 189_000, currency: 'GEL', pricePerSqm: 3780 })
assert.equal(gel.priceGEL, 189_000)
assert.equal(gel.priceUSD, Math.round(189_000 / 2.7))
assert.equal(gel.perM2USD, Math.round(3780 / 2.7))

const usd = hitPrices({ price: 285_000, currency: 'USD', pricePerSqm: 3167 })
assert.equal(usd.priceUSD, 285_000)
assert.equal(usd.priceGEL, Math.round(285_000 * 2.7))
assert.equal(usd.perM2USD, 3167)

const meili = hitPrices({ price: 189_000, currency: 'GEL', priceUSD: 70_000, pricePerSqm: 3780 })
assert.equal(meili.priceUSD, 70_000)

const derived = hitPrices({ price: 270_000, currency: 'USD', area: 90 })
assert.equal(derived.perM2USD, 3000)

const indexedM2 = hitPrices({ price: 189_000, currency: 'GEL', pricePerSqmUSD: 1400 })
assert.equal(indexedM2.perM2USD, 1400)

console.log('hit-prices.check: ok')
