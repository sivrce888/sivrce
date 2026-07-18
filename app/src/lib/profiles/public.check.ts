/**
 * Self-check: npx tsx src/lib/profiles/public.check.ts
 */
import assert from 'node:assert/strict'
import { SELLER_ROLE_LABEL, resolveStaticAgentProfile } from './roles'

assert.equal(SELLER_ROLE_LABEL.owner.ka, 'მესაკუთრე')
assert.equal(SELLER_ROLE_LABEL.agent.ka, 'აგენტი')
assert.equal(SELLER_ROLE_LABEL.developer.ka, 'დეველოპერი')
assert.equal(SELLER_ROLE_LABEL.agency.ka, 'სააგენტო')

const miss = resolveStaticAgentProfile('___no_such_agent___')
assert.equal(miss.profileHref, null)

console.log('profiles/public.check: ok')
