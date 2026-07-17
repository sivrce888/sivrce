import type { DashboardNavItem } from "@/components/dashboard/DashboardShell"
import type { CrmLeadStatus, ListingDealType, ListingStatus } from "@/generated/prisma/client"

/** Shared sidebar nav for every /agency page. */
export const AGENCY_NAV: DashboardNavItem[] = [
  { href: "/agency", label: "მთავარი" },
  { href: "/agency/listings", label: "განცხადებები" },
  { href: "/agency/leads", label: "ლიდები" },
  { href: "/agency/team", label: "გუნდი" },
  { href: "/agency/analytics", label: "ანალიტიკა" },
]

export const LEAD_STATUS_ORDER: CrmLeadStatus[] = [
  "new",
  "contacted",
  "viewing_scheduled",
  "offer_made",
  "negotiating",
  "closed_won",
  "closed_lost",
  "disqualified",
]

export const LEAD_STATUS_LABELS: Record<CrmLeadStatus, string> = {
  new: "ახალი",
  contacted: "კონტაქტი",
  viewing_scheduled: "ვიზიტი დაგეგმილი",
  offer_made: "შეთავაზება",
  negotiating: "მოლაპარაკება",
  closed_won: "მოგებული",
  closed_lost: "წაგებული",
  disqualified: "დისკვალიფიცირებული",
}

export const LISTING_STATUS_LABELS: Record<ListingStatus, string> = {
  active: "აქტიური",
  sold: "გაყიდული",
  pending: "მოლოდინში",
  expired: "ვადაგასული",
  withdrawn: "მოხსნილი",
}

export const LISTING_STATUS_CLASSES: Record<ListingStatus, string> = {
  active: "bg-emerald-50 text-emerald-700",
  sold: "bg-sv-blue/10 text-sv-blue",
  pending: "bg-amber-50 text-amber-700",
  expired: "bg-sv-ink/6 text-sv-ink/55",
  withdrawn: "bg-red-50 text-red-600",
}

export const DEAL_TYPE_LABELS: Record<ListingDealType, string> = {
  buy: "იყიდება",
  rent: "ქირავდება",
  daily: "დღიურად",
  mortgage: "იპოთეკა",
}

const CURRENCY_SYMBOLS: Record<string, string> = { GEL: "₾", USD: "$", EUR: "€" }

export function formatPrice(price: number, currency: string): string {
  return `${price.toLocaleString("en-US")} ${CURRENCY_SYMBOLS[currency] ?? currency}`
}
