/**
 * Stateless guest cancel capability — HMAC over the booking id.
 * Anonymous bookings have no session; the token handed back at create time is
 * the guest's proof of ownership for cancelling that one booking. Server-only
 * (node:crypto) — never import from client code; bookings.ts must stay
 * client-safe (StayBooker imports quoteStay from it).
 * ponytail: single-purpose token, no expiry — cancelling is low-stakes and
 * idempotent (illegal transitions throw). Add TTL if paid cancellations land.
 */

import { createHmac, timingSafeEqual } from "node:crypto"

const SECRET = () => process.env.AUTH_SECRET ?? "dev-insecure-stay-token"

export function createStayCancelToken(bookingId: string): string {
  return createHmac("sha256", SECRET()).update(`stay-cancel:${bookingId}`).digest("base64url")
}

export function verifyStayCancelToken(bookingId: string, token: unknown): boolean {
  if (typeof token !== "string" || token.length === 0 || token.length > 200) return false
  const expected = Buffer.from(createStayCancelToken(bookingId))
  const given = Buffer.from(token)
  return expected.length === given.length && timingSafeEqual(expected, given)
}

/** Short human reference — first 8 hex-ish chars of the uuid, uppercase. */
export function stayBookingRef(bookingId: string): string {
  return bookingId.replace(/-/g, "").slice(0, 8).toUpperCase()
}
