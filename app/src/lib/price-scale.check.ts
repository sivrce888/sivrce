import { priceScaleOf, vsDistrict } from "./price-scale"

// priceScaleOf: peers percentile still works
const p = priceScaleOf(1000, [800, 900, 1000, 1200, 1500])
if (p.pct !== 40 || p.band !== "average") throw new Error(`priceScaleOf drifted: ${p.pct} ${p.band}`)

// vsDistrict: guards + honest band
if (vsDistrict(0, 1000) !== null) throw new Error("zero perM2 must hide")
if (vsDistrict(1000, 0) !== null) throw new Error("zero avg must hide")
if (vsDistrict(-5, 1000) !== null) throw new Error("negative perM2 must hide")
if (vsDistrict(950, 1000) !== null) throw new Error("−5% is noise, hide")
if (vsDistrict(1100, 1000) !== null) throw new Error("+10% is noise, hide")
if (vsDistrict(880, 1000) !== -12) throw new Error("−12% bargain must show")
if (vsDistrict(1200, 1000) !== 20) throw new Error("+20% above market must show")
if (vsDistrict(500, 1000) !== null) throw new Error("−50% is scam territory, hide")
if (vsDistrict(1800, 1000) !== null) throw new Error("+80% is bad data, hide")

console.log("price-scale.check: OK ✓")
