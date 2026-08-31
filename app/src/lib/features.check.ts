/**
 * Runnable check for daily signal priority / pickDailySignals.
 * Run: npx tsx src/lib/features.check.ts
 */
import { DAILY_SIGNAL_KEYS, FEATURE_KEYS, FEATURE_GROUPS, pickDailySignals, featureLabel, groupedFeatures, orderFeaturesForDisplay, isFeatureKey } from "./features"
import { ka } from "./i18n/ka"

function assert(ok: boolean, label: string) {
  if (!ok) throw new Error(`features assert failed: ${label}`)
}

assert(DAILY_SIGNAL_KEYS.every((k) => (FEATURE_KEYS as readonly string[]).includes(k)), "signals ⊆ FEATURE_KEYS")
assert(pickDailySignals([]).length === 0, "empty")
assert(
  pickDailySignals(["add.f.workspace", "add.f.pool", "add.f.jacuzzi"]).join() ===
    "add.f.pool,add.f.jacuzzi",
  "priority pool>jacuzzi>… over workspace",
)
assert(pickDailySignals(["add.f.workspace"], 1).join() === "add.f.workspace", "limit 1")
assert(pickDailySignals(["პანორამული", "add.f.petsAllowed"]).join() === "add.f.petsAllowed", "ignore free-text")
assert(isFeatureKey("add.f.pool") && !isFeatureKey("აუზი"), "isFeatureKey")
assert(featureLabel("add.f.pool", (k) => `T:${k}`) === "T:add.f.pool", "featureLabel key")
assert(featureLabel("აუზი კომპლექსში", (k) => `T:${k}`) === "აუზი კომპლექსში", "featureLabel free-text")
assert(
  orderFeaturesForDisplay(["add.f.yard", "add.f.pool", "Wi-Fi"], "daily").join() ===
    "add.f.pool,add.f.yard,Wi-Fi",
  "daily order",
)
assert(orderFeaturesForDisplay(["add.f.yard", "add.f.pool"], "sale").join() === "add.f.yard,add.f.pool", "sale keeps order")
assert(isFeatureKey("add.f.loggia"), "loggia key")
{
  const grouped = new Set<string>(FEATURE_GROUPS.flatMap((g) => [...g.items]))
  for (const k of FEATURE_KEYS) {
    if (k === "add.f.onlineView") assert(!grouped.has(k), "onlineView stays off grid")
    else assert(grouped.has(k), `group covers ${k}`)
  }
}
assert(groupedFeatures(["add.f.balcony", "add.f.pool"]).map((g) => g.key).join() === "add.fg.space,add.fg.extra", "group order")
assert(groupedFeatures(["add.f.onlineView"]).length === 0, "onlineView no group")
assert(ka["add.f.partiesAllowed"] === "წვეულების სახლი", "feature is house-for-parties, not 'parties'")
assert(ka["col.party"] === "სახლები წვეულებისთვის", "collection is houses for parties")

console.log("features: ok")
