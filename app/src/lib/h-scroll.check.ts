import { scrollEdges } from './h-scroll'
import assert from 'node:assert/strict'

assert.deepEqual(scrollEdges(0, 400, 400), { canL: false, canR: false })
assert.deepEqual(scrollEdges(0, 400, 1200), { canL: false, canR: true })
assert.deepEqual(scrollEdges(400, 400, 1200), { canL: true, canR: true })
assert.deepEqual(scrollEdges(800, 400, 1200), { canL: true, canR: false })
assert.deepEqual(scrollEdges(1, 400, 1200), { canL: false, canR: true })

console.log('h-scroll.check: ok')
