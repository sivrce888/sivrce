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
  assert.equal(detectCompetitorSource('https://korter.ge/qiravdeba-binebi-tbilisshi/869577'), 'korter.ge')
  assert.equal(extractCompetitorId('https://korter.ge/binebis-yidva-gayidva-tbilisi/archi-kikvidze-garden/843242'), '843242')
  assert.equal(extractCompetitorId('https://ss.ge/ka/udzravi-qoneba/iyideba-2-otaxiani-bina-saburtaloze-31099402'), '31099402')

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

  assert.equal(extractCompetitorId('https://www.myhome.ge/en/pr/5-room-apartment-for-rent-in-vake-25529861'), '25529861')

  const korterUrl = 'https://korter.ge/qiravdeba-binebi-tbilisshi/869577'
  const ko = await importCompetitorListing(korterUrl)
  assert.equal(ko.source, 'korter.ge')
  assert.equal(ko.sourceId, '869577')
  assert.ok(ko.deal === 'rent', 'korter deal')
  assert.ok(ko.area != null && ko.area > 0, 'korter area')
  assert.ok(ko.priceUsd != null && ko.priceUsd > 0, 'korter price')
  assert.ok(ko.description.length > 20, 'korter description')
  assert.ok(ko.lat != null && ko.lng != null, 'korter coords')
  assert.ok(ko.phone != null, 'korter phone')
  assert.equal(ko.score, 100, 'korter fixture scores 100/100')
  const koDraft = toAddListingDraft(ko)
  assert.equal(koDraft.deal, 'rent')
  assert.ok(typeof koDraft.baths === 'number' && (koDraft.baths as number) > 0, 'korter draft baths')
  assert.ok(typeof koDraft.name === 'string' && (koDraft.name as string).length > 0, 'korter draft name')

  const { listings, best } = await importCompetitorListings([ssUrl, 'https://www.myhome.ge/ka/pr/25529861/', korterUrl])
  assert.equal(listings.length, 3, 'all sources import')
  assert.ok(best && best.score >= ss.score && best.score >= mh.score && best.score >= ko.score, 'best is top score')

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
