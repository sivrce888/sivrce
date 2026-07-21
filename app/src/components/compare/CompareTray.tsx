"use client"

import Image from "next/image"
import { Columns2, X } from "lucide-react"
import LocalizedLink from "@/components/LocalizedLink"
import { useCompare } from "@/lib/compare"
import { useListingsByIds } from "@/lib/use-listings-by-ids"
import { blurProps } from "@/lib/media"
import { useCompareStrings } from "./i18n"

/** Floating tray when ≥1 listing is in the compare set. */
export default function CompareTray() {
  const { ids, count, toggle, clear, max } = useCompare()
  const tt = useCompareStrings()
  const { items } = useListingsByIds(ids)

  if (count === 0) return null

  return (
    <div
      role="region"
      aria-label={tt("trayTitle")}
      className="fixed inset-x-0 bottom-0 z-[60] border-t border-sv-ink/10 bg-sv-surface/95 px-4 py-3 shadow-panel-dark backdrop-blur md:px-6"
    >
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 text-[13px] font-black text-sv-ink">
          <Columns2 className="h-4 w-4 text-sv-blue" aria-hidden />
          {tt("trayTitle")}
          <span className="rounded-full bg-sv-blue/10 px-2 py-0.5 text-[11px] text-sv-blue">
            {count}/{max}
          </span>
        </div>

        <div className="flex min-w-0 flex-1 gap-2 overflow-x-auto scrollbar-hide">
          {items.map((l) => (
            <div
              key={l.id}
              className="relative h-12 w-12 shrink-0 overflow-hidden rounded-control ring-1 ring-sv-ink/10"
            >
              <Image
                src={l.img}
                alt=""
                fill
                sizes="48px"
                className="object-cover"
                {...blurProps(l.img)}
              />
              <button
                type="button"
                aria-label={tt("remove")}
                onClick={() => toggle(l.id)}
                className="absolute right-0 top-0 grid h-5 w-5 place-items-center rounded-bl-control bg-sv-navy/80 text-white"
              >
                <X className="h-3 w-3" aria-hidden />
              </button>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={clear}
            className="rounded-full px-3 py-2 text-[12px] font-bold text-sv-ink/55 hover:text-sv-ink"
          >
            {tt("clear")}
          </button>
          <LocalizedLink
            href="/compare"
            className={`rounded-full px-5 py-2.5 text-[13px] font-bold text-white shadow-glow-blue-sm transition hover:-translate-y-0.5 ${
              count >= 2 ? "bg-sv-blue hover:bg-sv-blue-deep" : "pointer-events-none bg-sv-ink/25"
            }`}
            aria-disabled={count < 2}
          >
            {tt("open")}
          </LocalizedLink>
        </div>
      </div>
    </div>
  )
}
