import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import { CONSENT_KEY, CONSENT_EVENT, isTrackingKey, parseConsent } from "./consent"

console.log("consent.check: start")

// ── storage parsing: only the two explicit values count as a decision
assert.equal(parseConsent("granted"), "granted")
assert.equal(parseConsent("denied"), "denied")
for (const bogus of [null, undefined, "", "true", "1", "GRANTED", "yes", "{}"]) {
  assert.equal(parseConsent(bogus), null, `must not accept ${String(bogus)} as consent`)
}

// Versioned key: a policy change ships a new key so stale consent never carries over.
assert.match(CONSENT_KEY, /\.v\d+$/)
assert.equal(CONSENT_EVENT, "sivrce:consent")

// ── tracker state we must be able to erase on withdrawal (DSGVO Art. 7(3))
for (const key of ["_ga", "_ga_T90P2YSK4B", "_gid", "_gcl_au", "ph_abc_posthog", "__ph_opt_in_out"]) {
  assert.ok(isTrackingKey(key), `${key} must be purgeable`)
}
for (const key of ["sivrce.consent.v1", "theme", "sv-lang", "favorites", "agagreed"]) {
  assert.ok(!isTrackingKey(key), `${key} is ours — purge must not touch it`)
}

// ── source-level regression guards: a tracker that loads before opt-in is a
// TDDDG §25 violation, and the failure is silent in the browser. Assert wiring.
const src = (p: string) => readFileSync(join(process.cwd(), "src", p), "utf8")

const tags = src("components/GoogleTags.tsx")
assert.ok(tags.includes("useConsent"), "GoogleTags must read consent")
assert.ok(tags.includes("consent !== 'granted'"), "GoogleTags must bail unless granted")

const posthog = src("components/PostHogProvider.tsx")
assert.ok(posthog.includes("useConsent"), "PostHogProvider must read consent")
assert.ok(posthog.includes("consent !== 'granted'"), "PostHogProvider must bail unless granted")

for (const layout of ["app/[lang]/layout.tsx", "app/auth/layout.tsx"]) {
  const body = src(layout)
  assert.ok(!body.includes("googletagmanager.com/ns.html"), `${layout}: <noscript> GTM fires without consent`)
  assert.ok(body.includes("<ConsentBanner />"), `${layout}: consent prompt not mounted`)
}

// Withdrawal path stays one click from every page, and actually takes effect
// (already-evaluated tags survive a React unmount — only a reload kills them).
assert.ok(src("components/sections/Footer.tsx").includes("setConsent(null)"), "footer withdrawal link missing")
const consentSrc = src("lib/consent.ts")
assert.ok(consentSrc.includes("purgeTrackingStorage()"), "withdrawal must purge tracker state")
assert.ok(consentSrc.includes("location.reload()"), "withdrawal must unload running tags")

// Never server-rendered: a prompt in the SSR payload flashes for every visitor
// who already decided, and costs bytes on every page.
assert.ok(consentSrc.includes("'pending'"), "useConsent must report a pre-hydration state")

// Equal-weight choice: no dark pattern (both buttons same size class).
const banner = src("components/consent/ConsentBanner.tsx")
assert.ok(banner.includes("consent !== null"), "banner must render only when undecided (post-hydration)")
assert.equal((banner.match(/flex-1 rounded-control/g) ?? []).length, 2, "accept/decline must be equal weight")

console.log("consent.check: OK ✓")
