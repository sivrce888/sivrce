/**
 * myhome.ge-shaped add-listing field matrix.
 * Prop type + deal → which deals/fields/status/condition options show.
 * Stored status/condition values remain i18n keys (same as /search filters).
 */
import type { DealType, PropType } from '@/data/listings'
import type { DictKey } from '@/lib/i18n/context'
import { BUILDING_STATUS_KEYS, CONDITION_KEYS } from '@/lib/features'

export const FORM_PROP_TYPES = [
  'apartment',
  'house',
  'villa',
  'land',
  'commercial',
  'hotel',
] as const satisfies readonly PropType[]

/** Deals available per property type (land: rent = იჯარა, no daily). */
export const DEALS_FOR: Record<PropType, readonly DealType[]> = {
  apartment: ['sale', 'rent', 'pledge', 'daily'],
  house: ['sale', 'rent', 'pledge', 'daily'],
  villa: ['sale', 'rent', 'pledge', 'daily'],
  commercial: ['sale', 'rent', 'pledge', 'daily'],
  hotel: ['sale', 'rent', 'pledge', 'daily'],
  land: ['sale', 'rent', 'pledge'],
}

export const DEAL_LABEL: Record<DealType, DictKey> = {
  sale: 'add.deal.sale',
  rent: 'add.deal.rent',
  daily: 'add.deal.daily',
  pledge: 'add.deal.pledge',
}

export function dealLabelKey(deal: DealType, prop: PropType | null): DictKey {
  if (prop === 'land' && deal === 'rent') return 'add.deal.lease'
  return DEAL_LABEL[deal]
}

const BUILDING_CONDS = CONDITION_KEYS
const DAILY_CONDS = [
  'add.cond.newReno',
  'add.cond.oldReno',
  'add.cond.needsReno',
] as const satisfies readonly DictKey[]

const LAND_STATUSES = [
  'add.status.land.agri',
  'add.status.land.nonAgri',
  'add.status.land.commercial',
  'add.status.land.special',
  'add.status.land.investment',
  'add.status.land.farm',
] as const satisfies readonly DictKey[]

const COMM_STATUSES = [
  'add.status.comm.special',
  'add.status.comm.office',
  'add.status.comm.retail',
  'add.status.comm.warehouse',
  'add.status.comm.production',
  'add.status.comm.food',
  'add.status.comm.garage',
  'add.status.comm.basement',
  'add.status.comm.semiBasement',
  'add.status.comm.wholeBuilding',
  'add.status.comm.carWash',
  'add.status.comm.carService',
  'add.status.comm.universal',
] as const satisfies readonly DictKey[]

const HOTEL_STATUSES = [
  'add.status.construction',
  'add.status.completed',
] as const satisfies readonly DictKey[]

export type FormFields = {
  rooms: boolean
  baths: boolean
  floor: boolean
  totalFloors: boolean
  yard: boolean
  condition: boolean
  status: boolean
  areaHa: boolean
  rentPeriod: boolean
  rentType: boolean
  guests: boolean
  exchange: boolean
}

export function fieldsFor(prop: PropType, deal: DealType): FormFields {
  const land = prop === 'land'
  const built = !land
  const houseLike = prop === 'house' || prop === 'villa'
  return {
    rooms: built,
    baths: built,
    floor: prop === 'apartment' || prop === 'commercial' || prop === 'hotel',
    totalFloors: built,
    yard: houseLike || prop === 'hotel',
    condition: built,
    status: true,
    areaHa: land,
    rentPeriod: deal === 'rent' && !land,
    rentType: deal === 'rent' && !land,
    guests: deal === 'daily',
    exchange: deal === 'sale',
  }
}

export function conditionsFor(prop: PropType, deal: DealType): readonly DictKey[] {
  if (prop === 'land') return []
  if (deal === 'daily') return DAILY_CONDS
  return BUILDING_CONDS
}

export function statusesFor(prop: PropType): readonly DictKey[] {
  switch (prop) {
    case 'land':
      return LAND_STATUSES
    case 'commercial':
      return COMM_STATUSES
    case 'hotel':
      return HOTEL_STATUSES
    case 'apartment':
    case 'house':
    case 'villa':
      return BUILDING_STATUS_KEYS
    default: {
      const _x: never = prop
      return _x
    }
  }
}

export const RENT_PERIODS = [3, 6, 9, 12, 15, 18] as const
export const RENT_TYPES = [
  'add.rentType.whole',
  'add.rentType.part',
  'add.rentType.withOwner',
] as const satisfies readonly DictKey[]

/** Land / building feature subsets — full FEATURE_KEYS still accepted on publish. */
export const LAND_FEATURE_KEYS = [
  'add.f.parking',
  'add.f.garage',
  'add.f.security',
  'add.f.yard',
  'add.f.seaView',
  'add.f.mountainView',
  'add.f.beachfront',
] as const satisfies readonly DictKey[]
