/**
 * Runnable check: npx tsx src/data/tbilisi-quarters.check.ts
 */
import assert from 'node:assert/strict'
import {
  TBILISI_QUARTERS,
  isQuarterLabel,
  matchQuarter,
  quarterSearchQuery,
  romanizeQuarter,
} from './tbilisi-quarters'

assert.equal(TBILISI_QUARTERS.length, 56)

assert.equal(romanizeQuarter('მეორე კვარტალი'), 'II კვარტალი')
assert.equal(romanizeQuarter('დიღმის მასივი, მეორე კვარტალი'), 'დიღმის მასივი II კვარტალი')
// Varketili / Zghvisubani keep KA ordinals (Nominatim parent rewrite, not Roman).
assert.equal(
  romanizeQuarter('ვარკეთილის მე-3 მასივი, მე-2 კვარტალი'),
  'ვარკეთილის მე-3 მასივი, მე-2 კვარტალი',
)
assert.equal(
  romanizeQuarter('ზღვისუბანის მე-3 მიკრო რაიონი / 1-ლი კვარტალი'),
  'ზღვისუბანის მე-3 მიკრო რაიონი / 1-ლი კვარტალი',
)

assert.equal(isQuarterLabel('გლდანის მე-2 მიკრო რაიონი'), true)
assert.equal(isQuarterLabel('ვაზისუბნის 1-ლი მიკრორაიონი'), true)
assert.equal(isQuarterLabel('აკაკი ბელიაშვილის ქუჩა'), false)

assert.equal(matchQuarter('მეორე კვარტალი')?.ka, 'დიღმის მასივი, II კვარტალი')
assert.equal(matchQuarter('გლდანის მე-5 მიკრო რაიონი')?.district, 'გლდანი')
assert.equal(matchQuarter('ვაზისუბანი 2 მიკრო')?.district, 'ვაზისუბანი')
assert.equal(matchQuarter('ზღვისუბანი 4 მიკრო')?.district, 'ზღვისუბანი')
assert.equal(matchQuarter('ზემო პლატო 1 მიკრო')?.district, 'მესამე მასივი')
assert.equal(
  quarterSearchQuery('ვარკეთილის მე-3 მასივი, მე-3 კვარტალი'),
  'მესამე მასივი, მე-3 კვარტალი',
)
assert.equal(quarterSearchQuery('დიღმის მასივი, II კვარტალი'), 'დიღმის მასივი II კვარტალი')
assert.equal(quarterSearchQuery('მეორე კვარტალი'), 'დიღმის მასივი II კვარტალი')
assert.equal(
  quarterSearchQuery('ვარკეთილის ზემო პლატო, 1-ლი მიკრო რაიონი'),
  'ვარკეთილის ზემო პლატო 1-ლი მიკრო რაიონი',
)

const v3 = matchQuarter('ვარკეთილის მე-3 მასივი, მე-3 კვარტალი')
assert.ok(v3)
assert.ok(Math.abs(v3.lat - 41.687832) < 0.0001)

console.log('tbilisi-quarters.check: ok', TBILISI_QUARTERS.length)
