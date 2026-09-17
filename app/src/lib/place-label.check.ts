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
// Authored Mkhedruli titles stay verbatim — no mid-string city swap that
// breaks Georgian grammar (ქუთაისის → Kutaisiს).
const kaHotelTitle = 'ძველი თბილისი — ბუტიკ სასტუმრო, დღიური'
assert.equal(listingTitle(kaHotelTitle, 'თბილისი', 'en'), kaHotelTitle)
assert.equal(listingTitle('სტუდიო ქუთაისის ცენტრში დღიურად', 'ქუთაისი', 'en'), 'სტუდიო ქუთაისის ცენტრში დღიურად')
assert.equal(listingTitle('Batumi — სასტუმრო 500 მ²', 'ბათუმი', 'en'), 'Batumi — სასტუმრო 500 მ²')

console.log('place-label.check: ok')
