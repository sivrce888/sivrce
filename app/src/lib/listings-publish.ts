/**
 * Shared parse for POST /api/listings (create) and PATCH /api/listings/[id] (full edit).
 * ponytail: one body shape for add + edit wizards.
 */

import type { ListingDealType, ListingPropertyType } from "@/generated/prisma/client"
import type { DealType, PropType } from "@/data/listings"
import { featuresFor } from "@/lib/add-listing-fields"
import { sanitizeListingVideoUrl } from "@/lib/listing-video"

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
  beds: number
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

  const allow = new Set<string>(featuresFor(propertyType as PropType, dealKey as DealType, city))
  allow.add("add.f.onlineView")
  const features = asStrList(body.features, 50, 60).filter((f) => allow.has(f))
  const projectSlug = asStr(body.projectSlug, 140)

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
      beds: asInt(body.beds, 0, 50) ?? 0,
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
        ...(projectSlug ? { projectSlug } : {}),
        floorType: asStr(body.floorType, 60),
        kitchenArea:
          typeof body.kitchenArea === "number" && body.kitchenArea > 0 && body.kitchenArea <= 500
            ? body.kitchenArea
            : null,
        cadastral: asStr(body.cadastral, 60),
        cadastralPublic: body.cadastralPublic === true,
        video: sanitizeListingVideoUrl(body.video),
        matterport: asStr(body.matterport, 500),
        messengers: asStrList(body.messengers, 5, 30),
        yardArea: asInt(body.yardArea, 0, 100_000),
        rentPeriod: asInt(body.rentPeriod, 1, 36),
        rentType: asStr(body.rentType, 60),
        guests: asInt(body.guests, 1, 50),
        areaUnit: body.areaUnit === "ha" ? "ha" : "m2",
        onlineView: body.onlineView === true,
        exclusive: body.exclusive === true,
        sivrceExclusive: body.sivrceExclusive === true,
      },
    },
  }
}

/** Store both: bedrooms first, total rooms second. */
export function persistRoomCounts(rooms: number, beds: number): { rooms: number; bedrooms: number } {
  return { rooms, bedrooms: beds }
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
  if ("projectSlug" in good.data.extendedFields) throw new Error("no slug leak")
  const withSlug = parsePublishBody({
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
    projectSlug: "axis-towers",
    negotiable: false,
  })
  if (!withSlug.ok) throw new Error(withSlug.error)
  if (withSlug.data.extendedFields.projectSlug !== "axis-towers") throw new Error("projectSlug")
  const fakeSea = parsePublishBody({
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
    features: ["add.f.elevator", "add.f.seaView", "add.f.loggia", "junk"],
    description: "ok",
    negotiable: false,
  })
  if (!fakeSea.ok) throw new Error(fakeSea.error)
  if (fakeSea.data.features.includes("add.f.seaView")) throw new Error("tbilisi sea")
  if (fakeSea.data.features.includes("junk")) throw new Error("junk feat")
  if (!fakeSea.data.features.includes("add.f.elevator")) throw new Error("keep elevator")
  if (!fakeSea.data.features.includes("add.f.loggia")) throw new Error("keep loggia")
  const batumi = parsePublishBody({
    title: "იყიდება ბინა",
    deal: "sale",
    propType: "apartment",
    city: "ბათუმი",
    district: "ბათუმი",
    address: "ნინოშვილი 1",
    name: "გიორგი",
    phone: "+995 555 12 34 56",
    area: 80,
    price: 100000,
    images: ["https://cdn.example.com/a.webp"],
    features: ["add.f.seaView"],
    description: "ok",
    negotiable: false,
  })
  if (!batumi.ok) throw new Error(batumi.error)
  if (!batumi.data.features.includes("add.f.seaView")) throw new Error("batumi sea")
  const sale = persistRoomCounts(3, 2)
  if (sale.rooms !== 3 || sale.bedrooms !== 2) throw new Error("sale both")
  const daily = persistRoomCounts(1, 2)
  if (daily.rooms !== 1 || daily.bedrooms !== 2) throw new Error("daily both")
  if (good.data.extendedFields.exclusive !== false) throw new Error("exclusive default")
  if (good.data.extendedFields.sivrceExclusive !== false) throw new Error("sivrce exclusive default")
  const exo = parsePublishBody({
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
    exclusive: true,
    sivrceExclusive: true,
  })
  if (!exo.ok) throw new Error(exo.error)
  if (exo.data.extendedFields.exclusive !== true) throw new Error("exclusive")
  if (exo.data.extendedFields.sivrceExclusive !== true) throw new Error("sivrce exclusive")
  const vid = parsePublishBody({
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
    video: "https://youtu.be/dQw4w9wgGcQ",
  })
  if (!vid.ok) throw new Error(vid.error)
  if (vid.data.extendedFields.video !== "https://youtu.be/dQw4w9wgGcQ") throw new Error("youtube video")
  const xss = parsePublishBody({
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
    video: "javascript:alert(1)",
  })
  if (!xss.ok) throw new Error(xss.error)
  if (xss.data.extendedFields.video != null) throw new Error("reject xss video")
}
