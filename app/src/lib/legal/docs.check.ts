/**
 * Runnable check: npx tsx src/lib/legal/docs.check.ts
 */
import assert from 'node:assert/strict'
import { LEGAL_DOCS, LEGAL_SLUGS, getLegalDoc } from './docs'

// Spec route family: /legal/{impressum,datenschutz,agb,cookies,widerruf,
// verbraucherinformationen,partner-disclosures,data-sources,content-policy,
// takedown,privacy-request,accessibility}
const REQUIRED = [
  'impressum',
  'datenschutz',
  'agb',
  'cookies',
  'widerruf',
  'verbraucherinformationen',
  'partner-disclosures',
  'data-sources',
  'content-policy',
  'takedown',
  'privacy-request',
  'accessibility',
]

assert.equal(LEGAL_DOCS.length, REQUIRED.length, 'doc count')
assert.deepEqual([...LEGAL_SLUGS].sort(), [...REQUIRED].sort(), 'doc slugs match spec route family')

for (const d of LEGAL_DOCS) {
  assert.ok(getLegalDoc(d.slug) === d, `lookup ${d.slug}`)
  for (const loc of [d.de, d.en]) {
    assert.ok(loc.title.length > 0, `${d.slug} title`)
    assert.ok(loc.description.length > 0, `${d.slug} description`)
    assert.ok(loc.sections.length >= 2, `${d.slug} needs >=2 sections`)
    for (const s of loc.sections) {
      assert.ok(s.title.length > 0, `${d.slug} section title`)
      assert.ok(s.body.length > 0 && s.body.every((p) => p.trim().length > 0), `${d.slug} section body`)
    }
  }
  // Draft docs must not pose as final: German imprint/privacy/terms etc. carry the flag.
  if (['impressum', 'datenschutz', 'agb', 'cookies', 'widerruf'].includes(d.slug)) {
    assert.equal(d.legalReviewRequired, true, `${d.slug} must stay LEGAL_REVIEW_REQUIRED until counsel signs off`)
  }
}

console.log(`legal-docs: ${LEGAL_DOCS.length} docs, ${LEGAL_DOCS.filter((d) => d.legalReviewRequired).length} flagged for review ✓`)
