/**
 * Self-check for Germany Notary & Transaction OS.
 */
import assert from 'node:assert/strict'
import {
  STATUTORY_NOTARY_CHECKLIST,
  verifyCommissionParity,
  generateBankUnderwritingSummary,
} from './de-transaction-os'

console.log('de-transaction-os.check: start')

// 1. Checklist
assert.ok(STATUTORY_NOTARY_CHECKLIST.length >= 5)
const mandatoryItems = STATUTORY_NOTARY_CHECKLIST.filter((i) => i.mandatory)
assert.ok(mandatoryItems.some((i) => i.id === 'grundbuch_current'))
assert.ok(mandatoryItems.some((i) => i.id === 'teilungserklaerung'))
assert.ok(mandatoryItems.some((i) => i.id === 'energieausweis_valid'))

// 2. Commission parity (§656c BGB)
const validSplit = verifyCommissionParity(3.57, 3.57)
assert.equal(validSplit.compliant, true)

const provisionsfrei = verifyCommissionParity(0, 3.57)
assert.equal(provisionsfrei.compliant, true)

const illegalSplit = verifyCommissionParity(5.0, 2.0)
assert.equal(illegalSplit.compliant, false)

// 3. Bank underwriting summary
const bankDoc = generateBankUnderwritingSummary({
  propertyAddress: 'Torstraße 42, 10119 Berlin',
  purchasePriceEur: 500_000,
  closingCostsEur: 57_850,
  equityEur: 157_850,
  loanPrincipalEur: 400_000,
  monthlyColdRentEur: 1_400,
  annualNoiEur: 14_500,
  dscr: 1.35,
  energyClass: 'B',
})

assert.equal(bankDoc.ltvPct, 80.0)
assert.equal(bankDoc.dscrStatus, 'PRIME')
assert.ok(bankDoc.summaryTextDe.includes('Torstraße 42'))

console.log('de-transaction-os.check: OK ✓')
