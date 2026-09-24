import type { DashboardNavItem } from "@/components/dashboard/DashboardShell"
import type { CrmLeadStatus, ListingStatus } from "@/generated/prisma/client"
import { panelLang } from "@/lib/i18n/core"

const NAV_L = {
  ka: {
    overview: "მიმოხილვა",
    listings: "განცხადებები",
    leads: "ლიდები",
    tours: "ვიზიტები",
    team: "გუნდი",
    analytics: "ანალიტიკა",
    profile: "პროფილი",
    settings: "პარამეტრები",
  },
  en: {
    overview: "Overview",
    listings: "Listings",
    leads: "Leads",
    tours: "Tours",
    team: "Team",
    analytics: "Analytics",
    profile: "Profile",
    settings: "Settings",
  },
  de: {
    overview: "Übersicht",
    listings: "Inserate",
    leads: "Leads",
    tours: "Besichtigungen",
    team: "Team",
    analytics: "Analysen",
    profile: "Profil",
    settings: "Einstellungen",
  },
} as const

type Loc = keyof typeof NAV_L

function locOf(lang: string): Loc {
  return panelLang(lang)
}

/** Shared sidebar nav for every /agency page. */
export function AGENCY_NAV(lang: string): DashboardNavItem[] {
  const s = NAV_L[locOf(lang)]
  return [
    { href: "/agency", label: s.overview },
    { href: "/agency/listings", label: s.listings },
    { href: "/agency/leads", label: s.leads },
    { href: "/agency/tours", label: s.tours },
    { href: "/agency/team", label: s.team },
    { href: "/agency/analytics", label: s.analytics },
    { href: "/agency/profile", label: s.profile },
    { href: "/settings", label: s.settings },
  ]
}

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

const LEAD_L = {
  ka: {
    new: "ახალი",
    contacted: "დაკავშირებული",
    viewing_scheduled: "ვიზიტი დაგეგმილი",
    offer_made: "შეთავაზება გაკეთდა",
    negotiating: "მოლაპარაკება",
    closed_won: "მოგებული",
    closed_lost: "წაგებული",
    disqualified: "დისკვალიფიცირებული",
  },
  en: {
    new: "New",
    contacted: "Contacted",
    viewing_scheduled: "Viewing scheduled",
    offer_made: "Offer made",
    negotiating: "Negotiating",
    closed_won: "Won",
    closed_lost: "Lost",
    disqualified: "Disqualified",
  },
  de: {
    new: "Neu",
    contacted: "Kontaktiert",
    viewing_scheduled: "Besichtigung geplant",
    offer_made: "Angebot unterbreitet",
    negotiating: "Verhandlung",
    closed_won: "Gewonnen",
    closed_lost: "Verloren",
    disqualified: "Disqualifiziert",
  },
} as const

export function leadStatusLabels(lang: string): Record<CrmLeadStatus, string> {
  return LEAD_L[locOf(lang)]
}

const LISTING_L = {
  ka: {
    active: "აქტიური",
    sold: "გაყიდული",
    pending: "მოლოდინში",
    expired: "ვადაგასული",
    withdrawn: "მოხსნილი",
  },
  en: {
    active: "Active",
    sold: "Sold",
    pending: "Pending",
    expired: "Expired",
    withdrawn: "Withdrawn",
  },
  de: {
    active: "Aktiv",
    sold: "Verkauft",
    pending: "Ausstehend",
    expired: "Abgelaufen",
    withdrawn: "Zurückgezogen",
  },
} as const

export function listingStatusLabels(lang: string): Record<ListingStatus, string> {
  return LISTING_L[locOf(lang)]
}
