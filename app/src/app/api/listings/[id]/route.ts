/**
 * GET/PATCH/DELETE /api/listings/[id] — owner manage.
 * GET ?edit=1 → wizard payload for /add-listing?edit=.
 * PATCH: status/title/price/description OR full publish body (same as POST).
 */

import { type NextRequest, NextResponse } from "next/server"
import type { Prisma } from "@/generated/prisma/client"

import { auth } from "@/auth"
import { ListingStatus } from "@/generated/prisma/client"
import { db } from "@/lib/db"
import { canonicalizeDistrict } from "@/lib/district-canon"
import { recomputeNearestPois } from "@/lib/geo/nearest-poi"
import {
  DEAL_FROM_DB,
  parsePublishBody,
} from "@/lib/listings-publish"
import { attributeListing, unattributeListing } from "@/lib/map/attribution"
import { cityCenter, geocodeListingAddress, parseCoords, splitStreetHouse } from "@/lib/map/geocode"
import { linkListingMedia } from "@/lib/media/link-listing-media"
import { reindexListingById } from "@/lib/payments"
import { runPriceWatchAlerts } from "@/lib/price-watches"
import { deleteListing as unindexListing } from "@/lib/search"
import { isSameOrigin } from "@/lib/security/origin"

export const dynamic = "force-dynamic"

const OWNER_STATUSES = new Set<ListingStatus>([
  ListingStatus.active,
  ListingStatus.withdrawn,
  ListingStatus.sold,
  ListingStatus.pending,
])

async function loadOwned(id: string, userId: string, role: string | undefined) {
  const listing = await db.listing.findFirst({
    where: { id, deletedAt: null },
    select: {
      id: true,
      ownerId: true,
      status: true,
      title: true,
      price: true,
      currency: true,
      description: true,
      images: true,
      extendedFields: true,
      listingPhone: true,
      listingPhoneVerifiedAt: true,
    },
  })
  if (!listing) return null
  if (listing.ownerId !== userId && role !== "admin") return "forbidden" as const
  return listing
}

/** Owner-only wizard hydrate for edit. */
export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  if (req.nextUrl.searchParams.get("edit") !== "1") {
    return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 })
  }
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 })
  }

  const { id } = await ctx.params
  if (!id || id.length > 120) {
    return NextResponse.json({ ok: false, error: "bad_id" }, { status: 400 })
  }

  const row = await db.listing.findFirst({
    where: { id, deletedAt: null },
    select: {
      id: true,
      ownerId: true,
      title: true,
      description: true,
      dealType: true,
      propertyType: true,
      price: true,
      city: true,
      district: true,
      address: true,
      lat: true,
      lng: true,
      area: true,
      rooms: true,
      bathrooms: true,
      floor: true,
      totalFloors: true,
      images: true,
      features: true,
      extendedFields: true,
      agent: true,
      listingPhone: true,
      listingPhoneVerifiedAt: true,
    },
  })
  if (!row) return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 })
  if (row.ownerId !== session.user.id && session.user.role !== "admin") {
    return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 })
  }

  const ext = (row.extendedFields as Record<string, unknown> | null) ?? {}
  const agent = (row.agent as { name?: string; phone?: string } | null) ?? {}
  const phone = row.listingPhone || agent.phone || ""
  const { street, houseNo } = splitStreetHouse(row.address)
  const deal = DEAL_FROM_DB[row.dealType] ?? "sale"
  const areaUnit = ext.areaUnit === "ha" ? "ha" : "m2"
  const areaNum = row.area
  const area =
    areaUnit === "ha" && areaNum > 0
      ? String(Math.round((areaNum / 10_000) * 1000) / 1000)
      : String(areaNum || "")

  return NextResponse.json({
    ok: true,
    listing: {
      id: row.id,
      title: row.title,
      deal,
      propType: row.propertyType,
      city: row.city,
      district: row.district,
      street,
      houseNo,
      lat: row.lat,
      lng: row.lng,
      cadastral: typeof ext.cadastral === "string" ? ext.cadastral : "",
      cadastralPublic: ext.cadastralPublic === true,
      area,
      areaUnit,
      yardArea: typeof ext.yardArea === "number" ? String(ext.yardArea) : "",
      rooms: row.rooms,
      baths: row.bathrooms,
      floor: row.floor != null ? String(row.floor) : "",
      totalFloors: row.totalFloors != null ? String(row.totalFloors) : "",
      condition: typeof ext.condition === "string" ? ext.condition : "",
      buildingStatus: typeof ext.buildingStatus === "string" ? ext.buildingStatus : "",
      project: typeof ext.project === "string" ? ext.project : "",
      floorType: typeof ext.floorType === "string" ? ext.floorType : "",
      kitchenArea: typeof ext.kitchenArea === "number" ? String(ext.kitchenArea) : "",
      features: row.features,
      rentPeriod: typeof ext.rentPeriod === "number" ? ext.rentPeriod : null,
      rentType: typeof ext.rentType === "string" ? ext.rentType : "",
      guests: typeof ext.guests === "number" ? ext.guests : 0,
      images: row.images,
      video: typeof ext.video === "string" ? ext.video : "",
      matterport: typeof ext.matterport === "string" ? ext.matterport : "",
      price: String(row.price || ""),
      negotiable: ext.negotiable === true,
      exchangeable: ext.exchangeable === true,
      description: row.description,
      onlineView: ext.onlineView === true || row.features.includes("add.f.onlineView"),
      name: agent.name || "",
      phone,
      phoneVerified: Boolean(row.listingPhoneVerifiedAt),
      messengers: Array.isArray(ext.messengers)
        ? ext.messengers.filter((x): x is string => typeof x === "string")
        : ["WhatsApp", "Viber"],
    },
  })
}

export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  if (!isSameOrigin(req)) {
    return NextResponse.json({ ok: false, error: "bad_origin" }, { status: 403 })
  }
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 })
  }

  const { id } = await ctx.params
  if (!id || id.length > 120) {
    return NextResponse.json({ ok: false, error: "bad_id" }, { status: 400 })
  }

  const owned = await loadOwned(id, session.user.id, session.user.role)
  if (owned === null) return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 })
  if (owned === "forbidden") {
    return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 })
  }

  let body: Record<string, unknown>
  try {
    body = (await req.json()) as Record<string, unknown>
  } catch {
    return NextResponse.json({ ok: false, error: "bad_json" }, { status: 400 })
  }

  // Full wizard save (same body as POST /api/listings).
  if (typeof body.deal === "string" || typeof body.propType === "string") {
    const parsed = parsePublishBody(body)
    if (!parsed.ok) {
      return NextResponse.json({ ok: false, error: parsed.error }, { status: 400 })
    }
    const p = parsed.data
    const district = canonicalizeDistrict(p.district, p.city) || p.district

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
    // Keep listing verification when the phone number did not change.
    const phoneVerified =
      owner?.phoneVerifiedAt && owner.phone === p.phone
        ? owner.phoneVerifiedAt
        : owned.listingPhone === p.phone && owned.listingPhoneVerifiedAt
          ? owned.listingPhoneVerifiedAt
          : null

    const prevExt = (owned.extendedFields as Record<string, unknown> | null) ?? {}
    const beforePrice = owned.price
    const prevImages = owned.images ?? []

    await db.listing.update({
      where: { id },
      data: {
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
        extendedFields: { ...prevExt, ...p.extendedFields } as Prisma.InputJsonValue,
        agent: { name: p.name, phone: p.phone, agency: "" },
        listingPhone: p.phone,
        listingPhoneVerifiedAt: phoneVerified,
        petsAllowed: p.features.includes("add.f.petsAllowed"),
      },
    })

    if (p.price !== beforePrice) {
      const eventType = p.price < beforePrice ? "price_drop" : "price_increase"
      void db.listingPriceEvent
        .create({
          data: {
            listingId: id,
            eventType,
            price: p.price,
            previousPrice: beforePrice,
            currency: owned.currency,
          },
        })
        .catch((e) => console.error("[listings] price event:", (e as Error).message))
      if (p.price < beforePrice) {
        void runPriceWatchAlerts(id, beforePrice, p.price, owned.currency)
      }
    }

    const newUrls = p.images.filter((u) => !prevImages.includes(u))
    if (newUrls.length) {
      void linkListingMedia({
        listingId: id,
        urls: newUrls,
        uploadedBy: session.user.id,
      }).catch(() => {})
    }

    void attributeListing(id).catch(() => {})
    void recomputeNearestPois(id).catch(() => {})
    void reindexListingById(id)

    return NextResponse.json({ ok: true, id })
  }

  const data: {
    status?: ListingStatus
    title?: string
    price?: number
    description?: string
    soldAt?: Date | null
  } = {}

  if (typeof body.status === "string") {
    if (!OWNER_STATUSES.has(body.status as ListingStatus)) {
      return NextResponse.json({ ok: false, error: "bad_status" }, { status: 400 })
    }
    data.status = body.status as ListingStatus
    if (data.status === ListingStatus.sold) data.soldAt = new Date()
    else if (owned.status === ListingStatus.sold) data.soldAt = null
  }

  if (typeof body.title === "string") {
    const t = body.title.trim()
    if (t.length < 3 || t.length > 180) {
      return NextResponse.json({ ok: false, error: "bad_title" }, { status: 400 })
    }
    data.title = t
  }

  if (typeof body.price === "number") {
    if (!Number.isInteger(body.price) || body.price < 0 || body.price > 1_000_000_000) {
      return NextResponse.json({ ok: false, error: "bad_price" }, { status: 400 })
    }
    data.price = body.price
  }

  if (typeof body.description === "string") {
    const d = body.description.trim()
    if (d.length > 20_000) {
      return NextResponse.json({ ok: false, error: "bad_description" }, { status: 400 })
    }
    data.description = d
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ ok: false, error: "empty" }, { status: 400 })
  }

  const beforeStatus = owned.status
  const beforePrice = owned.price
  await db.listing.update({ where: { id }, data })

  if (typeof data.price === "number" && data.price !== beforePrice) {
    const eventType = data.price < beforePrice ? "price_drop" : "price_increase"
    void db.listingPriceEvent
      .create({
        data: {
          listingId: id,
          eventType,
          price: data.price,
          previousPrice: beforePrice,
          currency: owned.currency,
        },
      })
      .catch((e) => console.error("[listings] price event:", (e as Error).message))
    if (data.price < beforePrice) {
      void runPriceWatchAlerts(id, beforePrice, data.price, owned.currency)
    }
  }

  if (data.status && data.status !== beforeStatus) {
    if (beforeStatus === "active" && data.status !== "active") await unattributeListing(id)
    else if (beforeStatus !== "active" && data.status === "active") await attributeListing(id)
  }

  void reindexListingById(id)

  return NextResponse.json({
    ok: true,
    id,
    status: data.status,
    title: data.title,
    price: data.price,
    description: data.description,
  })
}

export async function DELETE(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  if (!isSameOrigin(req)) {
    return NextResponse.json({ ok: false, error: "bad_origin" }, { status: 403 })
  }
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 })
  }

  const { id } = await ctx.params
  if (!id || id.length > 120) {
    return NextResponse.json({ ok: false, error: "bad_id" }, { status: 400 })
  }

  const owned = await loadOwned(id, session.user.id, session.user.role)
  if (owned === null) return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 })
  if (owned === "forbidden") {
    return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 })
  }

  const deletedAt = new Date()
  await db.listing.update({ where: { id }, data: { deletedAt } })
  await unattributeListing(id)
  void unindexListing(id)

  return NextResponse.json({ ok: true, id, deletedAt: deletedAt.toISOString() })
}
