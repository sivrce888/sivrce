/**
 * Runnable self-check for the SEO listing title engine.
 * Run: npm run check:seo-title
 */

import assert from 'node:assert/strict'
import { cap1, locIn, locOn, seoTitleParts, streetLoc } from './seo-title'

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

/* ——— "on X" for street phrases / raw address heads ——— */
assert.equal(streetLoc('ბელიაშვილის ქუჩა N24'), 'ბელიაშვილის ქუჩაზე') // street word kept + inflected, number dropped
assert.equal(streetLoc('აკაკი ბელიაშვილის ქუჩა'), 'აკაკი ბელიაშვილის ქუჩაზე') // canonical catalog form
assert.equal(streetLoc('ჭავჭავაძის 47'), 'ჭავჭავაძეზე') // bare genitive head falls back to locOn
assert.equal(streetLoc('მშვიდობის ქ. 8'), 'მშვიდობის ქუჩაზე') // abbr expanded
assert.equal(streetLoc('ვაჟა-ფშაველას გამზირი'), 'ვაჟა-ფშაველას გამზირზე')
assert.equal(streetLoc('დავით აღმაშენებლის ხეივანი'), 'დავით აღმაშენებლის ხეივანში')
assert.equal(streetLoc('24'), '') // pure door number → no street part
assert.equal(streetLoc(''), '')

/* ——— title parts: ka — full chain city → district → street ——— */
assert.deepEqual(
  seoTitleParts({ lang: 'ka', deal: 'sale', dealLabel: 'იყიდება', street: 'ჭავჭავაძის გამზირი', district: 'ვაკე', city: 'თბილისი' }),
  { deal: 'იყიდება', where: 'თბილისში ვაკეში ჭავჭავაძის გამზირზე' },
)
assert.equal(
  seoTitleParts({ lang: 'ka', deal: 'sale', dealLabel: 'იყიდება', street: 'აკაკი ბელიაშვილის ქუჩა N24', district: 'დიღმის მასივი', city: 'თბილისი' }).where,
  'თბილისში დიღმის მასივში აკაკი ბელიაშვილის ქუჩაზე',
)
assert.deepEqual(
  seoTitleParts({ lang: 'ka', deal: 'daily', dealLabel: 'ქირავდება დღიურად', district: 'გლდანი', city: 'თბილისი' }),
  { deal: 'ქირავდება დღიურად', where: 'თბილისში გლდანში' },
)
assert.deepEqual(
  seoTitleParts({ lang: 'ka', deal: 'pledge', dealLabel: 'გირავდება', district: 'საბურთალო', city: 'თბილისი' }),
  { deal: 'გირავდება', where: 'თბილისში საბურთალოზე' },
)
assert.equal(
  seoTitleParts({ lang: 'ka', deal: 'sale', dealLabel: 'იყიდება', street: 'ნუცუბიძის ფერდობი', district: 'ნუცუბიძის ფერდობი', city: 'თბილისი' }).where,
  'თბილისში ნუცუბიძის ფერდობზე', // street duplicating the district drops
)

/* ——— street box holding a bare settlement name — in-X, never *ნიჩბისზე ——— */
assert.equal(
  seoTitleParts({ lang: 'ka', deal: 'sale', dealLabel: 'იყიდება', propType: 'land', street: 'ნიჩბისი', city: 'მცხეთის მუნიციპალიტეტი' }).where,
  'მცხეთის მუნიციპალიტეტში ნიჩბისში',
)
assert.equal(
  seoTitleParts({ lang: 'ka', deal: 'sale', dealLabel: 'იყიდება', street: 'ბაკურიანი', city: 'ბაკურიანი' }).where,
  'ბაკურიანში', // curated city, no city duplication
)
assert.equal(
  seoTitleParts({ lang: 'ka', deal: 'sale', dealLabel: 'იყიდება', street: 'საბურთალო', city: 'თბილისი' }).where,
  'თბილისში საბურთალოზე', // curated -ზე class survives the bare-name route
)
assert.equal(
  seoTitleParts({ lang: 'ka', deal: 'sale', dealLabel: 'იყიდება', street: 'დიდი დიღომი', city: 'თბილისი' }).where,
  'თბილისში დიდ დიღომში', // multi-word curated (syncope) still hits
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
assert.equal(seoTitleParts({ lang: 'en', deal: 'rent', dealLabel: 'For rent', propType: 'land', district: 'გლდანი' }).deal, 'for lease')
assert.equal(seoTitleParts({ lang: 'ka', deal: 'rent', dealLabel: 'გაიცემა იჯარით', propType: 'land', district: 'გლდანი' }).deal, 'გაიცემა იჯარით')

/* ——— misc ——— */
assert.equal(cap1('land plot for sale in Vake'), 'Land plot for sale in Vake')
assert.equal(cap1('იყიდება ბინა'), 'იყიდება ბინა') // Georgian has no case — unchanged
assert.equal(seoTitleParts({ lang: 'ka', deal: null, dealLabel: '' }).where, '—')

console.log('seo-title: all checks passed')
