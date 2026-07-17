import type { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"

import { signIn } from "@/auth"
import { LogoMark } from "@/components/Logo"
import { getSessionUser, dashboardPathFor } from "@/lib/guards"

export const metadata: Metadata = {
  title: "შესვლა",
  description: "შედი შენს sivrce ანგარიშში.",
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
  if (user) redirect(callbackUrl ?? dashboardPathFor(user.role))

  const googleEnabled = Boolean(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET)
  const target = callbackUrl ?? "/dashboard"

  return (
    <div className="flex min-h-screen items-center justify-center bg-sv-cloud px-6">
      <div className="w-full max-w-sm rounded-3xl border border-sv-ink/8 bg-white p-8 shadow-xl">
        <div className="flex flex-col items-center text-center">
          <LogoMark size={48} />
          <h1 className="mt-5 text-2xl font-black tracking-tight text-sv-ink">
            შესვლა sivrce-ში
          </h1>
          <p className="mt-2 text-[13.5px] font-medium leading-relaxed text-sv-ink/55">
            უძრავი ქონება ერთ სივრცეში — შენახული განცხადებები, ტურები და შეტყობინებები ყველგან.
          </p>
        </div>

        {error ? (
          <p className="mt-5 rounded-xl bg-red-50 px-4 py-3 text-center text-[12.5px] font-bold text-red-600">
            {ERROR_TEXT[error] ?? "შესვლა ვერ მოხერხდა — სცადე თავიდან."}
          </p>
        ) : null}

        {googleEnabled ? (
          <form
            className="mt-6"
            action={async () => {
              "use server"
              await signIn("google", { redirectTo: target })
            }}
          >
            <button
              type="submit"
              className="flex w-full items-center justify-center gap-3 rounded-full border border-sv-ink/12 bg-white px-6 py-3.5 text-[14px] font-bold text-sv-ink transition hover:border-sv-blue hover:text-sv-blue"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
                <path
                  fill="#4285F4"
                  d="M23.5 12.27c0-.85-.08-1.66-.22-2.45H12v4.64h6.45a5.52 5.52 0 0 1-2.4 3.62v3h3.87c2.27-2.09 3.58-5.17 3.58-8.81z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.96-1.07 7.94-2.91l-3.87-3c-1.08.72-2.45 1.15-4.07 1.15-3.13 0-5.78-2.11-6.73-4.96H1.29v3.1A12 12 0 0 0 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.27 14.28A7.2 7.2 0 0 1 4.89 12c0-.79.14-1.56.38-2.28v-3.1H1.29a12 12 0 0 0 0 10.76l3.98-3.1z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.76c1.76 0 3.34.6 4.58 1.8l3.44-3.44A11.98 11.98 0 0 0 12 0 12 12 0 0 0 1.29 6.62l3.98 3.1C6.22 6.87 8.87 4.76 12 4.76z"
                />
              </svg>
              Google-ით შესვლა
            </button>
          </form>
        ) : (
          <p className="mt-6 rounded-xl bg-sv-cloud px-4 py-3 text-center text-[12.5px] font-semibold text-sv-ink/55">
            შესვლა დროებით გამორთულია — OAuth კონფიგურაცია არ არის დაყენებული.
          </p>
        )}

        <p className="mt-6 text-center text-[11.5px] font-medium leading-relaxed text-sv-ink/40">
          შესვლით ეთანხმები sivrce-ის{" "}
          <Link href="/terms" className="underline hover:text-sv-blue">
            პირობებს
          </Link>{" "}
          და{" "}
          <Link href="/privacy" className="underline hover:text-sv-blue">
            კონფიდენციალურობას
          </Link>
          .
        </p>
      </div>
    </div>
  )
}
