/**
 * Runnable check: npx tsx src/lib/suggest-match.check.ts
 */
import assert from "node:assert/strict"
import { foldQuarterQuery, foldTranslit, suggestMatch } from "./suggest-match"
import { romanizeQuarter, quarterSearchQuery } from "@/data/tbilisi-quarters"

const beli = ["აკაკი ბელიაშვილის ქუჩა", "Akaki Beliashvili Street"]
const agh = ["დავით აღმაშენებლის გამზირი", "David Aghmashenebeli Avenue"]
const chav = ["ილია ჭავჭავაძის გამზირი", "Ilia Chavchavadze Avenue"]
const dedo = ["წმინდა ქეთევან დედოფლის გამზირი", "Tsminda Ketevan Dedoflis Avenue"]
const digomi2 = ["დიღმის მასივი, II კვარტალი", "მეორე კვარტალი", "Digomi Massiv 2nd Block"]
const gldani5 = ["გლდანის მე-5 მიკრო რაიონი", "გლდანი 5 მიკრო", "Gldani 5"]
const vark3 = ["ვარკეთილის მე-3 მასივი, მე-10 კვარტალი", "კვარტალი X", "Mesame 10"]

assert.equal(suggestMatch(beli, "beli")?.prefix, true)
assert.equal(suggestMatch(beli, "ბელი")?.prefix, true)
assert.equal(suggestMatch(agh, "beli")?.prefix, false)
assert.ok(suggestMatch(agh, "beli")) // substring still hits
assert.equal(suggestMatch(beli, "xyz"), null)

// Latin typing (how Georgians romanize) must hit Georgian-only and en hays.
assert.ok(suggestMatch(beli, "belias"))
assert.ok(suggestMatch(beli, "beliashvili"))
assert.ok(suggestMatch(beli, "beliashvilis")) // genitive tail folds away
assert.ok(suggestMatch(chav, "chav"))
assert.ok(suggestMatch(chav, "chavchavadzis"))
assert.ok(suggestMatch(dedo, "dedopli")) // nominative
assert.ok(suggestMatch(dedo, "dedoplis")) // genitive + en "Dedoflis" ≡ ka დედოფლის via f/p skeleton
assert.ok(suggestMatch(["შალვა ნუცუბიძის ქუჩა"], "nutsubidze")) // en-less regional street
assert.ok(suggestMatch(["ქუთაისი"], "kutaisi")) // city in latin via skeleton
assert.equal(suggestMatch(beli, "chavchavadzis"), null)

// Skeleton identity across spelling systems.
assert.equal(foldTranslit("ბელიაშვილი"), "beliasvili")
assert.equal(foldTranslit("Beliashvili"), "beliasvili")
assert.equal(foldTranslit("თბილისი"), "tbilisi")

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
