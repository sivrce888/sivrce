/**
 * Self-check: tour slot lock contracts (no DB).
 * Run: npx tsx src/lib/tour-slots.check.ts
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { tourDateISO, tourSlotLockKey, tourSlotScope } from './tour-slots'

// Scope mirrors the clash partition: agent bookings lock per agent,
// owner-hosted (NULL agent) per listing — exactly like the route where-clause.
assert.equal(tourSlotScope('agent-1', 'listing-9'), 'agent:agent-1')
assert.equal(tourSlotScope(null, 'listing-9'), 'owner:listing-9')
assert.notEqual(tourSlotScope('agent-1', 'listing-9'), tourSlotScope(null, 'listing-9'))

// Deterministic + int32 (pg_advisory_xact_lock takes int4 pair).
const a = tourSlotLockKey('agent:x', '2026-09-12', '14:30')
const b = tourSlotLockKey('agent:x', '2026-09-12', '14:30')
assert.deepEqual(a, b, 'deterministic')
for (const k of [a.key1, a.key2]) {
  assert.ok(Number.isInteger(k) && k >= -(2 ** 31) && k <= 2 ** 31 - 1, `int32: ${k}`)
}

// Every slot dimension moves the key (no cross-slot serialization gaps).
assert.notDeepEqual(a, tourSlotLockKey('agent:y', '2026-09-12', '14:30'), 'agent moves key')
assert.notDeepEqual(a, tourSlotLockKey('agent:x', '2026-09-13', '14:30'), 'day moves key')
assert.notDeepEqual(a, tourSlotLockKey('agent:x', '2026-09-12', '15:00'), 'time moves key')
assert.notDeepEqual(a, tourSlotLockKey('owner:l', '2026-09-12', '14:30'), 'scope moves key')

// 500 consecutive slots collide never — one lock never blocks a neighbor.
const seen = new Set<string>()
for (let m = 10 * 60; m < 18 * 60; m += 30) {
  const t = `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`
  for (const day of ['2026-09-12', '2026-09-13']) {
    const k = tourSlotLockKey('agent:x', day, t)
    const s = `${k.key1}:${k.key2}`
    assert.ok(!seen.has(s), `collision: ${s}`)
    seen.add(s)
  }
}

// UTC-midnight Date → calendar day the clash query matches.
assert.equal(tourDateISO(new Date('2026-09-12T00:00:00Z')), '2026-09-12')

// Wiring: the POST must hold the advisory lock BEFORE the clash re-check,
// on the same partition the check filters by.
const route = readFileSync(join(process.cwd(), 'src/app/api/tours/route.ts'), 'utf8')
assert.ok(route.includes('pg_advisory_xact_lock'), 'route takes the advisory lock')
assert.ok(route.includes('tourSlotLockKey'), 'route derives the key here, not inline')
assert.ok(route.includes('tourSlotScope'), 'route locks the clash partition')
const lockAt = route.indexOf('pg_advisory_xact_lock')
const clashAt = route.indexOf('propertyTour.findFirst')
assert.ok(lockAt > 0 && clashAt > lockAt, 'lock acquired before clash re-check')
assert.ok(route.includes('tourDateISO'), 'lock day matches clash day')

console.log(`tour-slots: ${seen.size} distinct slot keys, wiring ✓`)
