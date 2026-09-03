import Link from "next/link"
import { MessageCircle, Phone } from "lucide-react"

import Badge from "@/components/agent-dashboard/Badge"
import { fmtDate, tourStatusLabel, tourStatusTone } from "@/components/agent-dashboard/format"
import { telHref, waHref } from "@/lib/inquiries/phone"
import { leadWaText } from "@/lib/pro-leads"
import type { Prisma } from "@/generated/prisma/client"

export type TourWithListing = Prisma.PropertyTourGetPayload<{
  include: { listing: { select: { id: true; title: true; city: true; district: true } } }
}>

export const tourListingInclude = {
  listing: { select: { id: true, title: true, city: true, district: true } },
} as const

/** Tour booking card shared by /agent/tours and /seller/tours. Server component. */
export default function TourCard({ tour }: { tour: TourWithListing }) {
  return (
    <li className="rounded-card border border-sv-ink/[0.06] bg-sv-surface p-5 shadow-card">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <Link
            href={`/listing/${tour.listing.id}`}
            className="block truncate text-[15px] font-extrabold text-sv-ink hover:text-sv-blue"
          >
            {tour.listing.title}
          </Link>
          <p className="mt-0.5 text-[12.5px] font-medium text-sv-ink/50">
            {tour.listing.city} · {tour.listing.district}
          </p>
        </div>
        <Badge
          label={tourStatusLabel[tour.status] ?? tour.status}
          tone={tourStatusTone[tour.status] ?? "neutral"}
        />
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1 border-t border-sv-ink/6 pt-3 text-[12.5px] font-medium text-sv-ink/55">
        <span className="font-bold text-sv-ink/75">
          {fmtDate(tour.tourDate)} · {tour.tourTime}
        </span>
        <span>{tour.guestName}</span>
        <a
          href={telHref(tour.guestPhone)}
          className="inline-flex items-center gap-1.5 hover:text-sv-blue"
        >
          <Phone size={13} />
          {tour.guestPhone}
        </a>
        <a
          href={waHref(tour.guestPhone, leadWaText(tour.guestName, tour.listing.title))}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 font-bold text-sv-blue hover:underline"
        >
          <MessageCircle size={13} />
          WhatsApp
        </a>
      </div>
      {tour.guestNotes ? (
        <p className="mt-2 text-[12px] font-medium text-sv-ink/45">„{tour.guestNotes}“</p>
      ) : null}
    </li>
  )
}
