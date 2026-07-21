/**
 * Runnable check: npx tsx src/lib/suggest-match.check.ts
 */
import assert from "node:assert/strict"
import { foldQuarterQuery, suggestMatch } from "./suggest-match"
import { romanizeQuarter, quarterSearchQuery } from "@/data/tbilisi-quarters"

const beli = ["აკაკი ბელიაშვილის ქუჩა", "Akaki Beliashvili Street"]
const agh = ["დავით აღმაშენებლის გამზირი", "David Aghmashenebeli Avenue"]
const digomi2 = ["დიღმის მასივი, II კვარტალი", "მეორე კვარტალი", "Digomi Massiv 2nd Block"]
const gldani5 = ["გლდანის მე-5 მიკრო რაიონი", "გლდანი 5 მიკრო", "Gldani 5"]
const vark3 = ["ვარკეთილის მე-3 მასივი, მე-10 კვარტალი", "კვარტალი X", "Mesame 10"]

assert.equal(suggestMatch(beli, "beli")?.prefix, true)
assert.equal(suggestMatch(beli, "ბელი")?.prefix, true)
assert.equal(suggestMatch(agh, "beli")?.prefix, false)
assert.ok(suggestMatch(agh, "beli")) // substring still hits
assert.equal(suggestMatch(beli, "xyz"), null)

assert.ok(suggestMatch(digomi2, "მეორე კვარტალი"))
assert.ok(suggestMatch(digomi2, "II კვარტალი"))
assert.ok(suggestMatch(digomi2, "მეორე"))
assert.equal(suggestMatch(["დიღმის მასივი, III კვარტალი"], "მეორე კვარტალი"), null)
assert.equal(romanizeQuarter("მეორე კვარტალი"), "II კვარტალი")
assert.equal(romanizeQuarter("დიღმის მასივი, მეორე კვარტალი"), "დიღმის მასივი II კვარტალი")
assert.equal(foldQuarterQuery("მეორე"), foldQuarterQuery("ii"))

assert.ok(suggestMatch(gldani5, "გლდანი 5"))
assert.ok(suggestMatch(vark3, "კვარტალი X"))
assert.equal(quarterSearchQuery("ვარკეთილის მე-3 მასივი, მე-2 კვარტალი"), "მესამე მასივი, მე-2 კვარტალი")

console.log("suggest-match.check: ok")
