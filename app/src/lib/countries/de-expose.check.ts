/**
 * German exposé parser.
 * Run: npx tsx src/lib/countries/de-expose.check.ts
 */
import assert from 'node:assert/strict'
import { formatEur, parseDeExpose } from './de-expose'

const tor = parseDeExpose(
  'Dritte Etage eines sanierten Gründerzeitbaus. Energieausweis C, Baujahr 1902, Kernsanierung 2019.',
)
assert.equal(tor.energyClass, 'C', 'class C')
assert.equal(tor.yearBuilt, 1902, 'year')
assert.equal(tor.kfw, undefined, 'no kfw')

const neu = parseDeExpose('Erstbezug. Baujahr 2024, Energieausweis A+. KfW 40.')
assert.equal(neu.energyClass, 'A+', 'A+ before A')
assert.equal(neu.yearBuilt, 2024, 'new year')
assert.equal(neu.kfw, 'KfW 40', 'kfw')

const empty = parseDeExpose('Helle Wohnung mit Balkon in Mitte.')
assert.equal(empty.energyClass, undefined, 'no invent class')
assert.equal(empty.yearBuilt, undefined, 'no invent year')

assert.equal(formatEur(557_850), '557.850 €', 'de grouping')

console.log('de-expose: A+/C/year/kfw + no-invent ✓')
