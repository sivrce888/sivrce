import type { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"

import { AuthShell } from "@/components/auth/AuthShell"
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton"
import { getSessionUser } from "@/lib/guards"

export const metadata: Metadata = {
  title: "რეგისტრაცია",
  description: "შექმენი sivrce ანგარიში Google-ით და აირჩიე როლი — მყიდველი, გამყიდველი, აგენტი, სააგენტო ან დეველოპერი.",
  robots: { index: false },
}

export const dynamic = "force-dynamic"

export default async function SignUpPage() {
  const user = await getSessionUser()
  if (user) redirect("/auth/onboarding")

  const googleEnabled = Boolean(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET)

  return (
    <AuthShell
      title="შექმენი ანგარიში"
      subtitle="Google-ით რეგისტრაცია ერთ წამში. შემდეგ აირჩევ შენს როლს და პანელს."
      footer={
        <p className="text-[13px] font-medium text-white/50">
          უკვე გაქვს ანგარიში?{" "}
          <Link href="/auth/signin" className="font-bold text-sv-blue-light hover:underline">
            შესვლა
          </Link>
        </p>
      }
    >
      {googleEnabled ? (
        <GoogleSignInButton redirectTo="/auth/onboarding" label="Google-ით რეგისტრაცია" />
      ) : (
        <p className="rounded-module bg-white/5 px-4 py-3 text-center text-[12.5px] font-semibold text-white/55">
          რეგისტრაცია დროებით გამორთულია — დააყენე AUTH_GOOGLE_ID და AUTH_GOOGLE_SECRET.
        </p>
      )}

      <ul className="mt-6 space-y-2 text-[12.5px] font-medium text-white/45">
        <li>მყიდველი · გამყიდველი · აგენტი · სააგენტო · დეველოპერი</li>
        <li>როლს ირჩევ რეგისტრაციის შემდეგ — შეცვლა პარამეტრებშიც შეიძლება</li>
      </ul>
    </AuthShell>
  )
}
