import type { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"

import { AuthShell } from "@/components/auth/AuthShell"
import { ConfirmRole, RolePicker } from "@/components/settings/RolePicker"
import {
  isProRole,
  isSelfServeRole,
  ROLE_LABEL_KA,
  type SelfServeRole,
} from "@/lib/auth-roles"
import { dashboardPathFor, requireUser } from "@/lib/guards"
import { parsePersonaIntent, PRO_PERSONAS } from "@/lib/workspace"
import { readPersona } from "@/lib/workspace-cookie"

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
  const intent = parsePersonaIntent(rawIntent)
  const user = await requireUser(intent ? `/auth/onboarding?intent=${intent}` : "/auth/onboarding")

  if (user.role === "admin") redirect(dashboardPathFor("admin"))

  // Already chose a pro role — skip this screen.
  if (isSelfServeRole(user.role) && isProRole(user.role)) {
    redirect(dashboardPathFor(user.role))
  }

  const current = await readPersona(user.role)
  const confirmIntent =
    intent && (PRO_PERSONAS as readonly string[]).includes(intent) && pick !== "1"
      ? (intent as SelfServeRole)
      : null

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
            href={dashboardPathFor(user.role)}
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
        <RolePicker currentPersona={current} intent={intent} />
      )}
    </AuthShell>
  )
}
