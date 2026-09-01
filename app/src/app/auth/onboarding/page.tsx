import type { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"

import { AuthShell } from "@/components/auth/AuthShell"
import { ConfirmRole, RolePicker } from "@/components/settings/RolePicker"
import {
  isProRole,
  isSelfServeRole,
  parseRoleIntent,
  ROLE_LABEL_KA,
  roleOnboardingHref,
  type SelfServeRole,
} from "@/lib/auth-roles"
import { dashboardPathFor, requireUser } from "@/lib/guards"

export const metadata: Metadata = {
  title: "პროფილის ტიპი",
  robots: { index: false },
}

export const dynamic = "force-dynamic"

/** Focused role picker after pro signup CTAs (`?intent=agent`). */
export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ intent?: string; pick?: string }>
}) {
  const { intent: rawIntent, pick } = await searchParams
  const intent = parseRoleIntent(rawIntent)
  const user = await requireUser(roleOnboardingHref(intent))

  if (user.role === "admin") redirect(dashboardPathFor("admin"))

  // Already chose a pro role — skip this screen.
  if (isSelfServeRole(user.role) && isProRole(user.role)) {
    redirect(dashboardPathFor(user.role))
  }

  const current: SelfServeRole = isSelfServeRole(user.role) ? user.role : "buyer"
  const confirmIntent =
    intent && isProRole(intent) && pick !== "1" ? intent : null

  return (
    <AuthShell
      title={confirmIntent ? `გახდი ${ROLE_LABEL_KA[confirmIntent].title}` : "რა გინდა გააკეთო?"}
      subtitle={
        confirmIntent
          ? "ერთი შეხება — პროფილი შემდეგ შეავსებ. შეგიძლია ნებისმიერ დროს შეცვალო პარამეტრებში."
          : "აირჩიე პროფილის ტიპი. შეგიძლია ნებისმიერ დროს შეცვალო პარამეტრებში."
      }
      footer={
        <div className="flex flex-col items-center gap-3">
          {confirmIntent ? (
            <Link
              href="/auth/onboarding?pick=1"
              className="text-[13px] font-bold text-white/55 transition hover:text-white hover:underline"
            >
              სხვა პროფილის ტიპი
            </Link>
          ) : null}
          <Link
            href={dashboardPathFor(current)}
            className="text-[13px] font-bold text-sv-blue-light transition hover:underline"
          >
            გამოტოვება — მყიდველად დავრჩები
          </Link>
        </div>
      }
    >
      {confirmIntent ? (
        <ConfirmRole role={confirmIntent} />
      ) : (
        <RolePicker currentRole={current} intent={intent} />
      )}
    </AuthShell>
  )
}
