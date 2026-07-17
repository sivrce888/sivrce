"use server"

import { revalidatePath } from "next/cache"

import type { Prisma } from "@/generated/prisma/client"
import { BookingStatus } from "@/generated/prisma/enums"
import { logAdminAction } from "@/lib/admin/audit"
import { requireAdminAction } from "@/lib/admin/guard"
import { optString, reqEnum, reqString } from "@/lib/admin/validate"
import { db } from "@/lib/db"

/**
 * Admin-reachable transitions. The enum has no platform/admin cancel value, so
 * an admin cancel records cancelled_by_host (mirrors tours, where admin cancel
 * writes cancelled_by_agent) plus the audit trail naming the real actor.
 */
const ALLOWED: Record<BookingStatus, readonly BookingStatus[]> = {
  [BookingStatus.pending]: [BookingStatus.confirmed, BookingStatus.cancelled_by_host],
  [BookingStatus.confirmed]: [BookingStatus.cancelled_by_host],
  [BookingStatus.cancelled_by_guest]: [],
  [BookingStatus.cancelled_by_host]: [],
  [BookingStatus.no_show]: [],
  [BookingStatus.completed]: [],
}

export async function setDailyBookingStatus(fd: FormData) {
  const session = await requireAdminAction()
  const id = reqString(fd, "id", 120)
  const status = reqEnum(fd, "status", Object.values(BookingStatus))
  const reason = optString(fd, "reason", 200)
  const before = await db.dailyRentalBooking.findUniqueOrThrow({
    where: { id },
    select: { status: true },
  })
  if (before.status === status) throw new Error("Booking is already in this status")
  if (!ALLOWED[before.status].includes(status)) {
    throw new Error(`A booking in status "${before.status}" cannot be moved to "${status}"`)
  }
  const data: Prisma.DailyRentalBookingUpdateInput = { status }
  if (status === BookingStatus.cancelled_by_host) {
    data.cancelledAt = new Date()
    data.cancelReason = reason
  }
  await db.dailyRentalBooking.update({ where: { id }, data })
  await logAdminAction(session, "rentals.booking.set_status", "daily_rental_booking", id, {
    before: { status: before.status },
    after: { status, reason },
  })
  revalidatePath("/admin/rentals")
}
