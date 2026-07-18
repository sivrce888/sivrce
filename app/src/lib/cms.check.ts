/**
 * Runnable check for the CMS override store (pure parts — no DB).
 * Run: npx tsx src/lib/cms.check.ts
 */
import { CMS_BLOCKS, CMS_BLOCK_KEYS } from "./cms-blocks"
import { buildCmsId, cmsGroups, cmsRowsForGroup, parseCmsId } from "./cms-blocks"
import { ka } from "./i18n/ka"
import { LANGS } from "./i18n/core"
import { SITE_META } from "./i18n/server"

// id build/parse round-trips
assert(parseCmsId("cms.en.nav.buy")?.key === "nav.buy")
assert(parseCmsId("cms.en.nav.buy")?.lang === "en")
assert(parseCmsId("cms.ka.block.home.hero.titleA")?.key === "block.home.hero.titleA")
assert(parseCmsId("cms.xx.nav.buy") === null, "invalid lang rejected")
assert(parseCmsId("site.contactEmail") === null, "non-cms keys rejected")
assert(parseCmsId("cms.") === null)
assert(buildCmsId("en", "nav.buy") === "cms.en.nav.buy")
assert(buildCmsId("en", "x".repeat(61)) === null, "VarChar(64) overflow rejected")

// every key fits the SystemConfig.id column for every language
for (const key of Object.keys(ka)) {
  for (const lang of LANGS) assert(buildCmsId(lang, key) !== null, `dict key too long: ${key}`)
}
for (const key of CMS_BLOCK_KEYS) {
  for (const lang of LANGS) assert(buildCmsId(lang, `block.${key}`) !== null, `block key too long: ${key}`)
}

// block registry integrity
assert(CMS_BLOCK_KEYS.length > 30, "expected the homepage block set")
for (const key of CMS_BLOCK_KEYS) {
  assert(key.startsWith("home."), `block key namespaced: ${key}`)
  assert(CMS_BLOCKS[key].trim().length > 0, `block default non-empty: ${key}`)
}
// stat values stay numeric (count-up animation depends on it)
for (const key of CMS_BLOCK_KEYS.filter((k) => k.endsWith(".value"))) {
  assert(Number.isFinite(Number(CMS_BLOCKS[key])), `stat value numeric: ${key}`)
}

// admin editor model
const groups = cmsGroups()
assert(groups.some((g) => g.id === "nav"), "nav group exists")
assert(groups.some((g) => g.id === "blocks"), "blocks group exists")
assert(groups[groups.length - 1].id === "seo", "seo group last")
const totalDict = groups
  .filter((g) => g.id !== "blocks" && g.id !== "seo")
  .reduce((n, g) => n + g.count, 0)
assert(totalDict === Object.keys(ka).length, "groups cover every dict key")

const navRows = cmsRowsForGroup("en", "nav", { "nav.buy": "Buy now" })
assert(navRows.length === groups.find((g) => g.id === "nav")!.count)
assert(navRows.find((r) => r.key === "nav.buy")?.value === "Buy now")
assert(navRows.find((r) => r.key === "nav.rent")?.defaultText === "For rent")

const blockRows = cmsRowsForGroup("ka", "blocks", { "block.home.hero.titleA": "გამარჯობა" })
assert(blockRows.length === CMS_BLOCK_KEYS.length)
assert(blockRows[0].key.startsWith("block."), "block rows carry storage keys")
assert(blockRows.find((r) => r.key === "block.home.hero.titleA")?.value === "გამარჯობა")
assert(cmsRowsForGroup("ka", "nope", {}).length === 0, "unknown group → no rows")

// SEO meta group — defaults mirror SITE_META per language, overridable
const seoRows = cmsRowsForGroup("en", "seo", { "seo.site.title": "Custom title" })
assert(seoRows.length === 2, "title + description rows")
assert(seoRows.find((r) => r.key === "seo.site.title")?.value === "Custom title")
assert(seoRows.find((r) => r.key === "seo.site.title")?.defaultText === SITE_META.en.title)
assert(cmsRowsForGroup("ru", "seo", {}).find((r) => r.key === "seo.site.description")?.defaultText === SITE_META.ru.description)
assert(cmsGroups().some((g) => g.id === "seo"), "seo group listed")
for (const row of seoRows) {
  for (const lang of LANGS) assert(buildCmsId(lang, row.key) !== null, `seo key fits: ${row.key}`)
}

console.log("cms.check: ok")

function assert(cond: unknown, msg = "assert failed"): asserts cond {
  if (!cond) throw new Error(msg)
}
