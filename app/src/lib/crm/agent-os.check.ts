import { prioritizeAgentLeads, matchListingsForLead } from './agent-os'

console.log('agent-os.check: start')

const leads = [
  { id: '1', name: 'Giorgi M.', phone: '+995599000001', status: 'offer_made' as const, budgetUSD: 180000 },
  { id: '2', name: 'Elena K.', phone: '+995599000002', status: 'new' as const, budgetUSD: 120000, targetDistrict: 'ვაკე' },
]

const prioritized = prioritizeAgentLeads(leads)
if (prioritized.length !== 2) throw new Error('Expected 2 actions')
if (prioritized[0].leadId !== '1') throw new Error('offer_made lead should have top priority')

const listings = [
  { id: 'p1', priceUSD: 115000, district: 'ვაკე', dealType: 'sale' },
  { id: 'p2', priceUSD: 250000, district: 'საბურთალო', dealType: 'sale' },
]

const matched = matchListingsForLead(leads[1], listings)
if (matched.length === 0 || matched[0].propertyId !== 'p1') {
  throw new Error('Property p1 should match Elena K.')
}

console.log('agent-os.check: OK ✓')
