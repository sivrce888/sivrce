/**
 * Runnable check for dashboard personas.
 * Run: npx tsx src/lib/workspace.check.ts
 */
import {
  CONSUMER_PERSONAS,
  PERSONAS,
  PRO_PERSONAS,
  addListingHref,
  isPersona,
  isRentFocus,
  parsePersonaIntent,
  personaFromDealType,
  personaFromRole,
  panelTitle,
  roleForPersona,
  searchHref,
} from "./workspace"

assert(PERSONAS.length === 8)
assert(CONSUMER_PERSONAS.length === 4)
assert(PRO_PERSONAS.length === 3)
assert(isPersona("tenant"))
assert(isPersona("landlord"))
assert(!isPersona("adminx"))
assert(parsePersonaIntent("tenant") === "tenant")
assert(parsePersonaIntent("admin") === null)
assert(parsePersonaIntent("agent") === "agent")
assert(roleForPersona("tenant") === "buyer")
assert(roleForPersona("landlord") === "seller")
assert(roleForPersona("agency") === "agency")
assert(personaFromRole("buyer", "tenant") === "tenant")
assert(personaFromRole("buyer", "landlord") === "buyer")
assert(personaFromRole("seller", "landlord") === "landlord")
assert(personaFromRole("seller", null) === "seller")
assert(personaFromRole("agent", "tenant") === "agent")
assert(isRentFocus("tenant") && isRentFocus("landlord"))
assert(!isRentFocus("buyer") && !isRentFocus("seller"))
assert(addListingHref("landlord") === "/add-listing?deal=rent")
assert(addListingHref("seller") === "/add-listing")
assert(addListingHref("developer") === "/add-listing?deal=sale&propType=apartment")
assert(searchHref("rent") === "/search?deal=rent")
assert(personaFromDealType("rent") === "landlord")
assert(personaFromDealType("buy") === "seller")
assert(panelTitle("tenant").includes("დამქირავებ"))
assert(panelTitle("landlord").includes("გამქირავებ"))
assert(panelTitle("buyer") === "ჩემი სივრცე")

console.log("workspace.check: ok")

function assert(cond: unknown, msg = "assert failed"): asserts cond {
  if (!cond) throw new Error(msg)
}
