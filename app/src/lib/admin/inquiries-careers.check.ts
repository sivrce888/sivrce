/**
 * Inquiry buckets + careers city-prefix — pure asserts, no queries.
 * Run: npx tsx src/lib/admin/inquiries-careers.check.ts
 */

import { inquiryBucketLabel as label, isListingRef } from './inquiries'

const isListing = (listingId: string) => isListingRef({ listingId })
function cityFrom(msg: string) {
  return msg.match(/\[კარიერა · ([^\]]+)\]/)?.[1]?.trim()
}

function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) throw new Error(msg)
}

assert(label('careers') === 'კარიერა', 'careers label')
assert(label('general') === 'კონტაქტი', 'general label')
assert(!isListing('careers'), 'careers not listing')
assert(isListing('listing_xyz'), 'real listing')
// Every non-listing bucket the product writes must stay out of listing links.
for (const b of ['contact', 'demand-buy', 'demand-rent', 'demand-daily', 'demand-sell']) {
  assert(!isListing(b), `${b} not listing`)
}
assert(cityFrom('[კარიერა · ბათუმი]\nგანაცხადი.') === 'ბათუმი', 'city prefix')

console.log('inquiries-careers.check: ok')
