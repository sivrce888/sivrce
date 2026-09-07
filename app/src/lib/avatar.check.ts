/**
 * Self-check for name-derived avatar visuals.
 * Run: npx tsx src/lib/avatar.check.ts
 */
import assert from "node:assert/strict"

import { BRAND } from "./brand"
import { avatarInitials, avatarVisual, GRADIENTS, isValidAvatarStyle } from "./avatar"

const BRAND_HEX = new Set(
  Object.values(BRAND.colors).map((v) => v.toLowerCase()),
)

// Deterministic — same name, same visual (server + client, no hydration drift)
const a = avatarVisual("ნიკა გელაშვილი")
assert.deepEqual(avatarVisual("ნიკა გელაშვილი"), a)
assert.deepEqual(avatarVisual("  NIKO GELASHVILI ".trim().toLowerCase()), avatarVisual("niko gelashvili"))

// Only locked brand hues, gradient-safe angle family
for (const name of ["ნიკა", "Nino Beridze", "sivrce", "x", "  ", "გიორგი მაისაშვილი jr"]) {
  const v = avatarVisual(name)
  assert.ok(BRAND_HEX.has(v.from.toLowerCase()), `from not a brand hex: ${v.from}`)
  assert.ok(BRAND_HEX.has(v.to.toLowerCase()), `to not a brand hex: ${v.to}`)
  assert.ok(v.angle >= 90 && v.angle <= 180, `angle out of family: ${v.angle}`)
}

// 50 distinct combos reachable across a sample
const combos = new Set(
  ["ა", "ბ", "გ", "დ", "ე", "ვ", "ზ", "თ", "ი", "კ", "ლ", "მ", "ნ", "ო", "პ", "ჟ", "რ", "ს", "ტ", "უ"]
    .map((ch) => ch + " " + ch)
    .map((n) => {
      const v = avatarVisual(n)
      return `${v.from}->${v.to}@${v.angle}`
    }),
)
assert.ok(combos.size >= 10, `too few distinct combos: ${combos.size}`)

// Chosen style: deterministic, on-brand, distinct per index; invalid falls back to auto
assert.equal(GRADIENTS.length, 10)
for (let i = 0; i < GRADIENTS.length; i++) {
  const v = avatarVisual("ნიკა გელაშვილი", i)
  assert.deepEqual(avatarVisual("სხვა სახელი", i), v, `style ${i} not deterministic`)
  assert.equal(v.from, GRADIENTS[i][0])
  assert.equal(v.to, GRADIENTS[i][1])
  assert.ok(v.angle >= 90 && v.angle <= 180, `style ${i} angle out of family: ${v.angle}`)
}
assert.ok(isValidAvatarStyle(0) && isValidAvatarStyle(9))
assert.ok(!isValidAvatarStyle(10) && !isValidAvatarStyle(-1) && !isValidAvatarStyle(1.5))
assert.ok(!isValidAvatarStyle(null) && !isValidAvatarStyle(undefined))
const autoV = avatarVisual("ნიკა გელაშვილი")
assert.ok(
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].some((i) => {
    const v = avatarVisual("ნიკა გელაშვილი", i)
    return v.from !== autoV.from || v.to !== autoV.to || v.angle !== autoV.angle
  }),
  "pinned styles never diverge from auto",
)

// Initials: up to 2 leading letters, uppercase (Georian → Mtavruli all-caps), "S" fallback
assert.equal(avatarInitials("ნიკა გელაშვილი"), "ᲜᲒ")
assert.equal(avatarInitials("  Nino   Beridze "), "NB")
assert.equal(avatarInitials("გიორგი"), "Გ")
assert.equal(avatarInitials(""), "S")
assert.equal(avatarInitials(null), "S")
assert.equal(avatarInitials(undefined), "S")

console.log("avatar.check: ok")
