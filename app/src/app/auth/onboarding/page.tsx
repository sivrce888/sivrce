import type { Metadata } from "next"
import Link from "next/link"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"

import { AuthShell } from "@/components/auth/AuthShell"
import { ConfirmRole, RolePicker } from "@/components/settings/RolePicker"
import { authLang, getAuthStrings } from "@/components/auth/i18n"
import {
  isProRole,
  isSelfServeRole,
  ROLE_LABEL_KA,
  type SelfServeRole,
} from "@/lib/auth-roles"
import { dashboardPathFor, requireUser } from "@/lib/guards"
import { parsePersonaIntent, PRO_PERSONAS } from "@/lib/workspace"
import { readPersona } from "@/lib/workspace-cookie"

export const dynamic = "force-dynamic"

export async function generateMetadata(): Promise<Metadata> {
  const s = getAuthStrings(authLang((await cookies()).get("sv-lang")?.value))
  return { title: s.onboardTitle, robots: { index: false } }
}

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
  const lang = authLang((await cookies()).get("sv-lang")?.value)
  const s = getAuthStrings(lang)
  // Role labels are ka-only library data; non-ka gets the bare role title.
  const confirmTitle =
    confirmIntent && lang === "ka"
      ? `გახდი ${ROLE_LABEL_KA[confirmIntent].title}`
      : confirmIntent
        ? ROLE_LABEL_KA[confirmIntent].title
        : s.onboardTitle

  return (
    <AuthShell
      legal={s}
      title={confirmTitle}
      subtitle={confirmIntent ? s.onboardSubConfirm : s.onboardSub}
      footer={
        <div className="flex flex-col items-center gap-3">
          {confirmIntent ? (
            <Link
              href="/auth/onboarding?pick=1"
              className="text-[13px] font-bold text-white/55 transition hover:text-white hover:underline"
            >
              {s.onboardOtherType}
            </Link>
          ) : null}
          <Link
            href={dashboardPathFor(user.role)}
            className="text-[13px] font-bold text-sv-blue-light transition hover:underline"
          >
            {s.onboardSkip}
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
