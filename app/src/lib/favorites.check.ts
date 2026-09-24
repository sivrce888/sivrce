/**
 * Favorites cross-device sync (3-way merge) + panel locale fallback.
 * Run: tsx src/lib/favorites.check.ts
 */
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"

import { FAV_MAX, favPatch, mergeFavs, parseFavPatch } from "./favorites-sync"
import { LANGS, panelLang } from "./i18n/core"

// New device / first sign-in: empty base → everything local goes up, nothing lost.
assert.deepEqual(favPatch(["a", "b"], []), { add: ["a", "b"], remove: [] })
assert.deepEqual(mergeFavs(["a", "b"], [], ["a", "b", "s"]), ["a", "b", "s"])

// Removed on another device: in base, gone from server → gone locally, not re-sent.
assert.deepEqual(favPatch(["a", "x"], ["a", "x"]), { add: [], remove: [] })
assert.deepEqual(mergeFavs(["a", "x"], ["a", "x"], ["a"]), ["a"])

// Removed here while offline: in base, not local → sent as remove.
assert.deepEqual(favPatch(["a"], ["a", "x"]), { add: [], remove: ["x"] })

// Catalog-only id the server cannot store survives locally.
assert.deepEqual(mergeFavs(["a", "cat-1"], ["a"], ["a"]), ["a", "cat-1"])

// Untrusted body validation.
assert.deepEqual(parseFavPatch({}), { add: [], remove: [] })
assert.deepEqual(parseFavPatch({ add: ["a", "a"] }), { add: ["a"], remove: [] })
assert.equal(parseFavPatch(null), null)
assert.equal(parseFavPatch({ add: "a" }), null)
assert.equal(parseFavPatch({ add: ["../x"] }), null)
assert.equal(parseFavPatch({ add: [1] }), null)
assert.equal(parseFavPatch({ remove: Array.from({ length: FAV_MAX + 1 }, (_, i) => `l${i}`) }), null)

// Shared device: another user's synced hearts are never pushed into this account.
const src = readFileSync(new URL("./favorites.ts", import.meta.url), "utf8")
const core = readFileSync(new URL("./favorites-sync.ts", import.meta.url), "utf8")
assert.doesNotMatch(core, /from .react./, "favorites-sync is imported by server code — no React")
assert.match(src, /handover \? \{\} :/, "handover must send an empty patch")

// Panel copy: ka/de own tables, every other locale → English, never Georgian.
assert.equal(panelLang("ka"), "ka")
assert.equal(panelLang("de"), "de")
for (const l of LANGS.filter((x) => x !== "ka" && x !== "de")) assert.equal(panelLang(l), "en", l)
assert.equal(panelLang("zz"), "ka")

console.log("favorites.check: ok")
