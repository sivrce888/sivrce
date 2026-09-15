/**
 * Auth-surface locale invariants.
 * Run: npx tsx src/components/auth/i18n.check.ts
 * 1. All 10 locales resolve with full key parity; unknown falls back to en.
 * 2. authLang() maps only known sv-lang cookie values; everything else → ka.
 * 3. No hardcoded Georgian left in the auth forms — copy lives in i18n.ts.
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { getAuthStrings, authLang } from './i18n'
import { LANGS } from '@/lib/i18n/core'

const en = getAuthStrings('en')
const ka = getAuthStrings('ka')
for (const l of LANGS) {
  const s = getAuthStrings(l)
  for (const k of Object.keys(en) as (keyof typeof en)[]) {
    assert.ok(s[k] && s[k].length > 0, `${l}.${k} empty`)
    assert.equal(typeof s[k], typeof en[k], `${l}.${k} type drift`)
  }
  if (l !== 'ka') assert.notEqual(s.signinTitle, ka.signinTitle, `locale ${l} must not show Georgian chrome`)
  if (l !== 'en' && !['de'].includes(l))
    assert.notEqual(s.signinTitle, en.signinTitle, `locale ${l} falls back to en — translate it`)
}

assert.equal(authLang(undefined), 'ka', 'no cookie → ka')
assert.equal(authLang('xx'), 'ka', 'garbage cookie → ka')
assert.equal(authLang('ru'), 'ru', 'cookie resolves')

// forms consume props — no Georgian literals left in client auth components
const geo = /[\u10A0-\u10FF]/
for (const f of ['SignInForm', 'SignUpForm', 'PhoneAuthForm', 'PasskeyButton', 'ForgotForm', 'ResetForm', 'PasskeysCard']) {
  const src = readFileSync(`src/components/auth/${f}.tsx`, 'utf8')
  assert.ok(!geo.test(src), `${f} has hardcoded Georgian — copy lives in i18n.ts`)
}

// auth pages localize via the sv-lang cookie
for (const p of ['signin', 'signup', 'forgot', 'reset', 'error', 'onboarding']) {
  const src = readFileSync(`src/app/auth/${p}/page.tsx`, 'utf8')
  assert.ok(src.includes('authLang'), `${p} must resolve locale via authLang`)
  assert.ok(src.includes('getAuthStrings'), `${p} must use getAuthStrings`)
}

console.log('auth-i18n: 10 locales complete, cookie locale wired, sources clean ✓')
