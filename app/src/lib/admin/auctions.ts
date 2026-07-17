import { AuctionStatus } from "@/generated/prisma/enums"
import { ADMIN_PAGE_SIZE } from "@/lib/admin/query"
import { db } from "@/lib/db"

export const AUCTION_STATUS_TABS = [
  { value: "", label: "All" },
  { value: AuctionStatus.scheduled, label: "Scheduled" },
  { value: AuctionStatus.live, label: "Live" },
  { value: AuctionStatus.paused, label: "Paused" },
  { value: AuctionStatus.ended_sold, label: "Ended · sold" },
  { value: AuctionStatus.ended_unsold, label: "Ended · unsold" },
  { value: AuctionStatus.cancelled, label: "Cancelled" },
] as const

const STATUS_VALUES = Object.values(AuctionStatus) as string[]

export function isAuctionStatus(v: string): v is AuctionStatus {
  return STATUS_VALUES.includes(v)
}

export async function listAuctions(status: string, page: number) {
  const where = isAuctionStatus(status) ? { status } : {}
  const [rows, total, grouped] = await Promise.all([
    db.auction.findMany({
      where,
      include: { listing: { select: { title: true } } },
      orderBy: [{ endsAt: "asc" }, { createdAt: "desc" }],
      skip: (page - 1) * ADMIN_PAGE_SIZE,
      take: ADMIN_PAGE_SIZE,
    }),
    db.auction.count({ where }),
    db.auction.groupBy({ by: ["status"], _count: { _all: true } }),
  ])
  const counts: Record<string, number> = {}
  let all = 0
  for (const g of grouped) {
    counts[g.status] = g._count._all
    all += g._count._all
  }
  return { rows, total, counts, all }
}

export async function getAuctionDetail(id: string) {
  return db.auction.findUnique({
    where: { id },
    include: {
      listing: { select: { id: true, title: true } },
      organizer: { select: { name: true, email: true } },
      agency: { select: { name: true, slug: true } },
      winner: { select: { name: true, email: true } },
      bids: {
        orderBy: { placedAt: "desc" },
        take: 100,
        include: { bidder: { select: { name: true, email: true } } },
      },
      deposits: {
        orderBy: { heldAt: "desc" },
        include: { bidder: { select: { name: true, email: true } } },
      },
    },
  })
}
