/**
 * Runnable self-check for the SEO listing title engine.
 * Run: npm run check:seo-title
 */

import assert from 'node:assert/strict'
import { cap1, locIn, locOn, seoTitleParts } from './seo-title'

/* ——— "in X" locatives ——— */
assert.equal(locIn('ვაკე'), 'ვაკეში') // curated
assert.equal(locIn('გლდანი'), 'გლდანში') // curated
assert.equal(locIn('საბურთალო'), 'საბურთალოზე') // curated exception, not -ში
assert.equal(locIn('თბილისი'), 'თბილისში') // curated city
assert.equal(locIn('ნავთლუღი'), 'ნავთლუღში') // heuristic: drop -ი, add -ში
assert.equal(locIn('დიღმის მასივი'), 'დიღმის მასივში') // heuristic: last word only

/* ——— "on X street" locatives ——— */
assert.equal(locOn('ჭავჭავაძის გამზირი'), 'ჭავჭავაძეზე') // genitive -ის + -ეზე after ძ
assert.equal(locOn('ჭავჭავაძის'), 'ჭავჭავაძეზე')
assert.equal(locOn('პეკინის ქუჩა'), 'პეკინზე')
assert.equal(locOn('რუსთაველის გამზ.'), 'რუსთაველზე')
assert.equal(locOn('აკაკი წერეთლის გამზირი'), 'აკაკი წერეთელზე') // last token inflected
assert.equal(locOn('ვაჟა-ფშაველას გამზირი'), 'ვაჟა-ფშაველაზე') // genitive -ას
assert.equal(locOn('კოსტავას ქ.'), 'კოსტავაზე')
assert.equal(locOn('თამარ მეფის ქუჩა'), 'თამარ მეფეზე') // obstruent epenthesis

/* ——— title parts: ka ——— */
assert.deepEqual(
  seoTitleParts({ lang: 'ka', deal: 'sale', dealLabel: 'იყიდება', street: 'ჭავჭავაძის გამზირი', district: 'ვაკე', city: 'თბილისი' }),
  { deal: 'იყიდება', where: 'ჭავჭავაძეზე ვაკეში' },
)
assert.deepEqual(
  seoTitleParts({ lang: 'ka', deal: 'daily', dealLabel: 'ქირავდება დღიურად', district: 'გლდანი', city: 'თბილისი' }),
  { deal: 'ქირავდება დღიურად', where: 'გლდანში' },
)
assert.deepEqual(
  seoTitleParts({ lang: 'ka', deal: 'pledge', dealLabel: 'გირავდება', district: 'საბურთალო', city: 'თბილისი' }),
  { deal: 'გირავდება', where: 'საბურთალოზე' },
)

/* ——— title parts: en/ru use curated seo-pages phrases ——— */
assert.deepEqual(
  seoTitleParts({ lang: 'en', deal: 'sale', dealLabel: 'For sale', district: 'ვაკე', city: 'თბილისი' }),
  { deal: 'for sale', where: 'Vake, Tbilisi' },
)
assert.deepEqual(
  seoTitleParts({ lang: 'ru', deal: 'daily', dealLabel: 'Посуточно', district: 'გლდანი', city: 'თბილისი' }),
  { deal: 'посуточно', where: 'Глдани, Тбилиси' },
)
assert.equal(seoTitleParts({ lang: 'en', deal: 'pledge', dealLabel: 'For lease', district: 'ვაკე' }).deal, 'for lease')

/* ——— misc ——— */
assert.equal(cap1('land plot for sale in Vake'), 'Land plot for sale in Vake')
assert.equal(cap1('იყიდება ბინა'), 'იყიდება ბინა') // Georgian has no case — unchanged
assert.equal(seoTitleParts({ lang: 'ka', deal: null, dealLabel: '' }).where, '—')

console.log('seo-title: all checks passed')
