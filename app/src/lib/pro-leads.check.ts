/**
 * Run: npx tsx src/lib/pro-leads.check.ts
 */
import assert from "node:assert/strict"
import {
  INQUIRY_STATUSES,
  inquiryWhere,
  isInquiryStatus,
  leadWaText,
  listingManageRule,
  listingOwnerWhere,
} from "./pro-leads"

assert.equal(INQUIRY_STATUSES.length, 4)
assert.equal(isInquiryStatus("new"), true)
assert.equal(isInquiryStatus("viewing_scheduled"), false)

const withIds = inquiryWhere(["a"], "ag@sivrce.ge")
assert.equal(withIds.deletedAt, null)
assert.ok(Array.isArray(withIds.OR) && withIds.OR.length === 2)

const emailOnly = inquiryWhere([], "ag@sivrce.ge")
assert.ok(Array.isArray(emailOnly.OR) && emailOnly.OR.length === 1)
assert.deepEqual(emailOnly.OR?.[0], { agentEmail: "ag@sivrce.ge" })

assert.deepEqual(listingOwnerWhere(["u1"]), { ownerId: { in: ["u1"] }, deletedAt: null })
assert.equal(leadWaText("ნინო", "ვაკე, 3 ოთახი").includes("ნინო"), true)
assert.equal(leadWaText("  ", "").includes("თქვენ"), true)
assert.equal(listingManageRule({ id: "a", role: "agent" }, "a", false), true)
assert.equal(listingManageRule({ id: "a", role: "agent" }, "b", true), false)
assert.equal(listingManageRule({ id: "ag", role: "agency" }, "b", true), true)
assert.equal(listingManageRule({ id: "ag", role: "agency" }, "b", false), false)
assert.equal(listingManageRule({ id: "x", role: "admin" }, "b", false), true)

console.log("pro-leads.check: ok")
