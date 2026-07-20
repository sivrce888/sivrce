import assert from 'node:assert/strict'
import { CARD_PHOTO_CAP, cardGalleryTeaser } from './card-gallery-teaser'

const two = cardGalleryTeaser(['a', 'b'], 'x')
assert.equal(two.photos.length, 2)
assert.equal(two.dashSlots, CARD_PHOTO_CAP)
assert.equal(two.multi, true)
assert.equal(two.morePhotos, 0)

const fat = cardGalleryTeaser(['1', '2', '3', '4', '5', '6'], 'x')
assert.equal(fat.photos.length, CARD_PHOTO_CAP)
assert.equal(fat.dashSlots, 4)
assert.equal(fat.morePhotos, 2)

const one = cardGalleryTeaser([], 'only')
assert.equal(one.photos.length, 1)
assert.equal(one.multi, false)
assert.equal(one.dashSlots, 4)

console.log('card-gallery-teaser: ok')
