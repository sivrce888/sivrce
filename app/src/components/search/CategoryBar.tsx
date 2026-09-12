'use client'

import { useMemo } from 'react'
import HScroll from '@/components/HScroll'
import { CATEGORY_BRAND, type CategoryBrand } from '@/lib/category-brand'
import type { CmsBlockKey } from '@/lib/cms-blocks'
import { useI18n, type DictKey } from '@/lib/i18n/context'
import type { DealType, PropType } from '@/data/listings'
import {
  Building,
  Home,
  TreePalm,
  Map,
  Briefcase,
  CalendarClock,
  Hotel,
  Sparkles,
  KeyRound,
  Waves,
  Mountain,
  PawPrint,
  Laptop,
  Crown,
  Trees,
  Bath,
  Compass,
  Layers,
  type LucideIcon,
} from 'lucide-react'
import { PartyHouseIcon } from '@/components/PartyHouseIcon'

export type CategoryBarItem = {
  id: string
  labelKey: CmsBlockKey | DictKey
  icon: LucideIcon
  brand: CategoryBrand
  type?: PropType
  deal?: DealType
  feat?: string
}

export const SEARCH_CATEGORIES: CategoryBarItem[] = [
  {
    id: 'all',
    labelKey: 'search.allTypes',
    icon: Layers,
    brand: CATEGORY_BRAND.apartments,
  },
  {
    id: 'apartments',
    labelKey: 'home.categories.apartments',
    icon: Building,
    brand: CATEGORY_BRAND.apartments,
    type: 'apartment',
  },
  {
    id: 'houses',
    labelKey: 'home.categories.houses',
    icon: Home,
    brand: CATEGORY_BRAND.houses,
    type: 'house',
  },
  {
    id: 'cottages',
    labelKey: 'home.categories.cottages',
    icon: TreePalm,
    brand: CATEGORY_BRAND.cottages,
    type: 'villa',
  },
  {
    id: 'dailyRent',
    labelKey: 'home.categories.dailyRent',
    icon: CalendarClock,
    brand: CATEGORY_BRAND.dailyRent,
    deal: 'daily',
  },
  {
    id: 'partyHouses',
    labelKey: 'home.categories.partyHouses',
    icon: PartyHouseIcon,
    brand: CATEGORY_BRAND.partyHouses,
    deal: 'daily',
    feat: 'add.f.partiesAllowed',
  },
  {
    id: 'selfCheckIn',
    labelKey: 'home.categories.selfCheckIn',
    icon: KeyRound,
    brand: CATEGORY_BRAND.selfCheckIn,
    deal: 'daily',
    feat: 'add.f.selfCheckIn',
  },
  {
    id: 'seaView',
    labelKey: 'home.categories.seaView',
    icon: Compass,
    brand: CATEGORY_BRAND.seaView,
    feat: 'add.f.seaView',
  },
  {
    id: 'pools',
    labelKey: 'home.categories.pools',
    icon: Waves,
    brand: CATEGORY_BRAND.pools,
    feat: 'add.f.pool',
  },
  {
    id: 'jacuzzi',
    labelKey: 'home.categories.jacuzzi',
    icon: Bath,
    brand: CATEGORY_BRAND.jacuzzi,
    feat: 'add.f.jacuzzi',
  },
  {
    id: 'ski',
    labelKey: 'home.categories.ski',
    icon: Mountain,
    brand: CATEGORY_BRAND.ski,
    feat: 'add.f.skiAccess',
  },
  {
    id: 'petFriendly',
    labelKey: 'home.categories.petFriendly',
    icon: PawPrint,
    brand: CATEGORY_BRAND.petFriendly,
    feat: 'add.f.petsAllowed',
  },
  {
    id: 'workspace',
    labelKey: 'home.categories.workspace',
    icon: Laptop,
    brand: CATEGORY_BRAND.workspace,
    feat: 'add.f.workspace',
  },
  {
    id: 'penthouses',
    labelKey: 'home.categories.penthouses',
    icon: Crown,
    brand: CATEGORY_BRAND.penthouses,
    feat: 'add.f.penthouse',
  },
  {
    id: 'cabins',
    labelKey: 'home.categories.cabins',
    icon: Trees,
    brand: CATEGORY_BRAND.cabins,
    type: 'house',
    feat: 'add.f.wooden',
  },
  {
    id: 'land',
    labelKey: 'home.categories.land',
    icon: Map,
    brand: CATEGORY_BRAND.land,
    type: 'land',
  },
  {
    id: 'commercial',
    labelKey: 'home.categories.commercial',
    icon: Briefcase,
    brand: CATEGORY_BRAND.commercial,
    type: 'commercial',
  },
  {
    id: 'hotels',
    labelKey: 'home.categories.hotels',
    icon: Hotel,
    brand: CATEGORY_BRAND.hotels,
    type: 'hotel',
  },
  {
    id: 'newProjects',
    labelKey: 'home.categories.newProjects',
    icon: Sparkles,
    brand: CATEGORY_BRAND.newProjects,
  },
]

type Props = {
  currentType?: PropType
  currentDeal?: DealType
  currentFeats?: string[]
  onSelect: (item: CategoryBarItem) => void
  className?: string
}

export default function CategoryBar({
  currentType,
  currentDeal,
  currentFeats = [],
  onSelect,
  className = '',
}: Props) {
  const { t, b } = useI18n()

  const activeId = useMemo(() => {
    for (const item of SEARCH_CATEGORIES) {
      if (item.id === 'all') continue
      if (item.feat && currentFeats.includes(item.feat)) {
        if (item.deal && currentDeal !== item.deal) continue
        if (item.type && currentType !== item.type) continue
        return item.id
      }
      if (!item.feat && item.type && currentType === item.type && (!item.deal || currentDeal === item.deal)) {
        return item.id
      }
      if (!item.feat && !item.type && item.deal && currentDeal === item.deal) {
        return item.id
      }
    }
    return 'all'
  }, [currentType, currentDeal, currentFeats])

  return (
    <div className={`w-full ${className}`}>
      <HScroll size="sm" aria-label="კატეგორიები" className="gap-2 py-1.5">
        {SEARCH_CATEGORIES.map((item) => {
          const active = activeId === item.id
          const Icon = item.icon
          const label = item.labelKey.startsWith('home.categories.')
            ? b(item.labelKey as CmsBlockKey)
            : t(item.labelKey as DictKey)

          return (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => onSelect(item)}
              className={`group flex shrink-0 items-center gap-2 rounded-full px-3.5 py-2 text-[13px] font-extrabold transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sv-primary ${
                active
                  ? 'bg-sv-surface text-sv-ink shadow-card ring-2 dark:bg-sv-navy dark:text-white'
                  : 'bg-sv-cloud/80 text-sv-ink/70 hover:bg-sv-surface hover:text-sv-ink dark:bg-white/[0.06] dark:text-white/70 dark:hover:bg-white/[0.12] dark:hover:text-white'
              }`}
              style={
                active
                  ? {
                      borderColor: item.brand.hue,
                      boxShadow: `0 2px 12px -2px ${item.brand.hue}25`,
                    }
                  : undefined
              }
            >
              <span
                className="grid h-7 w-7 shrink-0 place-items-center rounded-full transition-transform duration-300 group-hover:scale-105"
                style={{
                  backgroundColor: active ? item.brand.chipVar : 'transparent',
                  color: item.brand.hue,
                }}
              >
                <Icon className="h-4 w-4" />
              </span>
              <span className="truncate">{label}</span>
            </button>
          )
        })}
      </HScroll>
    </div>
  )
}
