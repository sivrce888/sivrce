/**
 * Native systems lock — Capacitor bridge, PWA offline path, install prompt,
 * deep-link statements. Run: npx tsx src/lib/native.check.ts
 */
import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const root = process.cwd()
const read = (rel: string) => readFileSync(join(root, rel), 'utf8')

// --- Service worker: offline path + navigation preload ----------------------
const sw = read('public/sw.js')
assert.match(sw, /navigationPreload\.enable\(\)/, 'navigation preload removed — navigations wait on SW boot again')
assert.ok(sw.includes("'/offline'"), 'offline fallback missing from fetch handler')
assert.ok(!sw.includes('sivrce-v1'), 'cache version not bumped — old caches would survive activate')

// --- Offline page exists and is self-contained ------------------------------
const offline = read('src/app/offline/page.tsx')
assert.ok(offline.includes('<html'), 'offline page must render its own html (no layout above it)')

// --- Manifest stays installable with hardened display -----------------------
const manifest = read('src/app/manifest.ts')
assert.ok(manifest.includes('display_override'), 'manifest display_override removed')

// --- SW registration must skip the Capacitor shell --------------------------
assert.ok(
  /if\s*\(\s*isNative\(\)\s*\)\s*return/.test(read('src/app/sw-register.tsx')),
  'sw-register no longer guards the native shell',
)

// --- NativeShell: Capacitor imports stay dynamic (web bundle pays 0 bytes) --
const shell = read('src/components/native/NativeShell.tsx')
assert.ok(!/from\s+['"]@capacitor/.test(shell), 'static @capacitor import leaked into the client graph')
// The back button lives in @capacitor/app. @capacitor/core has no App export,
// so importing it from there left App undefined, the throw fell into the
// catch, and Android's hardware back button did nothing at all.
assert.ok(/import\('@capacitor\/app'\)/.test(shell), 'back-button bridge missing')
assert.ok(!/import\('@capacitor\/core'\)[^]{0,80}App/.test(shell), 'App must not be pulled from @capacitor/core')
assert.ok(
  existsSync(join(root, 'node_modules/@capacitor/app')),
  '@capacitor/app is not installed — the back-button bridge would silently no-op',
)
const pkg = JSON.parse(read('package.json')) as { dependencies: Record<string, string> }
assert.ok(pkg.dependencies['@capacitor/app'], '@capacitor/app missing from dependencies')

// tsx compiles a .check.ts to CJS, where top-level await is a hard error. One
// async main keeps the dynamic imports without renaming the file to .mts.
async function main() {
// --- isNative(): pure behavior, no window required at import time -----------
const { isNative } = await import('./native')
const g = globalThis as { window?: unknown }
g.window = { Capacitor: { isNativePlatform: true } }
assert.ok(isNative(), 'isNative() false with Capacitor global present')
g.window = {}
assert.ok(!isNative(), 'isNative() true without Capacitor global')
delete g.window
assert.ok(!isNative(), 'isNative() must not throw without window')

// --- Deep-link statements: empty without env, shaped with env ----------------
process.env.ANDROID_PACKAGE_NAME = 'ge.sivrce.app'
delete process.env.ANDROID_CERT_SHA256S
const al = await import('../app/.well-known/assetlinks.json/route')
assert.deepEqual(await al.GET().json(), [], 'assetlinks must be [] without certs')
process.env.ANDROID_CERT_SHA256S = 'AA:BB:CC, DD:EE:FF'
const links = await al.GET().json()
assert.equal(links.length, 2)
assert.equal(links[0].target.package_name, 'ge.sivrce.app')
assert.deepEqual(links[1].target.sha256_cert_fingerprints, ['DD:EE:FF'])
delete process.env.ANDROID_CERT_SHA256S
delete process.env.ANDROID_PACKAGE_NAME

delete process.env.APPLE_APP_ID
const aasa = await import('../app/apple-app-site-association/route')
assert.deepEqual(
  (await aasa.GET().json()).applinks.details,
  [],
  'AASA must be empty without APPLE_APP_ID',
)
process.env.APPLE_APP_ID = 'TEAM123.ge.sivrce.app'
const details = (await aasa.GET().json()).applinks.details
assert.deepEqual(details, [{ appIDs: ['TEAM123.ge.sivrce.app'], components: [{ '/': '/*' }] }])
delete process.env.APPLE_APP_ID

// --- Install prompt: i18n keys exist in every dict ---------------------------
for (const lang of ['ka', 'en', 'ru', 'he', 'ar', 'tr', 'uk', 'hy', 'az', 'de']) {
  const dict = read(`src/lib/i18n/${lang}.ts`)
  for (const key of ['app.install.title', 'app.install.action', 'app.install.later', 'app.install.ios']) {
    assert.ok(dict.includes(`"${key}"`), `${lang} dict missing ${key}`)
  }
}

}

void main().then(
  () => console.log('native.check ✓'),
  (err: unknown) => {
    console.error(err)
    process.exit(1)
  },
)
