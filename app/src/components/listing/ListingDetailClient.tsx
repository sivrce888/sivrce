'use client'

import { useEffect, useId, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import {
  Heart, Share2, MapPin, Eye, Calendar, BedDouble, Bath, Ruler,
  Building2, DoorOpen, Layers, ChevronLeft, ChevronRight, X, Crown, Flame,
  Phone, MessageCircle, BadgeCheck, Calculator, Sparkles,
} from 'lucide-react'
import Navbar from '@/components/sections/Navbar'
import Footer from '@/components/sections/Footer'
import ListingCard, { BADGE_STYLE } from '@/components/ListingCard'
import { Reveal } from '@/components/Reveal'
import { ReviewsSection } from '@/components/reviews/ReviewsSection'
import { LeadForm } from '@/components/lead/LeadForm'
import { lt } from './i18n'
import {
  formatUSD, formatGEL, formatViews,
  formatFloor, getListing, USD_GEL, type Listing, type PropType,
} from '@/data/listings'
import { useFavorites } from '@/lib/favorites'
import { pushRecent, useRecentIds } from '@/lib/recent'
import { useI18n, type DictKey } from '@/lib/i18n/context'

const ease = [0.21, 0.65, 0.2, 1] as const

const PROP_TYPE_KEY: Record<PropType, DictKey> = {
  apartment: 'prop.apartment',
  house: 'prop.houseShort',
  commercial: 'prop.commercial',
  land: 'prop.land',
}

/* ————— AI assessment copy by score ————— */
function aiExplanation(l: Listing, t: (key: DictKey, vars?: Record<string, string | number>) => string): string {
  const { score } = l.ai
  const base = t('detail.aiBase', {
    district: l.district,
    city: l.city,
    deal: t(l.dealType === 'rent' ? 'detail.dealRent' : 'detail.dealSale'),
  })
  if (score >= 90) return `${base} ${t('detail.aiVerdictHigh')}`
  if (score >= 84) return `${base} ${t('detail.aiVerdictMid')}`
  return `${base} ${t('detail.aiVerdictLow')}`
}

/* ————— Annuity mortgage payment ————— */
function monthlyPayment(principal: number, annualRatePct: number, years: number): number {
  const r = annualRatePct / 100 / 12
  const n = years * 12
  if (principal <= 0 || n <= 0) return 0
  if (r === 0) return principal / n
  return (principal * r) / (1 - Math.pow(1 + r, -n))
}

/* ————— Lightbox ————— */
function Lightbox({
  images, index, onClose, onNav,
}: { images: string[]; index: number; onClose: () => void; onNav: (dir: number) => void }) {
  const { t } = useI18n()
  const closeRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const trigger = document.activeElement instanceof HTMLElement ? document.activeElement : null
    closeRef.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowRight') onNav(1)
      if (e.key === 'ArrowLeft') onNav(-1)
    }
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
      trigger?.focus()
    }
  }, [onClose, onNav])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[90] flex items-center justify-center bg-sv-navy/95 p-4 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={t('detail.photoViewer')}
    >
      <button
        ref={closeRef}
        onClick={onClose}
        aria-label={t('detail.close')}
        className="absolute right-5 top-5 grid h-11 w-11 place-items-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
      >
        <X className="h-5 w-5" />
      </button>
      <button
        onClick={(e) => { e.stopPropagation(); onNav(-1) }}
        aria-label={t('detail.prevPhoto')}
        className="absolute left-4 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
      <motion.img
        key={index}
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.35, ease }}
        src={images[index]}
        alt={t('detail.photo', { n: index + 1 })}
        className="max-h-[84vh] max-w-full rounded-module object-contain shadow-panel-dark"
        onClick={(e) => e.stopPropagation()}
      />
      <button
        onClick={(e) => { e.stopPropagation(); onNav(1) }}
        aria-label={t('detail.nextPhoto')}
        className="absolute right-4 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
      >
        <ChevronRight className="h-5 w-5" />
      </button>
      <span className="absolute bottom-5 left-1/2 -translate-x-1/2 rounded-full bg-white/10 px-4 py-1.5 text-[13px] font-bold text-white/85">
        {index + 1} / {images.length}
      </span>
    </motion.div>
  )
}

/* ————— Page ————— */
export default function ListingDetailClient({ listing: l, similar }: { listing: Listing; similar: Listing[] }) {
  const { has, toggle } = useFavorites()
  const { t, lang } = useI18n()
  const [photo, setPhoto] = useState(0)
  const [lightbox, setLightbox] = useState(false)
  const [currency, setCurrency] = useState<'USD' | 'GEL'>('USD')
  const gradId = useId()

  // Mortgage state
  const [downPct, setDownPct] = useState(20)
  const [years, setYears] = useState(15)
  const [rate, setRate] = useState(9.5)

  // Reset photo + scroll on listing change (render-time state adjustment)
  const [prevId, setPrevId] = useState(l.id)
  if (prevId !== l.id) {
    setPrevId(l.id)
    setPhoto(0)
  }

  useEffect(() => {
    window.scrollTo({ top: 0 })
    pushRecent(l.id)
  }, [l.id])

  const recentIds = useRecentIds()
  const recent = useMemo(
    () =>
      recentIds
        .filter((id) => id !== l.id)
        .map(getListing)
        .filter((x): x is Listing => Boolean(x))
        .slice(0, 3),
    [recentIds, l.id],
  )

  const monthlyUSD = useMemo(() => {
    if (l.dealType !== 'sale') return 0
    return monthlyPayment(l.priceUSD * (1 - downPct / 100), rate, years)
  }, [l, downPct, rate, years])

  const fav = has(l.id)
  const isSale = l.dealType === 'sale'
  const priceMain = currency === 'USD' ? formatUSD(l.priceUSD) : formatGEL(l.priceGEL)
  const priceAlt = currency === 'USD' ? formatGEL(l.priceGEL) : formatUSD(l.priceUSD)

  const specs: { icon: typeof BedDouble; label: string; value: string }[] = [
    { icon: DoorOpen, label: t('spec.rooms'), value: l.rooms > 0 ? String(l.rooms) : '—' },
    { icon: BedDouble, label: t('spec.beds'), value: l.beds > 0 ? String(l.beds) : '—' },
    { icon: Bath, label: t('spec.baths'), value: l.baths > 0 ? String(l.baths) : '—' },
    { icon: Ruler, label: t('spec.area'), value: `${l.area} მ²` },
    { icon: Building2, label: t('spec.floor'), value: formatFloor(l) },
    { icon: Layers, label: t('spec.type'), value: t(PROP_TYPE_KEY[l.propType]) },
  ]

  const navPhoto = (dir: number) =>
    setPhoto((p) => (p + dir + l.images.length) % l.images.length)

  // "Message" CTAs jump to the lead form in the sidebar
  const scrollToLead = () =>
    document.getElementById('lead-form')?.scrollIntoView({ behavior: 'smooth', block: 'center' })

  // Native share sheet where available; clipboard copy elsewhere
  const share = async () => {
    const url = window.location.href
    if (navigator.share) {
      try {
        await navigator.share({ title: document.title, url })
      } catch {
        /* user dismissed the sheet — nothing to do */
      }
      return
    }
    navigator.clipboard?.writeText(url)
      .then(() => toast.success(t('detail.linkCopied')))
      .catch(() => toast.error('ბმულის კოპირება ვერ მოხერხდა'))
  }

  return (
    <div className="font-geo min-h-screen bg-sv-cloud antialiased">
      <Navbar />

      <main id="main" className="mx-auto max-w-[1440px] px-5 pb-28 pt-[92px] md:px-10 lg:pb-20">
        {/* Breadcrumb */}
        <nav className="mb-5 flex items-center gap-2 text-[13px] font-bold text-sv-ink/45" aria-label={t('detail.breadcrumb')}>
          <Link href="/" className="transition-colors hover:text-sv-blue">{t('detail.home')}</Link>
          <span>/</span>
          <Link href="/search" className="transition-colors hover:text-sv-blue">{t('search.title')}</Link>
          <span>/</span>
          <Link
            href={`/search?district=${encodeURIComponent(l.district)}`}
            className="transition-colors hover:text-sv-blue"
          >
            {l.district}
          </Link>
          <span>/</span>
          <span className="truncate text-sv-ink/70">{l.title}</span>
        </nav>

        {/* ————— Gallery ————— */}
        <div className="grid gap-4 lg:grid-cols-[1.9fr_1fr]">
          <motion.div
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease }}
            className="group relative overflow-hidden rounded-card shadow-card"
          >
            <button
              className="relative block aspect-[16/10] w-full cursor-zoom-in"
              onClick={() => setLightbox(true)}
              aria-label={t('detail.zoomPhoto')}
            >
              <Image
                key={photo}
                src={l.images[photo]}
                alt={`${l.title} — ფოტო ${photo + 1}`}
                fill
                sizes="(max-width:1024px) 100vw, 850px"
                priority
                className="object-cover"
              />
            </button>
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-sv-navy/50 via-transparent to-sv-navy/10" />
            {l.badge && (
              <span className={`absolute left-5 top-5 flex items-center gap-1.5 rounded-full px-4 py-2 text-[12px] font-black tracking-wider ${BADGE_STYLE[l.badge]}`}>
                {l.badge === 'SUPER VIP' ? <Crown className="h-4 w-4" /> : <Flame className="h-4 w-4" />}
                {l.badge}
              </span>
            )}
            <div className="absolute bottom-5 left-5 right-5 flex items-center justify-between">
              <span className="flex items-center gap-1.5 rounded-full bg-sv-navy/55 px-3 py-1.5 text-[12px] font-bold text-white/90 backdrop-blur">
                <Eye className="h-3.5 w-3.5" /> {t('detail.views', { n: formatViews(l.views) })}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => navPhoto(-1)}
                  aria-label={t('detail.prevPhoto')}
                  className="grid h-11 w-11 place-items-center rounded-full bg-white/90 text-sv-navy backdrop-blur transition-all hover:bg-sv-surface"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  onClick={() => navPhoto(1)}
                  aria-label={t('detail.nextPhoto')}
                  className="grid h-11 w-11 place-items-center rounded-full bg-white/90 text-sv-navy backdrop-blur transition-all hover:bg-sv-surface"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
            </div>
          </motion.div>

          {/* Thumbnails */}
          <div className="grid grid-cols-4 gap-3 lg:grid-cols-2 lg:grid-rows-2">
            {l.images.slice(0, 4).map((src, i) => (
              <button
                key={src + i}
                onClick={() => setPhoto(i)}
                aria-label={t('detail.photo', { n: i + 1 })}
                aria-pressed={photo === i}
                className={`relative aspect-[16/10] overflow-hidden rounded-module transition-all duration-300 lg:aspect-auto lg:h-full ${
                  photo === i
                    ? 'ring-2 ring-sv-blue ring-offset-2 ring-offset-sv-cloud'
                    : 'opacity-75 hover:opacity-100'
                }`}
              >
                <Image src={src} alt={`${l.title} — ფოტო ${i + 1}`} fill sizes="(max-width:1024px) 25vw, 420px" className="object-cover" />
              </button>
            ))}
          </div>
        </div>

        {/* ————— Main columns ————— */}
        <div className="mt-8 grid gap-8 lg:grid-cols-[1.9fr_1fr]">
          {/* Left: content */}
          <div className="min-w-0">
            {/* Title + price */}
            <div className="flex flex-wrap items-start justify-between gap-5">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2.5">
                  {l.isNew && (
                    <span className="rounded-full bg-sv-blue/10 px-3 py-1 text-[11px] font-black uppercase tracking-wider text-sv-blue">
                      {t('detail.newComplex')}
                    </span>
                  )}
                  <span className="flex items-center gap-1 text-[12px] font-bold text-sv-ink/45">
                    <Calendar className="h-3.5 w-3.5" /> {l.postedAt}
                  </span>
                </div>
                <h1 className="mt-2.5 text-balance text-[26px] font-black leading-tight tracking-[-0.02em] text-sv-ink md:text-[34px]">
                  {l.title}
                </h1>
                <p className="mt-2 flex items-center gap-1.5 text-[15px] font-semibold text-sv-ink/50">
                  <MapPin className="h-4 w-4 shrink-0 text-sv-blue" /> {l.address}
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => toggle(l.id)}
                  aria-label={fav ? t('detail.removeFavorite') : t('detail.addFavorite')}
                  aria-pressed={fav}
                  className={`group grid h-11 w-11 place-items-center rounded-full border transition-all duration-300 hover:scale-105 ${
                    fav
                      ? 'border-sv-orange/30 bg-sv-orange/10 text-sv-orange'
                      : 'border-sv-ink/10 bg-sv-surface text-sv-ink'
                  }`}
                >
                  <Heart
                    className={`h-5 w-5 transition-all ${
                      fav ? 'fill-sv-orange text-sv-orange' : 'group-hover:fill-sv-orange/20 group-hover:text-sv-orange'
                    }`}
                  />
                </button>
                <button
                  onClick={share}
                  aria-label={t('detail.share')}
                  className="grid h-11 w-11 place-items-center rounded-full border border-sv-ink/10 bg-sv-surface text-sv-ink/60 transition-all duration-300 hover:scale-105 hover:text-sv-blue"
                >
                  <Share2 className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Price block */}
            <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-card border border-sv-ink/[0.06] bg-sv-surface p-6 shadow-card">
              <div>
                <div className="text-[11px] font-black uppercase tracking-wider text-sv-ink/40">
                  {isSale ? t('detail.fullPrice') : t('detail.monthlyRent')}
                </div>
                <div className="mt-1 text-[32px] font-black tracking-tight text-sv-ink md:text-[36px]">
                  {priceMain}
                  {!isSale && <span className="text-[18px] font-extrabold text-sv-ink/45"> {t('detail.perMonth')}</span>}
                </div>
                <div className="mt-0.5 text-[14px] font-bold text-sv-ink/45">
                  {priceAlt} · {currency === 'USD'
                    ? `$${l.perM2USD.toLocaleString('en-US')}`
                    : `${Math.round(l.priceGEL / l.area).toLocaleString('en-US')} ₾`}/მ²
                </div>
              </div>
              {/* Currency toggle */}
              <div className="flex rounded-control bg-sv-ink/[0.05] p-1" role="tablist" aria-label={t('detail.currency')}>
                {(['USD', 'GEL'] as const).map((c) => (
                  <button
                    key={c}
                    role="tab"
                    aria-selected={currency === c}
                    onClick={() => setCurrency(c)}
                    className={`relative rounded-lg px-5 py-2.5 text-[13px] font-extrabold transition-colors ${
                      currency === c ? 'text-white' : 'text-sv-ink/60 hover:text-sv-ink'
                    }`}
                  >
                    {currency === c && (
                      <motion.span
                        layoutId="cur-seg"
                        className="absolute inset-0 rounded-lg bg-sv-blue"
                        transition={{ type: 'spring', bounce: 0.18, duration: 0.5 }}
                      />
                    )}
                    <span className="relative z-10">{c === 'USD' ? '$ USD' : '₾ GEL'}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* AI assessment */}
            <div className="mt-6 overflow-hidden rounded-card border border-sv-blue/15 bg-gradient-to-br from-sv-blue/[0.06] via-sv-surface to-sv-violet/[0.06] p-6 shadow-card">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-sv-blue" />
                <span className="text-[12px] font-black uppercase tracking-wider text-sv-blue">
                  {t('detail.aiScore')}
                </span>
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-6">
                <div className="relative grid h-[88px] w-[88px] shrink-0 place-items-center">
                  <svg viewBox="0 0 36 36" className="h-[88px] w-[88px] -rotate-90">
                    <circle cx="18" cy="18" r="15.5" fill="none" stroke="var(--sv-blue)" strokeOpacity="0.12" strokeWidth="3" />
                    <motion.circle
                      cx="18" cy="18" r="15.5" fill="none" stroke={`url(#${gradId})`} strokeWidth="3"
                      strokeLinecap="round"
                      initial={{ strokeDasharray: '0 97.4' }}
                      whileInView={{ strokeDasharray: `${(l.ai.score / 100) * 97.4} 97.4` }}
                      viewport={{ once: true }}
                      transition={{ duration: 1.2, ease }}
                    />
                    <defs>
                      <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor="var(--sv-blue)" />
                        <stop offset="100%" stopColor="var(--sv-violet)" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="absolute text-center">
                    <div className="text-[24px] font-black leading-none text-sv-blue">{l.ai.score}</div>
                    <div className="text-[9px] font-black uppercase tracking-wider text-sv-ink/40">/ 100</div>
                  </div>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[18px] font-black text-sv-ink">{l.ai.label}</div>
                  <p className="mt-1.5 text-[14px] font-semibold leading-relaxed text-sv-ink/55">
                    {aiExplanation(l, t)}
                  </p>
                </div>
              </div>
            </div>

            {/* Specs */}
            <Reveal className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {specs.map((s) => (
                <div
                  key={s.label}
                  className="rounded-tile border border-sv-ink/[0.06] bg-sv-surface p-4 shadow-card"
                >
                  <s.icon className="h-5 w-5 text-sv-blue" />
                  <div className="mt-2.5 text-[18px] font-black text-sv-ink">{s.value}</div>
                  <div className="text-[12px] font-bold text-sv-ink/45">{s.label}</div>
                </div>
              ))}
            </Reveal>

            {/* Features */}
            <Reveal className="mt-8">
              <h2 className="text-[20px] font-black tracking-[-0.02em] text-sv-ink">{t('detail.features')}</h2>
              <div className="mt-4 flex flex-wrap gap-2">
                {l.features.map((f) => (
                  <span
                    key={f}
                    className="flex items-center gap-1.5 rounded-full border border-sv-ink/[0.08] bg-sv-surface px-4 py-2 text-[13px] font-bold text-sv-ink/70"
                  >
                    <BadgeCheck className="h-3.5 w-3.5 text-sv-blue" /> {f}
                  </span>
                ))}
              </div>
            </Reveal>

            {/* Description */}
            <div className="mt-8">
              <h2 className="text-[20px] font-black tracking-[-0.02em] text-sv-ink">{t('detail.description')}</h2>
              <p className="mt-3 text-[15px] font-medium leading-[1.8] text-sv-ink/65">
                {l.description}
              </p>
            </div>

            {/* Map */}
            <div className="mt-8">
              <h2 className="text-[20px] font-black tracking-[-0.02em] text-sv-ink">{t('detail.location')}</h2>
              <div className="relative mt-4 h-[320px] overflow-hidden rounded-card shadow-card">
                <Image src="/images/map3d.webp" alt={t('detail.map')} fill sizes="(max-width:1024px) 100vw, 850px" className="object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-sv-navy/60 via-transparent to-transparent" />
                {/* Pin */}
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                  <span className="animate-pin block h-5 w-5 rounded-full border-[3px] border-white bg-sv-orange shadow-glow-orange" />
                </div>
                <div className="absolute bottom-5 left-5 right-5 flex flex-wrap items-center justify-between gap-3">
                  <div className="rounded-module glass px-4 py-2.5">
                    <div className="flex items-center gap-1.5 text-[13px] font-extrabold text-white">
                      <MapPin className="h-3.5 w-3.5 text-sv-orange" /> {l.address}
                    </div>
                    <div className="mt-0.5 text-[11px] font-bold text-white/55">
                      {l.coords.lat.toFixed(4)}, {l.coords.lng.toFixed(4)}
                    </div>
                  </div>
                  <span className="rounded-full glass px-3.5 py-1.5 text-[11px] font-bold text-white/70">
                    {t('detail.map3dSoon')}
                  </span>
                </div>
              </div>
            </div>

            {/* Mortgage calculator */}
            {isSale && (
              <div className="mt-8 rounded-card border border-sv-ink/[0.06] bg-sv-surface p-6 shadow-card md:p-8">
                <div className="flex items-center gap-2.5">
                  <span className="grid h-10 w-10 place-items-center rounded-control bg-sv-blue/10">
                    <Calculator className="h-5 w-5 text-sv-blue" />
                  </span>
                  <div>
                    <h2 className="text-[20px] font-black tracking-[-0.02em] text-sv-ink">{t('detail.mortgage')}</h2>
                    <p className="text-[12px] font-bold text-sv-ink/45">{t('detail.mortgageNote', { rate: USD_GEL })}</p>
                  </div>
                </div>

                <div className="mt-6 space-y-6">
                  {/* Down payment */}
                  <div>
                    <div className="mb-2 flex items-center justify-between text-[13px] font-bold">
                      <span className="text-sv-ink/60">{t('detail.downPayment')}</span>
                      <span className="text-sv-ink">{downPct}% · {formatUSD(Math.round(l.priceUSD * downPct / 100))}</span>
                    </div>
                    <input
                      type="range" min={0} max={70} step={5} value={downPct}
                      onChange={(e) => setDownPct(Number(e.target.value))}
                      aria-label={t('detail.downPaymentAria')}
                      className="sv-range w-full"
                    />
                  </div>
                  {/* Years */}
                  <div>
                    <div className="mb-2 flex items-center justify-between text-[13px] font-bold">
                      <span className="text-sv-ink/60">{t('detail.term')}</span>
                      <span className="text-sv-ink">{t('detail.years', { n: years })}</span>
                    </div>
                    <input
                      type="range" min={1} max={30} step={1} value={years}
                      onChange={(e) => setYears(Number(e.target.value))}
                      aria-label={t('detail.termAria')}
                      className="sv-range w-full"
                    />
                  </div>
                  {/* Rate */}
                  <div>
                    <div className="mb-2 flex items-center justify-between text-[13px] font-bold">
                      <span className="text-sv-ink/60">{t('detail.rate')}</span>
                    </div>
                    <div className="relative w-[140px]">
                      <input
                        type="number" min={0} max={30} step={0.1} value={rate}
                        onChange={(e) => setRate(Number(e.target.value))}
                        aria-label={t('detail.rateAria')}
                        className="h-11 w-full rounded-control border border-sv-ink/10 bg-sv-surface px-3.5 pr-8 text-[14px] font-extrabold text-sv-ink outline-none transition-colors focus:border-sv-blue"
                      />
                      <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[14px] font-extrabold text-sv-ink/40">%</span>
                    </div>
                  </div>
                </div>

                {/* Result */}
                <div className="mt-7 flex flex-wrap items-center justify-between gap-4 rounded-module bg-gradient-to-r from-sv-blue/[0.08] to-sv-violet/[0.08] p-5 ring-1 ring-inset ring-sv-blue/15">
                  <div>
                    <div className="text-[11px] font-black uppercase tracking-wider text-sv-blue">{t('detail.monthlyPayment')}</div>
                    <div className="mt-1 text-[28px] font-black tracking-tight text-sv-ink">
                      {formatUSD(Math.round(monthlyUSD))}
                      <span className="text-[15px] font-extrabold text-sv-ink/45"> {t('detail.perMonth')}</span>
                    </div>
                    <div className="text-[13px] font-bold text-sv-ink/45">
                      {t('detail.approxPerMonth', { gel: formatGEL(Math.round(monthlyUSD * USD_GEL)) })}
                    </div>
                  </div>
                  <div className="text-right text-[12px] font-bold leading-relaxed text-sv-ink/45">
                    {t('detail.loanAmount')}<br />
                    <span className="text-[15px] font-black text-sv-ink">
                      {formatUSD(Math.round(l.priceUSD * (1 - downPct / 100)))}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right: agent card (sticky) */}
          <aside className="lg:sticky lg:top-[92px] lg:self-start">
            <div className="rounded-card border border-sv-ink/[0.06] bg-sv-surface p-6 shadow-card">
              <div className="flex items-center gap-4">
                <div className="grid h-14 w-14 shrink-0 place-items-center rounded-module bg-gradient-to-br from-sv-blue to-sv-violet text-[18px] font-black text-white">
                  {l.agent.name.charAt(0)}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 text-[16px] font-black text-sv-ink">
                    <span className="truncate">{l.agent.name}</span>
                    <BadgeCheck className="h-4 w-4 shrink-0 text-sv-blue" aria-label={t('detail.verifiedAgent')} />
                  </div>
                  <div className="text-[13px] font-bold text-sv-ink/45">{l.agent.agency}</div>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-2.5">
                <a
                  href={`tel:${l.agent.phone.replace(/\s/g, '')}`}
                  className="flex h-12 items-center justify-center gap-2 rounded-full bg-sv-orange text-[14px] font-extrabold text-white shadow-glow-orange transition-all duration-300 hover:-translate-y-0.5 hover:shadow-glow-orange-lg active:scale-[0.98]"
                >
                  <Phone className="h-4 w-4" /> {t('detail.call')}
                </a>
                <button
                  onClick={scrollToLead}
                  className="flex h-12 items-center justify-center gap-2 rounded-full border border-sv-blue/25 bg-sv-blue/[0.06] text-[14px] font-extrabold text-sv-blue transition-all duration-300 hover:bg-sv-blue/10"
                >
                  <MessageCircle className="h-4 w-4" /> {t('detail.message')}
                </button>
              </div>

              <div className="mt-2.5 grid grid-cols-2 gap-2.5">
                <button
                  onClick={() => toggle(l.id)}
                  aria-label={fav ? t('detail.removeFavorite') : t('detail.addFavorite')}
                  aria-pressed={fav}
                  className={`flex h-11 items-center justify-center gap-2 rounded-full border transition-all duration-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sv-orange ${
                    fav
                      ? 'border-sv-orange/30 bg-sv-orange/10 text-sv-orange'
                      : 'border-sv-ink/10 bg-sv-surface text-sv-ink/60 hover:text-sv-orange'
                  }`}
                >
                  <Heart className={`h-4.5 w-4.5 ${fav ? 'fill-sv-orange text-sv-orange' : ''}`} />
                  <span className="text-[13px] font-extrabold">{t('nav.favorites')}</span>
                </button>
                <button
                  onClick={share}
                  aria-label={t('detail.share')}
                  className="flex h-11 items-center justify-center gap-2 rounded-full border border-sv-ink/10 bg-sv-surface text-sv-ink/60 transition-all duration-300 hover:text-sv-blue focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sv-blue"
                >
                  <Share2 className="h-4.5 w-4.5" />
                  <span className="text-[13px] font-extrabold">{t('detail.share')}</span>
                </button>
              </div>

              <div className="mt-4 rounded-module bg-sv-ink/[0.03] p-4 text-center">
                <div className="text-[12px] font-bold text-sv-ink/45">{t('detail.agentPhone')}</div>
                <a
                  href={`tel:${l.agent.phone.replace(/\s/g, '')}`}
                  className="mt-0.5 block text-[16px] font-black tracking-wide text-sv-ink transition-colors hover:text-sv-blue"
                >
                  {l.agent.phone}
                </a>
              </div>

              <p className="mt-4 flex items-center justify-center gap-1.5 text-[11px] font-bold text-sv-ink/35">
                <BadgeCheck className="h-3.5 w-3.5 text-sv-blue" />
                {t('detail.verifiedBy')}
              </p>
            </div>

            {/* Lead form — anchor target for the "message" CTAs */}
            <div
              id="lead-form"
              className="mt-4 scroll-mt-28 rounded-card border border-sv-ink/[0.06] bg-sv-surface p-6 shadow-card"
            >
              <LeadForm targetType="listing" targetId={l.id} recipientName={l.agent.name} />
            </div>

            {/* Safety note */}
            <div className="mt-4 rounded-tile border border-sv-ink/[0.06] bg-sv-surface p-5 shadow-card">
              <div className="text-[13px] font-black text-sv-ink">{t('detail.safetyTitle')}</div>
              <p className="mt-1.5 text-[12px] font-semibold leading-relaxed text-sv-ink/50">
                {t('detail.safetyText')}
              </p>
            </div>
          </aside>
        </div>

        {/* ————— Reviews ————— */}
        <Reveal className="mt-16">
          <section id="reviews" aria-label={lt(lang, 'reviewsTitle')}>
            <h2 className="text-[24px] font-black tracking-[-0.02em] text-sv-ink md:text-[28px]">
              {lt(lang, 'reviewsTitle')}
            </h2>
            <p className="mt-1 text-[14px] font-semibold text-sv-ink/50">
              {lt(lang, 'reviewsSub')}
            </p>
            <ReviewsSection targetType="listing" targetId={l.id} className="mt-6" />
          </section>
        </Reveal>

        {/* ————— Similar ————— */}
        {similar.length > 0 && (
          <Reveal className="mt-16">
            <section>
              <div className="mb-6 flex items-end justify-between">
                <div>
                  <h2 className="text-[24px] font-black tracking-[-0.02em] text-sv-ink md:text-[28px]">
                    {t('detail.similar')}
                  </h2>
                  <p className="mt-1 text-[14px] font-semibold text-sv-ink/50">
                    {lt(lang, 'similarSub', { deal: t(isSale ? 'search.sale' : 'search.rent') })}
                  </p>
                </div>
                <Link
                  href={`/search?deal=${l.dealType}&type=${l.propType}`}
                  className="hidden shrink-0 items-center gap-2 text-[14px] font-extrabold text-sv-blue transition-colors hover:text-sv-blue-deep sm:flex"
                >
                  {t('detail.seeMore')} <ChevronRight className="h-4 w-4" />
                </Link>
              </div>
              <div className="-mx-5 overflow-x-auto px-5 pb-2 md:-mx-10 md:px-10">
                <div className="flex snap-x snap-mandatory gap-6">
                  {similar.map((s, i) => (
                    <div key={s.id} className="w-[300px] shrink-0 snap-start sm:w-[340px]">
                      <ListingCard l={s} i={i} layout="wide" />
                    </div>
                  ))}
                </div>
              </div>
            </section>
          </Reveal>
        )}
        {/* ————— Recently viewed ————— */}
        {recent.length > 0 && (
          <Reveal className="mt-16">
            <section aria-label={t('recent.title')}>
              <h2 className="mb-6 text-[24px] font-black tracking-[-0.02em] text-sv-ink md:text-[28px]">
                {t('recent.title')}
              </h2>
              <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {recent.map((r, i) => (
                  <ListingCard key={r.id} l={r} i={i} layout="wide" />
                ))}
              </div>
            </section>
          </Reveal>
        )}
      </main>

      <Footer />

      {/* ————— Mobile conversion bar (call / message / favorite) ————— */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-sv-ink/10 bg-sv-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden">
        <div className="grid grid-cols-3 gap-2 px-4 py-2.5">
          <a
            href={`tel:${l.agent.phone.replace(/\s/g, '')}`}
            aria-label={t('detail.call')}
            className="flex h-12 items-center justify-center gap-2 rounded-full bg-sv-orange text-[14px] font-extrabold text-white shadow-glow-orange transition-all active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sv-orange"
          >
            <Phone className="h-4 w-4" /> {t('detail.call')}
          </a>
          <button
            onClick={scrollToLead}
            aria-label={t('detail.message')}
            className="flex h-12 items-center justify-center gap-2 rounded-full border border-sv-blue/25 bg-sv-blue/[0.06] text-[14px] font-extrabold text-sv-blue transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sv-blue"
          >
            <MessageCircle className="h-4 w-4" /> {t('detail.message')}
          </button>
          <button
            onClick={() => toggle(l.id)}
            aria-label={fav ? t('detail.removeFavorite') : t('detail.addFavorite')}
            aria-pressed={fav}
            className={`flex h-12 items-center justify-center gap-2 rounded-full border transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sv-orange ${
              fav
                ? 'border-sv-orange/30 bg-sv-orange/10 text-sv-orange'
                : 'border-sv-ink/10 bg-sv-surface text-sv-ink/70'
            }`}
          >
            <Heart className={`h-5 w-5 ${fav ? 'fill-sv-orange text-sv-orange' : ''}`} />
          </button>
        </div>
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {lightbox && (
          <Lightbox
            images={l.images}
            index={photo}
            onClose={() => setLightbox(false)}
            onNav={navPhoto}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
