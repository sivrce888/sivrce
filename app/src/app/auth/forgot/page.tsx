import type { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"

import { AuthShell } from "@/components/auth/AuthShell"
import { ForgotForm } from "@/components/auth/ForgotForm"
import { getSessionUser } from "@/lib/guards"

export const metadata: Metadata = {
  title: "პაროლის აღდგენა",
  robots: { index: false },
}

export const dynamic = "force-dynamic"

export default async function ForgotPage() {
  const user = await getSessionUser()
  if (user) redirect("/dashboard")

  return (
    <AuthShell
      title="პაროლის აღდგენა"
      subtitle="შეიყვანე ელფოსტა — გამოგიგზავნი უსაფრთხო ბმულს ახალი პაროლის დასაყენებლად."
      footer={
        <p className="text-[13px] font-medium text-white/50">
          გაახსენდა?{" "}
          <Link href="/auth/signin" className="font-bold text-sv-blue-light hover:underline">
            შესვლა
          </Link>
        </p>
      }
    >
      <ForgotForm />
    </AuthShell>
  )
}
