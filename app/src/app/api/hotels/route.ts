/**
 * GET /api/hotels?city=tbilisi|{lat,lng,city}&checkIn&checkOut&adults
 * Live GDS rates + Sivrce margin, CDN-cached 10min. Unconfigured keys or a
 * provider outage degrade to { mode } + empty hotels — never a 500.
 */

import { NextResponse } from "next/server"
import { getFx, parseStay, placeBySlug, searchHotels } from "@/lib/hotels"

export const runtime = "nodejs"

export async function GET(req: Request) {
  const q = new URL(req.url).searchParams
  const city = q.get("city") ?? "tbilisi"
  const checkIn = q.get("checkIn") ?? ""
  const checkOut = q.get("checkOut") ?? ""
  const adultsRaw = Number.parseInt(q.get("adults") ?? "2", 10)
  const adults = Number.isFinite(adultsRaw) ? Math.min(Math.max(adultsRaw, 1), 9) : 2

  const stay = parseStay(checkIn, checkOut)
  if (!stay) {
    return NextResponse.json({ error: "invalid stay: checkIn/checkOut must be ISO dates, 1–30 nights, starting today or later" }, { status: 400 })
  }

  let lat: number | null = null
  let lng: number | null = null
  let cityEn = city
  const place = placeBySlug(city)
  if (place) {
    lat = place.lat
    lng = place.lng
    cityEn = place.en
  } else {
    lat = Number.parseFloat(q.get("lat") ?? "")
    lng = Number.parseFloat(q.get("lng") ?? "")
    cityEn = q.get("cityEn") ?? city
    if (!Number.isFinite(lat) || lat < -90 || lat > 90 || !Number.isFinite(lng) || lng < -180 || lng > 180) {
      return NextResponse.json({ error: "unknown city slug or out-of-range lat/lng" }, { status: 400 })
    }
  }

  const result = await searchHotels({ lat, lng, checkIn, checkOut, adults })
  return NextResponse.json(
    { ...result, nights: stay.nights, city: cityEn, fxRates: await getFx() },
    { headers: { "cache-control": "public, s-maxage=600, stale-while-revalidate=1800" } },
  )
}
