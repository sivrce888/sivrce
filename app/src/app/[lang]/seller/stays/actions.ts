"use server"

import { revalidatePath } from "next/cache"

import { BookingStatus } from "@/generated/prisma/enums"
import { requireRole } from "@/lib/guards"
import { transitionStayBooking } from "@/lib/stay-create"
import { db } from "@/lib/db"

/** Seller-reachable transitions: confirm a request or cancel as host. */
const ALLOWED = [BookingStatus.confirmed, BookingStatus.cancelled_by_host] as const

export async function sellerSetStayStatus(fd: FormData) {
  const user = await requireRole("seller", "/seller")
  const id = String(fd.get("id") ?? "").slice(0, 120)
  const raw = String(fd.get("status") ?? "")
  const reason = fd.get("reason")?.toString().slice(0, 200)
  const status = raw as BookingStatus
  if (!id || !(ALLOWED as readonly string[]).includes(raw)) {
    throw new Error("Invalid request")
  }
  // Ownership gate: only bookings on the seller's own daily listings.
  const owned = await db.dailyRentalBooking.findFirst({
    where: { id, listing: { ownerId: user.id, dealType: "daily", deletedAt: null } },
    select: { id: true },
  })
  if (!owned) throw new Error("Booking not found")
  await db.$transaction((tx) => transitionStayBooking(tx, id, status, { cancelReason: reason }))
  revalidatePath("/seller/stays")
}
