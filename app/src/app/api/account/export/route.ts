/**
 * GET /api/account/export — the signed-in user's own data as one JSON file
 * (GDPR Art. 15 access + Art. 20 portability, DSGVO Auskunft/Datenübertragbarkeit).
 *
 * Auth-gated and self-scoped: every query is filtered by the session user id or
 * their verified email, so an export can only ever contain the caller's data.
 * Credentials are never included; records that name third parties (moderation,
 * complaints, fraud, security logs) stay on the manual request path.
 *
 * ponytail: one GET, capped arrays, no pagination, no background job — the
 * volumes here fit one response. Upgrade path: queue + emailed link if a single
 * account ever outgrows the caps in EXPORT_LIMITS.
 */

import { NextResponse } from "next/server"

import { auth } from "@/auth"
import {
  EXPORT_LIMITS,
  ON_REQUEST_ONLY,
  exportFilename,
  exportProfile,
  type ExportableUser,
} from "@/lib/account-export"
import { db } from "@/lib/db"

export const dynamic = "force-dynamic"

const desc = { createdAt: "desc" } as const

export async function GET() {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 })
  }

  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      id: true, name: true, email: true, emailVerified: true, phone: true,
      phoneVerifiedAt: true, image: true, role: true, trustScore: true,
      signupSource: true, lastSeenAt: true, createdAt: true, updatedAt: true,
    },
  })
  if (!user) {
    return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 })
  }

  const [
    savedListings, savedSearches, reviews, tours, bookings,
    inquiries, forumThreads, forumReplies, listings, behaviors,
  ] = await Promise.all([
    db.savedListing.findMany({ where: { userId }, orderBy: desc, take: EXPORT_LIMITS.savedListings }),
    db.savedSearch.findMany({ where: { userId }, orderBy: desc, take: EXPORT_LIMITS.savedSearches }),
    db.review.findMany({ where: { authorId: userId }, orderBy: desc, take: EXPORT_LIMITS.reviews }),
    db.propertyTour.findMany({ where: { userId }, orderBy: desc, take: EXPORT_LIMITS.tours }),
    db.dailyRentalBooking.findMany({ where: { guestId: userId }, orderBy: desc, take: EXPORT_LIMITS.bookings }),
    // Inquiries carry no user id — they are matched on the verified email the
    // buyer used, which is the same identity the session proves.
    db.inquiry.findMany({ where: { buyerEmail: user.email }, orderBy: desc, take: EXPORT_LIMITS.inquiries }),
    db.forumThread.findMany({ where: { ownerId: userId }, orderBy: desc, take: EXPORT_LIMITS.forumThreads }),
    db.forumReply.findMany({ where: { ownerId: userId }, orderBy: desc, take: EXPORT_LIMITS.forumReplies }),
    db.listing.findMany({ where: { ownerId: userId }, orderBy: desc, take: EXPORT_LIMITS.listings }),
    db.userBehavior.findMany({ where: { userId }, orderBy: desc, take: EXPORT_LIMITS.behaviors }),
  ])

  const body = {
    exportedAt: new Date().toISOString(),
    format: "sivrce-account-export/1",
    legalBasis: "GDPR Art. 15 (access) + Art. 20 (portability)",
    notIncluded: {
      credentials: "Passwords, OAuth tokens, sessions and passkeys are never exported.",
      thirdParty: `Available on request (these records name other people): ${ON_REQUEST_ONLY.join(", ")}.`,
      caps: EXPORT_LIMITS,
    },
    profile: exportProfile(user as ExportableUser),
    savedListings,
    savedSearches,
    reviews,
    propertyTours: tours,
    stayBookings: bookings,
    inquiries,
    forumThreads,
    forumReplies,
    listings,
    activity: behaviors,
  }

  return new NextResponse(JSON.stringify(body, null, 2), {
    headers: {
      "content-type": "application/json; charset=utf-8",
      "content-disposition": `attachment; filename="${exportFilename(userId)}"`,
      // Personal data: never cached by a CDN or a shared proxy.
      "cache-control": "private, no-store",
    },
  })
}
