/**
 * Self-check: DE address fold (no DB).
 * Run: npx tsx src/lib/intelligence/entity-resolution.de.check.ts
 */
import assert from 'node:assert/strict'
import { normalizeGermanAddress } from './normalize-de'

assert.equal(normalizeGermanAddress('Müller Straße 12 GmbH'), 'mueller str 12')
assert.equal(normalizeGermanAddress('Hauptstr.'), 'hauptstr')
assert.equal(
  normalizeGermanAddress('Blankenburger Süden'),
  normalizeGermanAddress('Blankenburger Sueden'),
)

console.log('entity-resolution.de: address fold ✓')
