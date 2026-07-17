import type { DashboardNavItem } from "@/components/dashboard/DashboardShell"
import { AGENCY_NAV } from "@/components/agency-dashboard/nav"
import { agentNav } from "@/components/agent-dashboard/nav"
import { developerNav } from "@/components/developer-dashboard/nav"
import { sellerNav } from "@/components/seller-dashboard/nav"
import { dashboardPathFor } from "@/lib/guards"
import type { UserRole } from "@/generated/prisma/client"

const buyerNav: DashboardNavItem[] = [
  { href: "/account", label: "ანგარიში" },
  { href: "/settings", label: "პარამეტრები" },
]

const adminNav: DashboardNavItem[] = [
  { href: "/admin", label: "ადმინი" },
  { href: "/settings", label: "პარამეტრები" },
]

/** Role-aware sidebar for the shared /settings page. */
export function settingsNavFor(role: UserRole): DashboardNavItem[] {
  switch (role) {
    case "developer":
      return developerNav
    case "agent":
      return agentNav
    case "agency":
      return AGENCY_NAV
    case "seller":
      return sellerNav
    case "admin":
      return adminNav
    case "buyer":
      return buyerNav
    default: {
      const _exhaustive: never = role
      return _exhaustive
    }
  }
}

export function settingsTitleFor(role: UserRole): string {
  switch (role) {
    case "developer":
      return "დეველოპერის პანელი"
    case "agent":
      return "აგენტის პანელი"
    case "agency":
      return "სააგენტოს პანელი"
    case "seller":
      return "გამყიდველის პანელი"
    case "admin":
      return "ადმინ პანელი"
    case "buyer":
      return "ჩემი სივრცე"
    default: {
      const _exhaustive: never = role
      return _exhaustive
    }
  }
}

export { dashboardPathFor }
