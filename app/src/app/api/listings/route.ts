/**
 * POST /api/listings — publish a listing from the /add-listing wizard.
 * Auth-gated, same-origin only. First publish upgrades buyer → seller
 * (database session strategy picks the new role up on the next request).
 * ponytail: inline validation, matching /api/tours + /api/reviews precedent.
 */

import { randomUUID } from "node:crypto"

import { type NextRequest, NextResponse } from "next/server"

import { auth } from "@/auth"
import { LISTINGS } from "@/data/listings"
import type { ListingDealType, ListingPropertyType } from "@/generated/prisma/client"
import { db } from "@/lib/db"
import { isSameOrigin } from "@/lib/security/origin"

export const dynamic = "force-dynamic"

const DEALS: Record<string, ListingDealType> = {
  sale: "buy",
  rent: "rent",
  daily: "daily",
  pledge: "mortgage",
}
const PROP_TYPES = new Set<ListingPropertyType>(["apartment", "house", "commercial", "land"])
const PHONE_RE = /^\+995 \d{3} \d{2} \d{2} \d{2}$/
const TBILISI = { lat: 41.7151, lng: 44.8271 }

/** City center = catalog average. ponytail: replace with geocoding when the address map picker lands. */
function cityCoords(city: string): { lat: number; lng: number } {
  const same = LISTINGS.filter((l) => l.city === city)
  if (same.length === 0) return TBILISI
  return {
    lat: same.reduce((s, l) => s + l.coords.lat, 0) / same.length,
    lng: same.reduce((s, l) => s + l.coords.lng, 0) / same.length,
  }
}

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
  const district = asStr(body.district, 120)
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
  const images = asStrList(body.images, 16, 500).filter((u) => u.startsWith("https://"))
  const features = asStrList(body.features, 30, 60)
  const description = typeof body.description === "string" ? body.description.slice(0, 5000) : ""
  const { lat, lng } = cityCoords(city)

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
      floor: asInt(body.floor, 0, 200),
      totalFloors: asInt(body.totalFloors, 0, 200),
      city,
      district,
      address,
      lat,
      lng,
      images,
      features,
      extendedFields: {
        negotiable,
        condition: asStr(body.condition, 60),
        buildingStatus: asStr(body.buildingStatus, 60),
        cadastral: asStr(body.cadastral, 60),
        video: asStr(body.video, 500),
        messengers: asStrList(body.messengers, 5, 30),
      },
      agent: { name, phone, agency: "" },
      listingPhone: phone,
    },
    select: { id: true },
  })

  if (session.user.role === "buyer") {
    await db.user.update({ where: { id: session.user.id }, data: { role: "seller" } })
  }

  return NextResponse.json({ ok: true, id: listing.id }, { status: 201 })
}
