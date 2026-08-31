import assert from 'node:assert/strict'
import { cardGalleryTeaser, photoMountIdx } from './card-gallery-teaser'

const two = cardGalleryTeaser(['a', 'b'], 'x')
assert.equal(two.photos.length, 2)
assert.equal(two.multi, true)

const fat = cardGalleryTeaser(['1', '2', '3', '4', '5', '6'], 'x')
assert.equal(fat.photos.length, 6)
assert.equal(fat.multi, true)

const one = cardGalleryTeaser([], 'only')
assert.deepEqual(one.photos, ['only'])
assert.equal(one.multi, false)

assert.deepEqual(photoMountIdx(0, 1), [0])
assert.deepEqual(photoMountIdx(0, 2), [0, 1])
assert.deepEqual(photoMountIdx(0, 5), [4, 0, 1])
assert.deepEqual(photoMountIdx(4, 5), [3, 4, 0])

console.log('card-gallery-teaser: ok')
