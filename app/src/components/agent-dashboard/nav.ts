import type { DashboardNavItem } from "@/components/dashboard/DashboardShell"
import { panelLang } from "@/lib/i18n/core"

const L = {
  ka: {
    overview: "მიმოხილვა",
    listings: "განცხადებები",
    leads: "ლიდები",
    tours: "ვიზიტები",
    analytics: "ანალიტიკა",
    profile: "პროფილი",
    settings: "პარამეტრები",
  },
  en: {
    overview: "Overview",
    listings: "Listings",
    leads: "Leads",
    tours: "Tours",
    analytics: "Analytics",
    profile: "Profile",
    settings: "Settings",
  },
  de: {
    overview: "Übersicht",
    listings: "Inserate",
    leads: "Leads",
    tours: "Besichtigungen",
    analytics: "Analysen",
    profile: "Profil",
    settings: "Einstellungen",
  },
} as const

type Loc = keyof typeof L

/** Shared sidebar nav for every /agent page. */
export function agentNav(lang: string): DashboardNavItem[] {
  const loc: Loc = panelLang(lang)
  const s = L[loc]
  return [
    { href: "/agent", label: s.overview },
    { href: "/agent/listings", label: s.listings },
    { href: "/agent/leads", label: s.leads },
    { href: "/agent/tours", label: s.tours },
    { href: "/agent/analytics", label: s.analytics },
    { href: "/agent/profile", label: s.profile },
    { href: "/settings", label: s.settings },
  ]
}
