import type { DashboardNavItem } from "@/components/dashboard/DashboardShell"
import type { CrmLeadStatus, ListingStatus } from "@/generated/prisma/client"

/** Shared sidebar nav for every /agency page. */
export const AGENCY_NAV: DashboardNavItem[] = [
  { href: "/agency", label: "მიმოხილვა" },
  { href: "/agency/listings", label: "განცხადებები" },
  { href: "/agency/leads", label: "ლიდები" },
  { href: "/agency/tours", label: "ვიზიტები" },
  { href: "/agency/team", label: "გუნდი" },
  { href: "/agency/analytics", label: "ანალიტიკა" },
  { href: "/agency/profile", label: "პროფილი" },
  { href: "/settings", label: "პარამეტრები" },
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
  contacted: "დაკავშირებული",
  viewing_scheduled: "ვიზიტი დაგეგმილი",
  offer_made: "შეთავაზება გაკეთდა",
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
