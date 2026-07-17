import type { Metadata } from "next"
import { ArrowUpRight, LogOut } from "lucide-react"
import Link from "next/link"

import { signOut } from "@/auth"
import { AdminNav } from "@/components/admin/shell/AdminNav"
import { requireAdmin } from "@/lib/admin/guard"

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s · Sivrce Admin" },
  robots: { index: false, follow: false },
}

export const dynamic = "force-dynamic"

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Trust boundary for the whole /admin tree — redirects when not an admin.
  const session = await requireAdmin()
  const name = session.user.name ?? session.user.email ?? "Admin"
  const initials = name
    .split(/\s+/)
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase()

  return (
    <div className="min-h-screen bg-sv-cloud text-sv-ink">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[264px] flex-col bg-sv-navy lg:flex">
        <div className="flex items-center gap-3 px-6 pt-7 pb-6">
          <div className="grid h-10 w-10 place-items-center rounded-[12px] bg-[linear-gradient(120deg,#8FB4FF_0%,#2E6BFF_55%,#7A5CFF_100%)] text-[16px] font-black text-white">
            ს
          </div>
          <div>
            <p className="text-[15px] leading-tight font-extrabold text-white">სივრცე</p>
            <p className="text-[10.5px] font-bold tracking-[0.16em] text-sv-blue-light/70 uppercase">
              Admin Console
            </p>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto pb-4">
          <AdminNav orientation="side" />
        </div>
        <div className="border-t border-white/8 p-4">
          <div className="flex items-center gap-3 px-2">
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white/10 text-[12px] font-extrabold text-white">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-bold text-white">{name}</p>
              <p className="text-[11px] font-semibold text-white/35">Administrator</p>
            </div>
            <form
              action={async () => {
                "use server"
                await signOut({ redirectTo: "/" })
              }}
            >
              <button
                type="submit"
                aria-label="Sign out"
                className="grid h-9 w-9 place-items-center rounded-[10px] text-white/40 transition-colors hover:bg-white/8 hover:text-white"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </form>
          </div>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="sticky top-0 z-40 border-b border-sv-ink/8 bg-white/90 backdrop-blur lg:hidden">
        <div className="flex items-center justify-between px-4 pt-3">
          <p className="text-[15px] font-extrabold text-sv-ink">
            სივრცე <span className="text-sv-ink/35">· Admin</span>
          </p>
          <Link
            href="/"
            className="flex items-center gap-1 text-[12.5px] font-bold text-sv-blue"
          >
            View site <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        <AdminNav orientation="top" />
      </div>

      <div className="lg:pl-[264px]">
        <header className="sticky top-0 z-30 hidden items-center justify-end gap-3 border-b border-sv-ink/6 bg-sv-cloud/85 px-8 py-3 backdrop-blur lg:flex">
          <Link
            href="/"
            className="flex items-center gap-1.5 rounded-full border border-sv-ink/10 bg-white px-4 py-2 text-[12.5px] font-bold text-sv-ink/70 transition-colors hover:border-sv-blue hover:text-sv-blue"
          >
            View site <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </header>
        <main className="mx-auto w-full max-w-[1240px] px-4 py-7 sm:px-7 lg:px-9">
          {children}
        </main>
      </div>
    </div>
  )
}
