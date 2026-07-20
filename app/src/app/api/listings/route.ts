/**
 * POST /api/listings — publish a listing from the /add-listing wizard.
 * Auth-gated, same-origin only. First publish upgrades buyer → seller
 * (database session strategy picks the new role up on the next request).
 * ponytail: shared parse with PATCH edit via listings-publish.
 */

import { randomUUID } from "node:crypto"

import { type NextRequest, NextResponse } from "next/server"

import { auth } from "@/auth"
import type { Prisma } from "@/generated/prisma/client"
import { db } from "@/lib/db"
import { recomputeNearestPois } from "@/lib/geo/nearest-poi"
import { attributeListing } from "@/lib/map/attribution"
import { cityCenter, geocodeListingAddress, parseCoords } from "@/lib/map/geocode"
import { metroMeters } from "@/lib/map/pois"
import { linkListingMedia } from "@/lib/media/link-listing-media"
import { parsePublishBody } from "@/lib/listings-publish"
import { runSavedSearchAlerts } from "@/lib/saved-search-alerts"
import { indexListing } from "@/lib/search"
import { isSameOrigin } from "@/lib/security/origin"
import { canonicalizeDistrict } from "@/lib/district-canon"

export const dynamic = "force-dynamic"

export async function POST(req: NextRequest) {
  if (!isSameOrigin(req)) {
    return NextResponse.json({ ok: false, error: "bad_origin" }, { status: 403 })
  }
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 })
  }

  let body: Record<string, unknown>
  try {
    body = (await req.json()) as Record<string, unknown>
  } catch {
    return NextResponse.json({ ok: false, error: "bad_json" }, { status: 400 })
  }

  const parsed = parsePublishBody(body)
  if (!parsed.ok) {
    return NextResponse.json({ ok: false, error: parsed.error }, { status: 400 })
  }
  const p = parsed.data
  const district = canonicalizeDistrict(p.district, p.city) || p.district

  // Coords: client pin → geocode address → city center. Always Georgia-bounded.
  let coords = parseCoords(p.lat, p.lng)
  if (!coords) {
    const hit = await geocodeListingAddress({
      street: p.address,
      district,
      city: p.city,
    })
    coords = hit ? { lat: hit.lat, lng: hit.lng } : cityCenter(p.city)
  }
  const { lat, lng } = coords

  const owner = await db.user.findUnique({
    where: { id: session.user.id },
    select: { phone: true, phoneVerifiedAt: true },
  })
  const phoneVerified =
    owner?.phoneVerifiedAt && owner.phone === p.phone ? owner.phoneVerifiedAt : null

  const listing = await db.listing.create({
    data: {
      id: randomUUID(),
      ownerId: session.user.id,
      slug: `user-${randomUUID()}`,
      title: p.title,
      description: p.description,
      dealType: p.dealType,
      propertyType: p.propertyType,
      price: p.price,
      currency: "USD",
      pricePerSqm: p.price ? Math.round(p.price / p.area) : null,
      rooms: p.rooms,
      bedrooms: p.rooms,
      bathrooms: p.baths,
      area: p.area,
      floor: p.floor,
      totalFloors: p.totalFloors,
      city: p.city,
      district,
      address: p.address,
      lat,
      lng,
      images: p.images,
      features: p.features,
      extendedFields: p.extendedFields as Prisma.InputJsonValue,
      agent: { name: p.name, phone: p.phone, agency: "" },
      listingPhone: p.phone,
      listingPhoneVerifiedAt: phoneVerified,
      petsAllowed: p.features.includes("add.f.petsAllowed"),
      sellerType: session.user.role === "agency" || session.user.role === "agent" ? "agency" : "owner",
    },
    select: { id: true },
  })

  void attributeListing(listing.id).catch(() => {})
  void recomputeNearestPois(listing.id).catch(() => {})
  void linkListingMedia({
    listingId: listing.id,
    urls: p.images,
    uploadedBy: session.user.id,
  }).catch(() => {})

  void indexListing({
    id: listing.id,
    title: p.title,
    description: p.description,
    city: p.city,
    district,
    address: p.address,
    dealType: p.dealType,
    propertyType: p.propertyType,
    price: p.price,
    currency: "USD",
    priceUSD: p.price,
    pricePerSqm: p.price ? Math.round(p.price / p.area) : undefined,
    verified: false,
    hasImages: p.images.length > 0,
    petsAllowed: p.features.includes("add.f.petsAllowed"),
    sellerType: session.user.role === "agency" || session.user.role === "agent" ? "agency" : "owner",
    condition: (p.extendedFields.condition as string | null) ?? undefined,
    buildingStatus: (p.extendedFields.buildingStatus as string | null) ?? undefined,
    project: (p.extendedFields.project as string | null) ?? undefined,
    floorType: (p.extendedFields.floorType as string | null) ?? undefined,
    area: p.area,
    rooms: p.rooms,
    bedrooms: p.rooms,
    bathrooms: p.baths,
    floor: p.floor ?? undefined,
    totalFloors: p.totalFloors ?? undefined,
    features: p.features,
    images: p.images,
    lat,
    lng,
    metroM: metroMeters(lat, lng),
    createdAt: new Date().toISOString(),
    status: "active",
    tier: "standard",
    tierRank: 0,
  }).catch(() => {})

  void runSavedSearchAlerts(listing.id).catch(() => {})

  if (session.user.role === "buyer") {
    await db.user.update({ where: { id: session.user.id }, data: { role: "seller" } })
  }

  return NextResponse.json({ ok: true, id: listing.id }, { status: 201 })
}
