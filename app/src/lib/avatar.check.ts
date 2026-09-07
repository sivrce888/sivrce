/**
 * Self-check for name-derived avatar visuals.
 * Run: npx tsx src/lib/avatar.check.ts
 */
import assert from "node:assert/strict"

import { BRAND } from "./brand"
import {
  avatarInitials,
  avatarVisual,
  customVisual,
  GRADIENTS,
  hexToHsl,
  ICONS,
  isValidAvatarColor,
  isValidAvatarIcon,
  isValidAvatarStyle,
} from "./avatar"

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

// Icon allowlist: closed set of curated glyphs, junk never passes the boundary
const iconKeys = Object.keys(ICONS)
assert.equal(iconKeys.length, 10, `expected 10 glyphs, got ${iconKeys.length}`)
// lucide exports forwardRef objects ({$$typeof, render}); older versions, functions
assert.ok(iconKeys.every((k) => ["object", "function"].includes(typeof ICONS[k as keyof typeof ICONS])))
assert.ok(isValidAvatarIcon("house") && isValidAvatarIcon("paw"))
assert.ok(!isValidAvatarIcon("House")) // case-sensitive keys
assert.ok(!isValidAvatarIcon("logo") && !isValidAvatarIcon("") )
assert.ok(!isValidAvatarIcon(null) && !isValidAvatarIcon(undefined))
for (const k of iconKeys) assert.ok(isValidAvatarIcon(k), `own key rejected: ${k}`)
const autoV = avatarVisual("ნიკა გელაშვილი")
assert.ok(
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].some((i) => {
    const v = avatarVisual("ნიკა გელაშვილი", i)
    return v.from !== autoV.from || v.to !== autoV.to || v.angle !== autoV.angle
  }),
  "pinned styles never diverge from auto",
)

// Custom color: hex gate at the trust boundary
assert.ok(isValidAvatarColor("#2e6bff") && isValidAvatarColor("#FF6A2D"))
assert.ok(!isValidAvatarColor("2e6bff") && !isValidAvatarColor("#2e6bff "))
assert.ok(!isValidAvatarColor("#2e6b") && !isValidAvatarColor("#2e6bff00") && !isValidAvatarColor("red"))
assert.ok(!isValidAvatarColor(null) && !isValidAvatarColor(undefined) && !isValidAvatarColor(""))

// hexToHsl: known primaries + brand blue
assert.deepEqual(hexToHsl("#ff0000"), [0, 100, 50])
assert.deepEqual(hexToHsl("#00ff00"), [120, 100, 50])
assert.deepEqual(hexToHsl("#0000ff"), [240, 100, 50])
assert.deepEqual(hexToHsl("#000000"), [0, 0, 0])
assert.deepEqual(hexToHsl("#ffffff"), [0, 0, 100])

// customVisual: deterministic, hue preserved, S/L clamped into the white-text
// legibility band; neutrals stay neutral; invalid input never reaches it
const cv = customVisual("#2e6bff")
assert.deepEqual(customVisual("#2E6BFF"), cv)
const HSL_RE = /hsl\((\d+) (\d+)% (\d+)%\)/
const parseHsl = (s: string): [number, number, number] => {
  const m = HSL_RE.exec(s)
  assert.ok(m, `not a derived hsl() stop: ${s}`)
  return [Number(m[1]), Number(m[2]), Number(m[3])]
}
assert.equal(parseHsl(cv.to)[0], hexToHsl("#2e6bff")[0])
for (const hex of ["#ff0000", "#22c55e", "#111111", "#f5d0fe", "#808080", "#000000"]) {
  const v = customVisual(hex)
  const [, s, l] = parseHsl(v.to)
  const [, s0] = hexToHsl(hex)
  if (s0 < 8) assert.ok(s < 8, `neutral drifts saturated: ${hex}`)
  else assert.ok(s >= 45 && s <= 88, `sat out of band: ${s}`)
  assert.ok(l >= 34 && l <= 76, `light out of band: ${l}`)
  const [, , lf] = parseHsl(v.from)
  assert.ok(lf > l && lf <= 86, `from not a tint above to: ${lf}`)
  assert.ok(v.angle >= 90 && v.angle <= 180, `angle out of family: ${v.angle}`)
}

// Precedence: color > style > auto; junk color falls through to style/auto
assert.deepEqual(avatarVisual("ნიკა", 3, "#ff0000"), customVisual("#ff0000"))
assert.deepEqual(avatarVisual("ნიკა", 3, "javascript:alert(1)"), avatarVisual("ნიკა", 3))
assert.deepEqual(avatarVisual("ნიკა", 3, null), avatarVisual("ნიკა", 3))

// Initials: up to 2 leading letters, uppercase (Georian → Mtavruli all-caps), "S" fallback
assert.equal(avatarInitials("ნიკა გელაშვილი"), "ᲜᲒ")
assert.equal(avatarInitials("  Nino   Beridze "), "NB")
assert.equal(avatarInitials("გიორგი"), "Გ")
assert.equal(avatarInitials(""), "S")
assert.equal(avatarInitials(null), "S")
assert.equal(avatarInitials(undefined), "S")

console.log("avatar.check: ok")
