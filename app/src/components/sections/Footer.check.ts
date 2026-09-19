/**
 * Footer.check.ts — validates Footer component integrity:
 * 1. Germany market support: § 5 DDG Impressum, DSGVO Datenschutz, AGB, Widerruf, Verbraucherinfo
 * 2. Germany cities and keyword columns present
 * 3. Consent withdrawal link setConsent(null) present (Art. 7(3) DSGVO)
 * 4. Device budget locks satisfied (sv-link-grid, minmax(0,1.3fr), no xl:grid-cols-5)
 * 5. Bundle leak integrity (no forbidden heavy imports)
 *
 * Run: npx tsx src/components/sections/Footer.check.ts
 */
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const cwd = process.cwd()
const footerPath = path.join(cwd, 'src/components/sections/Footer.tsx')
const code = fs.readFileSync(footerPath, 'utf8')

// 1. Consent withdrawal
assert.ok(code.includes('setConsent(null)'), 'Footer must contain setConsent(null) withdrawal trigger')

// 2. German legal requirements
assert.ok(code.includes('/legal/impressum'), 'Footer must link to /legal/impressum for German market')
assert.ok(code.includes('/legal/datenschutz'), 'Footer must link to /legal/datenschutz for German market')
assert.ok(code.includes('/legal/agb'), 'Footer must link to /legal/agb for German market')
assert.ok(code.includes('/legal/widerruf'), 'Footer must link to /legal/widerruf for German market')
assert.ok(code.includes('/legal/verbraucherinformationen'), 'Footer must link to /legal/verbraucherinformationen for German market')

// 3. German market keywords & top cities
assert.ok(code.includes('DE_CITIES'), 'Footer must define DE_CITIES for Germany')
assert.ok(code.includes('DE_GRID_COLS'), 'Footer must define DE_GRID_COLS for Germany')
assert.ok(code.includes('Berlin'), 'DE_CITIES must include Berlin')
assert.ok(code.includes('München'), 'DE_CITIES must include München')
assert.ok(code.includes('Hamburg'), 'DE_CITIES must include Hamburg')
assert.ok(code.includes('Frankfurt am Main'), 'DE_CITIES must include Frankfurt am Main')
assert.ok(code.includes('DSGVO Art. 7(3) konform'), 'Footer must surface DSGVO compliance badge')
assert.ok(code.includes('§ 87 GEG Energieausweis-geprüft'), 'Footer must surface GEG compliance badge')

// 4. Device budget locks
assert.ok(code.includes('sv-link-grid'), 'Footer must use sv-link-grid CSS grid')
assert.ok(code.includes('minmax(0,1.3fr)'), 'Footer must respect minmax(0,1.3fr) layout ratio')
assert.ok(!code.includes('xl:grid-cols-5'), 'Footer must not use prohibited xl:grid-cols-5')

// 5. Bundle isolation
assert.ok(!code.includes("from '@/lib/map/user-place'"), 'Footer must not import user-place')
assert.ok(!code.includes("from '@/data/world-places'"), 'Footer must not import world-places')

console.log('Footer.check: OK ✓ — Germany market + legal compliance + device budget + bundle locks verified')
