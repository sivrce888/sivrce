/**
 * Self-check for German OpenImmo-XML & CRM feed parser.
 */
import assert from 'node:assert/strict'
import { parseOpenImmoXml } from './de-openimmo'

console.log('de-openimmo.check: start')

const sampleXml = `
<?xml version="1.0" encoding="UTF-8"?>
<openimmo>
  <anbieter>
    <immobilie>
      <objektnr_extern>BER-MITTE-104</objektnr_extern>
      <objekttitel>Helle 3-Zimmer-Wohnung in Berlin-Mitte</objekttitel>
      <preise>
        <kaufpreis>540000</kaufpreis>
        <provisionsfrei>false</provisionsfrei>
      </preise>
      <flaechen>
        <wohnflaeche>78.5</wohnflaeche>
        <anzahl_zimmer>3</anzahl_zimmer>
      </flaechen>
      <geo>
        <strasse>Torstraße</strasse>
        <hausnummer>42</hausnummer>
        <plz>10119</plz>
        <ort>Berlin</ort>
        <bundesland>Berlin</bundesland>
        <breitengrad>52.529</breitengrad>
        <laengengrad>13.401</laengengrad>
      </geo>
      <energiepass>
        <energieeffizienzklasse>B</energieeffizienzklasse>
        <endenergiebedarf>68</endenergiebedarf>
        <baujahr>2019</baujahr>
      </energiepass>
    </immobilie>
  </anbieter>
</openimmo>
`

const res = parseOpenImmoXml(sampleXml, 'onoffice')
assert.equal(res.totalParsed, 1)
assert.equal(res.validListings, 1)
assert.equal(res.scamSuspects, 0)

const p = res.properties[0]
assert.equal(p.externalId, 'BER-MITTE-104')
assert.equal(p.sourceCrm, 'onoffice')
assert.equal(p.priceEur, 540_000)
assert.equal(p.livingAreaSqm, 78.5)
assert.equal(p.rooms, 3)
assert.equal(p.address.city, 'Berlin')
assert.equal(p.energy.energyClass, 'B')
assert.equal(p.energy.yearBuilt, 2019)
assert.equal(p.commission.provisionsfrei, false)
assert.equal(p.commission.buyerCommissionPct, 3.57)

console.log('de-openimmo.check: OK ✓')
