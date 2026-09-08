'use client'
/**
 * Client filter bar + grid for the /projects hub.
 *
 * The server page stays static/ISR: the full corpus arrives once as a compact
 * ProjectCard projection (card.ts, ~12KB gz) and filtering/sorting runs
 * in-memory — instant, no server round-trips. Unfiltered state renders the
 * same first PER_PAGE cards the server paged before, plus the server-rendered
 * SEO pager (passed as `pager`); engaging any filter swaps to the full sorted
 * match set and hides the pager. State syncs to the URL
 * (?status&city&price&handover&dev&sort) so every view is shareable and the
 * back button undoes filters.
 *
 * Pure logic lives in card.ts (self-checked by card.check.ts) — this file is
 * presentation only.
 */
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { ChevronDown, Search } from 'lucide-react'
import HScroll from '@/components/HScroll'
import {
  EMPTY_Q,
  HANDOVER_BUCKETS,
  OTHER_CITY,
  PRICE_BUCKETS,
  facetCities,
  facetCounts,
  facetDistricts,
  facetDevs,
  isQActive,
  matchesCard,
  parseQ,
  qToSearch,
  sortCards,
  type Q,
  type Sort,
} from './card'
import { PER_PAGE, ProjectsGrid } from './ProjectsGrid'
import type { ProjectCard } from './card'
import { cityName, type DirLoc } from '@/lib/directory-seo'

type Labels = {
  aria: string
  searchAria: string
  searchPh: string
  statusBuild: string
  statusDone: string
  other: string
  allDistricts: string
  districtAria: string
  allDev: string
  devAria: string
  sortAria: string
  sorts: Record<Sort, string>
  results: (n: number) => string
  more: string
  clear: string
  empty: string
}

// ru plural: 1 проект / 2–4 проекта / 5+ проектов
const ruResults = (n: number) => {
  const m10 = n % 10
  const m100 = n % 100
  const word = m10 === 1 && m100 !== 11 ? 'проект' : m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14) ? 'проекта' : 'проектов'
  return `${n} ${word}`
}

const L: Record<DirLoc, Labels> = {
  ka: {
    aria: 'პროექტების ფილტრები',
    searchAria: 'ძიება',
    searchPh: 'პროექტი, უბანი, დეველოპერი…',
    statusBuild: 'მშენებარე',
    statusDone: 'ჩაბარებული',
    other: 'სხვა',
    allDistricts: 'ყველა უბანი',
    districtAria: 'უბანი',
    allDev: 'ყველა დეველოპერი',
    devAria: 'დეველოპერი',
    sortAria: 'დალაგება',
    sorts: { rec: 'რეკომენდებული', price: 'ფასი: ზრდადი', 'price-desc': 'ფასი: კლებადი', handover: 'ჩაბარება: მალე', rating: 'რეიტინგი: მაღალი', progress: 'მშენებლობა: დაწინაურებული' },
    results: (n) => `${n} პროექტი`,
    more: 'ნახე მეტი',
    clear: 'გასუფთავება',
    empty: 'ამ ფილტრებით პროექტი ვერ მოიძებნა',
  },
  en: {
    aria: 'Project filters',
    searchAria: 'Search',
    searchPh: 'Project, district, developer…',
    statusBuild: 'Under construction',
    statusDone: 'Delivered',
    other: 'Other',
    allDistricts: 'All districts',
    districtAria: 'District',
    allDev: 'All developers',
    devAria: 'Developer',
    sortAria: 'Sort',
    sorts: { rec: 'Recommended', price: 'Price: low to high', 'price-desc': 'Price: high to low', handover: 'Handover: soonest', rating: 'Rating: high to low', progress: 'Construction: most advanced' },
    results: (n) => `${n} ${n === 1 ? 'project' : 'projects'}`,
    more: 'Show more',
    clear: 'Clear all',
    empty: 'No projects match these filters',
  },
  ru: {
    aria: 'Фильтры проектов',
    searchAria: 'Поиск',
    searchPh: 'Проект, район, застройщик…',
    statusBuild: 'Строятся',
    statusDone: 'Сданы',
    other: 'Другие',
    allDistricts: 'Все районы',
    districtAria: 'Район',
    allDev: 'Все застройщики',
    devAria: 'Застройщик',
    sortAria: 'Сортировка',
    sorts: { rec: 'Рекомендованные', price: 'Цена: по возрастанию', 'price-desc': 'Цена: по убыванию', handover: 'Сдача: скорее', rating: 'Рейтинг: по убыванию', progress: 'Готовность: по убыванию' },
    results: ruResults,
    more: 'Показать ещё',
    clear: 'Сбросить',
    empty: 'По этим фильтрам ничего не найдено',
  },
}

const chipBase =
  'shrink-0 whitespace-nowrap rounded-control border px-3.5 py-2 text-[13px] font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sv-blue'
const chipOff = `${chipBase} border-sv-ink/10 bg-sv-surface text-sv-ink/70 hover:border-sv-ink/30`
const chipOn = `${chipBase} border-sv-ink bg-sv-ink text-white`
const chipCount = (on: boolean) => `ml-1.5 text-[11px] font-extrabold ${on ? 'text-white/60' : 'text-sv-ink/60'}`
const selectCls =
  'h-10 shrink-0 rounded-control border border-sv-ink/10 bg-sv-surface px-3 text-[13px] font-bold text-sv-ink/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sv-blue'

function Chip({ on, onClick, children }: { on: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button type="button" aria-pressed={on} onClick={onClick} className={on ? chipOn : chipOff}>
      {children}
    </button>
  )
}

export function ProjectsExplorer({
  projects,
  loc,
  pager,
}: {
  projects: ProjectCard[]
  loc: DirLoc
  /** Server-rendered SEO pager — shown while no filter is engaged. */
  pager?: ReactNode
}) {
  const t = L[loc]
  const [q, setQ] = useState<Q>(EMPTY_Q)
  // Live corpus can exceed 1k rows — filtered mode renders progressively to
  // keep the DOM (and low-end devices) under the glitch lock.
  const [visibleCount, setVisibleCount] = useState(PER_PAGE)
  const rowRef = useRef<HTMLDivElement>(null)

  // URL → state after hydration (never during render, so SSR HTML stays stable);
  // popstate makes the back button walk filter history. Restored filters may sit
  // beyond the row's right edge — nudge the first active chip into view.
  useEffect(() => {
    const apply = () => {
      setQ(parseQ(new URLSearchParams(window.location.search)))
      setVisibleCount(PER_PAGE)
      requestAnimationFrame(() => {
        rowRef.current
          ?.querySelector('[aria-pressed="true"]')
          ?.scrollIntoView({ block: 'nearest', inline: 'nearest' })
      })
    }
    apply()
    window.addEventListener('popstate', apply)
    return () => window.removeEventListener('popstate', apply)
  }, [])

  // Search typing uses replaceState (no history spam per keystroke); discrete
  // chip/select changes push, so the back button walks meaningful steps.
  const update = (patch: Partial<Q>, replace = false) => {
    const next = { ...q, ...patch }
    setQ(next)
    setVisibleCount(PER_PAGE)
    const url = `${window.location.pathname}${qToSearch(next)}`
    if (replace) window.history.replaceState(null, '', url)
    else window.history.pushState(null, '', url)
  }

  const cities = useMemo(() => facetCities(projects), [projects])
  const topCitySet = useMemo(
    () => new Set(cities.filter((c) => c.value !== OTHER_CITY).map((c) => c.value)),
    [cities],
  )
  const districts = useMemo(() => facetDistricts(projects), [projects])
  const devs = useMemo(() => facetDevs(projects), [projects])
  const counts = useMemo(() => facetCounts(projects), [projects])
  const otherCityCount = cities.find((c) => c.value === OTHER_CITY)?.count

  const filtered = useMemo(
    () => (isQActive(q) ? sortCards(projects.filter((p) => matchesCard(p, q, topCitySet)), q.sort) : null),
    [projects, q, topCitySet],
  )
  const visible = filtered ? filtered.slice(0, visibleCount) : projects.slice(0, PER_PAGE)

  return (
    <div aria-label={t.aria}>
      <div className="flex items-center justify-between gap-3">
        <p aria-live="polite" className="min-w-0 truncate text-[13px] font-bold text-sv-ink/60">
          {t.results(filtered ? filtered.length : projects.length)}
        </p>
        <div className="flex shrink-0 items-center gap-3">
          {filtered && (
            <button
              type="button"
              onClick={() => update(EMPTY_Q)}
              className="text-[13px] font-black text-sv-blue transition-opacity hover:opacity-70"
            >
              {t.clear}
            </button>
          )}
          <label className="flex min-w-0 items-center gap-2">
            <span className="hidden text-[13px] font-bold text-sv-ink/60 sm:block">{t.sortAria}</span>
            <div className="relative min-w-0">
              <select
                aria-label={t.sortAria}
                value={q.sort}
                onChange={(e) => update({ sort: e.target.value as Sort })}
                className={`${selectCls} max-w-[11rem] appearance-none pr-8 sm:max-w-none`}
              >
                {(Object.keys(t.sorts) as Sort[]).map((s) => (
                  <option key={s} value={s}>
                    {t.sorts[s]}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-sv-ink/60" aria-hidden />
            </div>
          </label>
        </div>
      </div>

      {/* HScroll rail: arrows + edge fade + drag + keyboard — filters past the
          right edge stay discoverable (was: bare hidden-scrollbar overflow). */}
      <HScroll size="sm" step={420} aria-label={t.aria} className="scroll-px-12 -mx-5 mt-3 gap-2 px-5 pb-1 md:mx-0 md:px-0 [&_input]:cursor-text">
        <div ref={rowRef} className="contents">
          <div className="relative shrink-0">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-sv-ink/35" aria-hidden />
            <input
              type="search"
              value={q.q}
              onChange={(e) => update({ q: e.target.value }, true)}
              placeholder={t.searchPh}
              aria-label={t.searchAria}
              className="h-10 w-56 rounded-control border border-sv-ink/10 bg-sv-surface pl-9 pr-3 text-[13px] font-semibold text-sv-ink placeholder:font-medium placeholder:text-sv-ink/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sv-blue"
            />
          </div>

          <Chip on={q.status === 'build'} onClick={() => update({ status: q.status === 'build' ? '' : 'build' })}>
            {t.statusBuild}
            <span className={chipCount(q.status === 'build')}>{counts.build}</span>
          </Chip>
          <Chip on={q.status === 'done'} onClick={() => update({ status: q.status === 'done' ? '' : 'done' })}>
            {t.statusDone}
            <span className={chipCount(q.status === 'done')}>{counts.done}</span>
          </Chip>

          {cities.map((c) => {
            const on = q.city === c.value
            return (
              <Chip key={c.value} on={on} onClick={() => update({ city: on ? '' : c.value })}>
                {c.value === OTHER_CITY ? t.other : cityName(c.value, loc)}
                <span className={chipCount(on)}>{c.value === OTHER_CITY ? otherCityCount : counts.city.get(c.value)}</span>
              </Chip>
            )
          })}

          <select
            aria-label={t.districtAria}
            value={q.district}
            onChange={(e) => update({ district: e.target.value })}
            className={selectCls}
          >
            <option value="">{t.allDistricts}</option>
            {districts.map((d) => (
              <option key={d.value} value={d.value}>
                {d.value} ({d.count})
              </option>
            ))}
          </select>

          {PRICE_BUCKETS.map((b) => {
            const on = q.price === b.key
            return (
              <Chip key={b.key} on={on} onClick={() => update({ price: on ? '' : b.key })}>
                {b.label}
                <span className={chipCount(on)}>{counts.price.get(b.key)}</span>
              </Chip>
            )
          })}

          {HANDOVER_BUCKETS.map((b) => {
            const on = q.handover === b.key
            return (
              <Chip key={b.key} on={on} onClick={() => update({ handover: on ? '' : b.key })}>
                {b.label}
                <span className={chipCount(on)}>{counts.handover.get(b.key)}</span>
              </Chip>
            )
          })}

          <select
            aria-label={t.devAria}
            value={q.dev}
            onChange={(e) => update({ dev: e.target.value })}
            className={selectCls}
          >
            <option value="">{t.allDev}</option>
            {devs.map((d) => (
              <option key={d.slug} value={d.slug}>
                {d.label} ({d.count})
              </option>
            ))}
          </select>
        </div>
      </HScroll>

      {visible.length === 0 ? (
        <div className="mt-6 rounded-card border border-dashed border-sv-ink/15 px-6 py-12 text-center">
          <p className="text-[14px] font-semibold text-sv-ink/65">{t.empty}</p>
          <button
            type="button"
            onClick={() => update(EMPTY_Q)}
            className="mt-4 rounded-control bg-sv-ink px-5 py-2.5 text-[13px] font-black text-white transition-opacity hover:opacity-85"
          >
            {t.clear}
          </button>
        </div>
      ) : (
        <>
          <ProjectsGrid projects={visible} loc={loc} />
          {filtered && visibleCount < filtered.length && (
            <div className="mt-10 flex justify-center">
              <button
                type="button"
                onClick={() => setVisibleCount((n) => n + PER_PAGE)}
                className="rounded-control border border-sv-ink/10 bg-sv-surface px-6 py-3 text-[14px] font-black text-sv-ink shadow-card transition-colors hover:border-sv-ink/25"
              >
                {t.more}
              </button>
            </div>
          )}
          {!filtered && pager}
        </>
      )}
    </div>
  )
}
