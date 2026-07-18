/**
 * Shared listing vocabulary: condition, building status, feature chips.
 * The i18n keys ARE the stored DB values (extendedFields.condition,
 * extendedFields.buildingStatus, features[]) — keep byte-identical or old
 * rows stop matching /search filters. Labels live in the i18n dicts.
 */
import type { DictKey } from '@/lib/i18n/context'

export const CONDITION_KEYS = [
  'add.cond.newReno', 'add.cond.oldReno', 'add.cond.needsReno',
  'add.cond.whiteFrame', 'add.cond.blackFrame', 'add.cond.greenFrame',
] as const satisfies readonly DictKey[]

export const BUILDING_STATUS_KEYS = [
  'add.status.new', 'add.status.old', 'add.status.construction',
] as const satisfies readonly DictKey[]

export const FEATURE_KEYS = [
  'add.f.balcony', 'add.f.elevator', 'add.f.parking', 'add.f.garage', 'add.f.furniture',
  'add.f.appliances', 'add.f.centralHeating', 'add.f.gas', 'add.f.internet', 'add.f.ac',
  'add.f.storage', 'add.f.fireplace', 'add.f.security', 'add.f.yard',
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
] as const satisfies readonly DictKey[]
