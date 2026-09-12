import { answerPropertyQuestion } from './ai-copilot'

console.log('ai-copilot.check: start')

const ctx = {
  id: 'prop-1',
  title: 'Vake Apartment 2BR',
  priceUSD: 140000,
  areaSqm: 70,
  district: 'ვაკე',
  city: 'თბილისი',
  countryCode: 'GE',
  districtMedianPerSqm: 2100,
  estimatedMonthlyRentUSD: 950,
  sellerPhoneVerified: true,
  photosCount: 6,
  hasCadastralCode: true,
}

// Valuation question
const val = answerPropertyQuestion('Why is this apartment cheap?', ctx)
if (val.questionCategory !== 'valuation' || val.confidenceScore < 80) {
  throw new Error('Valuation question parsing failed')
}

// Investment question
const inv = answerPropertyQuestion('What is the rental yield and ROI?', ctx)
if (inv.questionCategory !== 'investment' || !inv.headlineEn.includes('Yield')) {
  throw new Error('Investment question parsing failed')
}

// TCO question
const tco = answerPropertyQuestion('What are the total closing fees and taxes?', ctx)
if (tco.questionCategory !== 'tco_hidden_costs') {
  throw new Error('TCO question parsing failed')
}

// Trust question
const trust = answerPropertyQuestion('Is this property safe and verified?', ctx)
if (trust.questionCategory !== 'trust_safety') {
  throw new Error('Trust question parsing failed')
}

// Regression: `description` must reach the scam radar. It was dropped at the
// call site, so the +35 payment-phrase signal never fired in product.
const scammy = answerPropertyQuestion('Is this property safe?', {
  ...ctx,
  description: 'Owner is abroad — wire transfer the deposit before viewing',
})
const clean = answerPropertyQuestion('Is this property safe?', {
  ...ctx,
  description: 'Bright 2BR in a quiet yard, viewings any weekday',
})
if (scammy.bodyEn === clean.bodyEn) {
  throw new Error('description is not reaching evaluateListingFraudRisk')
}
if (!/risk|caution|suspicious|unverified/i.test(scammy.headlineEn + scammy.bodyEn)) {
  throw new Error(`scam phrase did not raise the trust answer: ${scammy.headlineEn}`)
}

console.log('ai-copilot.check: OK ✓')
