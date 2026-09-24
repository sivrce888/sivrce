import type { DashboardNavItem } from "@/components/dashboard/DashboardShell"
import { panelLang } from "@/lib/i18n/core"

const L = {
  ka: ["მიმოხილვა", "განცხადებები", "ლიდები", "ვიზიტები", "ღამეული", "პარამეტრები"],
  en: ["Overview", "Listings", "Leads", "Tours", "Stays", "Settings"],
  de: ["Überblick", "Inserate", "Anfragen", "Besichtigungen", "Übernachtungen", "Einstellungen"],
} as const

export function sellerNav(lang = "ka"): DashboardNavItem[] {
  const t = L[panelLang(lang)]
  return [
    { href: "/seller", label: t[0] },
    { href: "/seller/listings", label: t[1] },
    { href: "/seller/leads", label: t[2] },
    { href: "/seller/tours", label: t[3] },
    { href: "/seller/stays", label: t[4] },
    { href: "/settings", label: t[5] },
  ]
}
