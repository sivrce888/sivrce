/**
 * Agent/agency money path = Inquiry (buyer form), not CrmLead (admin CRM).
 * ponytail: CrmLead stays for admin; wire it when agents type notes.
 */
import type { Prisma } from "@/generated/prisma/client"

export const INQUIRY_STATUSES = ["new", "contacted", "qualified", "closed"] as const
export type InquiryStatus = (typeof INQUIRY_STATUSES)[number]

export const INQUIRY_STATUS_KA: Record<InquiryStatus, string> = {
  new: "ახალი",
  contacted: "დაკავშირებული",
  qualified: "კვალიფიცირებული",
  closed: "დახურული",
}

export function isInquiryStatus(value: string): value is InquiryStatus {
  return (INQUIRY_STATUSES as readonly string[]).includes(value)
}

/** Own listings + inquiries addressed to this email. Empty ids still match email. */
export function inquiryWhere(listingIds: string[], email: string): Prisma.InquiryWhereInput {
  return {
    deletedAt: null,
    OR: [
      ...(listingIds.length > 0 ? [{ listingId: { in: listingIds } }] : []),
      { agentEmail: email },
    ],
  }
}

export function listingOwnerWhere(ownerIds: string[]): Prisma.ListingWhereInput {
  return { ownerId: { in: ownerIds }, deletedAt: null }
}

export function leadWaText(buyerName: string, listingTitle?: string): string {
  const name = buyerName.trim() || "თქვენ"
  const about = listingTitle?.trim() ? ` — ${listingTitle.trim()}` : ""
  return `გამარჯობა ${name}, სივრცე.ge-დან გიპასუხებთ${about}.`
}

/** Agency may edit teammate listings; agents only own; admin always. */
export function listingManageRule(
  user: { id: string; role: string },
  listingOwnerId: string,
  teammate: boolean,
): boolean {
  if (listingOwnerId === user.id || user.role === "admin") return true
  return user.role === "agency" && teammate
}
