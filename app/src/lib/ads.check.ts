import assert from "node:assert/strict"

import {
  AD_SLOTS,
  SLOT_META,
  audienceFromRole,
  filterCandidates,
  isAdSlot,
  isInternalHref,
  isLiveNow,
  isSafeHref,
  matchesAudience,
  matchesLang,
  pickWeighted,
  sponsoredLabel,
  type AdCandidate,
} from "./ads"

assert.equal(new Set(AD_SLOTS).size, AD_SLOTS.length)
for (const slot of AD_SLOTS) {
  assert.ok(SLOT_META[slot], slot)
}

assert.equal(audienceFromRole(undefined), "guest")
assert.equal(audienceFromRole("seller"), "seller")
assert.equal(audienceFromRole("admin"), "all")

assert.equal(matchesAudience(["all"], "buyer"), true)
assert.equal(matchesAudience(["seller"], "buyer"), false)
assert.equal(matchesAudience(["seller"], "seller"), true)
assert.equal(matchesLang(["all"], "en"), true)
assert.equal(matchesLang(["ka"], "en"), false)

assert.equal(isLiveNow({ status: "live", startsAt: null, endsAt: null }), true)
assert.equal(isLiveNow({ status: "draft", startsAt: null, endsAt: null }), false)
assert.equal(
  isLiveNow({ status: "live", startsAt: new Date(Date.now() + 60_000), endsAt: null }),
  false,
)

const rows: AdCandidate[] = [
  {
    id: "a",
    slot: "home_hero",
    format: "billboard",
    title: "A",
    subtitle: null,
    ctaLabel: null,
    href: "/advertise",
    imageUrl: null,
    advertiser: null,
    weight: 1,
    audiences: ["all"],
    langs: ["all"],
    startsAt: null,
    endsAt: null,
    status: "live",
  },
  {
    id: "b",
    slot: "home_hero",
    format: "billboard",
    title: "B",
    subtitle: null,
    ctaLabel: null,
    href: "https://bank.ge",
    imageUrl: null,
    advertiser: "BOG",
    weight: 99,
    audiences: ["buyer"],
    langs: ["ka"],
    startsAt: null,
    endsAt: null,
    status: "live",
  },
]

assert.equal(pickWeighted(rows, () => 0)?.id, "a")
assert.equal(pickWeighted(rows, () => 0.5)?.id, "b")
assert.equal(filterCandidates(rows, "home_hero", "buyer", "ka").length, 2)
assert.equal(filterCandidates(rows, "home_hero", "seller", "en").length, 1)
assert.equal(filterCandidates(rows, "search_top", "buyer", "ka").length, 0)

assert.equal(isSafeHref("/search"), true)
assert.equal(isSafeHref("//evil"), false)
assert.equal(isSafeHref("javascript:alert(1)"), false)
assert.equal(isSafeHref("https://sivrce.ge/map"), true)
assert.equal(isInternalHref("/search"), true)
assert.equal(isInternalHref("https://x.com"), false)
assert.equal(isAdSlot("mortgage"), true)
assert.equal(isAdSlot("popup"), false)
assert.equal(sponsoredLabel("ka"), "რეკლამა")

console.log("ads: ok")
