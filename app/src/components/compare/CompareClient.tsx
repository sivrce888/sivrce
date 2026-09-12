"use client"

import { useEffect, useMemo, useState } from "react"
import Image from "next/image"
import { Columns2, Search, X, Eye, Calendar, ArrowUpDown } from "lucide-react"
import LocalizedLink from "@/components/LocalizedLink"
import { formatFloor, formatPerM2 } from "@/data/listings"
import { areaSym } from "@/lib/listing-format"
import { listingPath } from "@/lib/listing-slug"
import { useCompare } from "@/lib/compare"
import { useCurrency } from "@/lib/currency"
import { useI18n, type DictKey } from "@/lib/i18n/context"
import { useListingsByIds } from "@/lib/use-listings-by-ids"
import { blurProps } from "@/lib/media"
import { useCompareStrings } from "./i18n"
import { dealLabelKey, rentPeriodKey } from "@/lib/add-listing-fields"
import { formatUSD } from "@/lib/listing-format"
import type { PropType } from "@/data/listings"
import { cardOf } from "@/lib/media"

const PROP_KEY: Record<PropType, DictKey> = {
  apartment: "prop.apartment",
  house: "prop.houseShort",
  villa: "prop.villa",
  commercial: "prop.commercial",
  land: "prop.land",
  hotel: "prop.hotel",
}

/** Find best/worst in a numeric column for highlighting. */
function findExtremes(items: { id: string; val: number }[]) {
  if (items.length < 2) return { best: null, worst: null }
  const sorted = [...items].sort((a, b) => b.val - a.val)
  return { best: sorted[0].id, worst: sorted[sorted.length - 1].id }
}

export default function CompareClient() {
  const { ids, toggle, clear, count } = useCompare()
  const tt = useCompareStrings()
  const { t, lang } = useI18n()
  const { format, currency } = useCurrency()
  const [mounted, setMounted] = useState(false)
  const [highlight, setHighlight] = useState(false)

  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true))
    return () => cancelAnimationFrame(id)
  }, [])

  const { items, loading } = useListingsByIds(mounted ? ids : [])

  // Pre-compute extremes for highlighting
  const extremes = useMemo(() => {
    if (!highlight || items.length < 2) return {}
    return {
      price: findExtremes(items.map((l) => ({ id: l.id, val: l.priceUSD }))),
      perM2: findExtremes(items.map((l) => ({ id: l.id, val: l.perM2USD }))),
      area: findExtremes(items.map((l) => ({ id: l.id, val: l.area }))),
      beds: findExtremes(items.map((l) => ({ id: l.id, val: l.beds }))),
      score: findExtremes(items.map((l) => ({ id: l.id, val: l.ai.score }))),
    }
  }, [highlight, items])

  if (!mounted || (ids.length > 0 && loading)) {
    return <div className="h-64 animate-pulse rounded-card bg-sv-cloud ring-1 ring-sv-ink/5" />
  }

  if (items.length < 2) {
    return (
      <div className="rounded-card bg-sv-surface px-6 py-16 text-center shadow-card ring-1 ring-sv-ink/5">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-module bg-sv-blue/10">
          <Columns2 className="h-8 w-8 text-sv-blue" />
        </div>
        <h2 className="mt-6 text-2xl font-black tracking-[-0.02em] text-sv-ink">{tt("empty")}</h2>
        <LocalizedLink
          href="/search"
          className="mt-8 inline-flex items-center gap-2 rounded-full bg-sv-orange px-7 py-3.5 text-sm font-bold text-sv-ink shadow-glow-orange"
        >
          <Search className="h-4 w-4" />
          {tt("search")}
        </LocalizedLink>
      </div>
    )
  }

  const maxPrice = Math.max(...items.map((l) => l.priceUSD))

  const rows: {
    key: string
    label: string
    cell: (i: (typeof items)[0]) => string
    best?: string
    worst?: string
    bar?: (i: (typeof items)[0]) => number
  }[] = [
    {
      key: "price",
      label: tt("price"),
      cell: (l) => {
        const k = rentPeriodKey(l.dealType, l.propType)
        return `${format(l.priceGEL)}${k ? t(k) : ""}`
      },
      bar: (l) => maxPrice > 0 ? (l.priceUSD / maxPrice) * 100 : 0,
    },
    {
      key: "perM2",
      label: tt("perM2"),
      cell: (l) => (l.dealType === "sale" ? formatPerM2(l, currency, lang) : "—"),
    },
    { key: "area", label: tt("area"), cell: (l) => `${l.area} ${areaSym(lang)}` },
    { key: "beds", label: tt("beds"), cell: (l) => (l.beds > 0 ? String(l.beds) : "—") },
    { key: "rooms", label: tt("rooms"), cell: (l) => (l.rooms > 0 ? String(l.rooms) : "—") },
    { key: "baths", label: tt("baths"), cell: (l) => (l.baths > 0 ? String(l.baths) : "—") },
    { key: "floor", label: tt("floor"), cell: (l) => formatFloor(l, lang) },
    { key: "district", label: tt("district"), cell: (l) => `${l.district}, ${l.city}` },
    { key: "type", label: tt("type"), cell: (l) => t(PROP_KEY[l.propType]) },
    { key: "deal", label: tt("deal"), cell: (l) => t(dealLabelKey(l.dealType, l.propType)) },
    { key: "views", label: lang === "de" ? "Aufrufe" : "Views", cell: (l) => l.views > 0 ? String(l.views) : "—" },
    { key: "ai", label: tt("ai"), cell: (l) => `${l.ai.score} · ${l.ai.label}` },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-[15px] font-semibold text-sv-ink/60">
          {count} · {tt("pageTitle")}
        </p>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setHighlight(!highlight)}
            className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-[13px] font-bold transition-colors ${
              highlight
                ? "bg-sv-blue text-white"
                : "text-sv-ink/60 ring-1 ring-sv-ink/10 hover:text-sv-ink"
            }`}
          >
            <ArrowUpDown className="h-3.5 w-3.5" />
            {lang === "de" ? "Unterschiede" : "Differences"}
          </button>
          <button
            type="button"
            onClick={clear}
            className="rounded-full px-4 py-2 text-[13px] font-bold text-sv-ink/60 ring-1 ring-sv-ink/10 hover:text-sv-ink"
          >
            {tt("clear")}
          </button>
        </div>
      </div>

      {/* Price comparison bar chart */}
      <div className="rounded-card border border-sv-ink/[0.06] bg-sv-surface p-5 shadow-card">
        <h3 className="mb-4 text-[14px] font-black text-sv-ink">
          {lang === "de" ? "Preisvergleich" : "Price Comparison"}
        </h3>
        <div className="space-y-3">
          {items.map((l) => {
            const pct = maxPrice > 0 ? (l.priceUSD / maxPrice) * 100 : 0
            return (
              <div key={l.id} className="flex items-center gap-3">
                <LocalizedLink
                  href={listingPath(l)}
                  className="w-24 shrink-0 truncate text-[12px] font-bold text-sv-ink hover:text-sv-blue"
                >
                  {l.title}
                </LocalizedLink>
                <div className="flex-1">
                  <div className="h-5 overflow-hidden rounded bg-sv-ink/[0.04]">
                    <div
                      className="h-full rounded bg-sv-blue transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
                <span className="w-20 text-right text-[13px] font-black text-sv-ink">
                  {formatUSD(l.priceUSD)}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Comparison table */}
      <div className="overflow-x-auto rounded-card border border-sv-ink/[0.06] bg-sv-surface shadow-card">
        <table className="w-full min-w-[640px] border-collapse text-left text-[13px]">
          <thead>
            <tr className="border-b border-sv-ink/[0.06]">
              <th className="sticky left-0 z-[1] bg-sv-surface p-4 font-black text-sv-ink/60">
                {tt("col")}
              </th>
              {items.map((l) => (
                <th key={l.id} className="min-w-[180px] p-4 align-top">
                  <div className="relative mb-3 aspect-[4/3] overflow-hidden rounded-module">
                    <Image
                      src={cardOf(l.img) ?? l.img}
                      alt=""
                      fill
                      sizes="180px"
                      className="object-cover"
                      {...blurProps(l.img)}
                    />
                    <button
                      type="button"
                      aria-label={tt("removeCol")}
                      onClick={() => toggle(l.id)}
                      className="absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-full bg-sv-navy/70 text-white"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <LocalizedLink
                    href={listingPath(l)}
                    className="line-clamp-2 font-extrabold text-sv-ink hover:text-sv-blue"
                  >
                    {l.title}
                  </LocalizedLink>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.key} className="border-b border-sv-ink/[0.04]">
                <th className="sticky left-0 bg-sv-surface p-4 font-bold text-sv-ink/60">
                  {row.label}
                </th>
                {items.map((l) => {
                  const isBest = highlight && extremes[row.key as keyof typeof extremes]?.best === l.id
                  const isWorst = highlight && extremes[row.key as keyof typeof extremes]?.worst === l.id
                  return (
                    <td
                      key={l.id}
                      className={`p-4 font-extrabold ${
                        isBest
                          ? "bg-green-50 text-green-700"
                          : isWorst
                            ? "bg-red-50 text-red-600"
                            : "text-sv-ink"
                      }`}
                    >
                      {row.cell(l)}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
