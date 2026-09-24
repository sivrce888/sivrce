import { redirect } from "next/navigation"

import { dashboardPathFor, requireUser } from "@/lib/guards"
import { isValidLang, localizedHref } from "@/lib/i18n/core"

export const dynamic = "force-dynamic"

/** /dashboard → the signed-in user's role area, in the reader's locale. */
export default async function DashboardIndex({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params
  const user = await requireUser("/dashboard")
  const path = dashboardPathFor(user.role)
  redirect(isValidLang(lang) ? localizedHref(path, lang) : path)
}
