/**
 * Runnable check: npx tsx src/lib/catalog-place.check.ts
 */
import assert from 'node:assert/strict'
import { catalogPlace } from './catalog-place'

assert.equal(catalogPlace('ბერლინი', true), 'Berlin')
assert.equal(catalogPlace('Berlin', false), 'ბერლინი')
assert.equal(catalogPlace('მიტე', true), 'Mitte')
assert.equal(catalogPlace('შპანდაუ', true), '')
assert.equal(catalogPlace('Marzahn-Hellersdorf', true), 'Marzahn-Hellersdorf')
assert.equal(catalogPlace('თბილისი', false), 'თბილისი')

console.log('catalog-place.check: ok')
