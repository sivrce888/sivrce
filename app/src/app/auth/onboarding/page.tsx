import type { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"

import { chooseSelfRole } from "@/app/auth/actions"
import { AuthShell } from "@/components/auth/AuthShell"
import {
  isSelfServeRole,
  ROLE_LABEL_KA,
  SELF_SERVE_ROLES,
} from "@/lib/auth-roles"
import { dashboardPathFor, requireUser } from "@/lib/guards"

export const metadata: Metadata = {
  title: "აირჩიე როლი",
  robots: { index: false },
}

export const dynamic = "force-dynamic"

export default async function OnboardingPage() {
  const user = await requireUser("/auth/onboarding")
  if (user.role === "admin") redirect("/admin")

  return (
    <AuthShell
      title="როგორ იყენებ sivrce-ს?"
      subtitle={`${user.name ?? user.email} — აირჩიე პროფილი. შეცვლა მოგვიანებით პარამეტრებში შეგიძლია.`}
    >
      <div className="grid gap-2.5">
        {SELF_SERVE_ROLES.map((role) => {
          const meta = ROLE_LABEL_KA[role]
          const selected = user.role === role
          return (
            <form key={role} action={chooseSelfRole}>
              <input type="hidden" name="role" value={role} />
              <button
                type="submit"
                className={`flex w-full items-center justify-between rounded-module border px-4 py-3.5 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sv-blue ${
                  selected
                    ? "border-sv-blue bg-sv-blue/10 text-sv-ink"
                    : "border-sv-ink/8 bg-sv-cloud/60 text-sv-ink hover:border-sv-blue/40 hover:bg-sv-cloud"
                }`}
              >
                <span>
                  <span className="block text-[14px] font-extrabold tracking-tight">{meta.title}</span>
                  <span className="mt-0.5 block text-[12px] font-medium text-sv-ink/50">{meta.blurb}</span>
                </span>
                <span className="text-[11px] font-bold text-sv-orange">
                  {selected ? "აქტიური" : "არჩევა"}
                </span>
              </button>
            </form>
          )
        })}
      </div>

      <Link
        href={dashboardPathFor(user.role)}
        className="mt-4 block w-full text-center text-[12.5px] font-semibold text-sv-ink/40 underline-offset-2 hover:text-sv-ink/70 hover:underline"
      >
        გამოტოვება — გავაგრძელო როგორც{" "}
        {isSelfServeRole(user.role) ? ROLE_LABEL_KA[user.role].title : "მყიდველი"}
      </Link>
    </AuthShell>
  )
}
