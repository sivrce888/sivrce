'use client'

import { useState, useMemo } from 'react'
import { Search, RotateCcw, ChevronDown } from 'lucide-react'
import ListingCard from '@/components/ListingCard'
import { useI18n } from '@/lib/i18n/context'
import type { Listing, PropType, SortKey } from '@/data/listings'

interface SeoFilterableListingsProps {
  initialListings: Listing[]
  gridAriaLabel: string
}

const PROP_TYPE_OPTIONS: { value: PropType | 'all'; labelKa: string; labelEn: string; labelRu: string }[] = [
  { value: 'all', labelKa: 'ყველა ტიპი', labelEn: 'All Types', labelRu: 'Все типы' },
  { value: 'apartment', labelKa: 'ბინები', labelEn: 'Apartments', labelRu: 'Квартиры' },
  { value: 'house', labelKa: 'სახლები', labelEn: 'Houses', labelRu: 'Дома' },
  { value: 'land', labelKa: 'მიწის ნაკვეთები', labelEn: 'Land', labelRu: 'Участки' },
  { value: 'commercial', labelKa: 'კომერციული', labelEn: 'Commercial', labelRu: 'Коммерческая' },
]

export default function SeoFilterableListings({ initialListings, gridAriaLabel }: SeoFilterableListingsProps) {
  const { lang, t } = useI18n()
  const [q, setQ] = useState('')
  const [seller, setSeller] = useState<'owner' | 'agency' | undefined>(undefined)
  const [propType, setPropType] = useState<PropType | 'all'>('all')
  const [minPrice, setMinPrice] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const [minArea, setMinArea] = useState('')
  const [maxArea, setMaxArea] = useState('')
  const [sort, setSort] = useState<SortKey>('date')

  const filtered = useMemo(() => {
    let list = [...initialListings]

    // Seller type filter
    if (seller === 'owner') {
      list = list.filter((l) => l.agent?.role === 'owner' || l.sellerType === 'owner')
    } else if (seller === 'agency') {
      list = list.filter((l) => l.agent?.role === 'agency' || l.sellerType === 'agency')
    }

    // Property type filter
    if (propType !== 'all') {
      list = list.filter((l) => l.propType === propType)
    }

    // Keyword / address / ID filter
    if (q.trim()) {
      const query = q.trim().toLowerCase()
      list = list.filter((l) =>
        l.title.toLowerCase().includes(query) ||
        l.address.toLowerCase().includes(query) ||
        (l.city && l.city.toLowerCase().includes(query)) ||
        (l.district && l.district.toLowerCase().includes(query)) ||
        (l.publicId && String(l.publicId).includes(query))
      )
    }

    // Price range
    const minP = Number(minPrice)
    if (minPrice && !isNaN(minP)) {
      list = list.filter((l) => l.priceGEL >= minP || l.priceUSD >= minP)
    }
    const maxP = Number(maxPrice)
    if (maxPrice && !isNaN(maxP)) {
      list = list.filter((l) => l.priceGEL <= maxP || l.priceUSD <= maxP)
    }

    // Area range
    const minA = Number(minArea)
    if (minArea && !isNaN(minA)) {
      list = list.filter((l) => l.area >= minA)
    }
    const maxA = Number(maxArea)
    if (maxArea && !isNaN(maxA)) {
      list = list.filter((l) => l.area <= maxA)
    }

    // Sorting
    if (sort === 'price-asc') {
      list.sort((a, b) => a.priceGEL - b.priceGEL)
    } else if (sort === 'price-desc') {
      list.sort((a, b) => b.priceGEL - a.priceGEL)
    } else if (sort === 'area') {
      list.sort((a, b) => b.area - a.area)
    }

    return list
  }, [initialListings, seller, propType, q, minPrice, maxPrice, minArea, maxArea, sort])

  const hasFilters = Boolean(q || seller || propType !== 'all' || minPrice || maxPrice || minArea || maxArea || sort !== 'date')

  const resetFilters = () => {
    setQ('')
    setSeller(undefined)
    setPropType('all')
    setMinPrice('')
    setMaxPrice('')
    setMinArea('')
    setMaxArea('')
    setSort('date')
  }

  const propLabel = (opt: (typeof PROP_TYPE_OPTIONS)[number]) =>
    lang === 'ka' ? opt.labelKa : lang === 'ru' ? opt.labelRu : opt.labelEn

  return (
    <div className="space-y-6">
      {/* Search & Filter Toolbar */}
      <div className="rounded-card border border-sv-ink/[0.06] bg-sv-surface p-4 shadow-card md:p-5">
        <div className="flex flex-wrap items-center gap-3">
          {/* Search Input */}
          <div className="relative min-w-[240px] flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-sv-ink/40" />
            <input
              type="text"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={lang === 'ka' ? 'მაგ. ვაჟა-ფშაველას გამზირი | ID, ტელეფონი, სიტყვა' : 'Search by location, street, ID…'}
              className="h-11 w-full rounded-control border border-sv-ink/10 bg-sv-surface pl-10 pr-3.5 text-[13px] font-bold text-sv-ink outline-none transition-colors placeholder:text-sv-ink/35 focus:border-sv-blue focus-visible:ring-2 focus-visible:ring-sv-blue/30"
            />
          </div>

          {/* Property Type Dropdown */}
          <div className="relative min-w-[150px]">
            <select
              value={propType}
              onChange={(e) => setPropType(e.target.value as PropType | 'all')}
              className="h-11 w-full appearance-none rounded-control border border-sv-ink/10 bg-sv-surface pl-3.5 pr-9 text-[13px] font-bold text-sv-ink outline-none transition-colors focus:border-sv-blue focus-visible:ring-2 focus-visible:ring-sv-blue/30 cursor-pointer"
            >
              {PROP_TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {propLabel(opt)}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-sv-ink/40" />
          </div>

          {/* Seller Type Filter (მესაკუთრე / სამშენებლო) */}
          <div className="flex items-center gap-1 rounded-control bg-sv-ink/[0.05] p-1" role="group" aria-label="Seller Filter">
            <button
              type="button"
              onClick={() => setSeller(seller === 'owner' ? undefined : 'owner')}
              aria-pressed={seller === 'owner'}
              className={`h-9 rounded-lg px-3.5 text-[13px] font-extrabold transition-colors ${
                seller === 'owner'
                  ? 'bg-sv-surface text-sv-blue shadow-glow-blue-sm'
                  : 'text-sv-ink/65 hover:text-sv-ink'
              }`}
            >
              {t('search.sellerOwner')}
            </button>
            <button
              type="button"
              onClick={() => setSeller(seller === 'agency' ? undefined : 'agency')}
              aria-pressed={seller === 'agency'}
              className={`h-9 rounded-lg px-3.5 text-[13px] font-extrabold transition-colors ${
                seller === 'agency'
                  ? 'bg-sv-surface text-sv-blue shadow-glow-blue-sm'
                  : 'text-sv-ink/65 hover:text-sv-ink'
              }`}
            >
              {t('search.sellerAgency')}
            </button>
          </div>

          {/* Sort selector */}
          <div className="relative min-w-[150px]">
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
              className="h-11 w-full appearance-none rounded-control border border-sv-ink/10 bg-sv-surface pl-3.5 pr-9 text-[13px] font-bold text-sv-ink outline-none transition-colors focus:border-sv-blue focus-visible:ring-2 focus-visible:ring-sv-blue/30 cursor-pointer"
            >
              <option value="date">{lang === 'ka' ? 'თარიღი კლებადი' : 'Newest First'}</option>
              <option value="price-asc">{lang === 'ka' ? 'ფასი ზრდადი' : 'Price: Low to High'}</option>
              <option value="price-desc">{lang === 'ka' ? 'ფასი კლებადი' : 'Price: High to Low'}</option>
              <option value="area">{lang === 'ka' ? 'ფართი კლებადი' : 'Area: High to Low'}</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-sv-ink/40" />
          </div>

          {/* Reset Filters */}
          {hasFilters && (
            <button
              type="button"
              onClick={resetFilters}
              className="flex h-11 items-center gap-1.5 rounded-control px-3.5 text-[13px] font-extrabold text-sv-orange transition-colors hover:bg-sv-orange/10"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              {t('search.clear')}
            </button>
          )}
        </div>

        {/* Numeric inputs: Price & Area */}
        <div className="mt-3 flex flex-wrap items-center gap-3 pt-3 border-t border-sv-ink/[0.06]">
          <div className="flex items-center gap-1.5">
            <span className="text-[12px] font-black uppercase tracking-wide text-sv-ink/65">{t('search.price')}</span>
            <input
              type="number"
              min={0}
              placeholder={t('search.min')}
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
              className="h-9 w-[100px] rounded-control border border-sv-ink/10 bg-sv-surface px-3 text-[13px] font-bold text-sv-ink outline-none placeholder:text-sv-ink/35 focus:border-sv-blue"
            />
            <span className="text-sv-ink/50">—</span>
            <input
              type="number"
              min={0}
              placeholder={t('search.max')}
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              className="h-9 w-[100px] rounded-control border border-sv-ink/10 bg-sv-surface px-3 text-[13px] font-bold text-sv-ink outline-none placeholder:text-sv-ink/35 focus:border-sv-blue"
            />
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-[12px] font-black uppercase tracking-wide text-sv-ink/65">{t('search.area')}</span>
            <input
              type="number"
              min={0}
              placeholder={t('search.min')}
              value={minArea}
              onChange={(e) => setMinArea(e.target.value)}
              className="h-9 w-[90px] rounded-control border border-sv-ink/10 bg-sv-surface px-3 text-[13px] font-bold text-sv-ink outline-none placeholder:text-sv-ink/35 focus:border-sv-blue"
            />
            <span className="text-sv-ink/50">—</span>
            <input
              type="number"
              min={0}
              placeholder={t('search.max')}
              value={maxArea}
              onChange={(e) => setMaxArea(e.target.value)}
              className="h-9 w-[90px] rounded-control border border-sv-ink/10 bg-sv-surface px-3 text-[13px] font-bold text-sv-ink outline-none placeholder:text-sv-ink/35 focus:border-sv-blue"
            />
          </div>

          {/* Found Count Badge */}
          <div className="ml-auto text-[13px] font-extrabold text-sv-ink/70">
            {lang === 'ka' ? `მოიძებნა ${filtered.length} განცხადება` : `Found ${filtered.length} listings`}
          </div>
        </div>
      </div>

      {/* Listing Grid */}
      {filtered.length > 0 ? (
        <section aria-label={gridAriaLabel} className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((l, i) => (
            <ListingCard key={l.id} l={l} i={i} layout="wide" />
          ))}
        </section>
      ) : (
        <div className="rounded-card border border-sv-ink/[0.06] bg-sv-surface p-12 text-center shadow-card">
          <p className="text-[18px] font-extrabold text-sv-ink">
            {lang === 'ka' ? 'განცხადებები ვერ მოიძებნა' : 'No listings found'}
          </p>
          <p className="mt-1 text-[14px] font-medium text-sv-ink/60">
            {lang === 'ka' ? 'სცადეთ ფილტრების შეცვლა ან გასუფთავება' : 'Try adjusting or clearing your filters'}
          </p>
          <button
            type="button"
            onClick={resetFilters}
            className="mt-4 inline-flex items-center gap-2 rounded-full bg-sv-blue px-5 py-2.5 text-[13px] font-extrabold text-white shadow-glow-blue-sm"
          >
            <RotateCcw className="h-4 w-4" />
            {t('search.clear')}
          </button>
        </div>
      )}
    </div>
  )
}
