/**
 * Runnable check: npx tsx src/lib/peer-rank.check.ts
 */
import assert from 'node:assert/strict'
import { peerScore, rankPeers, scalePeers } from './peer-rank'

const self = {
  id: 'self',
  address: 'ვაჟა-ფშაველას 12',
  district: 'საბურთალო',
  city: 'თბილისი',
  rooms: 3,
  priceUSD: 150000,
  area: 82,
  lat: 41.724,
  lng: 44.7309,
}
const cand = (over: Record<string, unknown>) => ({ id: `c${Math.random()}`, ...over })

// Same street beats everything else.
{
  const sameStreet = cand({ address: 'ვაჟა-ფშაველას 45', district: 'საბურთალო', city: 'თბილისი', rooms: 2, priceUSD: 200000, area: 100, lat: 41.73, lng: 44.74 })
  const farTwin = cand({ address: 'გლდანი 1', district: 'გლდანი', city: 'თბილისი', rooms: 3, priceUSD: 150000, area: 82, lat: 41.79, lng: 44.81 })
  assert.ok(peerScore(self, sameStreet) > peerScore(self, farTwin), 'street affinity wins')
}

// Closer price/m² outranks; rooms mismatch costs 20.
{
  const close = cand({ rooms: 3, priceUSD: 152000, area: 82 })
  const pricey = cand({ rooms: 3, priceUSD: 250000, area: 82 })
  const wrongRooms = cand({ rooms: 2, priceUSD: 152000, area: 82 })
  assert.ok(peerScore(self, close) > peerScore(self, pricey), 'price proximity')
  assert.equal(peerScore(self, close) - peerScore(self, wrongRooms), 20, 'rooms weight')
}

// Null-safe: bare candidates score finite, never throw.
{
  const bare = cand({})
  assert.ok(Number.isFinite(peerScore(self, bare)), 'bare cand finite')
  assert.equal(peerScore(self, bare), 0)
}

// rankPeers: best first, self excluded, ties keep input order.
{
  const a = { ...cand({ rooms: 3, priceUSD: 150000, area: 82 }), id: 'a' }
  const b = { ...cand({ rooms: 1, priceUSD: 300000, area: 40 }), id: 'b' }
  const out = rankPeers(self, [b, a, { ...self }])
  assert.deepEqual(out.map((x) => x.id), ['a', 'b'])
  const t1 = { ...cand({}), id: 't1' }
  const t2 = { ...cand({}), id: 't2' }
  assert.deepEqual(rankPeers(self, [t1, t2]).map((x) => x.id), ['t1', 't2'])
  assert.deepEqual(rankPeers(self, []), [])
}

console.log('peer-rank.check: ok')

// scalePeers: ranked comps win; district fallback below 2; junk filtered; capped.
{
  const comps = [{ perM2USD: 1800 }, { perM2USD: 1900 }, { perM2USD: 0 }, {}, { perM2USD: -5 }]
  assert.deepEqual(scalePeers(comps, [1500, 1600]), [1800, 1900])
  assert.deepEqual(scalePeers([{ perM2USD: 1800 }], [1500, 1600]), [1500, 1600])
  assert.deepEqual(scalePeers([], [1500]), [1500])
  assert.deepEqual(scalePeers([1, 2, 3, 4, 5, 6, 7].map((perM2USD) => ({ perM2USD })), []), [1, 2, 3, 4, 5, 6])
}
