/**
 * GDPR Art. 15 (access) + Art. 20 (portability) — what a data export contains.
 *
 * Pure shaping only, so the rules are testable without a database: which user
 * fields leave the server, what is capped, and what is deliberately excluded.
 *
 * Exclusions are not laziness — they are the law's own limits: credentials are
 * never disclosed (Art. 15(4): the rights of others / security), and moderation,
 * fraud and complaint records name third parties, so they are handled as a
 * manual request instead of an automated dump.
 */

/** Per-collection row caps — an export is a copy of your data, not a data feed. */
export const EXPORT_LIMITS = {
  savedListings: 500,
  savedSearches: 100,
  reviews: 500,
  tours: 500,
  bookings: 500,
  inquiries: 500,
  forumThreads: 500,
  forumReplies: 1000,
  listings: 500,
  behaviors: 1000,
} as const

/** Never leaves the server, for any reason. */
export const NEVER_EXPORTED = ['passwordHash', 'accounts', 'sessions', 'authenticators'] as const

/** Available on request instead of in the dump (contains third-party data). */
export const ON_REQUEST_ONLY = [
  'moderation records',
  'complaints',
  'fraud signals',
  'security logs',
] as const

export interface ExportableUser {
  id: string
  name: string | null
  email: string
  emailVerified: Date | null
  phone: string | null
  phoneVerifiedAt: Date | null
  image: string | null
  role: string
  trustScore: number
  signupSource: string | null
  lastSeenAt: Date | null
  createdAt: Date
  updatedAt: Date
  [extra: string]: unknown
}

/** Strip credentials and normalise dates to ISO for the JSON file. */
export function exportProfile(user: ExportableUser): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(user)) {
    if ((NEVER_EXPORTED as readonly string[]).includes(key)) continue
    out[key] = value instanceof Date ? value.toISOString() : value
  }
  return out
}

/** RFC 6266 filename for the download, dated so repeat exports do not collide. */
export function exportFilename(userId: string, now = new Date()): string {
  const day = now.toISOString().slice(0, 10)
  const safeId = userId.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 24)
  return `sivrce-data-export-${safeId}-${day}.json`
}
