import { PageHeader } from "@/components/admin/ui/PageHeader"
import { requireAdmin } from "@/lib/admin/guard"
import { db } from "@/lib/db"

import { BuildingForm } from "../form"

export const metadata = { title: "Add map building" }

export default async function NewBuildingPage() {
  await requireAdmin()
  const developers = await db.developerProfile.findMany({
    where: { deletedAt: null },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  })

  return (
    <>
      <PageHeader
        title="Add building"
        description="Goes live on the 3D map immediately after saving."
      />
      <div className="max-w-4xl rounded-module border border-sv-ink/8 bg-white p-6">
        <BuildingForm developers={developers} />
      </div>
    </>
  )
}
