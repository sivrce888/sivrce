import Link from "next/link"
import type { ReactNode } from "react"

import { signOut } from "@/auth"
import { LogoMark } from "@/components/Logo"

export interface DashboardNavItem {
  href: string
  label: string
}

interface DashboardShellProps {
  /** Sidebar/nav links for this role area. */
  nav: DashboardNavItem[]
  /** Georgian area title, e.g. "აგენტის პანელი". */
  title: string
  subtitle?: string
  userLabel: string
  children: ReactNode
}

/**
 * Shared role-dashboard chrome: top bar (logo · area title · user · sign-out)
 * + sidebar nav on desktop, horizontal scroll nav on mobile. Server component.
 */
export default function DashboardShell({
  nav,
  title,
  subtitle,
  userLabel,
  children,
}: DashboardShellProps) {
  return (
    <div className="min-h-screen bg-sv-cloud/40">
      <header className="sticky top-0 z-40 border-b border-sv-ink/8 bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-5">
          <Link href="/" className="group flex items-center gap-2.5" aria-label="sivrce — მთავარი">
            <LogoMark size={30} />
            <span className="text-[17px] font-black tracking-tight text-sv-ink">sivrce</span>
          </Link>
          <span className="hidden h-5 w-px bg-sv-ink/10 sm:block" />
          <div className="min-w-0">
            <p className="truncate text-[14px] font-extrabold text-sv-ink">{title}</p>
            {subtitle ? (
              <p className="truncate text-[11px] font-medium text-sv-ink/50">{subtitle}</p>
            ) : null}
          </div>
          <div className="ml-auto flex items-center gap-3">
            <span className="hidden max-w-48 truncate text-[12px] font-semibold text-sv-ink/60 md:block">
              {userLabel}
            </span>
            <form
              action={async () => {
                "use server"
                await signOut({ redirectTo: "/" })
              }}
            >
              <button
                type="submit"
                className="rounded-full border border-sv-ink/12 px-4 py-2 text-[12px] font-bold text-sv-ink/70 transition hover:border-sv-blue hover:text-sv-blue"
              >
                გასვლა
              </button>
            </form>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-7xl gap-8 px-5 py-8">
        <aside className="hidden w-52 shrink-0 lg:block">
          <nav className="sticky top-24 flex flex-col gap-1" aria-label={title}>
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-xl px-4 py-2.5 text-[13.5px] font-bold text-sv-ink/65 transition hover:bg-white hover:text-sv-ink hover:shadow-sm"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </aside>

        <main className="min-w-0 flex-1">
          <nav
            className="mb-6 flex gap-2 overflow-x-auto pb-1 lg:hidden"
            aria-label={title}
          >
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="shrink-0 rounded-full bg-white px-4 py-2 text-[12.5px] font-bold text-sv-ink/70 shadow-sm"
              >
                {item.label}
              </Link>
            ))}
          </nav>
          {children}
        </main>
      </div>
    </div>
  )
}
