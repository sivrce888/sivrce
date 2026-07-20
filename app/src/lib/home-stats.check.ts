import assert from 'node:assert/strict'
import type { HomeStats } from './home-stats'

/** Shape guard — values must be finite non-negative (no fake 52k injection). */
function assertStats(s: HomeStats) {
  for (const [k, v] of Object.entries(s)) {
    assert.equal(typeof v, 'number', k)
    assert.ok(Number.isFinite(v) && v >= 0, k)
  }
}

assertStats({ listings: 0, professionals: 1, projects: 2, cities: 3 })
assert.throws(() => assertStats({ listings: -1, professionals: 0, projects: 0, cities: 0 } as HomeStats))

console.log('home-stats: ok')
