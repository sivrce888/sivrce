/**
 * Runnable self-check for listing → building/floor attribution (pure helpers).
 * Run: npm run check:attribution
 */

import assert from "node:assert/strict"

import { DEAL_COUNT_FIELD, nearestBuilding3DId } from "./attribution"

// Every deal type maps to its floor-inventory column.
assert.equal(DEAL_COUNT_FIELD.buy, "forSaleCount")
assert.equal(DEAL_COUNT_FIELD.rent, "forRentCount")
assert.equal(DEAL_COUNT_FIELD.daily, "forDailyCount")
assert.equal(DEAL_COUNT_FIELD.mortgage, "forPledgeCount")

const buildings = [
  { id: "far", lat: 41.8, lng: 44.9 },
  { id: "near", lat: 41.7152, lng: 44.8272 }, // ~12 m from the point
]

// Nearest building within the default radius wins.
assert.equal(nearestBuilding3DId(buildings, 41.7151, 44.8271), "near")
// Nothing within a zero-radius.
assert.equal(nearestBuilding3DId(buildings, 41.7151, 44.8271, 0), null)
// Empty input → null.
assert.equal(nearestBuilding3DId([], 41.7151, 44.8271), null)
// Closest of several in-range buildings.
const two = [
  { id: "a", lat: 41.7153, lng: 44.8271 }, // ~22 m
  { id: "b", lat: 41.71515, lng: 44.8271 }, // ~5 m
]
assert.equal(nearestBuilding3DId(two, 41.7151, 44.8271), "b")

console.log("attribution.check: ok")
