"use server"

import { revalidatePath } from "next/cache"

import { BookingStatus } from "@/generated/prisma/enums"
import { logAdminAction } from "@/lib/admin/audit"
import { requireAdminAction } from "@/lib/admin/guard"
import { optString, reqEnum, reqString } from "@/lib/admin/validate"
import { transitionStayBooking } from "@/lib/stay-create"
import { db } from "@/lib/db"

/**
 * Admin-reachable transitions. The enum has no platform/admin cancel value, so
 * an admin cancel records cancelled_by_host (mirrors tours, where admin cancel
 * writes cancelled_by_agent) plus the audit trail naming the real actor.
 * The state machine + confirm overlap re-check + advisory lock live in
 * transitionStayBooking, shared with the seller actions.
 */
export async function setDailyBookingStatus(fd: FormData) {
  const session = await requireAdminAction()
  const id = reqString(fd, "id", 120)
  const status = reqEnum(fd, "status", Object.values(BookingStatus))
  const reason = optString(fd, "reason", 200)
  const before = await db.dailyRentalBooking.findUniqueOrThrow({
    where: { id },
    select: { status: true },
  })
  await db.$transaction((tx) => transitionStayBooking(tx, id, status, { cancelReason: reason ?? undefined }))
  await logAdminAction(session, "rentals.booking.set_status", "daily_rental_booking", id, {
    before: { status: before.status },
    after: { status, reason },
  })
  revalidatePath("/admin/rentals")
}
