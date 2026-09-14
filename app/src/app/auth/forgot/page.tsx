import type { Metadata } from "next"
import Link from "next/link"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"

import { AuthShell } from "@/components/auth/AuthShell"
import { ForgotForm } from "@/components/auth/ForgotForm"
import { authLang, getAuthStrings } from "@/components/auth/i18n"
import { getSessionUser } from "@/lib/guards"

export const dynamic = "force-dynamic"

export async function generateMetadata(): Promise<Metadata> {
  const s = getAuthStrings(authLang((await cookies()).get("sv-lang")?.value))
  return { title: s.forgotMetaTitle, robots: { index: false } }
}

export default async function ForgotPage() {
  const user = await getSessionUser()
  if (user) redirect("/dashboard")

  const s = getAuthStrings(authLang((await cookies()).get("sv-lang")?.value))

  return (
    <AuthShell
      title={s.forgotTitle}
      subtitle={s.forgotSub}
      footer={
        <p className="text-[13px] font-medium text-white/50">
          {s.remembered}{" "}
          <Link href="/auth/signin" className="font-bold text-sv-blue-light hover:underline">
            {s.signinTitle}
          </Link>
        </p>
      }
    >
      <ForgotForm s={s} />
    </AuthShell>
  )
}
