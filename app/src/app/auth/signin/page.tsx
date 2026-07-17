import type { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"

import { AuthShell } from "@/components/auth/AuthShell"
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton"
import { dashboardPathFor, getSessionUser } from "@/lib/guards"

export const metadata: Metadata = {
  title: "შესვლა",
  description: "შედი შენს sivrce ანგარიშში Google-ით — ერთი დაწკაპუნებით.",
  robots: { index: false },
}

export const dynamic = "force-dynamic"

const ERROR_TEXT: Record<string, string> = {
  OAuthAccountNotLinked: "ეს ელფოსტა უკვე დაკავშირებულია სხვა შესვლის მეთოდთან.",
  AccessDenied: "წვდომა უარყოფილია.",
  Configuration: "ავტორიზაცია დროებით მიუწვდომელია — სცადე მოგვიანებით.",
}

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string; error?: string }>
}) {
  const { callbackUrl, error } = await searchParams
  const user = await getSessionUser()
  // Open-redirect guard: only local paths may be redirect targets.
  const safeCallback =
    callbackUrl?.startsWith("/") && !callbackUrl.startsWith("//") ? callbackUrl : undefined
  if (user) redirect(safeCallback ?? dashboardPathFor(user.role))

  const googleEnabled = Boolean(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET)
  const target = safeCallback ?? "/dashboard"

  return (
    <AuthShell
      title="შესვლა sivrce-ში"
      subtitle="უძრავი ქონება ერთ სივრცეში — შენახული განცხადებები, ტურები და შეტყობინებები."
      footer={
        <p className="text-[13px] font-medium text-white/50">
          ახალი ხარ?{" "}
          <Link href="/auth/signup" className="font-bold text-sv-orange hover:underline">
            შექმენი ანგარიში
          </Link>
        </p>
      }
    >
      {error ? (
        <p className="mb-5 rounded-module bg-sv-orange-deep/20 px-4 py-3 text-center text-[12.5px] font-bold text-sv-orange-light">
          {ERROR_TEXT[error] ?? "შესვლა ვერ მოხერხდა — სცადე თავიდან."}
        </p>
      ) : null}

      {googleEnabled ? (
        <GoogleSignInButton redirectTo={target} label="Google-ით შესვლა" />
      ) : (
        <p className="rounded-module bg-white/5 px-4 py-3 text-center text-[12.5px] font-semibold text-white/55">
          შესვლა დროებით გამორთულია — დააყენე AUTH_GOOGLE_ID და AUTH_GOOGLE_SECRET.
        </p>
      )}

      <p className="mt-5 text-center text-[12px] font-medium text-white/40">
        ერთი დაწკაპუნება · უსაფრთხო OAuth · პაროლი არ სჭირდება
      </p>
    </AuthShell>
  )
}
