/**
 * Runnable check: npx tsx src/lib/chat-lead.check.ts
 */
import assert from "node:assert/strict"
import { inquiryDealOf, shouldRecordChatLead } from "./chat-lead"
import { ka } from "./i18n/ka"

assert.equal(
  shouldRecordChatLead({
    listingId: "l1",
    ownerId: "owner",
    senderId: "buyer",
    isFirstFromSender: true,
  }),
  true,
)
assert.equal(
  shouldRecordChatLead({
    listingId: "l1",
    ownerId: "owner",
    senderId: "owner",
    isFirstFromSender: true,
  }),
  false,
  "owner messaging own listing is not a lead",
)
assert.equal(
  shouldRecordChatLead({
    listingId: null,
    ownerId: "owner",
    senderId: "buyer",
    isFirstFromSender: true,
  }),
  false,
  "support/direct rooms skip Inquiry",
)
assert.equal(
  shouldRecordChatLead({
    listingId: "l1",
    ownerId: "owner",
    senderId: "buyer",
    isFirstFromSender: false,
  }),
  false,
  "follow-ups do not duplicate the lead",
)
assert.equal(
  shouldRecordChatLead({
    listingId: "l1",
    ownerId: null,
    senderId: "buyer",
    isFirstFromSender: true,
  }),
  false,
  "catalog rows with no owner stay on LeadForm",
)

assert.equal(inquiryDealOf("buy"), "buy")
assert.equal(inquiryDealOf("rent"), "rent")
assert.equal(inquiryDealOf("daily"), "daily")
assert.equal(inquiryDealOf("mortgage"), "pledge")
assert.equal(inquiryDealOf("unknown"), "buy")

for (const key of [
  "chat.suggestInterest",
  "chat.suggestViewing",
  "chat.suggestAvailable",
] as const) {
  assert.ok(ka[key].length >= 10, `${key} must stay ≥10 chars (lead-quality copy)`)
}

console.log("lib/chat-lead.check.ts — all green")
