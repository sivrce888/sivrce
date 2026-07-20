/**
 * Shared parse for POST /api/listings (create) and PATCH /api/listings/[id] (full edit).
 * ponytail: one body shape for add + edit wizards.
 */

import type { ListingDealType, ListingPropertyType } from "@/generated/prisma/client"

export const DEAL_TO_DB: Record<string, ListingDealType> = {
  sale: "buy",
  rent: "rent",
  daily: "daily",
  pledge: "mortgage",
}

export const DEAL_FROM_DB: Record<string, string> = {
  buy: "sale",
  rent: "rent",
  daily: "daily",
  mortgage: "pledge",
}

const PROP_TYPES: Set<ListingPropertyType> = new Set([
  "apartment", "house", "villa", "commercial", "land", "hotel",
])

export const PHONE_RE = /^\+995 \d{3} \d{2} \d{2} \d{2}$/

const asStr = (v: unknown, max: number): string | null =>
  typeof v === "string" && v.trim().length > 0 && v.length <= max ? v.trim() : null

const asInt = (v: unknown, min: number, max: number): number | null =>
  typeof v === "number" && Number.isInteger(v) && v >= min && v <= max ? v : null

const asStrList = (v: unknown, max: number, itemMax: number): string[] =>
  Array.isArray(v)
    ? v.filter((x): x is string => typeof x === "string" && x.length > 0 && x.length <= itemMax).slice(0, max)
    : []

export type PublishParsed = {
  title: string
  dealType: ListingDealType
  /** Wizard key: sale | rent | daily | pledge */
  deal: string
  propertyType: ListingPropertyType
  city: string
  district: string
  address: string
  name: string
  phone: string
  area: number
  price: number
  negotiable: boolean
  rooms: number
  baths: number
  floor: number | null
  totalFloors: number | null
  images: string[]
  features: string[]
  description: string
  lat: unknown
  lng: unknown
  extendedFields: Record<string, unknown>
}

export type ParseFail = { ok: false; error: string }
export type ParseOk = { ok: true; data: PublishParsed }

export function parsePublishBody(body: Record<string, unknown>): ParseOk | ParseFail {
  const title = asStr(body.title, 180)
  const dealKey = typeof body.deal === "string" ? body.deal : ""
  const dealType = DEAL_TO_DB[dealKey]
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
    return { ok: false, error: "invalid_fields" }
  }
  if ((price === null || price === 0) && !negotiable) {
    return { ok: false, error: "invalid_price" }
  }

  const images = asStrList(body.images, 16, 500).filter((u) => u.startsWith("https://"))
  if (images.length < 1) {
    return { ok: false, error: "photos_required" }
  }

  const features = asStrList(body.features, 30, 60)

  return {
    ok: true,
    data: {
      title,
      dealType,
      deal: dealKey,
      propertyType,
      city,
      district,
      address,
      name,
      phone,
      area,
      price: price ?? 0,
      negotiable,
      rooms: asInt(body.rooms, 0, 50) ?? 0,
      baths: asInt(body.baths, 0, 50) ?? 0,
      floor: asInt(body.floor, 0, 200),
      totalFloors: asInt(body.totalFloors, 0, 200),
      images,
      features,
      description: typeof body.description === "string" ? body.description.slice(0, 5000) : "",
      lat: body.lat,
      lng: body.lng,
      extendedFields: {
        negotiable,
        exchangeable: body.exchangeable === true,
        condition: asStr(body.condition, 60),
        buildingStatus: asStr(body.buildingStatus, 60),
        project: asStr(body.project, 60),
        floorType: asStr(body.floorType, 60),
        kitchenArea:
          typeof body.kitchenArea === "number" && body.kitchenArea > 0 && body.kitchenArea <= 500
            ? body.kitchenArea
            : null,
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
    },
  }
}

/** Self-check: `npx tsx src/lib/listings-publish.check.ts` */
export function _checkParsePublishBody() {
  const bad = parsePublishBody({})
  if (bad.ok) throw new Error("empty should fail")
  const good = parsePublishBody({
    title: "იყიდება ბინა",
    deal: "sale",
    propType: "apartment",
    city: "თბილისი",
    district: "ვაკე",
    address: "ჭავჭავაძის 12",
    name: "გიორგი",
    phone: "+995 555 12 34 56",
    area: 80,
    price: 100000,
    images: ["https://cdn.example.com/a.webp"],
    features: ["add.f.elevator"],
    description: "ok",
    negotiable: false,
  })
  if (!good.ok) throw new Error(good.error)
  if (good.data.dealType !== "buy") throw new Error("deal map")
  if (DEAL_FROM_DB.buy !== "sale") throw new Error("reverse deal")
}
