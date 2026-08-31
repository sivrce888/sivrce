'use client'

import { useMemo, useState } from 'react'
import Image from 'next/image'
import { MapPin, Building2, Star, Search, TrainFront } from 'lucide-react'
import LocalizedLink from '@/components/LocalizedLink'
import type { BuildingCatalogEntry } from '@/data/buildings'
import { DEAL_BRAND } from '@/lib/category-brand'
import { formatMetroDist, nearestMetro } from '@/lib/map/pois'

type Counts = { sale: number; rent: number; daily: number; pledge: number }

type Props = {
  buildings: BuildingCatalogEntry[]
  countsBySlug: Record<string, Counts>
  developerNames: Record<string, string>
}

const empty: Counts = { sale: 0, rent: 0, daily: 0, pledge: 0 }

export function BuildingsCatalog({ buildings, countsBySlug, developerNames }: Props) {
  const [q, setQ] = useState('')
  const [city, setCity] = useState<'all' | 'თბილისი' | 'ბათუმი'>('თბილისი')
  const [district, setDistrict] = useState<string>('all')
  const [ubani, setUbani] = useState<string>('all')
  const [status, setStatus] = useState<'all' | 'ready' | 'construction'>('all')

  const cities = useMemo(() => {
    const set = new Set(buildings.map((b) => b.city))
    return ['all' as const, ...[...set].sort((a, b) => a.localeCompare(b, 'ka'))]
  }, [buildings])

  const districts = useMemo(() => {
    const list = buildings.filter((b) => city === 'all' || b.city === city)
    const set = new Set(
      list.map((b) => b.district).filter((d) => d !== 'თბილისი' && d !== 'ბათუმი' && (city === 'all' || d !== city)),
    )
    return ['all', ...[...set].sort((a, b) => a.localeCompare(b, 'ka'))]
  }, [buildings, city])

  const ubanis = useMemo(() => {
    const list = buildings.filter(
      (b) =>
        (city === 'all' || b.city === city) &&
        (district === 'all' || b.district === district) &&
        b.ubani,
    )
    const set = new Set(list.map((b) => b.ubani!))
    return ['all', ...[...set].sort((a, b) => a.localeCompare(b, 'ka'))]
  }, [buildings, city, district])

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase()
    return buildings.filter((b) => {
      if (city !== 'all' && b.city !== city) return false
      if (district !== 'all' && b.district !== district) return false
      if (ubani !== 'all' && b.ubani !== ubani) return false
      if (status !== 'all' && b.status !== status) return false
      if (!needle) return true
      const dev = developerNames[b.developerSlug] ?? ''
      return (
        b.name.toLowerCase().includes(needle) ||
        b.nameEn.toLowerCase().includes(needle) ||
        b.address.toLowerCase().includes(needle) ||
        b.code.toLowerCase().includes(needle) ||
        b.district.toLowerCase().includes(needle) ||
        (b.ubani?.toLowerCase().includes(needle) ?? false) ||
        dev.toLowerCase().includes(needle)
      )
    })
  }, [buildings, city, district, ubani, status, q, developerNames])

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-module border border-sv-ink/[0.06] bg-sv-surface p-4 shadow-card md:p-5">
        <label className="relative block">
          <Search
            className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-sv-ink/35"
            aria-hidden
          />
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="ძებნა სახელით, უბნით, მისამართით ან დეველოპერით"
            className="h-12 w-full rounded-control border border-sv-ink/[0.08] bg-sv-cloud pl-10 pr-4 text-[15px] font-semibold text-sv-ink outline-none transition focus:border-sv-blue focus:ring-2 focus:ring-sv-blue/20"
          />
        </label>

        <div className="flex flex-wrap gap-2" role="tablist" aria-label="ქალაქი">
          {cities.map((c) => (
            <button
              key={c}
              type="button"
              role="tab"
              aria-selected={city === c}
              onClick={() => {
                setCity(c === 'all' ? 'all' : (c as 'თბილისი' | 'ბათუმი'))
                setDistrict('all')
                setUbani('all')
              }}
              className={`rounded-full px-4 py-2 text-[13px] font-extrabold transition ${
                city === c
                  ? 'bg-sv-navy text-white'
                  : 'bg-sv-cloud text-sv-ink/60 hover:bg-sv-ink/[0.06]'
              }`}
            >
              {c === 'all' ? 'ყველა ქალაქი' : c}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-2" role="tablist" aria-label="რაიონი">
          {districts.map((d) => (
            <button
              key={d}
              type="button"
              role="tab"
              aria-selected={district === d}
              onClick={() => {
                setDistrict(d)
                setUbani('all')
              }}
              className={`rounded-full px-3.5 py-1.5 text-[12px] font-bold transition ${
                district === d
                  ? 'bg-sv-blue text-white'
                  : 'bg-sv-cloud text-sv-ink/55 hover:bg-sv-ink/[0.06]'
              }`}
            >
              {d === 'all' ? 'ყველა რაიონი' : d}
            </button>
          ))}
        </div>

        {ubanis.length > 2 && (
          <div className="flex flex-wrap gap-2" role="tablist" aria-label="უბანი">
            {ubanis.map((u) => (
              <button
                key={u}
                type="button"
                role="tab"
                aria-selected={ubani === u}
                onClick={() => setUbani(u)}
                className={`rounded-full px-3.5 py-1.5 text-[12px] font-bold transition ${
                  ubani === u
                    ? 'bg-sv-navy text-white'
                    : 'bg-sv-cloud text-sv-ink/55 hover:bg-sv-ink/[0.06]'
                }`}
              >
                {u === 'all' ? 'ყველა უბანი' : u}
              </button>
            ))}
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2" role="tablist" aria-label="სტატუსი">
            {(
              [
                ['all', 'ყველა'],
                ['ready', 'ჩაბარებული'],
                ['construction', 'მშენებარე'],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={status === id}
                onClick={() => setStatus(id)}
                className={`rounded-full px-3.5 py-1.5 text-[12px] font-bold transition ${
                  status === id
                    ? 'bg-sv-orange text-white'
                    : 'bg-sv-cloud text-sv-ink/55 hover:bg-sv-ink/[0.06]'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <p className="text-[13px] font-bold text-sv-ink/45">{filtered.length} შენობა</p>
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="rounded-module border border-dashed border-sv-ink/15 bg-sv-surface px-6 py-16 text-center text-[15px] font-semibold text-sv-ink/50">
          ვერ მოიძებნა — შეცვალე ფილტრი ან ძებნის სიტყვა
        </p>
      ) : (
        <div className="sv-card-grid-3">
          {filtered.map((b, i) => {
            const devName = developerNames[b.developerSlug]
            const counts = countsBySlug[b.slug] ?? empty
            const total = counts.sale + counts.rent + counts.daily + counts.pledge
            const metro = nearestMetro(b.coords.lat, b.coords.lng)
            const place = [b.district, b.ubani].filter(Boolean).join(' · ')
            return (
              <LocalizedLink
                key={b.slug}
                href={`/buildings/${b.slug}`}
                aria-label={`${b.name} ${b.code}`}
                className="group block rounded-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sv-blue"
              >
                <article className="overflow-hidden rounded-card border border-sv-ink/[0.06] bg-sv-surface shadow-card transition-all duration-500 group-hover:-translate-y-2 group-hover:shadow-card-hover">
                  <div className="relative aspect-[16/10] overflow-hidden">
                    <Image
                      src={b.img}
                      alt={b.name}
                      fill
                      priority={i < 6}
                      sizes="(max-width:640px) 100vw, (max-width:1024px) 50vw, 440px"
                      className="object-cover transition-transform duration-700 group-hover:scale-[1.05]"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-sv-navy/75 via-transparent to-transparent" />
                    <span
                      className={`absolute top-3 right-3 rounded-full px-2.5 py-1 text-[11px] font-extrabold text-white ${
                        b.status === 'ready' ? 'bg-sv-blue' : 'bg-sv-orange'
                      }`}
                    >
                      {b.status === 'ready' ? 'ჩაბარებული' : 'მშენებარე'}
                    </span>
                    <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between gap-2">
                      <div className="min-w-0">
                        <p className="mb-0.5 truncate text-[11px] font-bold tracking-wide text-white/70">
                          {place}
                        </p>
                        <h2 className="truncate text-[20px] font-black text-white [text-shadow:0_2px_10px_rgba(5,11,38,0.55)]">
                          {b.name}
                        </h2>
                        {devName && (
                          <p className="text-[12px] font-bold text-white/80">{devName}</p>
                        )}
                      </div>
                      <div className="flex shrink-0 items-center gap-1 rounded-control bg-white/95 px-2.5 py-1.5 text-[13px] font-black text-sv-ink">
                        <Star className="h-3.5 w-3.5 fill-sv-orange text-sv-orange" aria-hidden />
                        {b.rating}
                      </div>
                    </div>
                  </div>
                  <div className="space-y-3 p-4">
                    <p className="flex items-center gap-1.5 text-[13px] font-semibold text-sv-ink/55">
                      <MapPin className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">{b.address}</span>
                    </p>
                    {metro && (
                      <p className="flex items-center gap-1.5 text-[12px] font-extrabold text-sv-blue">
                        <TrainFront className="h-3.5 w-3.5 shrink-0" aria-hidden />
                        {metro.name} · {formatMetroDist(metro)}
                      </p>
                    )}
                    <p className="line-clamp-2 text-[13px] font-medium leading-snug text-sv-ink/50">
                      {b.description.ka}
                    </p>
                    <div className="flex flex-wrap gap-2 text-[11px] font-extrabold">
                      <span style={{ color: DEAL_BRAND.sale }}>{counts.sale} იყიდება</span>
                      <span style={{ color: DEAL_BRAND.rent }}>{counts.rent} ქირა</span>
                      <span style={{ color: DEAL_BRAND.daily }}>{counts.daily} დღე</span>
                      <span style={{ color: DEAL_BRAND.pledge }}>{counts.pledge} გირავნ.</span>
                    </div>
                    <p className="inline-flex flex-wrap items-center gap-1.5 text-[12px] font-bold text-sv-ink/45">
                      <Building2 className="h-3.5 w-3.5" />
                      {total} განცხადება · {b.floors} სართ.
                      {b.units ? ` · ${b.units} ბინა` : ''}
                      {b.priceFromM2 ? ` · ${b.priceFromM2}/მ²` : ''}
                    </p>
                  </div>
                </article>
              </LocalizedLink>
            )
          })}
        </div>
      )}
    </div>
  )
}
