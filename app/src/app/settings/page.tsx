import type { Metadata } from "next"
import Link from "next/link"
import { Bell, LayoutDashboard, Mail, Shield } from "lucide-react"

import DashboardShell from "@/components/dashboard/DashboardShell"
import { toggleListingAlerts } from "@/app/settings/actions"
import {
  dashboardPathFor,
  settingsNavFor,
  settingsTitleFor,
} from "@/lib/dashboard-nav"
import { db } from "@/lib/db"
import { requireUser, safeQuery } from "@/lib/guards"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "პარამეტრები",
  robots: { index: false },
}

export default async function SettingsPage() {
  const user = await requireUser("/settings")
  const home = dashboardPathFor(user.role)

  const [alertSub, notifications] = await Promise.all([
    safeQuery(
      () =>
        db.listingAlertSubscription.findFirst({
          where: { email: user.email },
          orderBy: { createdAt: "desc" },
        }),
      null,
    ),
    safeQuery(
      () =>
        db.notification.findMany({
          where: { userId: user.id },
          orderBy: { createdAt: "desc" },
          take: 8,
        }),
      [],
    ),
  ])

  const alertsOn = Boolean(alertSub && !alertSub.unsubscribedAt)

  return (
    <DashboardShell
      nav={settingsNavFor(user.role)}
      title={settingsTitleFor(user.role)}
      subtitle="პარამეტრები"
      userLabel={user.name ?? user.email}
    >
      <h1 className="mb-6 text-[22px] font-black tracking-tight text-sv-ink">პარამეტრები</h1>

      <div className="grid gap-5">
        <section className="rounded-card border border-sv-ink/6 bg-sv-surface p-6 shadow-card">
          <div className="flex items-start gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-module bg-sv-blue/10 text-sv-blue">
              <Shield size={18} aria-hidden />
            </span>
            <div className="min-w-0 flex-1">
              <h2 className="text-[15px] font-extrabold text-sv-ink">ანგარიში</h2>
              <p className="mt-1 text-[13px] font-medium text-sv-ink/55">
                {user.name ?? "სახელი არ არის მითითებული"} · {user.email}
              </p>
              <p className="mt-2 inline-flex rounded-full bg-sv-blue/10 px-3 py-1 text-[11.5px] font-bold text-sv-blue">
                როლი: {user.role}
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-card border border-sv-ink/6 bg-sv-surface p-6 shadow-card">
          <div className="flex items-start gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-module bg-sv-blue/10 text-sv-blue">
              <LayoutDashboard size={18} aria-hidden />
            </span>
            <div className="min-w-0 flex-1">
              <h2 className="text-[15px] font-extrabold text-sv-ink">შენი სივრცე</h2>
              <p className="mt-1 text-[13px] font-medium text-sv-ink/55">
                გადადი შენი როლის პანელზე — განცხადებები, ლიდები და ანალიტიკა ერთ ადგილას.
              </p>
              <Link
                href={home}
                className="mt-4 inline-flex rounded-full bg-sv-blue px-5 py-2.5 text-[13px] font-bold text-white transition hover:bg-sv-blue-deep"
              >
                პანელის გახსნა
              </Link>
            </div>
          </div>
        </section>

        <section className="rounded-card border border-sv-ink/6 bg-sv-surface p-6 shadow-card">
          <div className="flex items-start gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-module bg-sv-orange/10 text-sv-orange">
              <Mail size={18} aria-hidden />
            </span>
            <div className="min-w-0 flex-1">
              <h2 className="text-[15px] font-extrabold text-sv-ink">ელფოსტის შეტყობინებები</h2>
              <p className="mt-1 text-[13px] font-medium text-sv-ink/55">
                ახალი განცხადებების ალერტები შენს ელფოსტაზე — Korter-ის სტილის შეტყობინებები, sivrce-ს
                სიმშვიდით.
              </p>
              <form action={toggleListingAlerts} className="mt-4">
                <input type="hidden" name="enabled" value={alertsOn ? "0" : "1"} />
                <button
                  type="submit"
                  className={`rounded-full px-5 py-2.5 text-[13px] font-bold transition ${
                    alertsOn
                      ? "border border-sv-ink/12 text-sv-ink/70 hover:border-sv-blue hover:text-sv-blue"
                      : "bg-sv-orange text-white shadow-glow-orange hover:opacity-95"
                  }`}
                >
                  {alertsOn ? "გამორთვა" : "ჩართვა"}
                </button>
              </form>
            </div>
          </div>
        </section>

        <section className="rounded-card border border-sv-ink/6 bg-sv-surface p-6 shadow-card">
          <div className="mb-4 flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-module bg-sv-blue/10 text-sv-blue">
              <Bell size={18} aria-hidden />
            </span>
            <h2 className="text-[15px] font-extrabold text-sv-ink">ბოლო შეტყობინებები</h2>
          </div>
          {notifications.length === 0 ? (
            <p className="text-[13px] font-medium text-sv-ink/50">
              შეტყობინებები ჯერ არ გაქვს — აქ გამოჩნდება ლიდები, ვიზიტები და სისტემური განახლებები.
            </p>
          ) : (
            <ul className="divide-y divide-sv-ink/6">
              {notifications.map((n) => (
                <li key={n.id} className="py-3">
                  <p className="text-[13.5px] font-bold text-sv-ink">{n.title}</p>
                  {n.body ? (
                    <p className="mt-0.5 line-clamp-2 text-[12.5px] font-medium text-sv-ink/55">
                      {n.body}
                    </p>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </DashboardShell>
  )
}
