"use client"

import {
  BadgeCheck,
  Building2,
  CalendarCheck,
  CreditCard,
  Gavel,
  Inbox,
  KanbanSquare,
  LayoutDashboard,
  Newspaper,
  Settings2,
  ShieldCheck,
  Users,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

interface NavItem {
  href: string
  label: string
  icon: LucideIcon
  exact?: boolean
}

interface NavSection {
  label: string
  items: NavItem[]
}

/**
 * Fixed admin route map — section routes are owned by feature workers but the
 * paths are locked here so nav never drifts.
 */
export const ADMIN_SECTIONS: NavSection[] = [
  {
    label: "Overview",
    items: [{ href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true }],
  },
  {
    label: "Operations",
    items: [
      { href: "/admin/listings", label: "Listings", icon: Building2 },
      { href: "/admin/moderation", label: "Moderation", icon: ShieldCheck },
      { href: "/admin/inquiries", label: "Inquiries", icon: Inbox },
      { href: "/admin/tours", label: "Tours", icon: CalendarCheck },
    ],
  },
  {
    label: "People",
    items: [
      { href: "/admin/users", label: "Users", icon: Users },
      { href: "/admin/professionals", label: "Professionals", icon: BadgeCheck },
      { href: "/admin/crm", label: "CRM", icon: KanbanSquare },
    ],
  },
  {
    label: "Money",
    items: [
      { href: "/admin/auctions", label: "Auctions", icon: Gavel },
      { href: "/admin/payments", label: "Payments", icon: CreditCard },
    ],
  },
  {
    label: "Platform",
    items: [
      { href: "/admin/content", label: "Content", icon: Newspaper },
      { href: "/admin/system", label: "System", icon: Settings2 },
    ],
  },
]

function isActive(pathname: string, href: string, exact?: boolean) {
  return exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`)
}

export function AdminNav({ orientation }: { orientation: "side" | "top" }) {
  const pathname = usePathname()

  if (orientation === "top") {
    // Mobile: single horizontal scroll strip of all items.
    return (
      <nav aria-label="Admin" className="flex gap-1 overflow-x-auto px-3 py-2">
        {ADMIN_SECTIONS.flatMap((s) => s.items).map((item) => {
          const active = isActive(pathname, item.href, "exact" in item && item.exact)
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`flex items-center gap-1.5 rounded-full px-3.5 py-2 text-[13px] font-bold whitespace-nowrap transition-colors ${
                active ? "bg-sv-navy text-white" : "text-sv-ink/55 hover:bg-sv-ink/5"
              }`}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          )
        })}
      </nav>
    )
  }

  return (
    <nav aria-label="Admin" className="flex flex-col gap-5 px-3">
      {ADMIN_SECTIONS.map((section) => (
        <div key={section.label}>
          <p className="px-3 pb-1.5 text-[10.5px] font-extrabold tracking-[0.14em] text-white/30 uppercase">
            {section.label}
          </p>
          <ul className="flex flex-col gap-0.5">
            {section.items.map((item) => {
              const active = isActive(pathname, item.href, "exact" in item && item.exact)
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={`group flex items-center gap-3 rounded-[12px] px-3 py-2.5 text-[13.5px] font-bold transition-all focus-visible:ring-2 focus-visible:ring-sv-blue-light focus-visible:outline-none ${
                      active
                        ? "bg-white/10 text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)]"
                        : "text-white/50 hover:bg-white/5 hover:text-white/85"
                    }`}
                  >
                    <item.icon
                      className={`h-[17px] w-[17px] transition-colors ${
                        active ? "text-sv-blue-light" : "text-white/35 group-hover:text-white/60"
                      }`}
                    />
                    {item.label}
                    {active ? <span className="ml-auto h-1.5 w-1.5 rounded-full bg-sv-blue-light" /> : null}
                  </Link>
                </li>
              )
            })}
          </ul>
        </div>
      ))}
    </nav>
  )
}
