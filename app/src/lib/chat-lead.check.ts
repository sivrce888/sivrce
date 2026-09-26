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

// Demand funnel (chat widget view) — chip shape + composed-lead guarantees.
import { demandMessage, funnelStrings, type DemandIntent } from "../components/lead/i18n"

const LANGS = ["ka", "en", "ru", "tr", "ar", "de", "he", "hy", "az", "uk"] as const
const INTENTS: DemandIntent[] = ["buy", "rent", "daily", "sell"]

for (const lang of LANGS) {
  const s = funnelStrings(lang)

  assert.equal(Object.keys(s.intents).length, 4, `${lang}: 4 intents`)
  for (const i of INTENTS) {
    assert.ok(s.intents[i].length > 0, `${lang}: intent ${i} label`)
    // The inquiries API rejects messages <10 chars — the sentence alone must clear it.
    assert.ok(s.sentence[i].length >= 10, `${lang}: sentence ${i} ≥10 chars`)
  }

  assert.equal(s.budgetBuy.length, 5, `${lang}: 5 buy bands`)
  assert.equal(s.budgetRent.length, 5, `${lang}: 5 rent bands`)
  assert.equal(s.budgetDaily.length, 4, `${lang}: 4 daily bands`)
  assert.equal(s.roomsChips.length, 5, `${lang}: 5 room chips`)
  assert.equal(s.typeChips.length, 4, `${lang}: 4 type chips`)
  assert.equal(s.whenChips.length, 4, `${lang}: 4 when chips`)

  const buy = demandMessage(s, "buy", {
    budget: s.budgetBuy[2],
    rooms: s.roomsChips[2],
    when: s.whenChips[1],
  })
  assert.ok(buy.includes(`${s.budgetQ}: ${s.budgetBuy[2]}`), `${lang}: buy message budget`)
  assert.ok(buy.includes(`${s.roomsQ}: ${s.roomsChips[2]}`), `${lang}: buy message rooms`)
  assert.ok(buy.includes(`${s.whenQ}: ${s.whenChips[1]}`), `${lang}: buy message when`)

  const sell = demandMessage(s, "sell", { type: s.typeChips[0], when: s.whenChips[0] })
  assert.ok(sell.includes(`${s.typeQ}: ${s.typeChips[0]}`), `${lang}: sell message type`)

  // Bare intent (no chips picked) still clears the server minimum.
  for (const i of INTENTS) {
    assert.ok(demandMessage(s, i, {}).length >= 10, `${lang}: bare ${i} message ≥10 chars`)
  }
}

assert.equal(funnelStrings("xx" as never).title, funnelStrings("en").title, "unknown lang → en")
