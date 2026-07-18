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
] as const satisfies readonly DictKey[]
