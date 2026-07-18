import assert from 'node:assert/strict'
import { canonicalizeDistrict, districtSearchValues } from './district-canon'

assert.equal(canonicalizeDistrict('Saburtalo'), 'საბურთალო')
assert.equal(canonicalizeDistrict('Vake'), 'ვაკე')
assert.equal(canonicalizeDistrict('ვაკე-საბურთალო'), 'საბურთალო')
assert.equal(canonicalizeDistrict('საბურთალო, თბილისი'), 'საბურთალო')
assert.equal(canonicalizeDistrict('ლისის ტბა'), 'ლისი')
assert.equal(canonicalizeDistrict('Airport (district)', 'ბათუმი'), 'აეროპორტის უბანი')
assert.equal(canonicalizeDistrict('Chugureti'), 'ჩუღურეთი')
assert.ok(districtSearchValues('ვაკე-საბურთალო').includes('ვაკე'))
assert.ok(districtSearchValues('ვაკე', 'თბილისი').includes('ბაგები'))
assert.equal(canonicalizeDistrict('აეროპორტის რაიონი, ადლიას ქ. 53', 'ბათუმი'), 'აეროპორტის უბანი')
assert.equal(canonicalizeDistrict('ჩაკვი, შავი ზღვის სანაპირო'), '')
assert.equal(canonicalizeDistrict('ვაკის რაიონი'), 'ვაკე')
assert.ok(!districtSearchValues('ვაკე', 'თბილისი').includes('დიღომი'))

console.log('district-canon: ok')
