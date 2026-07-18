"use client"

import LocalizedLink from "@/components/LocalizedLink"
import { usePathname } from "next/navigation"
import { stripLangPrefix } from "@/lib/i18n/core"

import type { DashboardNavItem } from "@/components/dashboard/DashboardShell"

function isActive(pathname: string, href: string): boolean {
  if (href === "/settings") return pathname === "/settings" || pathname.startsWith("/settings/")
  if (pathname === href) return true
  // Exact role roots only — avoid /developer matching /developer/projects as inactive sibling
  if (href.split("/").length === 2) return false
  return pathname.startsWith(`${href}/`)
}

export default function DashboardNav({
  nav,
  label,
  variant,
}: {
  nav: DashboardNavItem[]
  label: string
  variant: "side" | "mobile"
}) {
  const pathname = stripLangPrefix(usePathname())

  if (variant === "mobile") {
    return (
      <nav className="mb-6 flex gap-2 overflow-x-auto pb-1 lg:hidden" aria-label={label}>
        {nav.map((item) => {
          const active = isActive(pathname, item.href)
          return (
            <LocalizedLink
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`shrink-0 rounded-full px-4 py-2 text-[12.5px] font-bold shadow-soft transition ${
                active
                  ? "bg-sv-blue text-white"
                  : "bg-sv-surface text-sv-ink/70 hover:text-sv-ink"
              }`}
            >
              {item.label}
            </LocalizedLink>
          )
        })}
      </nav>
    )
  }

  return (
    <nav className="sticky top-24 flex flex-col gap-1" aria-label={label}>
      {nav.map((item) => {
        const active = isActive(pathname, item.href)
        return (
          <LocalizedLink
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={`rounded-control px-4 py-2.5 text-[13.5px] font-bold transition ${
              active
                ? "bg-sv-blue/10 text-sv-blue shadow-soft"
                : "text-sv-ink/65 hover:bg-sv-surface hover:text-sv-ink hover:shadow-soft"
            }`}
          >
            {item.label}
          </LocalizedLink>
        )
      })}
    </nav>
  )
}
