import {
  formatGlobalEntityId,
  parseGlobalEntityId,
  buildCanonicalEntityUrl,
  isValidHierarchyParent,
} from './global-entity-graph'

console.log('global-entity-graph.check: start')

// Test ID formatting and parsing
const propId = formatGlobalEntityId('PROP', '10020304')
if (propId !== 'SIVRCE-PROP-10020304') {
  throw new Error(`Expected SIVRCE-PROP-10020304, got ${propId}`)
}

const parsed = parseGlobalEntityId(propId)
if (!parsed || parsed.type !== 'PROP' || parsed.localId !== '10020304') {
  throw new Error(`Failed parsing ${propId}: ${JSON.stringify(parsed)}`)
}

// Test URL Canonicalization
const urlGe = buildCanonicalEntityUrl('PROP', '10020304', { domain: 'sivrce.ge', lang: 'ka' })
if (urlGe !== 'https://sivrce.ge/ka/property/10020304') {
  throw new Error(`Unexpected GE URL: ${urlGe}`)
}

const urlCom = buildCanonicalEntityUrl('PROP', '10020304', { domain: 'sivrce.com', lang: 'en', cc: 'ge' })
if (urlCom !== 'https://sivrce.com/en/ge/property/10020304') {
  throw new Error(`Unexpected COM URL: ${urlCom}`)
}

// Test Hierarchy Validation
if (!isValidHierarchyParent('CITY', 'HOOD')) {
  throw new Error('CITY should be valid parent of HOOD')
}
if (isValidHierarchyParent('PROP', 'CITY')) {
  throw new Error('PROP should NOT be parent of CITY')
}

console.log('global-entity-graph.check: OK ✓')
