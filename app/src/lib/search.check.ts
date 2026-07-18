/**
 * Runnable check for the Meilisearch adapter (npm run check:search).
 *
 * Without MEILISEARCH_HOST: asserts the null-fallback contract (DB takes over).
 * With MEILISEARCH_HOST: index → search (with poll for task commit) → delete.
 * Exits non-zero on any failure. Loads app/.env.local if present.
 */

try {
  process.loadEnvFile(".env.local")
} catch {
  /* no env file — fallback-contract branch will run */
}

import { deleteListing, indexListing, searchListings, type ListingDocument } from "./search"

function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) {
    console.error("FAIL:", msg)
    process.exit(1)
  }
}

async function main() {
  if (!process.env.MEILISEARCH_HOST) {
    const r = await searchListings({ q: "ვაკე" })
    assert(r === null, "searchListings must return null without MEILISEARCH_HOST")
    console.log("ok: null-fallback contract holds (no MEILISEARCH_HOST)")
    return
  }

  const id = `check-${Date.now()}`
  const doc: ListingDocument = {
    id,
    title: "სატესტო ბინა ვაკეში",
    description: "check document",
    city: "თბილისი",
    district: "ვაკე",
    address: "ჩავჭავაძის 47",
    dealType: "buy",
    propertyType: "apartment",
    price: 250000,
    currency: "USD",
    priceUSD: 250000,
    verified: false,
    hasImages: false,
    petsAllowed: true,
    sellerType: "agency",
    area: 86,
    rooms: 3,
    bedrooms: 2,
    bathrooms: 1,
    features: ["ავეჯით"],
    images: [],
    lat: 41.71,
    lng: 44.76,
    createdAt: new Date().toISOString(),
    status: "active",
    tier: "standard",
    tierRank: 0,
  }

  assert(await indexListing(doc), "indexListing failed")

  // Meilisearch commits documents asynchronously — poll briefly.
  let hits = 0
  for (let i = 0; i < 20; i++) {
    const r = await searchListings({ q: "ვაკე", city: "თბილისი" })
    hits = r?.hits.filter((h) => h.id === id).length ?? 0
    if (hits === 1) break
    await new Promise((res) => setTimeout(res, 250))
  }
  assert(hits === 1, "indexed document not found in search results")

  const filtered = await searchListings({ q: "ვაკე", maxPrice: 1000 })
  assert(!filtered?.hits.some((h) => h.id === id), "price filter leak")

  // pets/seller facets (2026-07-18): doc is petsAllowed + agency.
  const petHit = await searchListings({ q: "ვაკე", petsOnly: true })
  assert(petHit?.hits.some((h) => h.id === id), "petsOnly filter miss")
  const ownerHit = await searchListings({ q: "ვაკე", sellerType: "owner" })
  assert(!ownerHit?.hits.some((h) => h.id === id), "sellerType filter leak")

  assert(await deleteListing(id), "deleteListing failed")
  console.log("ok: index → search → filter → delete")
}

main().catch((e) => {
  console.error("FAIL:", (e as Error).message)
  process.exit(1)
})
