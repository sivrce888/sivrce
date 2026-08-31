/**
 * Self-check: NAPR override loader (no network).
 * Run: npx tsx src/lib/map/napr-overrides.check.ts
 */
import assert from 'node:assert/strict'
import { NAPR_PIN_OVERRIDES, naprOverrideFor } from './napr-overrides'

assert.equal(typeof NAPR_PIN_OVERRIDES, 'object')
assert.equal(naprOverrideFor('__missing__'), null)

console.log('napr-overrides.check: ok')
