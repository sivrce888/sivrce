import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { notFound } from "next/navigation"

import { deleteAdBanner, setAdStatus } from "@/app/[lang]/admin/ads/actions"
import {
  AdBannerForm,
  type AdBannerDefaults,
} from "@/components/admin/ads/AdBannerForm"
import { ConfirmButton } from "@/components/admin/ui/ConfirmButton"
import { PageHeader } from "@/components/admin/ui/PageHeader"
import { requireAdmin } from "@/lib/admin/guard"
import { SLOT_META, type AdSlotId } from "@/lib/ads"
import { db } from "@/lib/db"

export const metadata = { title: "Banner editor" }

const EMPTY: AdBannerDefaults = {
  id: "",
  slot: "home_hero",
  format: SLOT_META.home_hero.format,
  status: "draft",
  title: "",
  subtitle: "",
  ctaLabel: "",
  href: "/",
  imageUrl: "",
  advertiser: "",
  audiences: ["all"],
  langs: ["all"],
  weight: 10,
  startsAt: "",
  endsAt: "",
}

export default async function AdminAdEditorPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await requireAdmin()
  const { id } = await params
  const isNew = id === "new"
  const row = isNew ? null : await db.adBanner.findUnique({ where: { id } })
  if (!isNew && !row) notFound()

  const defaults: AdBannerDefaults = row
    ? {
        id: row.id,
        slot: row.slot,
        format: row.format,
        status: row.status,
        title: row.title,
        subtitle: row.subtitle ?? "",
        ctaLabel: row.ctaLabel ?? "",
        href: row.href,
        imageUrl: row.imageUrl ?? "",
        advertiser: row.advertiser ?? "",
        audiences: row.audiences,
        langs: row.langs,
        weight: row.weight,
        startsAt: row.startsAt?.toISOString() ?? "",
        endsAt: row.endsAt?.toISOString() ?? "",
      }
    : EMPTY

  const slotLabel = SLOT_META[defaults.slot as AdSlotId]?.label ?? defaults.slot

  return (
    <>
      <div className="mb-4">
        <Link
          href="/admin/ads"
          className="inline-flex h-9 items-center gap-1.5 text-[13px] font-bold text-sv-ink/50 transition-colors hover:text-sv-ink"
        >
          <ArrowLeft className="h-4 w-4" /> All banners
        </Link>
      </div>
      <PageHeader
        title={isNew ? "New banner" : defaults.title}
        description={isNew ? "Pick a slot, upload a creative, go live." : slotLabel}
        actions={
          row ? (
            <div className="flex flex-wrap gap-2">
              {row.status !== "live" ? (
                <ConfirmButton
                  action={setAdStatus}
                  fields={{ id: row.id, status: "live" }}
                  label="Go live"
                  tone="primary"
                />
              ) : (
                <ConfirmButton
                  action={setAdStatus}
                  fields={{ id: row.id, status: "paused" }}
                  label="Pause"
                  tone="ghost"
                />
              )}
              <ConfirmButton
                action={deleteAdBanner}
                fields={{ id: row.id }}
                label="Delete"
                tone="danger"
                confirm="Delete this banner? It disappears from the site immediately."
              />
            </div>
          ) : null
        }
      />
      <AdBannerForm defaults={defaults} />
    </>
  )
}
