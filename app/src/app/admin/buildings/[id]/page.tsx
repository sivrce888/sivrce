import Link from "next/link"
import { notFound } from "next/navigation"
import { ExternalLink } from "lucide-react"

import { ConfirmButton } from "@/components/admin/ui/ConfirmButton"
import { PageHeader } from "@/components/admin/ui/PageHeader"
import { fmtDateTime } from "@/lib/admin/format"
import { requireAdmin } from "@/lib/admin/guard"
import { db } from "@/lib/db"

import { deleteBuilding, togglePopular } from "../actions"
import { BuildingForm } from "../form"

export const metadata = { title: "Edit map building" }

export default async function EditBuildingPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await requireAdmin()
  const { id } = await params
  const [building, developers] = await Promise.all([
    db.mapBuilding.findUnique({ where: { id }, include: { developer: { select: { name: true } } } }),
    db.developerProfile.findMany({
      where: { deletedAt: null },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ])
  if (!building) notFound()

  return (
    <>
      <PageHeader
        title={building.title}
        description={`${building.code ?? building.slug} · created ${fmtDateTime(building.createdAt)} · updated ${fmtDateTime(building.updatedAt)}`}
        actions={
          <>
            <Link
              href={`/map?building=${building.slug}`}
              target="_blank"
              className="inline-flex items-center gap-1.5 rounded-full border border-sv-ink/12 px-4 py-2 text-[13px] font-extrabold text-sv-ink/70 transition hover:border-sv-blue/40 hover:text-sv-blue"
            >
              <ExternalLink className="h-3.5 w-3.5" /> View on map
            </Link>
            <ConfirmButton
              action={togglePopular}
              fields={{ id: building.id }}
              tone="ghost"
              label={building.popular ? "Unmark popular" : "Mark popular"}
            />
            <ConfirmButton
              action={deleteBuilding}
              fields={{ id: building.id }}
              confirm={`Delete "${building.title}" from the map? This cannot be undone.`}
              tone="danger"
              label="Delete"
            />
          </>
        }
      />
      <div className="max-w-4xl rounded-module border border-sv-ink/8 bg-white p-6">
        <BuildingForm building={building} developers={developers} />
      </div>
    </>
  )
}
