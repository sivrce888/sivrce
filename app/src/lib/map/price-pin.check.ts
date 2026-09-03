import assert from 'node:assert/strict'
import type { Listing } from '@/data/listings'
import { groupListingsByPin, paintPricePinEl, pinMinPriceGEL } from './price-pin'

function fake(): HTMLElement {
  return { style: {}, querySelector: () => null } as unknown as HTMLElement
}

const el = fake()
const inner = fake()
paintPricePinEl(el, inner, { hover: true, active: false, seen: true })
assert.equal((el.style as { transform?: string }).transform, undefined)
assert.equal(inner.style.transform, 'scale(1.12)')
assert.equal(el.style.zIndex, '20')
assert.equal(el.style.opacity, '1')
assert.equal(inner.style.backgroundColor, '#FFFFFF')
assert.equal(inner.style.color, '#0A1030')

paintPricePinEl(el, inner, { hover: false, active: false, seen: true })
assert.equal(inner.style.transform, 'scale(1)')
assert.equal(el.style.opacity, '0.55')

paintPricePinEl(el, inner, { hover: false, active: true, seen: true })
assert.ok(inner.style.boxShadow.includes('255,255,255'))
assert.equal(inner.style.backgroundColor, '#050B26')
assert.equal(inner.style.color, '#FFFFFF')
assert.equal((el.style as { transform?: string }).transform, undefined)

function L(id: string, lat: number, lng: number, priceGEL: number): Listing {
  return { id, coords: { lat, lng }, priceGEL } as Listing
}

const groups = groupListingsByPin([
  L('a', 41.7, 44.8, 200_000),
  L('b', 41.7, 44.8, 90_000),
  L('c', 41.71, 44.81, 50_000),
  L('bad', 0, 0, 1),
])
assert.equal(groups.length, 2)
const stacked = groups.find((g) => g.listings.length === 2)!
assert.equal(stacked.listings[0]!.id, 'b')
assert.equal(pinMinPriceGEL(stacked.listings), 90_000)
assert.equal(pinMinPriceGEL([]), 0)

console.log('price-pin: ok')
