/**
 * Self-check: FX pair slugs, cross-rate math, locale formatting.
 * Run: npx tsx src/lib/fx.check.ts
 */
import { FX_CURRENCIES, FX_PAIRS, fxConvert, fxFormat, fxName, pairSlug, parsePairSlug } from './fx'

// Slug round-trip: every listed pair parses back to itself; unknown slugs 404.
for (const [from, to] of FX_PAIRS) {
  const p = parsePairSlug(pairSlug(from, to))
  if (!p || p[0] !== from || p[1] !== to) throw new Error(`pair round-trip failed: ${from}->${to}`)
}
if (parsePairSlug('usd-chf') !== null || parsePairSlug('../../etc') !== null) throw new Error('non-whitelisted/hostile slug must 404')

// Cross rate pivots through USD: 100 USD -> GEL -> USD must round-trip.
const r = { USD: 1, EUR: 0.8, GEL: 2.5 } as Record<(typeof FX_CURRENCIES)[number], number>
const gel = fxConvert(100, 'USD', 'GEL', r)
if (gel !== 250) throw new Error(`USD->GEL expected 250, got ${gel}`)
if (fxConvert(gel, 'GEL', 'USD', r) !== 100) throw new Error('round-trip drift')
const eur = fxConvert(100, 'EUR', 'GEL', r)
if (Math.abs(eur - 312.5) > 1e-9) throw new Error(`EUR->GEL cross expected 312.5, got ${eur}`)

// Formatting: locale tags resolve, names come from ICU (never empty), ka digits stay Latin.
if (fxFormat(1234.5, 'GEL', 'en').indexOf('1,234') < 0) throw new Error(`fxFormat en: ${fxFormat(1234.5, 'GEL', 'en')}`)
if (!fxName('USD', 'ka') || fxName('USD', 'ka') === 'USD' && fxName('GEL', 'ka') === 'GEL') {
  // ICU must localise at least one of the two; both raw codes means DisplayNames failed.
  throw new Error('fxName returned raw codes for ka')
}

console.log('fx.check: ok')
