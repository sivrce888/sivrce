/**
 * Runnable check: npx tsx src/data/tbilisi-metro.check.ts
 */
import assert from 'node:assert/strict'
import { METRO_LINES, METRO_STATIONS, getMetroStation, metroByLine, metroNeighbours } from './tbilisi-metro'

// Full network: 22 stations, both lines, unique slugs & names.
assert.equal(METRO_STATIONS.length, 22)
assert.equal(metroByLine(1).length, 16)
assert.equal(metroByLine(2).length, 6)
assert.equal(new Set(METRO_STATIONS.map((s) => s.slug)).size, 22)
assert.equal(new Set(METRO_STATIONS.map((s) => s.ka)).size, 22)

// Every „near" phrase is a valid pre-inflected adessive: ends in მეტროსთან.
for (const s of METRO_STATIONS) {
  assert.ok(s.near.endsWith(' მეტროსთან'), `${s.slug}: ${s.near}`)
  assert.ok(s.near.startsWith(s.ka.slice(0, 2)), `${s.slug}: near must derive from ka name`)
  // Coords inside the Tbilisi bbox.
  assert.ok(s.lat > 41.6 && s.lat < 41.85 && s.lng > 44.6 && s.lng < 44.95, `${s.slug} coords`)
  assert.ok(['1', '2'].includes(String(s.line)))
}

// Query stems from the user's exact phrasings resolve.
assert.equal(getMetroStation('sarajishvili')?.near, 'სარაჯიშვილის მეტროსთან')
assert.equal(getMetroStation('grmagele')?.near, 'ღრმაღელის მეტროსთან')
assert.equal(getMetroStation('guramishvili')?.near, 'გურამიშვილის მეტროსთან')
assert.equal(getMetroStation('didube')?.near, 'დიდუბის მეტროსთან')
assert.equal(getMetroStation('nope'), undefined)

// Irregular genitives stay irregular.
assert.equal(getMetroStation('isani')?.near, 'ისნის მეტროსთან')
assert.equal(getMetroStation('tsereteli')?.near, 'წერეთლის მეტროსთან')
assert.equal(getMetroStation('sadguris-moedani')?.near, 'სადგურის მოედნის მეტროსთან')

// Neighbours follow riding order within the same line.
assert.deepEqual(metroNeighbours('sarajishvili').map((s) => s.slug), ['akhmetelis-teatri', 'guramishvili'])
assert.deepEqual(metroNeighbours('akhmetelis-teatri').map((s) => s.slug), ['sarajishvili'])
assert.deepEqual(metroNeighbours('varketili').map((s) => s.slug), ['samgori'])
assert.deepEqual(metroNeighbours('sadguris-moedani').map((s) => s.slug), ['nadzaladevi', 'marjanishvili'])

assert.equal(METRO_LINES[1], 'ახმეტელის თეატრი — ვარკეთილი')

console.log('tbilisi-metro.check: ok')
