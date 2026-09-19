import type { Metadata } from "next"
import Link from "next/link"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"

import { AuthShell } from "@/components/auth/AuthShell"
import { ResetForm } from "@/components/auth/ResetForm"
import { authLang, getAuthStrings } from "@/components/auth/i18n"
import { getSessionUser } from "@/lib/guards"

export const dynamic = "force-dynamic"

export async function generateMetadata(): Promise<Metadata> {
  const s = getAuthStrings(authLang((await cookies()).get("sv-lang")?.value))
  return { title: s.resetMetaTitle, robots: { index: false } }
}

export default async function ResetPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; email?: string }>
}) {
  const user = await getSessionUser()
  if (user) redirect("/dashboard")

  const { token, email } = await searchParams
  const ok = Boolean(token && email?.includes("@"))
  const s = getAuthStrings(authLang((await cookies()).get("sv-lang")?.value))

  return (
    <AuthShell
      legal={s}
      title={s.resetTitle}
      subtitle={ok ? s.resetSubOk : s.resetSubBad}
      footer={
        <p className="text-[13px] font-medium text-white/50">
          <Link href="/auth/forgot" className="font-bold text-sv-blue-light hover:underline">
            {s.requestNewLink}
          </Link>
        </p>
      }
    >
      {ok ? (
        <ResetForm email={email!} token={token!} s={s} />
      ) : (
        <Link
          href="/auth/forgot"
          className="flex w-full items-center justify-center rounded-full bg-sv-blue px-6 py-3.5 text-[14.5px] font-extrabold text-white"
        >
          {s.forgotTitle}
        </Link>
      )}
    </AuthShell>
  )
}
