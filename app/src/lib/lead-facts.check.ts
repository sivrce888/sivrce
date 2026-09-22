/**
 * Runnable check: npx tsx src/lib/lead-facts.check.ts
 * Fails if detection invents facts absent from the text or misses plain ones.
 */
import { detectLeadFacts, mergeLeadFacts } from "./lead-facts"

let failed = 0
function eq(label: string, got: unknown, want: unknown) {
  if (JSON.stringify(got) !== JSON.stringify(want)) {
    failed++
    console.error(`FAIL ${label}: got ${JSON.stringify(got)}, want ${JSON.stringify(want)}`)
  }
}

// — budget —
eq("gel bare", detectLeadFacts("მაინტერესებს, ბიუჯეტი 80 000 ლარი მაქვს").budgetGEL, 80_000)
eq("usd k-suffix", detectLeadFacts("My budget is 80k$ for an apartment").budgetGEL, Math.round(80_000 * 2.65))
eq("eur plain", detectLeadFacts("Budget €1500 monthly").budgetGEL, Math.round(1500 * 2.9))
eq("usd thousands-separator", detectLeadFacts("I can pay $120,000").budgetGEL, Math.round(120_000 * 2.65))
eq("no budget", detectLeadFacts("გამარჯობა, ხედავთ ბინას?").budgetGEL, undefined)
// — rooms / area —
eq("rooms ka", detectLeadFacts("მინდა 2 ოთახიანი ბინა").rooms, 2)
eq("rooms en", detectLeadFacts("Looking for a 3 bedroom flat").rooms, 3)
eq("area", detectLeadFacts("უნდა იყოს 70 მ2-ზე მეტი").areaM2, 70)
// — urgency / intent / timeframe —
eq("urgent", detectLeadFacts("სასწრაფოდ მინდა ბინა").urgency, "high")
eq("rent intent", detectLeadFacts("ვქირავდე ბინას ვაკეში").intent, "rent")
eq("daily intent", detectLeadFacts("გვინდა დღიურად 3 ღამეს").intent, "daily")
eq("timeframe week", detectLeadFacts("I need it this week").timeframe, "this week")
eq("timeframe month-range", detectLeadFacts("შესაძლებელია 12-20 სექტემბერი?").timeframe, "12-20 სექტემბერი")
// — never fabricates —
const empty = detectLeadFacts("გამარჯობა")
eq("empty facts", empty, {})
eq("no rooms from price", detectLeadFacts("ფასი 200 000 დოლარია").rooms, undefined)
// — merge —
eq("merge refines budget", mergeLeadFacts({ budgetGEL: 80_000 }, detectLeadFacts("actually 90 000 ლარი")).budgetGEL, 90_000)
eq("merge keeps old intent", mergeLeadFacts({ intent: "rent" }, { budgetGEL: 100 }).intent, "rent")
eq("merge fills intent", mergeLeadFacts({}, { intent: "invest" }).intent, "invest")

if (failed) {
  console.error(`lead-facts.check: ${failed} failure(s)`)
  process.exit(1)
}
console.log("lead-facts.check: ok")
