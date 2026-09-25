import assert from 'node:assert/strict'
import { freshQuery } from './guards'
import { NO_LIVE_STATS } from './home-stats'

// Outage fallback is all-zero: Stats hides zero tiles, so a DB blip can never
// relabel catalog sizes as live trust metrics.
for (const [k, v] of Object.entries(NO_LIVE_STATS)) assert.equal(v, 0, k)

// freshQuery must reject (never resolve a fallback) so unstable_cache skips it.
assert.rejects(freshQuery(async () => { throw new Error('boom') })).then(() => console.log('home-stats: ok'))
