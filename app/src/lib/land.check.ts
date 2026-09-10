/**
 * Runnable check for the land profile model.
 * Run: npx tsx --conditions=react-server src/lib/land.check.ts
 *
 * Asserts slope/aspect math against hand-computed geometry (STEP 0.0006° ≈
 * 66.8 m N–S, shrunk by cos(lat) E–W), the Georgia coordinate guard, and that
 * every aspect resolves to a non-empty label in all 10 site locales.
 */
import assert from 'node:assert/strict'
import { LANGS } from './i18n/core'
import { getDict } from './i18n/dicts'
import { inGeorgia, slopeAspect, type Aspect } from './land'

const STEP_M = 0.0006 * 111_320

// Dead flat terrain → flat, no slope.
assert.deepEqual(slopeAspect([100, 100, 100, 100, 100], 41.7), { slopeDeg: 0, aspect: 'flat' })

// 10 m drop to the south: atan(10 / 66.79) ≈ 8.51°.
const south = slopeAspect([100, 100, 90, 100, 100], 41.7)
assert.ok(Math.abs(south.slopeDeg - (Math.atan(10 / STEP_M) * 180) / Math.PI) < 0.01, `south slope, got ${south.slopeDeg}`)
assert.equal(south.aspect, 'S')

// Same 10 m drop eastward at Tbilisi's latitude is steeper in degrees —
// the east–west metre is shorter (× cos(lat) ≈ 0.75).
const east = slopeAspect([100, 100, 100, 90, 100], 41.7151)
assert.equal(east.aspect, 'E')
assert.ok(east.slopeDeg > south.slopeDeg + 1.5, `cos-lat correction, got ${east.slopeDeg} vs ${south.slopeDeg}`)

// Steepest direction wins when several neighbours differ.
assert.equal(slopeAspect([100, 92, 98, 100, 100], 41.7).aspect, 'N')

// Garbage readings degrade to flat instead of inventing a slope.
assert.deepEqual(slopeAspect([100, NaN, 90, 100, 100], 41.7), { slopeDeg: 0, aspect: 'flat' })

// Shallow relief below 0.5° (~0.9%) reads flat: 0.5 m over 66.8 m ≈ 0.43°.
const shallow = slopeAspect([100, 100, 99.5, 100, 100], 41.7)
assert.ok(shallow.slopeDeg > 0 && shallow.slopeDeg < 0.5)
assert.equal(shallow.aspect, 'flat')

// Georgia guard: real places pass, junk and foreign coords fail.
assert.ok(inGeorgia(41.7151, 44.8271)) // Tbilisi
assert.ok(inGeorgia(41.6102, 41.6198)) // Batumi
assert.ok(inGeorgia(43.0456, 42.7278)) // Mestia
assert.ok(!inGeorgia(0, 0)) // unset default
assert.ok(!inGeorgia(48.8566, 2.3522)) // Paris
assert.ok(!inGeorgia(41, 44.8)) // lat just south of the border (Azerbaijan)
assert.ok(!inGeorgia(44, 44.8271)) // lat way outside
assert.ok(!inGeorgia(41.7, 47.5)) // lng east of the border

// Every aspect — including flat — has a non-empty label in all 10 locales.
const ASPECTS: Aspect[] = ['flat', 'N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW']
for (const lang of LANGS) {
  // widened for template-literal keys below — a missing key reads as undefined
  const dict = getDict(lang) as Record<string, string | undefined>
  assert.ok(dict, `${lang} dict missing`)
  for (const key of ['detail.landTitle', 'detail.landNote', 'detail.landElev', 'detail.landSlope', 'detail.landFacing', 'detail.landPrecip', 'detail.landTemp', 'detail.landMm'] as const) {
    assert.ok((dict[key] ?? '').length > 0, `${lang} ${key} empty`)
  }
  for (const a of ASPECTS) assert.ok((dict[`detail.land${a === 'flat' ? 'Flat' : a}`] ?? '').length > 0, `${lang} aspect ${a} label missing`)
  for (const hint of ['HintFlat', 'HintSoft', 'HintSteep', 'HintSun', 'HintShade']) {
    assert.ok((dict[`detail.land${hint}`] ?? '').length > 0, `${lang} hint ${hint} missing`)
  }
}

console.log(`land.check ok — slope/aspect math, Georgia guard, ${ASPECTS.length} aspects × ${LANGS.length} locales`)
