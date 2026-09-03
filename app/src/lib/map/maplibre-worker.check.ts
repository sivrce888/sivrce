import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { bindMaplibreWorker } from './maplibre-worker'

assert.equal(typeof bindMaplibreWorker, 'function')

const src = readFileSync(join(process.cwd(), 'src/lib/map/maplibre-worker.ts'), 'utf8')
assert.ok(src.includes('/maplibre/maplibre-gl-worker.mjs'))
assert.ok(src.includes('setWorkerUrl'))
assert.ok(src.includes('prewarm'))
assert.ok(!src.includes('setWorkerCount'))

console.log('maplibre-worker: same-origin ESM url ✓')
