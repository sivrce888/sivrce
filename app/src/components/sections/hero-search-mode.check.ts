import assert from 'node:assert/strict'
import {
  countFilterMode,
  pricePresets,
  recentLabel,
} from './hero-search-mode'

assert.equal(countFilterMode(0, ''), 'rooms')
assert.equal(countFilterMode(1, 'apartment'), 'rooms')
assert.equal(countFilterMode(2, 'apartment'), 'beds')
assert.equal(countFilterMode(2, 'land'), 'hide')
assert.equal(countFilterMode(0, 'commercial'), 'hide')
assert.equal(countFilterMode(3, ''), 'hide')

assert.equal(pricePresets(0)[0]!.max, '100000')
assert.equal(pricePresets(1)[0]!.max, '500')
assert.equal(pricePresets(2)[0]!.max, '50')

const p = new URLSearchParams('deal=sale&city=თბილისი&rooms=2&max=200000')
assert.ok(recentLabel(p, 'იყიდება').includes('თბილისი'))
assert.ok(recentLabel(p, 'იყიდება').includes('2+'))

console.log('hero-search-mode: ok')
