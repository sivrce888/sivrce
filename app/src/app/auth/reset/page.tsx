import type { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"

import { AuthShell } from "@/components/auth/AuthShell"
import { ResetForm } from "@/components/auth/ResetForm"
import { getSessionUser } from "@/lib/guards"

export const metadata: Metadata = {
  title: "ახალი პაროლი",
  robots: { index: false },
}

export const dynamic = "force-dynamic"

export default async function ResetPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; email?: string }>
}) {
  const user = await getSessionUser()
  if (user) redirect("/dashboard")

  const { token, email } = await searchParams
  const ok = Boolean(token && email?.includes("@"))

  return (
    <AuthShell
      title="ახალი პაროლი"
      subtitle={
        ok
          ? "აირჩიე ძლიერი პაროლი — მინიმუმ 8 სიმბოლო."
          : "ბმული არასრულია. მოითხოვე ახალი აღდგენის ბმული."
      }
      footer={
        <p className="text-[13px] font-medium text-white/50">
          <Link href="/auth/forgot" className="font-bold text-sv-blue-light hover:underline">
            ახალი ბმულის მოთხოვნა
          </Link>
        </p>
      }
    >
      {ok ? (
        <ResetForm email={email!} token={token!} />
      ) : (
        <Link
          href="/auth/forgot"
          className="flex w-full items-center justify-center rounded-full bg-sv-blue px-6 py-3.5 text-[14.5px] font-extrabold text-white"
        >
          პაროლის აღდგენა
        </Link>
      )}
    </AuthShell>
  )
}
