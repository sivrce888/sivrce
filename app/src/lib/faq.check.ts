/**
 * Runnable check: npx tsx src/lib/faq.check.ts
 * FAQ assistant matcher — instant keyword coverage, miss fallback, chips.
 */
import assert from 'node:assert/strict'
import { FAQ_SECTIONS, faqLoc, faqMatch, faqSuggestions } from './faq'

// ——— dataset integrity: every section has QAs, all three locales aligned ———
for (const loc of ['ka', 'en', 'ru'] as const) {
  assert.ok(FAQ_SECTIONS[loc].length >= 4, `${loc}: sections`)
  for (const s of FAQ_SECTIONS[loc]) {
    assert.ok(s.title && s.items.length > 0, `${loc}: section "${s.title}"`)
    for (const item of s.items) assert.ok(item.q && item.a, `${loc}: QA content`)
  }
}
assert.deepEqual(
  FAQ_SECTIONS.ka.map((s) => s.items.length),
  FAQ_SECTIONS.en.map((s) => s.items.length),
)
assert.deepEqual(
  FAQ_SECTIONS.ka.map((s) => s.items.length),
  FAQ_SECTIONS.ru.map((s) => s.items.length),
)

// ——— faqLoc fallback ———
assert.equal(faqLoc('ka'), 'ka')
assert.equal(faqLoc('ru'), 'ru')
assert.equal(faqLoc('de'), 'de')
assert.equal(faqLoc('tr'), 'en')
assert.equal(faqLoc('xx'), 'en')

// ——— faqMatch: Georgian hits ———
// tie (both buy-questions score 1.0) resolves to the earlier, more general one
assert.match(faqMatch('როგორ ვიყიდო ბინა?', 'ka')?.q ?? '', /ვიყიდო ბინა/)
assert.ok(faqMatch('ვიპოვო უძრავი ქონება', 'ka'), 'ka: find real estate')
assert.ok(faqMatch('VIP პაკეტი რას იძლევა', 'ka'), 'ka: vip')
assert.ok(faqMatch('უფასოა განცხადების დამატება?', 'ka'), 'ka: free listing')

// ——— faqMatch: English + Russian hits ———
assert.equal(faqMatch('how do I book a tour', 'en')?.q, 'How do I book a tour?')
assert.ok(faqMatch('is it safe to contact agents directly', 'en'), 'en: safety')
assert.ok(faqMatch('Добавление объявления бесплатное?', 'ru'), 'ru: free listing')
assert.ok(faqMatch('что такое ИИ-оценка цены', 'ru'), 'ru: ai estimate')

// ——— punctuation/normalization resilience ———
assert.ok(faqMatch('ბინა დღიურად, თბილისში!', 'ka'), 'ka: punctuation')

// ——— misses → null (drives the "contact support" CTA) ———
assert.equal(faqMatch('', 'ka'), null)
assert.equal(faqMatch('   ', 'en'), null)
assert.equal(faqMatch('asdf qwerty zzz', 'ka'), null)
assert.equal(faqMatch('და ან თუ', 'ka'), null, 'ka: stopwords only')

// ——— German dataset: sections with content + live matcher hits ———
assert.ok(FAQ_SECTIONS.de.length >= 3, 'de: sections')
for (const s of FAQ_SECTIONS.de) {
  assert.ok(s.title && s.items.length > 0, `de: section "${s.title}"`)
  for (const item of s.items) assert.ok(item.q && item.a, 'de: QA content')
}
assert.ok(faqMatch('Können Deutsche in Georgien kaufen', 'de'), 'de: buy in Georgia')
assert.ok(faqMatch('Grunderwerbsteuer Berlin wie hoch', 'de'), 'de: berlin tax')
assert.ok(faqMatch('Visum Georgien Deutsche', 'de'), 'de: visa')
assert.equal(faqMatch('und der die', 'de'), null, 'de: stopwords only')
assert.equal(faqSuggestions('de', 4).length, 4)

// ——— suggestions: count cap + round-robin across sections ———
const chips = faqSuggestions('ka', 6)
assert.equal(chips.length, 6)
assert.ok(new Set(chips.map((c) => c.q)).size === 6, 'suggestions unique')
assert.equal(faqSuggestions('en', 6).length, 6)

console.log('faq.check: all assertions passed')
