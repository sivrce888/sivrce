import assert from 'node:assert/strict'
import { boundNum, heroDeal, HERO_TABS, moneyShort, priceLabel, quickHref, recentLabel, sizeLabel } from './hero-search-mode'

assert.equal(boundNum(''), undefined)
assert.equal(boundNum('0'), undefined)
assert.equal(boundNum('abc'), undefined)
assert.equal(boundNum('150000'), 150000)

assert.equal(moneyShort(150000, 'USD'), '$150k')
assert.equal(moneyShort(150000, 'GEL'), '₾150k')
assert.equal(priceLabel('', '200000', 'USD'), '≤$200k')
assert.equal(priceLabel('100000', '200000', 'USD'), '$100k–$200k')
assert.equal(sizeLabel(3, true, '', '', 'მ²'), '3')
assert.equal(sizeLabel(5, false, '80', '120', 'მ²'), '5+ · 80–120 მ²')
assert.equal(sizeLabel(undefined, true, '', '', 'მ²'), null)

const p = new URLSearchParams('deal=sale&city=თბილისი&rooms=2&max=200000')
assert.ok(recentLabel(p, 'იყიდება').includes('თბილისი'))
assert.ok(recentLabel(p, 'იყიდება').includes('2+'))

const typed = new URLSearchParams('deal=sale&city=თბილისი&type=house')
assert.ok(recentLabel(typed, 'იყიდება').includes('სახლი'))

const q = new URLSearchParams('q=პეკინი&deal=sale')
assert.ok(recentLabel(q, 'იყიდება').includes('პეკინი'))

assert.deepEqual(HERO_TABS.map((x) => x.deal), ['sale', 'rent', 'pledge', 'daily', undefined])
assert.equal(heroDeal(0), 'sale')
assert.equal(heroDeal(2), 'pledge')
assert.equal(heroDeal(3), 'daily')
assert.equal(heroDeal(4), undefined)
assert.equal(quickHref({
  sale: '/sale/apartments/tbilisi/vake',
  rent: '/rent/apartments/tbilisi/vake',
  pledge: '/search?deal=pledge&city=თბილისი&district=ვაკე',
  daily: '/daily/apartments/tbilisi/vake',
  projects: '/projects/tbilisi/vake',
}, 2), '/search?deal=pledge&city=თბილისი&district=ვაკე')
assert.equal(quickHref({
  sale: '/sale/apartments/tbilisi/vake',
  rent: '/rent/apartments/tbilisi/vake',
  pledge: '/search?deal=pledge&city=თბილისი&district=ვაკე',
  daily: '/daily/apartments/tbilisi/vake',
  projects: '/projects/tbilisi/vake',
}, 2, 'house'), '/search?deal=pledge&city=თბილისი&district=ვაკე&type=house')

console.log('hero-search-mode: ok')
