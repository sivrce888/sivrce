/**
 * Runnable check: npx tsx src/lib/suggest-match.check.ts
 */
import assert from "node:assert/strict"
import { suggestMatch } from "./suggest-match"

const beli = ["აკაკი ბელიაშვილის ქუჩა", "Akaki Beliashvili Street"]
const agh = ["დავით აღმაშენებლის გამზირი", "David Aghmashenebeli Avenue"]

assert.equal(suggestMatch(beli, "beli")?.prefix, true)
assert.equal(suggestMatch(beli, "ბელი")?.prefix, true)
assert.equal(suggestMatch(agh, "beli")?.prefix, false)
assert.ok(suggestMatch(agh, "beli")) // substring still hits
assert.equal(suggestMatch(beli, "xyz"), null)
console.log("suggest-match.check: ok")
