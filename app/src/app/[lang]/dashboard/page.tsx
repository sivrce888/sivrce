import { redirect } from "next/navigation"

import { dashboardPathFor, requireUser } from "@/lib/guards"

export const dynamic = "force-dynamic"

/** /dashboard → the signed-in user's role area. */
export default async function DashboardIndex() {
  const user = await requireUser("/dashboard")
  redirect(dashboardPathFor(user.role))
}
