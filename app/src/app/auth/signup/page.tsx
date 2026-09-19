import type { Metadata } from "next"
import Link from "next/link"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"

import { AuthShell } from "@/components/auth/AuthShell"
import { SignUpForm } from "@/components/auth/SignUpForm"
import { authLang, getAuthStrings } from "@/components/auth/i18n"
import { dashboardPathFor, getSessionUser } from "@/lib/guards"

export const dynamic = "force-dynamic"

export async function generateMetadata(): Promise<Metadata> {
  const s = getAuthStrings(authLang((await cookies()).get("sv-lang")?.value))
  return {
    title: s.signupMetaTitle,
    description: s.signupMetaDesc,
    robots: { index: false },
  }
}

export default async function SignUpPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>
}) {
  const { callbackUrl } = await searchParams
  const user = await getSessionUser()
  const safeCallback =
    callbackUrl?.startsWith("/") && !callbackUrl.startsWith("//") ? callbackUrl : undefined
  if (user) redirect(safeCallback ?? dashboardPathFor(user.role))

  const s = getAuthStrings(authLang((await cookies()).get("sv-lang")?.value))
  const googleEnabled = Boolean(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET)

  return (
    <AuthShell
      legal={s}
      title={s.signupTitle}
      subtitle={s.signupSub}
      footer={
        <p className="text-[13px] font-medium text-white/50">
          {s.haveAccount}{" "}
          <Link
            href={
              safeCallback
                ? `/auth/signin?callbackUrl=${encodeURIComponent(safeCallback)}`
                : "/auth/signin"
            }
            className="font-bold text-sv-blue-light hover:underline"
          >
            {s.signinTitle}
          </Link>
        </p>
      }
    >
      <SignUpForm googleEnabled={googleEnabled} callbackUrl={safeCallback ?? "/"} s={s} />
    </AuthShell>
  )
}
