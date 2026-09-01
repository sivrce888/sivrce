import assert from 'node:assert/strict'

import {
  detectCompetitorSource,
  extractCompetitorId,
  formatImportedListing,
  importCompetitorListing,
  importCompetitorListings,
  toAddListingDraft,
} from './competitor-import'

async function main() {
  assert.equal(detectCompetitorSource('https://ss.ge/ka/x-31099402'), 'ss.ge')
  assert.equal(detectCompetitorSource('https://www.myhome.ge/ka/pr/25529861/'), 'myhome.ge')
  assert.equal(extractCompetitorId('https://ss.ge/ka/udzravi-qoneba/iyideba-2-otaxiani-bina-saburtaloze-31099402'), '31099402')
  assert.equal(extractCompetitorId('https://www.myhome.ge/en/pr/5-room-apartment-for-rent-in-vake-25529861'), '25529861')

  const ssUrl = 'https://ss.ge/ka/udzravi-qoneba/iyideba-2-otaxiani-bina-saburtaloze-31099402'
  const ss = await importCompetitorListing(ssUrl)
  assert.ok(ss.title.length > 5, 'ss title')
  assert.ok(ss.area != null && ss.area > 0, 'ss area')
  assert.ok(ss.priceUsd != null && ss.priceUsd > 0, 'ss price')
  assert.equal(ss.source, 'ss.ge')
  assert.ok(ss.score >= 0 && ss.score <= 100, 'ss score range')
  assert.ok(!formatImportedListing(ss).includes('static.ss.ge'), 'card skips photos')

  const mh = await importCompetitorListing('https://www.myhome.ge/ka/pr/25529861/')
  assert.equal(mh.source, 'myhome.ge')
  assert.equal(mh.sourceId, '25529861')
  assert.ok(mh.deal === 'rent', 'myhome deal')
  assert.ok(mh.rooms === 5, 'myhome rooms from title')
  assert.ok(mh.score >= 0 && mh.score <= 100, 'myhome score range')
  assert.ok(mh.area != null && mh.area > 0, 'myhome area')
  assert.ok(mh.description.length > 20, 'myhome description')

  const { listings, best } = await importCompetitorListings([ssUrl, 'https://www.myhome.ge/ka/pr/25529861/'])
  assert.equal(listings.length, 2, 'both sources import')
  assert.ok(best && best.score >= ss.score, 'best is top score')
  assert.equal(best.sourceId, ss.score >= mh.score ? ss.sourceId : mh.sourceId)

  const draft = toAddListingDraft(ss)
  assert.equal(draft.v, 1)
  assert.equal(draft.deal, 'sale')
  assert.equal(draft.propType, 'apartment')
  assert.equal(draft.city, 'თბილისი')
  assert.ok(typeof draft.area === 'string' && draft.area.length > 0, 'draft area')
  assert.ok(typeof draft.price === 'string' && draft.price.length > 0, 'draft price')
  assert.ok(typeof draft.description === 'string' && (draft.description as string).length > 20, 'draft desc')
  assert.ok(draft.coords && typeof (draft.coords as { lat: number }).lat === 'number', 'draft coords')
  assert.equal(ss.score, 100, 'ss fixture scores 100/100')

  console.log('competitor-import.check OK')
  console.log(formatImportedListing(ss).split('\n').slice(0, 4).join('\n'))
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
