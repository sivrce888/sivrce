import type { Metadata } from "next"
import Link from "next/link"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"

import { AuthShell } from "@/components/auth/AuthShell"
import { SignInForm } from "@/components/auth/SignInForm"
import { authLang, getAuthStrings } from "@/components/auth/i18n"
import { dashboardPathFor, getSessionUser } from "@/lib/guards"

export const dynamic = "force-dynamic"

const ERROR_KEYS = [
  "OAuthAccountNotLinked",
  "AccessDenied",
  "Configuration",
  "CredentialsSignin",
  "WebAuthnVerificationError",
  "Verification",
] as const

export async function generateMetadata(): Promise<Metadata> {
  const s = getAuthStrings(authLang((await cookies()).get("sv-lang")?.value))
  return {
    title: s.signinMetaTitle,
    description: s.signinMetaDesc,
    robots: { index: false },
  }
}

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string; error?: string }>
}) {
  const { callbackUrl, error } = await searchParams
  const user = await getSessionUser()
  const safeCallback =
    callbackUrl?.startsWith("/") && !callbackUrl.startsWith("//") ? callbackUrl : undefined
  if (user) redirect(safeCallback ?? dashboardPathFor(user.role))

  const s = getAuthStrings(authLang((await cookies()).get("sv-lang")?.value))
  const googleEnabled = Boolean(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET)
  const target = safeCallback ?? "/dashboard"

  const errorText: Record<(typeof ERROR_KEYS)[number], string> = {
    OAuthAccountNotLinked: s.errOAuthNotLinked,
    AccessDenied: s.errAccessDenied,
    Configuration: s.errConfig,
    CredentialsSignin: s.errCredentials,
    WebAuthnVerificationError: s.errPasskeyVerify,
    Verification: s.errPasskeyVerify,
  }

  return (
    <AuthShell
      title={s.signinTitle}
      subtitle={s.signinSub}
      footer={
        <p className="text-[13px] font-medium text-white/50">
          {s.newHere}{" "}
          <Link
            href={
              safeCallback
                ? `/auth/signup?callbackUrl=${encodeURIComponent(safeCallback)}`
                : "/auth/signup"
            }
            className="font-bold text-sv-orange hover:underline"
          >
            {s.createAccount}
          </Link>
        </p>
      }
    >
      {error ? (
        <p className="mb-5 rounded-module bg-sv-orange-deep/10 px-4 py-3 text-center text-[12.5px] font-bold text-sv-orange-deep">
          {ERROR_KEYS.includes(error as (typeof ERROR_KEYS)[number])
            ? errorText[error as (typeof ERROR_KEYS)[number]]
            : s.errSigninGeneric}
        </p>
      ) : null}

      <SignInForm callbackUrl={target} googleEnabled={googleEnabled} s={s} />
    </AuthShell>
  )
}
