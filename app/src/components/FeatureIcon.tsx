import type { CSSProperties } from 'react'
import {
  Accessibility, AppWindow, Archive, ArrowUpDown, Bath, Baby, Blinds, Cable, CableCar,
  Check, Cigarette, CookingPot, Crown, DoorClosed, Droplets, Dumbbell, Fence, Flame, FlameKindling,
  Heater, KeyRound, Laptop, MountainSnow, Package, PawPrint, PlugZap, Refrigerator,
  Sailboat, ShieldCheck, Snowflake, Sofa, SquareParking, Store, Sun, Tent,
  ThermometerSun, TreeDeciduous, Trees, Tv, Umbrella, UtensilsCrossed, Video, VolumeX,
  Warehouse, WashingMachine, WavesLadder, Wifi,
  type LucideIcon,
} from 'lucide-react'
import type { FeatureKey } from '@/lib/features'
import { PartyHouseIcon } from '@/components/PartyHouseIcon'

/**
 * One Lucide glyph per amenity — detail chips, add-listing grid, search
 * filters and card signals all share this map. Names verified against the
 * installed lucide-react (no `Waves` — renamed upstream; `WavesLadder`
 * reads as pool). Brand lock: glyph color comes from context (sv-blue /
 * white on selected), never per-feature hues.
 * ponytail: partiesAllowed keeps the custom PartyHouseIcon via FeatureGlyph.
 */
export const FEATURE_ICON: Record<Exclude<FeatureKey, 'add.f.partiesAllowed'>, LucideIcon> = {
  'add.f.balcony': Fence,
  'add.f.loggia': Blinds,
  'add.f.terrace': Tent,
  'add.f.yard': Trees,
  'add.f.storage': Package,
  'add.f.cellar': Archive,
  'add.f.elevator': ArrowUpDown,
  'add.f.parking': SquareParking,
  'add.f.garage': Warehouse,
  'add.f.security': ShieldCheck,
  'add.f.ironDoor': DoorClosed,
  'add.f.doubleGlazing': AppWindow,
  'add.f.wooden': Trees,
  'add.f.penthouse': Crown,
  'add.f.accessible': Accessibility,
  'add.f.centralHeating': Heater,
  'add.f.gas': Flame,
  'add.f.hotWater': Droplets,
  'add.f.internet': Wifi,
  'add.f.cableTv': Cable,
  'add.f.furniture': Sofa,
  'add.f.appliances': Refrigerator,
  'add.f.ac': Snowflake,
  'add.f.fireplace': FlameKindling,
  'add.f.kitchen': CookingPot,
  'add.f.washer': WashingMachine,
  'add.f.tv': Tv,
  'add.f.seaView': Sailboat,
  'add.f.mountainView': MountainSnow,
  'add.f.yardView': TreeDeciduous,
  'add.f.streetView': Store,
  'add.f.beachfront': Umbrella,
  'add.f.bright': Sun,
  'add.f.quiet': VolumeX,
  'add.f.pool': WavesLadder,
  'add.f.jacuzzi': Bath,
  'add.f.sauna': ThermometerSun,
  'add.f.gym': Dumbbell,
  'add.f.bbq': UtensilsCrossed,
  'add.f.evCharger': PlugZap,
  'add.f.skiAccess': CableCar,
  'add.f.selfCheckIn': KeyRound,
  'add.f.petsAllowed': PawPrint,
  'add.f.kidFriendly': Baby,
  'add.f.workspace': Laptop,
  'add.f.smokingAllowed': Cigarette,
  'add.f.onlineView': Video,
}

/** Glyph for any feature key — custom party icon included, aria-hidden. */
export function FeatureGlyph({
  k, className = 'h-3.5 w-3.5', style,
}: {
  k: string
  className?: string
  style?: CSSProperties
}) {
  if (k === 'add.f.partiesAllowed') return <PartyHouseIcon className={className} style={style} />
  // ponytail: legacy free-text rows get neutral Check, not a literal glyph.
  const Icon = (FEATURE_ICON as Record<string, LucideIcon>)[k] ?? Check
  return <Icon className={className} style={style} aria-hidden />
}
