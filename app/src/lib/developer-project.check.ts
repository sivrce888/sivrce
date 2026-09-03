/**
 * Runnable check: npx tsx src/lib/developer-project.check.ts
 */
import {
  canMutateProject,
  coordsInGeorgia,
  isOwnedCover,
  isProjectStatus,
  parseProjectFields,
  slugifyProject,
} from "./developer-project"

function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) throw new Error(msg)
}

assert(slugifyProject("  Axis Towers  ") === "axis-towers", "slug")
assert(isProjectStatus("construction") && !isProjectStatus("live"), "status")
assert(coordsInGeorgia(41.7, 44.8) && !coordsInGeorgia(0, 0), "geo")
assert(isOwnedCover("/images/np1.webp") && !isOwnedCover("https://evil.test/x.webp"), "cover")

const bad = parseProjectFields({
  name: "",
  city: "თბილისი",
  district: "ვაკე",
  address: "",
  status: "construction",
  readyBy: "",
  priceFrom: "",
  pricePerSqmFrom: "",
  units: "",
  body: "",
  lat: "",
  lng: "",
  image: "",
})
assert(bad === null, "empty name")

const good = parseProjectFields({
  name: "Axis",
  city: "თბილისი",
  district: "ვაკე",
  address: "ჭავჭავაძის 12",
  status: "construction",
  readyBy: "2027",
  priceFrom: "120000",
  pricePerSqmFrom: "1800",
  units: "40",
  body: "ახალი პროექტი",
  lat: "41.71",
  lng: "44.78",
  image: "",
})
assert(good?.units === 40 && good.priceFrom === 120000, "ints")
assert(good?.lat === 41.71 && good.image === "/images/np1.webp", "defaults")

assert(canMutateProject({ ownerId: "u1", developer: "X" }, "u1", "X"), "owner")
assert(canMutateProject({ ownerId: null, developer: "X" }, "u1", "X"), "claim")
assert(!canMutateProject({ ownerId: "u2", developer: "X" }, "u1", "X"), "foreign")
assert(!canMutateProject({ ownerId: null, developer: "Y" }, "u1", "X"), "name mismatch")

console.log("developer-project.check: ok")
