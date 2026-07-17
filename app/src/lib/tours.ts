/**
 * Tour booking — thin adapter over Prisma PropertyTour model.
 * ponytail: simple CRUD. Upgrade path: calendar sync (Google/Outlook) when agents request it.
 */

import { db } from "@/lib/db"
import type { TourStatus } from "@/generated/prisma/client"

export interface CreateTourInput {
  listingId: string
  agentId: string
  guestId?: string
  tourDate: Date
  tourTime: string
  guestName: string
  guestPhone: string
  guestEmail?: string
  guestNotes?: string
}

export async function createTour(input: CreateTourInput) {
  return db.propertyTour.create({ data: input })
}

export async function getToursByUser(userId: string) {
  return db.propertyTour.findMany({
    where: { guestId: userId },
    include: { listing: { select: { title: true, slug: true, images: true } }, agent: { select: { name: true, slug: true } } },
    orderBy: { tourDate: "desc" },
    take: 50,
  })
}

export async function getToursByAgent(agentId: string, status?: TourStatus) {
  return db.propertyTour.findMany({
    where: { agentId, ...(status ? { status } : {}) },
    orderBy: { tourDate: "desc" },
    take: 100,
  })
}

/** Get available time slots for an agent on a given date. */
export async function getAvailableSlots(agentId: string, date: Date) {
  const dayOfWeek = date.getDay()
  const availabilities = await db.tourAvailability.findMany({
    where: { agentId, dayOfWeek, isActive: true },
  })
  const overrides = await db.tourDateOverride.findMany({
    where: { agentId, date },
  })
  // ponytail: naive block-check. Full slot calculation later if agents demand it.
  if (overrides.some((o) => o.isBlocked)) return []
  return availabilities.map((a) => ({ start: a.startTime, end: a.endTime, slotDuration: a.slotDuration }))
}

export async function updateTourStatus(tourId: string, status: TourStatus, reason?: string) {
  const data: Record<string, unknown> = { status }
  if (status === "confirmed") data.confirmedAt = new Date()
  if (status === "cancelled_by_agent" || status === "cancelled_by_guest") {
    data.cancelledAt = new Date()
    if (reason) data.cancelReason = reason
  }
  return db.propertyTour.update({ where: { id: tourId }, data })
}
