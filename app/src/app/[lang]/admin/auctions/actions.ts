"use server"

import { revalidatePath } from "next/cache"

import { AuctionStatus } from "@/generated/prisma/enums"
import { logAdminAction } from "@/lib/admin/audit"
import { requireAdminAction } from "@/lib/admin/guard"
import { reqString } from "@/lib/admin/validate"
import { db } from "@/lib/db"

async function loadStatus(id: string): Promise<AuctionStatus> {
  const auction = await db.auction.findUnique({
    where: { id },
    select: { status: true },
  })
  if (!auction) throw new Error("Auction not found")
  return auction.status
}

function revalidate(id: string) {
  revalidatePath("/admin/auctions")
  revalidatePath(`/admin/auctions/${id}`)
}

export async function pauseAuction(fd: FormData) {
  const session = await requireAdminAction()
  const id = reqString(fd, "id", 120)
  const reason = reqString(fd, "reason", 500)
  const before = await loadStatus(id)
  if (before !== AuctionStatus.live) {
    throw new Error(`Cannot pause an auction in status "${before}" — only live auctions can be paused`)
  }
  await db.auction.update({
    where: { id },
    data: { status: AuctionStatus.paused, pausedAt: new Date(), pausedReason: reason },
  })
  await logAdminAction(session, "auction.pause", "auction", id, {
    before: { status: before },
    after: { status: AuctionStatus.paused },
    reason,
  })
  revalidate(id)
}

export async function resumeAuction(fd: FormData) {
  const session = await requireAdminAction()
  const id = reqString(fd, "id", 120)
  const before = await loadStatus(id)
  if (before !== AuctionStatus.paused) {
    throw new Error(`Cannot resume an auction in status "${before}" — only paused auctions can be resumed`)
  }
  await db.auction.update({
    where: { id },
    data: { status: AuctionStatus.live, pausedAt: null, pausedReason: null },
  })
  await logAdminAction(session, "auction.resume", "auction", id, {
    before: { status: before },
    after: { status: AuctionStatus.live },
  })
  revalidate(id)
}

const CANCELLABLE: readonly AuctionStatus[] = [
  AuctionStatus.scheduled,
  AuctionStatus.live,
  AuctionStatus.paused,
]

export async function cancelAuction(fd: FormData) {
  const session = await requireAdminAction()
  const id = reqString(fd, "id", 120)
  const reason = reqString(fd, "reason", 500)
  const before = await loadStatus(id)
  if (!CANCELLABLE.includes(before)) {
    throw new Error(`Cannot cancel an auction in status "${before}"`)
  }
  await db.auction.update({
    where: { id },
    data: { status: AuctionStatus.cancelled },
  })
  await logAdminAction(session, "auction.cancel", "auction", id, {
    before: { status: before },
    after: { status: AuctionStatus.cancelled },
    reason,
  })
  revalidate(id)
}
