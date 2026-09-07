/**
 * AI degradation contract: without GOOGLE_GENERATIVE_AI_API_KEY every adapter
 * function resolves null synchronously — never throws, never hits the network.
 * Run: npx tsx src/lib/ai.check.ts
 */
import assert from 'node:assert/strict'

// Force the no-key path even if the dev machine has a real key in .env.local.
const savedKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY
delete process.env.GOOGLE_GENERATIVE_AI_API_KEY

import { estimatePropertyValue, generateListingDescription, parseSearchQuery, translateText } from './ai'
import { aiLabel } from './ai-label'

async function main() {
  const base = {
    title: 'Test', propType: 'apartment', dealType: 'sale',
    city: 'თბილისი', district: 'ვაკე', address: 'ქუჩა 1',
    rooms: 2, area: 60,
  }
  assert.equal(await generateListingDescription(base), null)
  assert.equal(await translateText('გამარჯობა', 'en'), null)
  assert.equal(await parseSearchQuery('ბინა ვაკეში'), null)
  assert.equal(await estimatePropertyValue(base), null)

  // Shared score → label mapping (search cards + listing mapper).
  assert.equal(aiLabel(95), 'შესანიშნავი ფასი')
  assert.equal(aiLabel(90), 'შესანიშნავი ფასი')
  assert.equal(aiLabel(89), 'კარგი შეთავაზება')
  assert.equal(aiLabel(75), 'კარგი შეთავაზება')
  assert.equal(aiLabel(74), 'საშუალო')

  if (savedKey) process.env.GOOGLE_GENERATIVE_AI_API_KEY = savedKey
  console.log('ai.check: OK')
}

main().catch((e) => {
  console.error('ai.check FAILED:', e)
  process.exit(1)
})
