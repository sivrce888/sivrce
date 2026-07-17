import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  title: "შესვლის შეცდომა",
  robots: { index: false },
}

export default function AuthErrorPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-sv-cloud px-6">
      <div className="w-full max-w-sm rounded-3xl border border-sv-ink/8 bg-white p-8 text-center shadow-xl">
        <h1 className="text-xl font-black text-sv-ink">შესვლა ვერ მოხერხდა</h1>
        <p className="mt-2 text-[13px] font-medium text-sv-ink/55">
          მოხდა მოულოდნელი შეცდომა. სცადე თავიდან.
        </p>
        <Link
          href="/auth/signin"
          className="mt-6 inline-block rounded-full bg-sv-blue px-6 py-3 text-[13px] font-bold text-white transition hover:bg-sv-blue-deep"
        >
          თავიდან ცდა
        </Link>
      </div>
    </div>
  )
}
