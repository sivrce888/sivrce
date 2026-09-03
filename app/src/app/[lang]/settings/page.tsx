import type { Metadata } from "next"
import Link from "next/link"
import {
  ArrowLeftRight,
  Bell,
  BellRing,
  Heart,
  LayoutDashboard,
  Mail,
  UserCog,
} from "lucide-react"

import { toggleListingAlerts } from "@/app/[lang]/settings/actions"
import { PasskeysCard } from "@/components/auth/PasskeysCard"
import DashboardShell from "@/components/dashboard/DashboardShell"
import { PushToggle } from "@/components/push/PushToggle"
import { AccountForms } from "@/components/settings/AccountForms"
import { LiteModeToggle } from "@/components/settings/LiteModeToggle"
import { RolePicker } from "@/components/settings/RolePicker"
import { isValidLang } from "@/lib/i18n/core"
import { getServerT } from "@/lib/i18n/server"
import {
  dashboardPathFor,
  settingsNavFor,
  settingsTitleFor,
} from "@/lib/dashboard-nav"
import { db } from "@/lib/db"
import { displayFromEmail, isPhoneEmail } from "@/lib/auth-phone"
import { requireUser, safeQuery } from "@/lib/guards"
import { parsePersonaIntent } from "@/lib/workspace"
import { readPersona } from "@/lib/workspace-cookie"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "პარამეტრები",
  robots: { index: false },
}

export default async function SettingsPage({
  params,
  searchParams,
}: {
  params: Promise<{ lang: string }>
  searchParams: Promise<{ intent?: string }>
}) {
  const { lang: raw } = await params
  const { intent: rawIntent } = await searchParams
  const intent = parsePersonaIntent(rawIntent)
  const t = getServerT(isValidLang(raw) ? raw : "ka")
  const user = await requireUser("/settings")
  const persona = await readPersona(user.role)
  const home = dashboardPathFor(user.role)

  const [alertSub, notifications, passkeys, me] = await Promise.all([
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
    safeQuery(
      () =>
        db.authenticator.findMany({
          where: { userId: user.id },
          select: {
            credentialID: true,
            credentialDeviceType: true,
            credentialBackedUp: true,
          },
        }),
        [],
      ),
    safeQuery(
      () =>
        db.user.findUnique({
          where: { id: user.id },
          select: {
            name: true,
            email: true,
            phone: true,
            passwordHash: true,
          },
        }),
      null,
    ),
  ])

  const alertsOn = Boolean(alertSub && !alertSub.unsubscribedAt)

  return (
    <DashboardShell
      nav={settingsNavFor(user.role)}
      title={settingsTitleFor(user.role, persona)}
      subtitle="პარამეტრები"
      userLabel={user.name ?? user.email}
    >
      <h1 className="mb-6 text-[22px] font-black tracking-tight text-sv-ink">პარამეტრები</h1>

      <div className="grid gap-5">
        <AccountForms
          name={me?.name ?? user.name ?? ""}
          email={isPhoneEmail(user.email) ? "" : user.email}
          phone={me?.phone ?? (isPhoneEmail(user.email) ? displayFromEmail(user.email) : "")}
          hasPassword={Boolean(me?.passwordHash)}
          isPhoneAccount={isPhoneEmail(user.email)}
        />

        <PasskeysCard keys={passkeys} />

        <LiteModeToggle />

        {user.role !== "admin" ? (
          <section className="rounded-card border border-sv-ink/6 bg-sv-surface p-6 shadow-card">
            <div className="mb-4 flex items-start gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-module bg-sv-blue/10 text-sv-blue">
                <UserCog size={18} aria-hidden />
              </span>
              <div>
                <h2 className="text-[15px] font-extrabold text-sv-ink">პროფილის ტიპი</h2>
                <p className="mt-1 text-[13px] font-medium text-sv-ink/55">
                  ნაგულისხმევი მყიდველია. გამქირავებელი და გამყიდველი ერთ ანგარიშზეა — განცხადების ტიპი განასხვავებს.
                </p>
              </div>
            </div>

            <RolePicker
              currentPersona={persona}
              intent={intent}
              compact
            />
          </section>
        ) : null}

        <section className="rounded-card border border-sv-ink/6 bg-sv-surface p-6 shadow-card">
          <div className="flex items-start gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-module bg-sv-blue/10 text-sv-blue">
              <LayoutDashboard size={18} aria-hidden />
            </span>
            <div className="min-w-0 flex-1">
              <h2 className="text-[15px] font-extrabold text-sv-ink">შენი სივრცე</h2>
              <p className="mt-1 text-[13px] font-medium text-sv-ink/55">
                ფავორიტები, შედარება, განცხადებები — ერთ ადგილას.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Link
                  href="/account"
                  className="inline-flex items-center gap-1.5 rounded-full border border-sv-ink/12 px-4 py-2 text-[12.5px] font-bold text-sv-ink/70 transition hover:border-sv-blue hover:text-sv-blue"
                >
                  ანგარიში
                </Link>
                <Link
                  href="/favorites"
                  className="inline-flex items-center gap-1.5 rounded-full border border-sv-ink/12 px-4 py-2 text-[12.5px] font-bold text-sv-ink/70 transition hover:border-sv-blue hover:text-sv-blue"
                >
                  <Heart size={13} aria-hidden />
                  ფავორიტები
                </Link>
                <Link
                  href="/compare"
                  className="inline-flex items-center gap-1.5 rounded-full border border-sv-ink/12 px-4 py-2 text-[12.5px] font-bold text-sv-ink/70 transition hover:border-sv-blue hover:text-sv-blue"
                >
                  <ArrowLeftRight size={13} aria-hidden />
                  შედარება
                </Link>
                <Link
                  href={home}
                  className="inline-flex items-center gap-1.5 rounded-full bg-sv-blue px-4 py-2 text-[12.5px] font-bold text-white transition hover:bg-sv-blue-deep"
                >
                  პანელი
                </Link>
              </div>
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
                ჩართე და მიიღე ახალი განცხადებები ელფოსტაზე.
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
          <div className="flex items-start gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-module bg-sv-blue/10 text-sv-blue">
              <BellRing size={18} aria-hidden />
            </span>
            <div className="min-w-0 flex-1">
              <h2 className="text-[15px] font-extrabold text-sv-ink">{t("settings.push.title")}</h2>
              <p className="mt-1 text-[13px] font-medium text-sv-ink/55">
                {t("settings.push.desc")}
              </p>
              <PushToggle
                labels={{
                  enable: t("settings.push.enable"),
                  disable: t("settings.push.disable"),
                  denied: t("settings.push.denied"),
                  unsupported: t("settings.push.unsupported"),
                }}
              />
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
              ჯერ ცარიელია. ახალი მოთხოვნები და განახლებები აქ გამოჩნდება.
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
