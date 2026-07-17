import type { LucideIcon } from "lucide-react"
import { Image as ImageIcon, Ruler, Scan, Video } from "lucide-react"

import { removeMedia } from "@/app/admin/listings/actions"
import { ConfirmButton } from "@/components/admin/ui/ConfirmButton"
import { EmptyState } from "@/components/admin/ui/EmptyState"
import { StatusPill } from "@/components/admin/ui/StatusPill"
import { fmtCompact } from "@/lib/admin/format"

export type AdminMediaItem = {
  id: string
  kind: string
  cdnUrl: string | null
  storagePath: string
  isCover: boolean
  processingStatus: string
  sizeBytes: bigint | null
}

const KIND_ICON: Record<string, LucideIcon> = {
  photo: ImageIcon,
  video: Video,
  panorama: Scan,
  floor_plan: Ruler,
}

const IMAGE_KINDS = new Set(["photo", "panorama", "floor_plan"])

/** Media grid for the listing detail page; removal soft-deletes via server action. */
export function ListingMediaGrid({
  listingId,
  media,
}: {
  listingId: string
  media: AdminMediaItem[]
}) {
  if (media.length === 0) {
    return (
      <EmptyState
        icon={ImageIcon}
        title="No media"
        hint="Photos, videos and floor plans uploaded for this listing will appear here."
      />
    )
  }
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
      {media.map((m) => {
        const Icon = KIND_ICON[m.kind] ?? ImageIcon
        const showImage = m.cdnUrl !== null && IMAGE_KINDS.has(m.kind)
        return (
          <figure
            key={m.id}
            className="overflow-hidden rounded-[var(--radius-control)] border border-sv-ink/8 bg-sv-cloud/40"
          >
            <div className="relative aspect-[4/3] bg-sv-cloud">
              {showImage ? (
                <img
                  src={m.cdnUrl ?? ""}
                  alt=""
                  loading="lazy"
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="grid h-full place-items-center text-sv-ink/25">
                  <Icon className="h-8 w-8" />
                </div>
              )}
              {m.isCover ? (
                <span className="absolute top-2 left-2 rounded-full bg-sv-navy/85 px-2 py-0.5 text-[10.5px] font-extrabold tracking-wide text-white uppercase">
                  Cover
                </span>
              ) : null}
            </div>
            <figcaption className="space-y-2 p-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[12px] font-bold text-sv-ink/70 capitalize">
                  {m.kind.replaceAll("_", " ")}
                </span>
                <StatusPill status={m.processingStatus} />
              </div>
              <p className="truncate text-[11.5px] text-sv-ink/40" title={m.storagePath}>
                {m.storagePath}
              </p>
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11.5px] text-sv-ink/40">
                  {m.sizeBytes === null ? "—" : `${fmtCompact(Number(m.sizeBytes))}B`}
                </span>
                <ConfirmButton
                  action={removeMedia}
                  fields={{ id: listingId, mediaId: m.id }}
                  label="Remove"
                  tone="danger"
                  confirm="Remove this media item? It will be hidden from the listing."
                />
              </div>
            </figcaption>
          </figure>
        )
      })}
    </div>
  )
}
