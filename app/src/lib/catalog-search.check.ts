/**
 * Runnable check: npx tsx src/lib/catalog-search.check.ts
 */
import assert from 'node:assert/strict'
import { canCatalogFallback, catalogSearch } from './catalog-search'

assert.equal(canCatalogFallback({ country: 'DE' }), true)
assert.equal(canCatalogFallback({ country: 'GE' }), false)
assert.equal(canCatalogFallback({}), false)
assert.equal(canCatalogFallback({ country: 'DE', q: 'mitte' }), true)
assert.equal(canCatalogFallback({ country: 'DE', dealType: 'rent' }), true)
assert.equal(canCatalogFallback({ country: 'DE', dealType: 'buy' }), true)
assert.equal(canCatalogFallback({ country: 'DE', minPrice: 100000 }), true)
assert.equal(canCatalogFallback({ country: 'DE', rooms: 3 }), true)
assert.equal(canCatalogFallback({ country: 'FR' }), true)
assert.equal(canCatalogFallback({ country: 'DE', propertyType: 'house' }), true)
assert.equal(canCatalogFallback({ country: 'DE', bbox: { west: 0, south: 0, east: 1, north: 1 } }), false)
assert.equal(canCatalogFallback({ country: 'FR', dealType: 'rent' }), false)

async function main() {
  const de = await catalogSearch({ country: 'DE', page: 1, pageSize: 24 })
  assert.ok((de?.totalHits ?? 0) >= 100, 'DE sample search ≥100')
  assert.equal(de?.hits.length, 24)
  assert.equal(de?.hits[0]?.country, 'DE')
  assert.equal(de?.hits[0]?.currency, 'EUR')
  assert.ok((de?.hits[0]?.images.length ?? 0) > 0)

  const rent = await catalogSearch({ country: 'DE', dealType: 'rent' })
  assert.ok((rent?.totalHits ?? 0) > 0, 'DE rent sample')
  assert.ok(rent?.hits.every((h) => h.dealType === 'rent'))

  const house = await catalogSearch({ country: 'DE', propertyType: 'house' })
  assert.ok((house?.totalHits ?? 0) > 0, 'DE house sample')

  const berlin = await catalogSearch({ city: 'berlin' })
  assert.ok((berlin?.totalHits ?? 0) > 0, 'Berlin city search should return hits')
  assert.ok(berlin?.hits.some((h) => h.city.toLowerCase() === 'berlin'))

  const berlinQ = await catalogSearch({ q: 'berlin' })
  assert.ok((berlinQ?.totalHits ?? 0) > 0, 'Berlin q search should return hits')

  const munich = await catalogSearch({ city: 'munich' })
  assert.ok((munich?.totalHits ?? 0) > 0, 'Munich city search should return hits')

  console.log('catalog-search.check: ok')
}

void main().catch((e) => {
  console.error(e)
  process.exit(1)
})
