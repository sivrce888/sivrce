/**
 * Runnable check: POI sprite data URLs render.
 * Run: npx tsx src/lib/map/poi-icons.check.ts
 */

import assert from 'node:assert/strict'
import { POI_CATEGORIES, POI_COLORS } from './pois'
import { CATEGORY_BRAND } from '@/lib/category-brand'
import { poiIconDataUrl, poiImageId } from './poi-icons'

for (const cat of POI_CATEGORIES) {
  assert.equal(poiImageId(cat), `sv-poi-${cat}`)
}

assert.equal(POI_COLORS.metro, CATEGORY_BRAND.dailyRent.hue)

const metro = poiIconDataUrl('metro')
assert.ok(metro.startsWith('data:image/svg+xml'), 'metro data url')
assert.ok(decodeURIComponent(metro).includes('91.405,67.947'), 'official M path')
assert.ok(decodeURIComponent(metro).includes(CATEGORY_BRAND.dailyRent.hue), 'red fill')

console.log(`poi-icons.check: ok (${POI_CATEGORIES.length} ids)`)
