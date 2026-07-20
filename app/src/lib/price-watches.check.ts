import assert from 'node:assert/strict'
import { isPriceWatchName, priceWatchName } from './price-watch-name'

assert.equal(priceWatchName('abc'), '__price__:abc')
assert.ok(isPriceWatchName('__price__:abc'))
assert.ok(!isPriceWatchName('My search'))

console.log('price-watches: ok')
