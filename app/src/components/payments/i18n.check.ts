/**
 * Paid-surface locale invariants.
 * Run: npx tsx src/components/payments/i18n.check.ts
 * 1. Boost checkout never shows Georgian to non-Georgian locales.
 * 2. /advertise pricing grid passes the real locale (no ka collapse for de/he/ar/tr/uk/hy/az).
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { getPaymentsStrings } from './i18n'
import { LANGS } from '@/lib/i18n/core'

// 1. Fallback: every locale resolves; only ka resolves to Georgian strings.
const ka = getPaymentsStrings('ka')
for (const l of LANGS) {
  const s = getPaymentsStrings(l)
  assert.ok(s.boost.length > 0, `boost label: ${l}`)
  if (l !== 'ka') assert.notEqual(s.boost, ka.boost, `locale ${l} must not show Georgian`)
}
assert.equal(getPaymentsStrings('de').boost, 'Boost', 'de native copy')
assert.equal(getPaymentsStrings('he').boost, 'קידום', 'he native copy')
for (const l of ['ar', 'tr', 'uk', 'hy', 'az'] as const)
  assert.notEqual(getPaymentsStrings(l).boost, getPaymentsStrings('en').boost, `${l} native copy`)
assert.ok(getPaymentsStrings('ru').renewHint(7).includes('7'), 'ru renewHint interpolates days')

// 2. Source guards.
const geo = /[\u10A0-\u10FF]/
const btn = readFileSync('src/components/payments/TierPurchaseButton.tsx', 'utf8')
assert.ok(!geo.test(btn), 'no hardcoded Georgian left in button — copy lives in i18n.ts')
assert.ok(btn.includes('lang = "ka"'), 'button keeps ka default for legacy callers')

const grid = readFileSync('src/components/payments/PromoPricingGrid.tsx', 'utf8')
assert.ok(!grid.includes('?? GRID.ka'), 'grid must not fall back to ka')
assert.ok(grid.includes('GRID[lang] ? lang : "en"'), 'grid en fallback for unknown langs')
assert.ok(!/lang === "ka" \?|lang === "ru" \?/.test(grid), 'grid has no inline locale ternaries — copy lives in GRID')

const adv = readFileSync('src/app/[lang]/advertise/page.tsx', 'utf8')
assert.ok(adv.includes('<PromoPricingGrid lang={lang} />'), 'advertise passes real locale')
assert.ok(adv.includes('<TierPurchaseButton') === false, 'no unlocalized button on advertise')

console.log('payments-i18n: 10 locales resolve, en (never ka) fallback, sources clean ✓')
