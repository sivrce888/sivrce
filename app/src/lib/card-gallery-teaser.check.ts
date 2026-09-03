import assert from 'node:assert/strict'
import { CARD_PHOTO_CAP, cardGalleryTeaser, cardPhotoPayload, photoMountIdx } from './card-gallery-teaser'

const two = cardGalleryTeaser(['a', 'b'], 'x')
assert.equal(two.photos.length, 2)
assert.equal(two.multi, true)
assert.equal(two.more, 0)
assert.equal(two.total, 2)

const fat = cardGalleryTeaser(['1', '2', '3', '4', '5', '6', '7'], 'x')
assert.equal(fat.photos.length, CARD_PHOTO_CAP)
assert.deepEqual(fat.photos, ['1', '2', '3', '4'])
assert.equal(fat.more, 3)
assert.equal(fat.total, 7)
assert.equal(fat.multi, true)

const sliced = cardGalleryTeaser(['1', '2', '3', '4'], 'x', 7)
assert.equal(sliced.more, 3)
assert.equal(sliced.total, 7)

const one = cardGalleryTeaser([], 'only')
assert.deepEqual(one.photos, ['only'])
assert.equal(one.multi, false)
assert.equal(one.more, 0)

const payload = cardPhotoPayload(['a', 'b', 'c', 'd', 'e'])
assert.deepEqual(payload.images, ['a', 'b', 'c', 'd'])
assert.equal(payload.photoCount, 5)

assert.deepEqual(photoMountIdx(0, 1), [0])
assert.deepEqual(photoMountIdx(0, 2), [0, 1])
assert.deepEqual(photoMountIdx(0, 5), [4, 0, 1])
assert.deepEqual(photoMountIdx(4, 5), [3, 4, 0])

console.log('card-gallery-teaser: ok')
