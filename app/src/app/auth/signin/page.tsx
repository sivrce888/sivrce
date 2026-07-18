import type { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"

import { AuthShell } from "@/components/auth/AuthShell"
import { SignInForm } from "@/components/auth/SignInForm"
import { dashboardPathFor, getSessionUser } from "@/lib/guards"

export const metadata: Metadata = {
  title: "შესვლა",
  description: "შედი sivrce ანგარიშში ელფოსტით ან Google-ით.",
  robots: { index: false },
}

export const dynamic = "force-dynamic"

const ERROR_TEXT: Record<string, string> = {
  OAuthAccountNotLinked: "ეს ელფოსტა უკვე დაკავშირებულია სხვა შესვლის მეთოდთან.",
  AccessDenied: "წვდომა უარყოფილია.",
  Configuration: "ავტორიზაცია დროებით მიუწვდომელია — სცადე მოგვიანებით.",
  CredentialsSignin: "ელფოსტა ან პაროლი არასწორია.",
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

  const googleEnabled = Boolean(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET)
  const target = safeCallback ?? "/dashboard"

  return (
    <AuthShell
      title="შესვლა"
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
        <p className="mb-5 rounded-module bg-sv-orange-deep/10 px-4 py-3 text-center text-[12.5px] font-bold text-sv-orange-deep">
          {ERROR_TEXT[error] ?? "შესვლა ვერ მოხერხდა — სცადე თავიდან."}
        </p>
      ) : null}

      <SignInForm callbackUrl={target} googleEnabled={googleEnabled} />
    </AuthShell>
  )
}
