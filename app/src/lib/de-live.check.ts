import assert from 'node:assert/strict'
import {
  distKm,
  isStopId,
  parseDepartures,
  pickStop,
} from './de-live'

// 1. isStopId validation
assert.equal(isStopId('900100003'), true, 'standard 9-digit VBB stop ID is valid')
assert.equal(isStopId('1234567'), true, '7-digit stop ID is valid')
assert.equal(isStopId('1234567890'), true, '10-digit stop ID is valid')
assert.equal(isStopId('900100003a'), false, 'alphanumeric stop ID is invalid')
assert.equal(isStopId('123456'), false, '6-digit stop ID is too short')
assert.equal(isStopId('12345678901'), false, '11-digit stop ID is too long')
assert.equal(isStopId(null), false, 'null is invalid')
assert.equal(isStopId(undefined), false, 'undefined is invalid')
assert.equal(isStopId(900100003), false, 'number type is invalid')

// 2. distKm math (Alex: 52.5219, 13.4132 -> Potsdamer Platz: 52.5096, 13.3759 ~ 3.0-3.5 km)
const alexToPotsdam = distKm(52.5219, 13.4132, 52.5096, 13.3759)
assert.ok(alexToPotsdam > 2.8 && alexToPotsdam < 3.5, `expected ~3.1km, got ${alexToPotsdam}`)
assert.equal(distKm(52.52, 13.41, 52.52, 13.41), 0, 'zero distance between identical coords')

// 3. pickStop nearest candidate selection
const mockLocations = [
  { type: 'poi', id: '900000001', location: { latitude: 52.52, longitude: 13.41 } }, // not a stop
  { type: 'stop', id: '900100001', location: { latitude: 52.53, longitude: 13.42 } }, // ~1.3 km away
  { type: 'stop', id: '900100002', location: { latitude: 52.5205, longitude: 13.4105 } }, // ~0.1 km away (closest)
  { type: 'stop', id: 'invalid_id', location: { latitude: 52.5201, longitude: 13.4101 } }, // invalid ID
]
const chosen = pickStop(mockLocations, 52.52, 13.41)
assert.equal(chosen, '900100002', 'picks nearest valid stop ID')
assert.equal(pickStop([], 52.52, 13.41), null, 'empty array returns null')
assert.equal(pickStop(null, 52.52, 13.41), null, 'null input returns null')

// 4. parseDepartures parsing & filtering
const baseTime = Date.parse('2026-09-15T12:00:00Z')
const mockVbbPayload = {
  departures: [
    {
      line: { name: 'U2', color: { bg: '#da421e', fg: '#ffffff' } },
      direction: 'Ruhleben',
      when: '2026-09-15T12:03:00Z',
      plannedWhen: '2026-09-15T12:02:00Z',
      platform: '1',
      cancelled: false,
      remarks: [{ type: 'warning', text: 'Aufzugsstörung am Bahnhof Kaiserdamm' }],
    },
    {
      line: { name: 'U8', color: { bg: '#0065ad', fg: '#ffffff' } },
      direction: 'Hermannstraße',
      when: '2026-09-15T12:01:00Z',
      plannedWhen: '2026-09-15T12:01:00Z',
      platform: '2',
      cancelled: true,
    },
    {
      line: { name: 'U5' }, // fallback default colors
      direction: 'Hauptbahnhof',
      plannedWhen: '2026-09-15T12:05:00Z',
      // when omitted -> uses plannedWhen
    },
    {
      line: { name: 'U2' },
      direction: 'Pankow',
      when: '2026-09-15T11:55:00Z', // 5 minutes ago -> expired (>60s old)
    },
  ],
}

const parsed = parseDepartures(mockVbbPayload, baseTime)
assert.equal(parsed.length, 3, 'expired departure excluded; 3 valid departures retained')
// sorted by departure time: U8 (12:01) -> U2 (12:03) -> U5 (12:05)
assert.equal(parsed[0].line, 'U8')
assert.equal(parsed[0].cancelled, true)
assert.equal(parsed[1].line, 'U2')
assert.equal(parsed[1].bg, '#da421e')
assert.equal(parsed[1].note, 'Aufzugsstörung am Bahnhof Kaiserdamm')
assert.equal(parsed[2].line, 'U5')
assert.equal(parsed[2].bg, '#0a1030', 'fallback background color')

// Null/empty payload safety
assert.deepEqual(parseDepartures(null), [])
assert.deepEqual(parseDepartures({}), [])
assert.deepEqual(parseDepartures({ departures: 'junk' }), [])

console.log('de-live.check: OK ✓ — VBB HAFAS departure parser, spatial nearest-stop & validation verified')
