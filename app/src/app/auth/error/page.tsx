import type { Metadata } from "next"
import Link from "next/link"
import { cookies } from "next/headers"

import { AuthShell } from "@/components/auth/AuthShell"
import { authLang, getAuthStrings } from "@/components/auth/i18n"

export async function generateMetadata(): Promise<Metadata> {
  const s = getAuthStrings(authLang((await cookies()).get("sv-lang")?.value))
  return { title: s.errPageMetaTitle, robots: { index: false } }
}

export default async function AuthErrorPage() {
  const s = getAuthStrings(authLang((await cookies()).get("sv-lang")?.value))
  return (
    <AuthShell
      legal={s}
      title={s.errPageTitle}
      subtitle={s.errPageSub}
      footer={
        <Link href="/" className="text-[13px] font-bold text-white/50 hover:text-white/80">
          {s.home}
        </Link>
      }
    >
      <Link
        href="/auth/signin"
        className="flex w-full items-center justify-center rounded-full bg-sv-orange px-6 py-3.5 text-[14px] font-extrabold text-sv-ink shadow-glow-orange transition hover:-translate-y-0.5 hover:shadow-glow-orange-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sv-blue"
      >
        {s.tryAgain}
      </Link>
    </AuthShell>
  )
}
