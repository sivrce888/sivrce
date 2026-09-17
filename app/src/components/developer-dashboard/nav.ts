import type { DashboardNavItem } from "@/components/dashboard/DashboardShell"

const L = {
  ka: {
    overview: "მიმოხილვა",
    projects: "პროექტები",
    listings: "განცხადებები",
    leads: "ლიდები",
    tours: "ვიზიტები",
    analytics: "ანალიტიკა",
    profile: "პროფილი",
    settings: "პარამეტრები",
  },
  en: {
    overview: "Overview",
    projects: "Projects",
    listings: "Listings",
    leads: "Leads",
    tours: "Tours",
    analytics: "Analytics",
    profile: "Profile",
    settings: "Settings",
  },
  de: {
    overview: "Übersicht",
    projects: "Projekte",
    listings: "Inserate",
    leads: "Leads",
    tours: "Besichtigungen",
    analytics: "Analysen",
    profile: "Profil",
    settings: "Einstellungen",
  },
} as const

type Loc = keyof typeof L

export function developerNav(lang: string): DashboardNavItem[] {
  const loc: Loc = lang === "en" ? "en" : lang === "de" ? "de" : "ka"
  const s = L[loc]
  return [
    { href: "/developer", label: s.overview },
    { href: "/developer/projects", label: s.projects },
    { href: "/developer/listings", label: s.listings },
    { href: "/developer/leads", label: s.leads },
    { href: "/developer/tours", label: s.tours },
    { href: "/developer/analytics", label: s.analytics },
    { href: "/developer/profile", label: s.profile },
    { href: "/settings", label: s.settings },
  ]
}
