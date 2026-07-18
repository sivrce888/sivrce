/**
 * POST /api/listings — publish a listing from the /add-listing wizard.
 * Auth-gated, same-origin only. First publish upgrades buyer → seller
 * (database session strategy picks the new role up on the next request).
 * ponytail: inline validation, matching /api/tours + /api/reviews precedent.
 */

import { randomUUID } from "node:crypto"

import { type NextRequest, NextResponse } from "next/server"

import { auth } from "@/auth"
import type { ListingDealType, ListingPropertyType } from "@/generated/prisma/client"
import { db } from "@/lib/db"
import { recomputeNearestPois } from "@/lib/geo/nearest-poi"
import { attributeListing } from "@/lib/map/attribution"
import { cityCenter, geocodeListingAddress, parseCoords } from "@/lib/map/geocode"
import { metroMeters } from "@/lib/map/pois"
import { linkListingMedia } from "@/lib/media/link-listing-media"
import { runSavedSearchAlerts } from "@/lib/saved-search-alerts"
import { indexListing } from "@/lib/search"
import { isSameOrigin } from "@/lib/security/origin"
import { canonicalizeDistrict } from "@/lib/district-canon"

export const dynamic = "force-dynamic"

const DEALS: Record<string, ListingDealType> = {
  sale: "buy",
  rent: "rent",
  daily: "daily",
  pledge: "mortgage",
}
const PROP_TYPES: Set<ListingPropertyType> = new Set([
  "apartment", "house", "villa", "commercial", "land", "hotel",
])
const PHONE_RE = /^\+995 \d{3} \d{2} \d{2} \d{2}$/

const asStr = (v: unknown, max: number): string | null =>
  typeof v === "string" && v.trim().length > 0 && v.length <= max ? v.trim() : null

const asInt = (v: unknown, min: number, max: number): number | null =>
  typeof v === "number" && Number.isInteger(v) && v >= min && v <= max ? v : null

const asStrList = (v: unknown, max: number, itemMax: number): string[] =>
  Array.isArray(v)
    ? v.filter((x): x is string => typeof x === "string" && x.length > 0 && x.length <= itemMax).slice(0, max)
    : []

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

  const title = asStr(body.title, 180)
  const dealType = typeof body.deal === "string" ? DEALS[body.deal] : undefined
  const propertyType =
    typeof body.propType === "string" && PROP_TYPES.has(body.propType as ListingPropertyType)
      ? (body.propType as ListingPropertyType)
      : undefined
  const city = asStr(body.city, 100)
  const districtRaw = asStr(body.district, 120)
  const district = districtRaw ? canonicalizeDistrict(districtRaw, city ?? undefined) || districtRaw : null
  const address = asStr(body.address, 240)
  const name = asStr(body.name, 160)
  const phone = typeof body.phone === "string" && PHONE_RE.test(body.phone) ? body.phone : null
  const area = typeof body.area === "number" && body.area > 0 && body.area <= 100_000 ? body.area : null
  const price = asInt(body.price, 0, 1_000_000_000)
  const negotiable = body.negotiable === true

  if (!title || !dealType || !propertyType || !city || !district || !address || !name || !phone || area === null) {
    return NextResponse.json({ ok: false, error: "invalid_fields" }, { status: 400 })
  }
  if ((price === null || price === 0) && !negotiable) {
    return NextResponse.json({ ok: false, error: "invalid_price" }, { status: 400 })
  }

  const rooms = asInt(body.rooms, 0, 50) ?? 0
  const baths = asInt(body.baths, 0, 50) ?? 0
  const floor = asInt(body.floor, 0, 200)
  const totalFloors = asInt(body.totalFloors, 0, 200)
  const images = asStrList(body.images, 16, 500).filter((u) => u.startsWith("https://"))
  const features = asStrList(body.features, 30, 60)
  const description = typeof body.description === "string" ? body.description.slice(0, 5000) : ""

  // Coords: client pin → geocode address → city center. Always Georgia-bounded.
  let coords = parseCoords(body.lat, body.lng)
  if (!coords) {
    const hit = await geocodeListingAddress({
      street: address,
      district,
      city,
    })
    coords = hit ? { lat: hit.lat, lng: hit.lng } : cityCenter(city)
  }
  const { lat, lng } = coords

  const owner = await db.user.findUnique({
    where: { id: session.user.id },
    select: { phone: true, phoneVerifiedAt: true },
  })
  const phoneVerified =
    owner?.phoneVerifiedAt && owner.phone === phone ? owner.phoneVerifiedAt : null

  const listing = await db.listing.create({
    data: {
      id: randomUUID(),
      ownerId: session.user.id,
      slug: `user-${randomUUID()}`,
      title,
      description,
      dealType,
      propertyType,
      price: price ?? 0,
      currency: "USD",
      pricePerSqm: price ? Math.round(price / area) : null,
      rooms,
      bedrooms: rooms,
      bathrooms: baths,
      area,
      floor,
      totalFloors,
      city,
      district,
      address,
      lat,
      lng,
      images,
      features,
      extendedFields: {
        negotiable,
        exchangeable: body.exchangeable === true,
        condition: asStr(body.condition, 60),
        buildingStatus: asStr(body.buildingStatus, 60),
        cadastral: asStr(body.cadastral, 60),
        cadastralPublic: body.cadastralPublic === true,
        video: asStr(body.video, 500),
        matterport: asStr(body.matterport, 500),
        messengers: asStrList(body.messengers, 5, 30),
        yardArea: asInt(body.yardArea, 0, 100_000),
        rentPeriod: asInt(body.rentPeriod, 1, 36),
        rentType: asStr(body.rentType, 60),
        guests: asInt(body.guests, 1, 50),
        areaUnit: body.areaUnit === "ha" ? "ha" : "m2",
        onlineView: body.onlineView === true,
      },
      agent: { name, phone, agency: "" },
      listingPhone: phone,
      listingPhoneVerifiedAt: phoneVerified,
      // Denormalized filter columns (2026-07-18) — kept in sync with the
      // feature vocabulary + author role at publish time.
      petsAllowed: features.includes("add.f.petsAllowed"),
      sellerType: session.user.role === "agency" || session.user.role === "agent" ? "agency" : "owner",
    },
    select: { id: true },
  })

  // Join building floor inventory — sold → unavailable flows through this link.
  // ponytail: fire-and-forget, same as search indexing below.
  void attributeListing(listing.id).catch(() => {})
  // PostGIS trigger fills location; nearest POI needs seeded `pois` table.
  void recomputeNearestPois(listing.id).catch(() => {})
  void linkListingMedia({
    listingId: listing.id,
    urls: images,
    uploadedBy: session.user.id,
  }).catch(() => {})

  // Index into Meilisearch. ponytail: fire-and-forget — a search outage must
  // never block publishing; the admin full-sync route is the backstop.
  void indexListing({
    id: listing.id,
    title, description, city, district, address,
    dealType, propertyType,
    price: price ?? 0, currency: "USD",
    priceUSD: price ?? 0,
    pricePerSqm: price ? Math.round(price / area) : undefined,
    verified: false,
    hasImages: images.length > 0,
    petsAllowed: features.includes("add.f.petsAllowed"),
    sellerType: session.user.role === "agency" || session.user.role === "agent" ? "agency" : "owner",
    condition: asStr(body.condition, 60) ?? undefined,
    buildingStatus: asStr(body.buildingStatus, 60) ?? undefined,
    area,
    rooms, bedrooms: rooms, bathrooms: baths,
    floor: floor ?? undefined, totalFloors: totalFloors ?? undefined,
    features, images, lat, lng,
    metroM: metroMeters(lat, lng),
    createdAt: new Date().toISOString(), status: "active",
    tier: "standard",
    tierRank: 0,
  }).catch(() => {})

  // Saved-search alerts: match + fan out (in-app/email/push). Fire-and-forget —
  // alert delivery must never block publishing, same as indexing above.
  void runSavedSearchAlerts(listing.id).catch(() => {})

  if (session.user.role === "buyer") {
    await db.user.update({ where: { id: session.user.id }, data: { role: "seller" } })
  }

  return NextResponse.json({ ok: true, id: listing.id }, { status: 201 })
}
