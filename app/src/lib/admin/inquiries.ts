import type { Prisma } from "@/generated/prisma/client"

import { ADMIN_PAGE_SIZE } from "@/lib/admin/query"
import { db } from "@/lib/db"

/** Allowed ops vocabulary for Inquiry.status (schema default is "new"). */
export const INQUIRY_STATUSES = ["new", "contacted", "qualified", "closed", "spam"] as const
export type InquiryStatusValue = (typeof INQUIRY_STATUSES)[number]

export const INQUIRY_STATUS_LABELS: Record<InquiryStatusValue, string> = {
  new: "New",
  contacted: "Contacted",
  qualified: "Qualified",
  closed: "Closed",
  spam: "Spam",
}

export function isInquiryStatus(v: string): v is InquiryStatusValue {
  return (INQUIRY_STATUSES as readonly string[]).includes(v)
}

/** Compact ref for table cells; full value goes on the title attribute. */
export function shortRef(id: string): string {
  return id.length > 16 ? `${id.slice(0, 14)}…` : id
}

/** A listing-backed inquiry has a linkable admin page. */
export function isListingRef(inquiry: { listingId: string }): boolean {
  return Boolean(inquiry.listingId)
}

/**
 * Display title for an inquiry's listing.
 * Returns null when the listing has been deleted.
 */
export async function getListingTitle(listingId: string): Promise<string | null> {
  const listing = await db.listing.findUnique({
    where: { id: listingId },
    select: { title: true },
  })
  return listing?.title ?? null
}

export async function listInquiries(status: string, q: string, page: number) {
  const where: Prisma.InquiryWhereInput = { deletedAt: null }
  if (isInquiryStatus(status)) where.status = status
  if (q) {
    where.OR = [
      { buyerName: { contains: q, mode: "insensitive" } },
      { buyerEmail: { contains: q, mode: "insensitive" } },
      { agentName: { contains: q, mode: "insensitive" } },
      { agentEmail: { contains: q, mode: "insensitive" } },
      { listingId: { contains: q, mode: "insensitive" } },
    ]
  }
  const [rows, total, grouped] = await Promise.all([
    db.inquiry.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * ADMIN_PAGE_SIZE,
      take: ADMIN_PAGE_SIZE,
    }),
    db.inquiry.count({ where }),
    db.inquiry.groupBy({
      by: ["status"],
      where: { deletedAt: null },
      _count: { _all: true },
    }),
  ])
  const counts: Record<string, number> = {}
  let all = 0
  for (const g of grouped) {
    counts[g.status] = g._count._all
    all += g._count._all
  }
  return { rows, total, counts, all }
}

export async function getInquiry(id: string) {
  return db.inquiry.findUnique({
    where: { id },
    include: { purchases: { orderBy: { purchasedAt: "desc" } } },
  })
}
