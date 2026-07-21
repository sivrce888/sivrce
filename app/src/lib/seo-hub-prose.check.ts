/**
 * Runnable self-check for category-hub SEO prose.
 * Run: npx tsx src/lib/seo-hub-prose.check.ts
 */
import assert from 'node:assert/strict'
import { HUB_PROSE, hubProseOf } from './seo-hub-prose'

const required = [
  'sale/land',
  'sale/apartments',
  'sale/houses',
  'rent/commercial',
] as const

for (const key of required) {
  const p = HUB_PROSE[key]
  assert.ok(p, `missing hub prose: ${key}`)
  assert.ok(p.lede.length > 80, `${key} lede too short`)
  assert.ok(p.sections.length >= 1, `${key} needs ≥1 section`)
  for (const s of p.sections) {
    assert.ok(s.h.length > 10, `${key} section heading too short`)
    assert.ok(s.body.every((b) => b.length > 40), `${key} section body too thin`)
  }
  // sivrce-branded — never ship competitor brand claims
  const blob = [p.lede, ...p.sections.flatMap((s) => [s.h, ...s.body])].join(' ')
  assert.ok(!/myhome|ss\.ge/i.test(blob), `${key} must not name competitors`)
  assert.ok(/sivrce/i.test(blob), `${key} should mention sivrce`)
}

assert.equal(hubProseOf('sale', 'land')?.lede, HUB_PROSE['sale/land']!.lede)
assert.equal(hubProseOf('sale', 'unknown'), null)
assert.equal(hubProseOf(undefined, 'land'), null)

console.log(`seo-hub-prose: ${required.length} hubs + lookup ✓`)
