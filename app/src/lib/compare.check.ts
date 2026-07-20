/**
 * Runnable check for compare tray rules.
 * Run: npx tsx src/lib/compare.check.ts
 */
import assert from "node:assert/strict"

const COMPARE_MAX = 4

function toggle(cur: string[], id: string): string[] {
  if (cur.includes(id)) return cur.filter((x) => x !== id)
  if (cur.length >= COMPARE_MAX) return cur
  return [...cur, id]
}

let ids: string[] = []
ids = toggle(ids, "a")
ids = toggle(ids, "b")
ids = toggle(ids, "c")
ids = toggle(ids, "d")
assert.deepEqual(ids, ["a", "b", "c", "d"])
ids = toggle(ids, "e")
assert.deepEqual(ids, ["a", "b", "c", "d"], "refuse 5th")
ids = toggle(ids, "b")
assert.deepEqual(ids, ["a", "c", "d"])
console.log("compare.check: ok")
