import type { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"

import { AuthShell } from "@/components/auth/AuthShell"
import { SignUpForm } from "@/components/auth/SignUpForm"
import { dashboardPathFor, getSessionUser } from "@/lib/guards"

export const metadata: Metadata = {
  title: "რეგისტრაცია",
  description: "შექმენი sivrce ანგარიში მობილურის ნომრით, Passkey-ით, Google-ით ან ელფოსტით.",
  robots: { index: false },
}

export const dynamic = "force-dynamic"

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

  const googleEnabled = Boolean(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET)

  return (
    <AuthShell
      title="ანგარიშის შექმნა"
      subtitle="ნომერი საკმარისია. შემდეგ დაამატე Passkey — Face ID-ით შესვლა."
      footer={
        <p className="text-[13px] font-medium text-white/50">
          უკვე გაქვს ანგარიში?{" "}
          <Link href="/auth/signin" className="font-bold text-sv-blue-light hover:underline">
            შესვლა
          </Link>
        </p>
      }
    >
      <SignUpForm googleEnabled={googleEnabled} callbackUrl={safeCallback ?? "/"} />
    </AuthShell>
  )
}
