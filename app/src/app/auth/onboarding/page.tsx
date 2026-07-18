import type { Metadata } from "next"
import { redirect } from "next/navigation"

import { requireUser } from "@/lib/guards"

export const metadata: Metadata = {
  title: "პროფილი",
  robots: { index: false },
}

export const dynamic = "force-dynamic"

/** Legacy URL — roles now live in /settings, not a forced signup step. */
export default async function OnboardingPage() {
  await requireUser("/settings")
  redirect("/settings")
}
