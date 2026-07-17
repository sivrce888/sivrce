'use client'

/**
 * Building click panel — sale / rent / daily / pledge + landmark card.
 */

import Image from 'next/image'
import Link from 'next/link'
import { X, Building2, MapPin, HardHat, Navigation, Star, BadgeCheck } from 'lucide-react'
import type { DealType } from '@/data/listings'
import { useCurrency } from '@/lib/currency'
import { DEAL_BRAND, CATEGORY_BRAND } from '@/lib/category-brand'
import { dealLabelKa, listingBuildingNumber } from '@/lib/map/buildings'
import type { MapBuildingCluster } from '@/lib/map/buildings'
import { buildingFloorCount, listingFloor } from '@/lib/map/floors'

const TABS: { id: DealType | 'all'; label: string; color?: string }[] = [
  { id: 'all', label: 'ყველა' },
  { id: 'sale', label: 'იყიდება', color: DEAL_BRAND.sale },
  { id: 'rent', label: 'ქირავდება', color: DEAL_BRAND.rent },
  { id: 'daily', label: 'დღიურად', color: DEAL_BRAND.daily },
  { id: 'pledge', label: 'გირავდება', color: DEAL_BRAND.pledge },
]

interface BuildingPanelProps {
  building: MapBuildingCluster
  tab: DealType | 'all'
  onTab: (t: DealType | 'all') => void
  floor?: number | null
  onFloorClear?: () => void
  onClose: () => void
}

export default function BuildingPanel({ building, tab, onTab, floor, onFloorClear, onClose }: BuildingPanelProps) {
  const { format } = useCurrency()
  const isConstruction = building.status === 'construction' && building.listings.length === 0
  const byTab =
    tab === 'all' ? building.listings : building.listings.filter((l) => l.dealType === tab)
  const floorCount = floor != null ? buildingFloorCount(building) : 0
  const list =
    floor == null ? byTab : byTab.filter((l) => listingFloor(l.floor, floorCount) === floor)

  return (
    <aside
      className="flex h-full w-full flex-col border-l border-sv-ink/8 bg-sv-surface shadow-panel-dark md:w-[400px]"
      role="dialog"
      aria-label={`${building.label} — განცხადებები`}
    >
      <header className="shrink-0 border-b border-sv-ink/6 p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex gap-3">
            {building.img ? (
              <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-module">
                <Image src={building.img} alt="" fill className="object-cover" sizes="56px" />
              </div>
            ) : (
              <span
                className="grid h-14 w-14 shrink-0 place-items-center rounded-module text-white"
                style={{ background: building.color }}
              >
                {isConstruction ? (
                  <HardHat className="h-6 w-6" />
                ) : (
                  <Building2 className="h-6 w-6" />
                )}
              </span>
            )}
            <div className="min-w-0">
              <h2 className="text-[17px] font-black tracking-[-0.02em] text-sv-ink">
                {building.label}
              </h2>
              {building.code && (
                <p className="mt-0.5 text-[12px] font-extrabold text-sv-blue">{building.code}</p>
              )}
              <p className="mt-0.5 flex items-center gap-1 text-[13px] font-semibold text-sv-ink/50">
                <MapPin className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{building.address}</span>
              </p>
              <p className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] font-bold text-sv-ink/40">
                {building.buildingNumber && building.buildingNumber !== '—' && (
                  <span>კორპ. #{building.buildingNumber}</span>
                )}
                <span className="inline-flex items-center gap-0.5">
                  <Navigation className="h-3 w-3" />
                  {building.lat.toFixed(5)}, {building.lng.toFixed(5)}
                </span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="დახურვა"
            className="grid h-11 w-11 shrink-0 place-items-center rounded-control text-sv-ink/40 transition hover:bg-sv-cloud hover:text-sv-ink"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {(building.developerName || building.rating != null) && (
          <div className="mt-3 flex flex-wrap items-center gap-3 text-[12px] font-bold text-sv-ink/55">
            {building.developerName && (
              <span className="inline-flex items-center gap-1">
                <BadgeCheck className="h-3.5 w-3.5 text-sv-blue" />
                {building.developerSlug ? (
                  <Link
                    href={`/developers/${building.developerSlug}`}
                    className="text-sv-ink hover:text-sv-blue"
                  >
                    {building.developerName}
                  </Link>
                ) : (
                  building.developerName
                )}
              </span>
            )}
            {building.rating != null && (
              <span className="inline-flex items-center gap-1">
                <Star className="h-3.5 w-3.5 fill-sv-orange text-sv-orange" />
                {building.rating}
              </span>
            )}
            {building.yearBuilt && <span>{building.yearBuilt}</span>}
            {building.floors && <span>{building.floors} სართ.</span>}
          </div>
        )}

        {building.slug && (
          <Link
            href={`/buildings/${building.slug}`}
            className="mt-3 inline-flex min-h-11 items-center rounded-full bg-sv-cloud px-4 py-2 text-[12px] font-extrabold text-sv-ink transition hover:bg-sv-blue hover:text-white"
          >
            შენობის გვერდი
          </Link>
        )}

        {isConstruction ? (
          <div className="mt-4 rounded-module border border-sv-blue/15 bg-sv-blue/[0.06] p-3">
            <div className="flex items-center justify-between text-[12px] font-extrabold text-sv-ink">
              <span style={{ color: CATEGORY_BRAND.newProjects.hue }}>მშენებარე პროექტი</span>
              <span>{building.progress ?? 0}%</span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-sv-ink/8">
              <div
                className="h-full rounded-full bg-gradient-to-r from-sv-blue to-sv-violet"
                style={{ width: `${building.progress ?? 0}%` }}
              />
            </div>
            {building.finish && (
              <p className="mt-2 text-[11px] font-semibold text-sv-ink/45">
                ჩაბარება: {building.finish}
              </p>
            )}
            {building.projectSlug && (
              <Link
                href={`/projects/${building.projectSlug}`}
                className="mt-3 inline-flex min-h-11 items-center rounded-full bg-sv-blue px-4 py-2 text-[12px] font-extrabold text-white shadow-glow-blue-sm transition hover:bg-sv-blue-deep"
              >
                პროექტის ნახვა
              </Link>
            )}
          </div>
        ) : (
          <>
            <div className="mt-4 grid grid-cols-4 gap-1.5">
              {(
                [
                  ['sale', building.counts.sale, DEAL_BRAND.sale, 'იყიდება'],
                  ['rent', building.counts.rent, DEAL_BRAND.rent, 'ქირა'],
                  ['daily', building.counts.daily, DEAL_BRAND.daily, 'დღე'],
                  ['pledge', building.counts.pledge, DEAL_BRAND.pledge, 'გირავნ.'],
                ] as const
              ).map(([key, n, color, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => onTab(key)}
                  className="rounded-control px-1.5 py-2.5 text-center transition hover:opacity-90"
                  style={{ background: `${color}14` }}
                >
                  <div className="text-[18px] font-black" style={{ color }}>
                    {n}
                  </div>
                  <div className="text-[10px] font-bold text-sv-ink/45">{label}</div>
                </button>
              ))}
            </div>

            <div className="mt-4 flex gap-1.5 overflow-x-auto pb-0.5">
              {TABS.map((t) => {
                const active = tab === t.id
                const disabled =
                  t.id !== 'all' && building.counts[t.id as DealType] === 0
                return (
                  <button
                    key={t.id}
                    type="button"
                    disabled={disabled}
                    onClick={() => onTab(t.id)}
                    className={`min-h-11 shrink-0 rounded-full px-3.5 py-2 text-[12px] font-extrabold transition ${
                      active
                        ? 'text-white shadow-glow-blue-sm'
                        : 'bg-sv-cloud text-sv-ink/55 hover:text-sv-ink disabled:opacity-35'
                    }`}
                    style={active ? { background: t.color ?? DEAL_BRAND.sale } : undefined}
                  >
                    {t.label}
                  </button>
                )
              })}
            </div>

            {floor != null && (
              <button
                type="button"
                onClick={onFloorClear}
                className="mt-3 inline-flex min-h-11 items-center gap-2 self-start rounded-full bg-sv-blue px-4 py-2 text-[12px] font-extrabold text-white shadow-glow-blue-sm transition hover:bg-sv-blue-deep"
                aria-label={`სართული ${floor} — ფილტრის გასუფთავება`}
              >
                სართული {floor} · {list.length} თავისუფალია
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </>
        )}
      </header>

      {!isConstruction && (
        <ul className="min-h-0 flex-1 space-y-2 overflow-y-auto p-4">
          {list.length === 0 ? (
            <li className="rounded-module bg-sv-cloud px-4 py-8 text-center text-[14px] font-semibold text-sv-ink/45">
              ამ კატეგორიაში განცხადება არ არის
            </li>
          ) : (
            list.map((l) => {
              const suffix =
                l.dealType === 'rent' ? '/თვე' : l.dealType === 'daily' ? '/დღე' : ''
              const bn = listingBuildingNumber(l)
              return (
                <li key={l.id}>
                  <Link
                    href={`/listing/${l.id}`}
                    className="flex gap-3 rounded-module border border-sv-ink/6 bg-sv-cloud/60 p-2.5 transition hover:border-sv-blue/30 hover:bg-sv-surface"
                  >
                    <div className="relative h-[72px] w-[88px] shrink-0 overflow-hidden rounded-control">
                      <Image src={l.img} alt="" fill className="object-cover" sizes="88px" />
                    </div>
                    <div className="min-w-0 flex-1 py-0.5">
                      <div
                        className="text-[11px] font-extrabold uppercase tracking-wide"
                        style={{ color: DEAL_BRAND[l.dealType] }}
                      >
                        {dealLabelKa(l.dealType)}
                      </div>
                      <div className="mt-0.5 truncate text-[13px] font-extrabold text-sv-ink">
                        {l.title}
                      </div>
                      <div className="mt-1 text-[15px] font-black tracking-tight text-sv-ink">
                        {format(l.priceGEL)}
                        {suffix}
                      </div>
                      <div className="truncate text-[11px] font-semibold text-sv-ink/40">
                        {l.address}
                        {bn ? ` · #${bn}` : ''} · {l.coords.lat.toFixed(4)}, {l.coords.lng.toFixed(4)}
                      </div>
                      <div className="text-[11px] font-semibold text-sv-ink/35">
                        {l.area} მ² · {l.rooms} ოთახი · სართ. {l.floor}/{l.totalFloors}
                      </div>
                    </div>
                  </Link>
                </li>
              )
            })
          )}
        </ul>
      )}
    </aside>
  )
}
