import type { Metadata } from "next"
import Link from "next/link"

import { AuthShell } from "@/components/auth/AuthShell"

export const metadata: Metadata = {
  title: "შესვლის შეცდომა",
  robots: { index: false },
}

export default function AuthErrorPage() {
  return (
    <AuthShell
      title="შესვლა ვერ მოხერხდა"
      subtitle="მოხდა მოულოდნელი შეცდომა. სცადე თავიდან — ან დაბრუნდი მთავარ გვერდზე."
      footer={
        <Link href="/" className="text-[13px] font-bold text-white/50 hover:text-white/80">
          მთავარი
        </Link>
      }
    >
      <Link
        href="/auth/signin"
        className="flex w-full items-center justify-center rounded-full bg-sv-orange px-6 py-3.5 text-[14px] font-extrabold text-white shadow-glow-orange transition hover:-translate-y-0.5 hover:shadow-glow-orange-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sv-blue"
      >
        თავიდან ცდა
      </Link>
    </AuthShell>
  )
}
