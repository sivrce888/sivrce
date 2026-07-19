/**
 * Shared listing vocabulary: condition, building status, project series, features.
 * The i18n keys ARE the stored DB values (extendedFields.condition,
 * extendedFields.buildingStatus, extendedFields.project, extendedFields.floorType,
 * features[]) — keep byte-identical or old rows stop matching /search filters.
 * Labels live in the i18n dicts.
 */
import type { DictKey } from '@/lib/i18n/context'

export const CONDITION_KEYS = [
  'add.cond.newReno', 'add.cond.oldReno', 'add.cond.currentReno', 'add.cond.needsReno',
  'add.cond.whiteFrame', 'add.cond.blackFrame', 'add.cond.greenFrame', 'add.cond.whitePlus',
] as const satisfies readonly DictKey[]

export const BUILDING_STATUS_KEYS = [
  'add.status.new', 'add.status.old', 'add.status.construction',
] as const satisfies readonly DictKey[]

/** Tbilisi apartment series — ss.ge / myhome vocabulary (apartments). */
export const PROJECT_KEYS = [
  'add.project.nonStandard',
  'add.project.leningrad',
  'add.project.lvov',
  'add.project.kiev',
  'add.project.tbilisiYard',
  'add.project.moscow',
  'add.project.city',
  'add.project.czech',
  'add.project.khrushchev',
  'add.project.tukhareli',
  'add.project.vedzisi',
  'add.project.yugoslav',
  'add.project.metromsheni',
  'add.project.kavlashvili',
  'add.project.other',
] as const satisfies readonly DictKey[]

/** Apartment layout extras common on Georgian classifieds. */
export const FLOOR_TYPE_KEYS = [
  'add.floorType.duplex',
  'add.floorType.triplex',
  'add.floorType.attic',
] as const satisfies readonly DictKey[]

export const FEATURE_KEYS = [
  'add.f.balcony', 'add.f.elevator', 'add.f.parking', 'add.f.garage', 'add.f.furniture',
  'add.f.appliances', 'add.f.centralHeating', 'add.f.gas', 'add.f.internet', 'add.f.ac',
  'add.f.storage', 'add.f.fireplace', 'add.f.security', 'add.f.yard',
  // Georgian classified staples (ss.ge / myhome).
  'add.f.hotWater', 'add.f.doubleGlazing', 'add.f.ironDoor', 'add.f.cableTv', 'add.f.cellar',
  'add.f.yardView', 'add.f.streetView', 'add.f.bright', 'add.f.quiet',
  // Daily-rent set (2026-07-18): contactless check-in, events, leisure.
  'add.f.selfCheckIn', 'add.f.partiesAllowed', 'add.f.pool',
  'add.f.jacuzzi', 'add.f.terrace', 'add.f.petsAllowed',
  // Competitor-verified filter set (Airbnb/Booking top filters, 2026-07-18).
  // ponytail: skipped safety items (smoke/CO alarm, extinguisher) — host
  // checklist, not renter filters; add with a detail-page safety block.
  'add.f.kitchen', 'add.f.washer', 'add.f.tv', 'add.f.workspace',
  'add.f.seaView', 'add.f.mountainView', 'add.f.beachfront', 'add.f.skiAccess',
  'add.f.bbq', 'add.f.sauna', 'add.f.gym', 'add.f.evCharger',
  'add.f.kidFriendly', 'add.f.accessible', 'add.f.smokingAllowed',
  // Seller capability (dedicated checkbox on /add-listing — not in amenity grid).
  'add.f.onlineView',
] as const satisfies readonly DictKey[]

/**
 * S-tier daily lifestyle signals — search quick chips + card overlays.
 * Order = priority (max 2 on cards). Same keys as Collections deep-links.
 * Not a paid "sticker" SKU — free truth surface.
 * Paid ნიშნები: sticker_urgent / sticker_price_drop in promo-pricing.
 * Owner/agency stays on the seller card — not a paid or free overlay chip.
 */
export const DAILY_SIGNAL_KEYS = [
  'add.f.pool',
  'add.f.jacuzzi',
  'add.f.partiesAllowed',
  'add.f.beachfront',
  'add.f.selfCheckIn',
  'add.f.petsAllowed',
  'add.f.skiAccess',
  'add.f.workspace',
] as const satisfies readonly (typeof FEATURE_KEYS)[number][]

/** Pick up to `limit` lifestyle keys present on a listing (priority order). */
export function pickDailySignals(features: readonly string[], limit = 2): typeof DAILY_SIGNAL_KEYS[number][] {
  const out: typeof DAILY_SIGNAL_KEYS[number][] = []
  for (const k of DAILY_SIGNAL_KEYS) {
    if (features.includes(k)) out.push(k)
    if (out.length >= limit) break
  }
  return out
}

const FEATURE_KEY_SET = new Set<string>(FEATURE_KEYS)
const DAILY_SIGNAL_SET = new Set<string>(DAILY_SIGNAL_KEYS)
const PROJECT_KEY_SET = new Set<string>(PROJECT_KEYS)
const FLOOR_TYPE_KEY_SET = new Set<string>(FLOOR_TYPE_KEYS)

export function isFeatureKey(f: string): f is (typeof FEATURE_KEYS)[number] {
  return FEATURE_KEY_SET.has(f)
}

export function isProjectKey(f: string): f is (typeof PROJECT_KEYS)[number] {
  return PROJECT_KEY_SET.has(f)
}

export function isFloorTypeKey(f: string): f is (typeof FLOOR_TYPE_KEYS)[number] {
  return FLOOR_TYPE_KEY_SET.has(f)
}

/** DB stores i18n keys; seed/legacy rows may still be free-text. */
export function featureLabel(f: string, t: (key: DictKey) => string): string {
  return isFeatureKey(f) ? t(f) : f
}

export function projectLabel(f: string, t: (key: DictKey) => string): string {
  return isProjectKey(f) ? t(f) : f
}

export function floorTypeLabel(f: string, t: (key: DictKey) => string): string {
  return isFloorTypeKey(f) ? t(f) : f
}

/** Daily: lifestyle signals first (priority order), then the rest. */
export function orderFeaturesForDisplay(features: readonly string[], dealType?: string): string[] {
  if (dealType !== 'daily') return [...features]
  const signals = DAILY_SIGNAL_KEYS.filter((k) => features.includes(k))
  const rest = features.filter((f) => !DAILY_SIGNAL_SET.has(f))
  return [...signals, ...rest]
}
