/**
 * Runnable self-check: quiet brand + legal credit constants; tiles via /api/map.
 * Run: npx tsx src/lib/map/mapChrome.check.ts
 */

import assert from 'node:assert/strict'
import { loadCleanStyle, MAP_CREDIT_PLAIN, MAP_CREDIT_LEGAL } from './mapChrome'
import { mapProxyPathOk, toMapProxyUrl, MAP_PROXY_PREFIX } from './map-proxy'

async function main() {
  assert.equal(MAP_CREDIT_PLAIN, 'Sivrce Maps')
  assert.ok(/OpenMapTiles/.test(MAP_CREDIT_LEGAL), 'legal credit must name OpenMapTiles')
  assert.ok(/OpenStreetMap/.test(MAP_CREDIT_LEGAL), 'legal credit must name OpenStreetMap')
  assert.ok(!/OpenFreeMap|MapLibre/i.test(MAP_CREDIT_LEGAL))

  assert.equal(mapProxyPathOk('styles/liberty'), true)
  assert.equal(mapProxyPathOk('../etc/passwd'), false)
  assert.equal(
    toMapProxyUrl('https://tiles.openfreemap.org/styles/dark'),
    `${MAP_PROXY_PREFIX}/styles/dark`,
  )

  const style = await loadCleanStyle('/api/map/styles/liberty')
  const blob = JSON.stringify(style)
  assert.ok(!/openfreemap\.org/i.test(blob), 'style must not leak openfreemap.org')
  assert.ok(!/OpenFreeMap/i.test(blob), 'style must not name OpenFreeMap')

  for (const src of Object.values(style.sources ?? {})) {
    if (!src || typeof src !== 'object') continue
    const attr =
      'attribution' in src ? String((src as { attribution?: string }).attribution ?? '') : ''
    assert.equal(attr, '', `source attribution cleared (credit on control): ${attr}`)
  }

  const om = style.sources?.sivrce as { tiles?: string[] } | undefined
  assert.ok(om?.tiles?.length, 'sivrce basemap must be inlined with tiles[]')
  assert.ok(om!.tiles!.every((t) => t.includes('/api/map/')), 'tiles via proxy')
  assert.equal(style.sources?.openmaptiles, undefined, 'openmaptiles source id renamed')

  console.log('mapChrome.check: ok')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
