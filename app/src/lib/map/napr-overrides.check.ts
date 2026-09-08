/**
 * Self-check: NAPR override loader (no network).
 * Run: npx tsx src/lib/map/napr-overrides.check.ts
 */
import assert from 'node:assert/strict'
import { NAPR_PIN_OVERRIDES, ensureNaprOverrides, naprOverrideFor } from './napr-overrides'

assert.equal(typeof NAPR_PIN_OVERRIDES, 'object')
assert.equal(naprOverrideFor('__missing__'), null)
void ensureNaprOverrides().then(() => {
  assert.ok(Object.keys(NAPR_PIN_OVERRIDES).length > 0, 'dynamic import loaded no overrides')
  console.log('napr-overrides.check: ok')
})
