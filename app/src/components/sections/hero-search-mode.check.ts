import assert from 'node:assert/strict'
import { recentLabel } from './hero-search-mode'

const p = new URLSearchParams('deal=sale&city=თბილისი&rooms=2&max=200000')
assert.ok(recentLabel(p, 'იყიდება').includes('თბილისი'))
assert.ok(recentLabel(p, 'იყიდება').includes('2+'))

const q = new URLSearchParams('q=პეკინი&deal=sale')
assert.ok(recentLabel(q, 'იყიდება').includes('პეკინი'))

console.log('hero-search-mode: ok')
