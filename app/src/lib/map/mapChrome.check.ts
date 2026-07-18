/**
 * Runnable self-check: clean style strips OpenFreeMap / MapLibre branding.
 * Run: npx tsx src/lib/map/mapChrome.check.ts
 */

import assert from 'node:assert/strict'
import { loadCleanStyle, MAP_CREDIT_PLAIN } from './mapChrome'

async function main() {
  assert.ok(!/OpenFreeMap|MapLibre/i.test(MAP_CREDIT_PLAIN))

  const style = await loadCleanStyle('https://tiles.openfreemap.org/styles/liberty')

  assert.ok(style.sources)
  for (const src of Object.values(style.sources)) {
    if (!src || typeof src !== 'object') continue
    const attr =
      'attribution' in src ? String((src as { attribution?: string }).attribution ?? '') : ''
    assert.ok(!/OpenFreeMap/i.test(attr), `source still has OpenFreeMap: ${attr}`)
    assert.ok(!/MapLibre/i.test(attr), `source still has MapLibre: ${attr}`)
  }

  const om = style.sources.openmaptiles as { tiles?: string[]; attribution?: string } | undefined
  assert.ok(om?.tiles?.length, 'openmaptiles must be inlined with tiles[]')
  assert.equal(om?.attribution, MAP_CREDIT_PLAIN)

  console.log('mapChrome.check: ok')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
