/**
 * Runnable check for the CMS override store (pure parts — no DB).
 * Run: npx tsx src/lib/cms.check.ts
 */
import { CMS_BLOCKS, CMS_BLOCK_KEYS } from "./cms-blocks"
import { buildCmsId, cmsGroups, cmsRowForKey, cmsRowsForGroup, isKnownCmsKey, parseCmsId } from "./cms-blocks"
import { BLOCK_I18N } from "./cms-blocks.i18n"
import { ka } from "./i18n/ka"
import { LANGS } from "./i18n/core"
import { SITE_META } from "./i18n/server"

// translated block defaults: every locale-neutral-symbolic ka value is exempt;
// every other key must exist, keep {n}/{v} vars, and months must have 12 parts.
const SYMBOLIC_KA = /^[\d\s/+%.·-]*$/
for (const [lang, dict] of Object.entries(BLOCK_I18N)) {
  for (const key of CMS_BLOCK_KEYS) {
    if (SYMBOLIC_KA.test(CMS_BLOCKS[key])) continue
    const val = dict[key]
    assert(val != null && val.trim().length > 0, `block i18n missing: ${lang} ${key}`)
    for (const v of ["{n}", "{v}"]) {
      if (CMS_BLOCKS[key].includes(v))
        assert(val.includes(v), `block i18n lost ${v}: ${lang} ${key}`)
    }
  }
  assert(
    (dict["home.blog.months"] ?? "").split(",").length === 12,
    `block i18n months must have 12 entries: ${lang}`,
  )
}

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
assert(isKnownCmsKey("nav.buy") && isKnownCmsKey("block.home.hero.titleA"))
assert(isKnownCmsKey("seo.site.title") && !isKnownCmsKey("not.a.key"))
assert(cmsRowForKey("en", "nav.buy", {})?.defaultText === "For sale")

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
for (const lang of LANGS) {
  assert(SITE_META[lang].title.trim().length > 20, `seo title ${lang}`)
  assert(SITE_META[lang].description.trim().length > 40, `seo desc ${lang}`)
}
assert(SITE_META.he.title !== SITE_META.en.title, "he meta not english copy")
assert(SITE_META.ar.title !== SITE_META.en.title, "ar meta not english copy")
assert(SITE_META.tr.title !== SITE_META.en.title, "tr meta not english copy")
assert(SITE_META.ka.title.includes("უძრავი ქონება საქართველოში"), "ka title money query")
assert(SITE_META.ka.title.includes("ბინები დღიურად თბილისში"), "ka title daily tbilisi")
assert(SITE_META.ka.description.includes("საბურთალოზე"), "ka desc saburtalo")
assert(CMS_BLOCKS["home.hero.titleAccent"] === "საქართველოში", "home h1 locative")

console.log("cms.check: ok")

function assert(cond: unknown, msg = "assert failed"): asserts cond {
  if (!cond) throw new Error(msg)
}
