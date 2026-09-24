/**
 * Runnable check: npx tsx src/components/chat/translate.check.ts
 * When the chat offers "Translate" — script of the message vs. reader locale.
 */
import assert from 'node:assert/strict'
import { dominantScript, translateHint, translateMessage } from './translate'

assert.equal(dominantScript('გამარჯობა, ბინა ჯერ კიდევ თავისუფალია?'), 'Georgian')
assert.equal(dominantScript('Здравствуйте, квартира свободна?'), 'Cyrillic')
assert.equal(dominantScript('שלום, הדירה עדיין פנויה?'), 'Hebrew')
assert.equal(dominantScript('مرحبا، هل الشقة متاحة؟'), 'Arabic')
assert.equal(dominantScript('Բարև, բնակարանը ազատ է՞'), 'Armenian')
// Mixed: the majority script wins (a Georgian reply quoting "Vake Park").
assert.equal(dominantScript('ვაკის პარკთან ახლოს, Vake Park'), 'Georgian')

// Too short / no letters — never offer.
assert.equal(dominantScript('ok'), null)
assert.equal(dominantScript('$150 000 · 2+1 👍'), null)
assert.equal(translateHint('ok 👍', 'ka'), 'no')

// Different script → certainly foreign.
assert.equal(translateHint('Здравствуйте, квартира свободна?', 'ka'), 'yes')
assert.equal(translateHint('Hello, is the flat still available?', 'ka'), 'yes')
assert.equal(translateHint('გამარჯობა, ბინა თავისუფალია?', 'en'), 'yes')
assert.equal(translateHint('שלום, הדירה עדיין פנויה?', 'ar'), 'yes')

// Own unique script → nothing to translate.
assert.equal(translateHint('გამარჯობა, ბინა თავისუფალია?', 'ka'), 'no')
assert.equal(translateHint('שלום, הדירה עדיין פנויה?', 'he'), 'no')
assert.equal(translateHint('Բարև, բնակարանը ազատ է՞', 'hy'), 'no')

// Shared script → only a detector can tell (en/de/tr/az, ru/uk).
assert.equal(translateHint('Hello, is the flat still available?', 'de'), 'maybe')
assert.equal(translateHint('Merhaba, daire hâlâ müsait mi?', 'en'), 'maybe')
assert.equal(translateHint('Здравствуйте, квартира свободна?', 'uk'), 'maybe')

// Fallback chain: on-device first, server only when the device can't.
const g = globalThis as Record<string, unknown>
const serverCalls: string[] = []
g.fetch = async (_url: string, init: { body: string }) => {
  serverCalls.push(init.body)
  return new Response(JSON.stringify({ ok: true, translated: 'server' }))
}
const detector = (lang: string, confidence = 0.95) => ({
  availability: async () => 'available',
  create: async () => ({ detect: async () => [{ detectedLanguage: lang, confidence }] }),
})
const translator = (avail: string) => ({
  availability: async () => avail,
  create: async () => ({ translate: async (t: string) => `device:${t}` }),
})

async function fallbackChain() {
  // No built-in AI (Safari/Firefox) → server, by message id only.
  assert.equal(await translateMessage('m1', 'Здравствуйте', 'en'), 'server')
  assert.deepEqual(JSON.parse(serverCalls.at(-1)!), { messageId: 'm1', targetLang: 'en' })

  // Chrome with the pack installed → on-device, server untouched.
  g.LanguageDetector = detector('ru')
  g.Translator = translator('available')
  const before = serverCalls.length
  assert.equal(await translateMessage('m2', 'Здравствуйте', 'en'), 'device:Здравствуйте')
  assert.equal(serverCalls.length, before)

  // Pack not downloaded → server; never a silent multi-MB download.
  g.Translator = translator('downloadable')
  assert.equal(await translateMessage('m3', 'Здравствуйте', 'en'), 'server')

  // Detector unsure → server.
  g.LanguageDetector = detector('ru', 0.3)
  g.Translator = translator('available')
  assert.equal(await translateMessage('m4', 'Здравствуйте', 'en'), 'server')

  // On-device throws → server, never a dead button.
  g.Translator = { availability: async () => { throw new Error('boom') } }
  g.LanguageDetector = detector('ru')
  assert.equal(await translateMessage('m5', 'Здравствуйте', 'en'), 'server')

  // Server refuses (not a member / rate-limited) → null.
  g.fetch = async () => new Response('{}', { status: 404 })
  delete g.Translator
  assert.equal(await translateMessage('m6', 'Здравствуйте', 'en'), null)
}

fallbackChain().then(() => console.log('translate.check: ok'))
