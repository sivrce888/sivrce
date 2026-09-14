/**
 * Runnable check: npx tsx src/lib/place-label.check.ts
 */
import assert from 'node:assert/strict'
import { listingTitle, placeLabel } from './place-label'

assert.equal(placeLabel('ბერლინი', 'en'), 'Berlin')
assert.equal(placeLabel('Berlin', 'en'), 'Berlin')
assert.equal(placeLabel('Berlin', 'ka'), 'ბერლინი')
assert.equal(placeLabel('თბილისი', 'en'), 'Tbilisi')
assert.equal(placeLabel('მიტე', 'en', 'DE'), '')
assert.equal(placeLabel('მიტე', 'ka', 'DE'), 'მიტე')
assert.equal(placeLabel('ვაკე', 'en', 'GE'), 'ვაკე')
assert.equal(
  listingTitle('Quartier Lilienthal — ბერლინი', 'ბერლინი', 'en'),
  'Quartier Lilienthal — Berlin',
)
assert.equal(listingTitle('ბინა ვაკეში', 'თბილისი', 'en'), 'ბინა ვაკეში')

console.log('place-label.check: ok')
