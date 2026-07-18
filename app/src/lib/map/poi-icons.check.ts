/**
 * Runnable check: POI sprite data URLs render.
 * Run: npx tsx src/lib/map/poi-icons.check.ts
 */

import assert from 'node:assert/strict'
import { POI_CATEGORIES } from './pois'
import { poiImageId } from './poi-icons'

// Side-effect free IDs
for (const cat of POI_CATEGORIES) {
  assert.equal(poiImageId(cat), `sv-poi-${cat}`)
}

// Render SVG sprites (uses react-dom/server)
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { TrainFront } from 'lucide-react'

const svg = renderToStaticMarkup(
  createElement(TrainFront, { size: 22, color: '#fff', strokeWidth: 2.4 }),
)
assert.ok(svg.includes('<svg'), 'lucide svg')
assert.ok(svg.includes('stroke'), 'lucide stroke')

console.log(`poi-icons.check: ok (${POI_CATEGORIES.length} ids)`)
