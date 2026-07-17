"use server"

import { revalidatePath } from "next/cache"

import type { Prisma } from "@/generated/prisma/client"
import { TourStatus } from "@/generated/prisma/enums"
import { logAdminAction } from "@/lib/admin/audit"
import { requireAdminAction } from "@/lib/admin/guard"
import { optString, reqEnum, reqString } from "@/lib/admin/validate"
import { db } from "@/lib/db"

const TOUR_STATUSES = Object.values(TourStatus)

export async function setTourStatus(fd: FormData) {
  const session = await requireAdminAction()
  const id = reqString(fd, "id", 120)
  const status = reqEnum(fd, "status", TOUR_STATUSES)
  const reason = optString(fd, "reason", 200)
  const before = await db.propertyTour.findUniqueOrThrow({
    where: { id },
    select: { status: true },
  })
  if (before.status !== TourStatus.pending && before.status !== TourStatus.confirmed) {
    throw new Error(`A tour in status "${before.status}" can no longer be changed`)
  }
  if (before.status === status) throw new Error("Tour is already in this status")
  const data: Prisma.PropertyTourUpdateInput = { status }
  if (status === TourStatus.confirmed) data.confirmedAt = new Date()
  if (status === TourStatus.cancelled_by_agent) {
    data.cancelledAt = new Date()
    data.cancelReason = reason
  }
  await db.propertyTour.update({ where: { id }, data })
  await logAdminAction(session, "tour.set_status", "property_tour", id, {
    before: { status: before.status },
    after: { status, reason },
  })
  revalidatePath("/admin/tours")
}
