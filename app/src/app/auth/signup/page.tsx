import type { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"

import { AuthShell } from "@/components/auth/AuthShell"
import { SignUpForm } from "@/components/auth/SignUpForm"
import { dashboardPathFor, getSessionUser } from "@/lib/guards"

export const metadata: Metadata = {
  title: "რეგისტრაცია",
  description: "შექმენი sivrce ანგარიში ელფოსტით ან Google-ით.",
  robots: { index: false },
}

export const dynamic = "force-dynamic"

export default async function SignUpPage() {
  const user = await getSessionUser()
  if (user) redirect(dashboardPathFor(user.role))

  const googleEnabled = Boolean(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET)

  return (
    <AuthShell
      title="ანგარიშის შექმნა"
      subtitle="რეგისტრაცია ერთ წუთში — შემდეგ პირდაპირ ძიება ან განცხადების დამატება."
      footer={
        <p className="text-[13px] font-medium text-white/50">
          უკვე გაქვს ანგარიში?{" "}
          <Link href="/auth/signin" className="font-bold text-sv-blue-light hover:underline">
            შესვლა
          </Link>
        </p>
      }
    >
      <SignUpForm googleEnabled={googleEnabled} />
    </AuthShell>
  )
}
