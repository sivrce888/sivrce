/**
 * Chat → Inquiry gate (pure). First buyer message on a listing room becomes
 * a lead the owner already knows how to work (/leads inbox + email).
 * ponytail: no source column — 7-day email+listing dedupe lives in chat.ts.
 */

export function shouldRecordChatLead(p: {
  listingId: string | null | undefined
  ownerId: string | null | undefined
  senderId: string
  isFirstFromSender: boolean
}): boolean {
  return Boolean(
    p.listingId && p.ownerId && p.ownerId !== p.senderId && p.isFirstFromSender,
  )
}

/** Prisma ListingDealType → Inquiry.deal vocabulary. */
export function inquiryDealOf(deal: string): string {
  if (deal === "rent") return "rent"
  if (deal === "daily") return "daily"
  if (deal === "mortgage") return "pledge"
  return "buy"
}
