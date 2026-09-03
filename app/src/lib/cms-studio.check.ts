/**
 * Runnable check for the CMS studio model (pure — no DB).
 * Run: npx tsx src/lib/cms-studio.check.ts
 */
import { CMS_BLOCK_KEYS } from "./cms-blocks"
import { cmsRowForKey, isKnownCmsKey, rowsForSection } from "./cms-admin"
import {
  CMS_LAYOUT_ID,
  HOME_FLOW,
  HOME_SECTIONS,
  HOME_VIP_FOLLOW,
  HOME_VIP_LEAD,
  defaultHomeLayout,
  moveHomeLayout,
  parseHomeLayout,
  previewPath,
  sectionById,
  sectionIdForKey,
  studioPageById,
} from "./cms-studio"

assert(CMS_LAYOUT_ID.length <= 64, "layout id fits SystemConfig")
assert(HOME_FLOW.length === 16, "homepage flow count")
assert(
  HOME_FLOW.indexOf(HOME_VIP_FOLLOW) === HOME_FLOW.indexOf(HOME_VIP_LEAD) + 1,
  "SUPER VIP then VIP+ adjacent",
)
{
  const sid = HOME_SECTIONS.map((s) => s.id)
  assert(sid.indexOf(HOME_VIP_FOLLOW) === sid.indexOf(HOME_VIP_LEAD) + 1, "studio list glued")
}
assert(new Set(HOME_FLOW).size === HOME_FLOW.length, "flow ids unique")

const ids = HOME_SECTIONS.map((s) => s.id)
assert(new Set(ids).size === ids.length, "section ids unique")
for (const id of HOME_FLOW) {
  assert(HOME_SECTIONS.some((s) => s.id === id && !s.pin), `flow section ${id}`)
}
assert(sectionById("nav")?.pin === "start")
assert(sectionById("footer")?.pin === "end")
assert(sectionById("seo")?.pin === "meta")
assert(sectionIdForKey("block.home.vipPlus.title") === "vip_plus")

const layout = parseHomeLayout(["cta", "bogus", "cta", { id: "map", hidden: true }])
assert(layout[0].id === "cta", "stored order wins")
assert(layout.find((i) => i.id === "map")?.hidden === true)
assert(layout.find((i) => i.id === "stories"), "missing ids appended")
assert(!layout.some((i) => (i.id as string) === "bogus"))
assert(parseHomeLayout({ order: ["listings"] })[0].id === "listings")
assert(defaultHomeLayout().map((i) => i.id).join() === HOME_FLOW.join())
{
  const pinned = parseHomeLayout(["vip_plus", "cta", "listings"])
  assert(
    pinned.findIndex((i) => i.id === HOME_VIP_FOLLOW) ===
      pinned.findIndex((i) => i.id === HOME_VIP_LEAD) + 1,
    "VIP+ pinned under SUPER VIP",
  )
  const moved = moveHomeLayout(pinned, HOME_VIP_LEAD, "cta")
  assert(
    moved.findIndex((i) => i.id === HOME_VIP_FOLLOW) ===
      moved.findIndex((i) => i.id === HOME_VIP_LEAD) + 1,
    "drag SUPER VIP keeps VIP+ glued",
  )
  const split = moveHomeLayout(pinned, HOME_VIP_FOLLOW, "cta")
  assert(
    split.findIndex((i) => i.id === HOME_VIP_FOLLOW) ===
      split.findIndex((i) => i.id === HOME_VIP_LEAD) + 1,
    "drag VIP+ ignored — stays under SUPER VIP",
  )
}

assert(isKnownCmsKey("nav.buy"))
assert(isKnownCmsKey("block.home.hero.titleA"))
assert(isKnownCmsKey("seo.site.title"))
assert(!isKnownCmsKey("block.nope"))
assert(!isKnownCmsKey("layout.home"))

const hero = sectionById("hero")!
assert(hero.keys.includes("block.home.hero.titleA"))
assert(hero.keys.includes("block.home.search.popular"))
assert(sectionIdForKey("nav.buy") === "nav")
assert(sectionIdForKey("block.home.cta.primary") === "cta")

const rows = rowsForSection("en", hero, { "block.home.hero.titleA": "Hello" })
assert(rows.find((r) => r.key === "block.home.hero.titleA")?.value === "Hello")
assert(cmsRowForKey("en", "nav.buy", {})?.defaultText === "For sale")

assert(studioPageById("search")?.group === "search")
assert(previewPath("ka", "/") === "/")
assert(previewPath("en", "/search") === "/en/search")

const keyed = new Set(HOME_SECTIONS.flatMap((s) => s.keys))
for (const k of CMS_BLOCK_KEYS.filter((k) => k.startsWith("home.hero."))) {
  assert(keyed.has(`block.${k}`), `hero key mapped: ${k}`)
}

console.log("cms-studio.check: ok")

function assert(cond: unknown, msg = "assert failed"): asserts cond {
  if (!cond) throw new Error(msg)
}
