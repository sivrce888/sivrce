import type { DashboardNavItem } from "@/components/dashboard/DashboardShell"
import { AGENCY_NAV } from "@/components/agency-dashboard/nav"
import { agentNav } from "@/components/agent-dashboard/nav"
import { developerNav } from "@/components/developer-dashboard/nav"
import { sellerNav } from "@/components/seller-dashboard/nav"
import { dashboardPathFor } from "@/lib/guards"
import { panelTitle, type Persona } from "@/lib/workspace"
import type { UserRole } from "@/generated/prisma/client"

const BUYER_L = {
  ka: ["მიმოხილვა", "ფავორიტები", "შედარება", "პარამეტრები"],
  en: ["Overview", "Favorites", "Compare", "Settings"],
  de: ["Überblick", "Favoriten", "Vergleich", "Einstellungen"],
} as const

export function buyerNav(lang = "ka"): DashboardNavItem[] {
  const t = BUYER_L[lang === "en" ? "en" : lang === "de" ? "de" : "ka"]
  return [
    { href: "/account", label: t[0] },
    { href: "/favorites", label: t[1] },
    { href: "/compare", label: t[2] },
    { href: "/settings", label: t[3] },
  ]
}

const ADMIN_L = { ka: ["ადმინი", "პარამეტრები"], en: ["Admin", "Settings"], de: ["Admin", "Einstellungen"] } as const

function adminNav(lang = "ka"): DashboardNavItem[] {
  const t = ADMIN_L[lang === "en" ? "en" : lang === "de" ? "de" : "ka"]
  return [
    { href: "/admin", label: t[0] },
    { href: "/settings", label: t[1] },
  ]
}

/** Role-aware sidebar for the shared /settings page. */
export function settingsNavFor(role: UserRole, lang: string): DashboardNavItem[] {
  switch (role) {
    case "developer":
      return developerNav(lang)
    case "agent":
      return agentNav(lang)
    case "agency":
      return AGENCY_NAV(lang)
    case "seller":
      return sellerNav(lang)
    case "admin":
      return adminNav(lang)
    case "buyer":
      return buyerNav(lang)
    default: {
      const _exhaustive: never = role
      return _exhaustive
    }
  }
}

export function settingsTitleFor(role: UserRole, persona?: Persona, lang = "ka"): string {
  return panelTitle(persona ?? role, lang)
}

export { dashboardPathFor }
