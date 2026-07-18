import { redirect } from "next/navigation"

import { requireAdmin } from "@/lib/admin/guard"

export default async function ContentIndexPage() {
  await requireAdmin()
  redirect("/admin/content/blog")
}
