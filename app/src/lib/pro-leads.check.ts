/**
 * Run: npx tsx src/lib/pro-leads.check.ts
 */
import assert from "node:assert/strict"
import {
  INQUIRY_STATUSES,
  INQUIRY_STATUS_EN,
  OPEN_INQUIRY_STATUSES,
  canWorkLeads,
  inquiryWhere,
  isInquiryStatus,
  isOpenInquiryStatus,
  leadWaText,
  listingManageRule,
  listingOwnerWhere,
  normalizeInquiryStatus,
} from "./pro-leads"

// Shared pipeline vocabulary: owner inbox + staff inbox + admin ops all
// render from this one list, so every value needs a label.
assert.equal(INQUIRY_STATUSES.length, 10)
for (const s of INQUIRY_STATUSES) assert.ok(INQUIRY_STATUS_EN[s], `missing label: ${s}`)
assert.equal(isInquiryStatus("new"), true)
assert.equal(isInquiryStatus("viewing"), true)
assert.equal(isInquiryStatus("viewing_scheduled"), false)
// "closed" stays a legacy alias of "won" for rows written before the Deal OS.
assert.equal(normalizeInquiryStatus("closed"), "won")
assert.equal(normalizeInquiryStatus("negotiating"), "negotiating")
assert.equal(normalizeInquiryStatus("bogus"), "new")
// Open-pipeline filters never count terminal stages as alive.
assert.equal(isOpenInquiryStatus("new"), true)
assert.equal(isOpenInquiryStatus("negotiating"), true)
assert.equal(isOpenInquiryStatus("won"), false)
assert.equal(isOpenInquiryStatus("lost"), false)
assert.ok(OPEN_INQUIRY_STATUSES.every(isOpenInquiryStatus))

const withIds = inquiryWhere(["a"], "ag@sivrce.ge")
assert.equal(withIds.deletedAt, null)
assert.ok(Array.isArray(withIds.OR) && withIds.OR.length === 2)

const emailOnly = inquiryWhere([], "ag@sivrce.ge")
assert.ok(Array.isArray(emailOnly.OR) && emailOnly.OR.length === 1)
assert.deepEqual(emailOnly.OR?.[0], { agentEmail: "ag@sivrce.ge" })

assert.deepEqual(listingOwnerWhere(["u1"]), { ownerId: { in: ["u1"] }, deletedAt: null })
assert.equal(leadWaText("ნინო", "ვაკე, 3 ოთახი").includes("ნინო"), true)
// Blank buyer name — "გიპასუხებთ" already carries the polite "you" (-თ suffix),
// so the greeting must stay well-formed with no placeholder and no double space.
const anon = leadWaText("  ", "")
assert.ok(anon.startsWith("გამარჯობა, "), `blank name greeting: ${anon}`)
assert.ok(!anon.includes("  "), `double space in greeting: ${anon}`)
assert.ok(!leadWaText("ნინო", "   ").includes(" — "), "blank title adds no dash")
assert.equal(listingManageRule({ id: "a", role: "agent" }, "a", false), true)
assert.equal(listingManageRule({ id: "a", role: "agent" }, "b", true), false)
assert.equal(listingManageRule({ id: "ag", role: "agency" }, "b", true), true)
assert.equal(listingManageRule({ id: "ag", role: "agency" }, "b", false), false)
assert.equal(listingManageRule({ id: "x", role: "admin" }, "b", false), true)
assert.equal(listingManageRule({ id: "a", role: "agent" }, null, false), false)
assert.equal(listingManageRule({ id: "x", role: "admin" }, null, false), true)
assert.equal(canWorkLeads("seller"), true)
assert.equal(canWorkLeads("developer"), true)
assert.equal(canWorkLeads("buyer"), false)

console.log("pro-leads.check: ok")
