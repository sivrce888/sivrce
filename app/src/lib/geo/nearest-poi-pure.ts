/**
 * Pure helpers for nearest-POI (no DB) — safe for checks + Prisma where builders.
 */

import { createHash } from "node:crypto"

import type { Prisma } from "@/generated/prisma/client"
import { METRO_NEAR_M } from "@/lib/geo/nearest-poi-constants"

export { METRO_NEAR_M, METRO_MAX_CATCHMENT_M } from "@/lib/geo/nearest-poi-constants"

/** Stable UUID from OSM-ish key (sha256 → UUID bytes). */
export function poiUuid(key: string): string {
  const h = createHash("sha256").update(`sivrce-poi:${key}`).digest()
  const b = Buffer.from(h.subarray(0, 16))
  b[6] = (b[6]! & 0x0f) | 0x40
  b[8] = (b[8]! & 0x3f) | 0x80
  const hex = b.toString("hex")
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
}

/** Prisma filter fragment for nearMetro saved-search / DB fallback. */
export function nearMetroWhere(): Prisma.ListingWhereInput {
  return {
    nearestPois: {
      some: {
        poiKind: "metro",
        distanceM: { lte: METRO_NEAR_M },
      },
    },
  }
}
