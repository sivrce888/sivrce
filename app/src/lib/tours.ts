/**
 * Tour booking — thin adapter over Prisma PropertyTour model.
 * ponytail: simple CRUD + slot math. Upgrade path: calendar sync (Google/Outlook) when agents request it.
 */

import { db } from "@/lib/db"
import type { TourStatus } from "@/generated/prisma/client"

export interface CreateTourInput {
  listingId: string
  agentId: string | null
  guestId?: string
  userId?: string | null
  tourDate: Date
  tourTime: string
  guestName: string
  guestPhone: string
  guestEmail?: string
  guestNotes?: string
}

/** Fallback booking window when an agent (or owner-hosted listing) has no availability configured. */
const DEFAULT_WINDOW = { start: "10:00", end: "18:00", slotDuration: 30 }

/** Minutes since midnight for "HH:MM". */
function toMin(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number)
  return h * 60 + m
}

function toHHMM(min: number): string {
  return `${String(Math.floor(min / 60)).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`
}

/** Current time in Asia/Tbilisi (UTC+4, no DST) as a UTC-shifted Date — use getUTC* accessors. */
function tbilisiNow(): Date {
  return new Date(Date.now() + 4 * 3600_000)
}

export async function createTour(input: CreateTourInput) {
  const { guestId, userId, ...rest } = input
  // ponytail: Prisma requires guestId. Use a placeholder when anonymous.
  return db.propertyTour.create({
    data: { ...rest, guestId: guestId ?? input.guestPhone, userId: userId ?? null },
  })
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

/**
 * Resolve the agent profile for a listing: direct JSON id → name match → owner's profile.
 * NULL agent = owner-hosted tour (private seller), shown in /seller/tours.
 */
export async function resolveListingAgentId(listingId: string): Promise<{ agentId: string | null } | null> {
  const listing = await db.listing.findUnique({
    where: { id: listingId },
    select: { agent: true, ownerId: true },
  })
  if (!listing) return null

  const agentData = listing.agent as { id?: string; name?: string } | null
  if (agentData?.id) return { agentId: agentData.id }

  if (agentData?.name) {
    const profile = await db.agentProfile.findFirst({
      where: { name: agentData.name },
      select: { id: true },
    })
    if (profile) return { agentId: profile.id }
  }

  if (listing.ownerId) {
    const profile = await db.agentProfile.findFirst({
      where: { ownerId: listing.ownerId, deletedAt: null },
      select: { id: true },
    })
    if (profile) return { agentId: profile.id }
  }

  return { agentId: null }
}

/**
 * Bookable start times ("HH:MM") for a listing on a given date (UTC-midnight Date).
 * Weekly TourAvailability windows + TourDateOverride blocks − already-booked slots.
 * Agents with no availability configured fall back to DEFAULT_WINDOW so booking never dead-ends.
 */
export async function getBookableSlots(listingId: string, agentId: string | null, date: Date): Promise<string[]> {
  const dayOfWeek = date.getUTCDay()

  const [availabilities, overrides, booked] = await Promise.all([
    agentId
      ? db.tourAvailability.findMany({ where: { agentId, dayOfWeek, isActive: true } })
      : Promise.resolve([]),
    agentId
      ? db.tourDateOverride.findMany({ where: { agentId, date } })
      : Promise.resolve([]),
    db.propertyTour.findMany({
      where: {
        tourDate: date,
        status: { in: ["pending", "confirmed"] },
        ...(agentId ? { agentId } : { listingId }),
      },
      select: { tourTime: true },
    }),
  ])

  if (overrides.some((o) => o.isBlocked)) return []

  // Any configured availability at all (any weekday) decides fallback vs real windows.
  let windows = availabilities
  if (agentId && windows.length === 0) {
    const anyConfigured = await db.tourAvailability.count({ where: { agentId } })
    if (anyConfigured > 0) return [] // agent works, just not this weekday
  }

  const taken = new Set(booked.map((b) => b.tourTime))
  const slots: string[] = []
  const push = (start: string, end: string, dur: number) => {
    for (let m = toMin(start); m + dur <= toMin(end); m += dur) {
      const hhmm = toHHMM(m)
      if (!taken.has(hhmm)) slots.push(hhmm)
    }
  }

  if (windows.length === 0) {
    push(DEFAULT_WINDOW.start, DEFAULT_WINDOW.end, DEFAULT_WINDOW.slotDuration)
  } else {
    for (const w of windows) push(w.startTime, w.endTime, w.slotDuration)
  }

  // Same-day bookings: keep a 60-minute lead time (Tbilisi clock).
  const now = tbilisiNow()
  const todayTbilisi = toHHMM(now.getUTCHours()) // only used via min compare below
  void todayTbilisi
  if (date.getTime() === Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())) {
    const minLead = now.getUTCHours() * 60 + now.getUTCMinutes() + 60
    return slots.filter((s) => toMin(s) >= minLead)
  }
  return slots
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
