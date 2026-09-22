/**
 * SIVRCE — Real Estate Deal OS & Pro Leads Pipeline.
 * Manages seller, agency, and developer deal workflows from inquiry to notary closing.
 *
 * Database model: `Inquiry` (Postgres enum `new`, `contacted`, `qualified`, `closed`).
 * Extended Deal OS adds workflow stages, viewing scheduling, and commission pipeline forecasting.
 */
import type { Prisma } from "@/generated/prisma/client"

/**
 * Lead pipeline vocabulary, shared by owner inboxes and the Sivrce staff
 * inbox. "closed" is kept as a legacy alias of "won" — rows written before
 * the Deal OS keep rendering correctly.
 */
export const INQUIRY_STATUSES = [
  "new",
  "contacted",
  "qualified",
  "matching",
  "viewing",
  "negotiating",
  "won",
  "closed",
  "lost",
  "inactive",
] as const
export type InquiryStatus = (typeof INQUIRY_STATUSES)[number]

export const INQUIRY_STATUS_KA: Record<InquiryStatus, string> = {
  new: "ახალი",
  contacted: "დაკავშირებული",
  qualified: "კვალიფიცირებული",
  matching: "შერჩევა",
  viewing: "ნახვა",
  negotiating: "მოლაპარაკება",
  won: "გაყიდული",
  closed: "დახურული",
  lost: "დაკარგული",
  inactive: "პასიური",
}

export const INQUIRY_STATUS_EN: Record<InquiryStatus, string> = {
  new: "New",
  contacted: "Contacted",
  qualified: "Qualified",
  matching: "Matching",
  viewing: "Viewing",
  negotiating: "Negotiating",
  won: "Won",
  closed: "Closed / Won",
  lost: "Lost",
  inactive: "Inactive",
}

/** Stages where the deal is still alive — the "open leads" filters. */
export const OPEN_INQUIRY_STATUSES: readonly InquiryStatus[] = [
  "new",
  "contacted",
  "qualified",
  "matching",
  "viewing",
  "negotiating",
]

export function isOpenInquiryStatus(v: string): boolean {
  return OPEN_INQUIRY_STATUSES.includes(v as InquiryStatus)
}

/** Legacy alias normalization for display/stats: closed ≡ won. */
export function normalizeInquiryStatus(v: string): InquiryStatus {
  return v === "closed" ? "won" : isInquiryStatus(v) ? v : "new"
}

export function isInquiryStatus(value: string): value is InquiryStatus {
  return (INQUIRY_STATUSES as readonly string[]).includes(value)
}

/** Extended 6-stage Deal Pipeline for real estate professionals. */
export const DEAL_PIPELINE_STAGES = [
  "new_inquiry",
  "contacted",
  "tour_scheduled",
  "offer_negotiation",
  "notary_underwriting",
  "closed_won",
] as const

export type DealPipelineStage = (typeof DEAL_PIPELINE_STAGES)[number]

export interface DealStageMeta {
  id: DealPipelineStage
  labelKa: string
  labelEn: string
  labelDe: string
  color: string
  probability: number
}

export const DEAL_STAGES_CONFIG: Record<DealPipelineStage, DealStageMeta> = {
  new_inquiry: {
    id: "new_inquiry",
    labelKa: "ახალი ლიდი",
    labelEn: "New Lead",
    labelDe: "Neue Anfrage",
    color: "#2E6BFF",
    probability: 0.1,
  },
  contacted: {
    id: "contacted",
    labelKa: "კომუნიკაციაში",
    labelEn: "In Contact",
    labelDe: "Erstkontakt",
    color: "#38BDF8",
    probability: 0.25,
  },
  tour_scheduled: {
    id: "tour_scheduled",
    labelKa: "დანიშნული ვიზიტი",
    labelEn: "Tour Scheduled",
    labelDe: "Besichtigung",
    color: "#FF6A2D",
    probability: 0.5,
  },
  offer_negotiation: {
    id: "offer_negotiation",
    labelKa: "შეთავაზება / მოლაპარაკება",
    labelEn: "Offer & Negotiation",
    labelDe: "Kaufangebot",
    color: "#A855F7",
    probability: 0.75,
  },
  notary_underwriting: {
    id: "notary_underwriting",
    labelKa: "ნოტარიუსი / იპოთეკა",
    labelEn: "Notary Due Diligence",
    labelDe: "Notarielle Abwicklung",
    color: "#F59E0B",
    probability: 0.9,
  },
  closed_won: {
    id: "closed_won",
    labelKa: "წარმატებით დასრულებული",
    labelEn: "Closed / Won",
    labelDe: "Abgeschlossen",
    color: "#10B981",
    probability: 1.0,
  },
}

/** Roles that own Inquiry rows and may change status. Buyer/tenant cannot. */
export function canWorkLeads(role: string): boolean {
  return (
    role === "agent" ||
    role === "agency" ||
    role === "seller" ||
    role === "developer" ||
    role === "admin"
  )
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
  const name = buyerName.trim()
  const about = listingTitle?.trim() ? ` — ${listingTitle.trim()}` : ""
  return `გამარჯობა${name ? ` ${name}` : ""}, sivrce.ge-დან გიპასუხებთ${about}.`
}

/** Agency may edit teammate listings; agents only own; admin always. Catalog rows may have null owner. */
export function listingManageRule(
  user: { id: string; role: string },
  listingOwnerId: string | null,
  teammate: boolean,
): boolean {
  if (user.role === "admin") return true
  if (listingOwnerId && listingOwnerId === user.id) return true
  return user.role === "agency" && teammate
}

/** Forecast deal commission and weighted pipeline volume. */
export function forecastDealVolume(
  deals: Array<{ valueUSD: number; stage: DealPipelineStage }>,
  commissionPct = 0.03,
): { grossVolumeUSD: number; weightedPipelineUSD: number; expectedCommissionUSD: number } {
  let gross = 0
  let weighted = 0
  for (const d of deals) {
    gross += d.valueUSD
    const prob = DEAL_STAGES_CONFIG[d.stage]?.probability ?? 0.1
    weighted += d.valueUSD * prob
  }
  return {
    grossVolumeUSD: Math.round(gross),
    weightedPipelineUSD: Math.round(weighted),
    expectedCommissionUSD: Math.round(weighted * commissionPct),
  }
}
