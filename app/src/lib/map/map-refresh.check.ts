/**
 * Runnable: map refresh delta message.
 * Run: npx tsx src/lib/map/map-refresh.check.ts
 */

import assert from 'node:assert/strict'

function refreshNote(prevIds: string[], nextIds: string[]): string {
  const prev = new Set(prevIds)
  const added = nextIds.filter((id) => !prev.has(id)).length
  return added > 0 ? `+${added} ახალი განცხადება` : 'რუკა განახლებულია'
}

assert.equal(refreshNote(['a'], ['a', 'b']), '+1 ახალი განცხადება')
assert.equal(refreshNote(['a', 'b'], ['a', 'b']), 'რუკა განახლებულია')
assert.equal(refreshNote([], ['x', 'y']), '+2 ახალი განცხადება')

console.log('map-refresh.check: ok')
