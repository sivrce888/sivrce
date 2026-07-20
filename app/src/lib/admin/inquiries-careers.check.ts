/**
 * Careers inquiry bucket + city-prefix — pure asserts, no DB.
 * Run: npx tsx src/lib/admin/inquiries-careers.check.ts
 */

const BUCKET_LABELS: Record<string, string> = {
  careers: 'კარიერა',
  general: 'კონტაქტი',
  contact: 'კონტაქტი',
}

function label(id: string) {
  return BUCKET_LABELS[id] ?? (id.length > 16 ? `${id.slice(0, 14)}…` : id)
}
function isListing(id: string) {
  return Boolean(id) && !(id in BUCKET_LABELS)
}
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
assert(cityFrom('[კარიერა · ბათუმი]\nგანაცხადი.') === 'ბათუმი', 'city prefix')

console.log('inquiries-careers.check: ok')
