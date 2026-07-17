'use client'

/**
 * SIVRCE — Add Listing wizard (6 steps)
 * Type → Location → Details → Photos → Price & description → Contact.
 * Live preview, listing-strength meter, AI price estimate, AI description.
 * All colors come from locked tokens (BRAND.md §3/§3.1) — category icons
 * use CATEGORY_BRAND, actions use sv-orange, brand surfaces use sv-blue.
 */

import { useMemo, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import {
  Building, Home, Briefcase, Map, Tag, KeyRound, CalendarClock,
  MapPin, Ruler, BedDouble, Bath, Layers, Check, ChevronLeft,
  ImagePlus, Star, X, Sparkles, Phone, User, MessageCircle,
  CircleCheckBig, Plus, Video, BadgeCheck, Flame,
} from 'lucide-react'
import { useI18n, type DictKey } from '@/lib/i18n/context'
import { CATEGORY_BRAND } from '@/lib/category-brand'
import {
  CITIES, districtsOf, LISTINGS, USD_GEL, formatUSD, formatGEL,
  type Listing, type PropType,
} from '@/data/listings'
import ListingCard from '@/components/ListingCard'

type Deal = 'sale' | 'rent' | 'daily'
type Photo = { url: string; name: string }

const PROP_TYPES: { key: PropType; icon: typeof Building; brand: (typeof CATEGORY_BRAND)[keyof typeof CATEGORY_BRAND]; labelKey: DictKey }[] = [
  { key: 'apartment', icon: Building, brand: CATEGORY_BRAND.apartments, labelKey: 'prop.apartment' },
  { key: 'house', icon: Home, brand: CATEGORY_BRAND.houses, labelKey: 'prop.house' },
  { key: 'commercial', icon: Briefcase, brand: CATEGORY_BRAND.commercial, labelKey: 'prop.commercial' },
  { key: 'land', icon: Map, brand: CATEGORY_BRAND.land, labelKey: 'prop.land' },
]

const DEALS: { key: Deal; icon: typeof Tag; labelKey: DictKey; hue: string }[] = [
  { key: 'sale', icon: Tag, labelKey: 'add.deal.sale', hue: '#2E6BFF' },
  { key: 'rent', icon: KeyRound, labelKey: 'add.deal.rent', hue: '#7C3AED' },
  { key: 'daily', icon: CalendarClock, labelKey: 'add.deal.daily', hue: CATEGORY_BRAND.dailyRent.hue },
]

const CONDITIONS = ['add.cond.newReno', 'add.cond.oldReno', 'add.cond.needsReno', 'add.cond.whiteFrame', 'add.cond.blackFrame', 'add.cond.greenFrame'] as const
const STATUSES = ['add.status.new', 'add.status.old', 'add.status.construction'] as const
const FEATURES = [
  'add.f.balcony', 'add.f.elevator', 'add.f.parking', 'add.f.garage', 'add.f.furniture',
  'add.f.appliances', 'add.f.centralHeating', 'add.f.gas', 'add.f.internet', 'add.f.ac',
  'add.f.storage', 'add.f.fireplace', 'add.f.security', 'add.f.yard',
] as const

const STEPS = ['add.step.type', 'add.step.location', 'add.step.details', 'add.step.photos', 'add.step.price', 'add.step.contact'] as const

/** rough market $/m² baselines for the AI estimate (display-only demo model) */
const BASE_M2: Record<PropType, number> = { apartment: 1150, house: 720, commercial: 1350, land: 95 }
const CITY_MULT: Record<string, number> = { თბილისი: 1, ბათუმი: 0.9, ქუთაისი: 0.55, რუსთავი: 0.5 }

const ease = [0.21, 0.65, 0.2, 1] as const

const PHONE_RE = /^\+995 \d{3} \d{2} \d{2} \d{2}$/

/** Normalize to `+995 XXX XX XX XX` while typing (9 digits after the forced prefix) */
const formatPhone = (raw: string): string => {
  let d = raw.replace(/\D/g, '')
  if (d.startsWith('995')) d = d.slice(3)
  d = d.slice(0, 9)
  const groups = [d.slice(0, 3), d.slice(3, 5), d.slice(5, 7), d.slice(7, 9)].filter(Boolean)
  return `+995${groups.length ? ` ${groups.join(' ')}` : ''}`
}

export default function AddListingClient() {
  const { t } = useI18n()
  const fileRef = useRef<HTMLInputElement>(null)

  const [step, setStep] = useState(0)
  const [touched, setTouched] = useState(false)
  const [published, setPublished] = useState(false)

  const [deal, setDeal] = useState<Deal | null>(null)
  const [propType, setPropType] = useState<PropType | null>(null)
  const [city, setCity] = useState('')
  const [district, setDistrict] = useState('')
  const [street, setStreet] = useState('')
  const [houseNo, setHouseNo] = useState('')
  const [cadastral, setCadastral] = useState('')
  const [area, setArea] = useState('')
  const [rooms, setRooms] = useState(0)
  const [baths, setBaths] = useState(1)
  const [floor, setFloor] = useState('')
  const [totalFloors, setTotalFloors] = useState('')
  const [condition, setCondition] = useState<DictKey | ''>('')
  const [status, setStatus] = useState<DictKey | ''>('')
  const [features, setFeatures] = useState<DictKey[]>([])
  const [photos, setPhotos] = useState<Photo[]>([])
  const [cover, setCover] = useState(0)
  const [video, setVideo] = useState('')
  const [price, setPrice] = useState('')
  const [negotiable, setNegotiable] = useState(false)
  const [description, setDescription] = useState('')
  const [aiUsed, setAiUsed] = useState(false)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [messengers, setMessengers] = useState<string[]>(['WhatsApp', 'Viber'])
  const [terms, setTerms] = useState(false)

  const areaN = Number(area) || 0
  const priceN = Number(price) || 0
  const districts = districtsOf(city || undefined)

  /* ————— AI price estimate (demo model) ————— */
  const estimate = useMemo(() => {
    if (!propType || !city || !areaN) return null
    const mid = Math.round(BASE_M2[propType] * (CITY_MULT[city] ?? 0.6) * areaN)
    const n = Math.max(LISTINGS.filter((l) => l.propType === propType && l.city === city).length * 17, 96)
    return { low: Math.round(mid * 0.92), high: Math.round(mid * 1.08), mid, n }
  }, [propType, city, areaN])

  const verdict = useMemo(() => {
    if (!estimate || !priceN) return null
    if (priceN < estimate.low) return 'low' as const
    if (priceN > estimate.high) return 'high' as const
    return 'fair' as const
  }, [estimate, priceN])

  /* ————— listing strength ————— */
  const strength = useMemo(() => {
    const signals = [
      !!deal && !!propType, !!(city && district && street), areaN > 0, rooms > 0,
      !!condition, features.length >= 3, photos.length >= 1, photos.length >= 5,
      priceN > 0 || negotiable, description.length >= 80, !!video, PHONE_RE.test(phone),
    ]
    return Math.round((signals.filter(Boolean).length / signals.length) * 100)
  }, [deal, propType, city, district, street, areaN, rooms, condition, features, photos, priceN, negotiable, description, video, phone])

  const stepValid = [
    !!deal && !!propType,
    !!(city && district && street),
    areaN > 0,
    true,
    priceN > 0 || negotiable,
    !!(name.trim() && PHONE_RE.test(phone) && terms),
  ][step]

  const propLabel = propType ? t(PROP_TYPES.find((p) => p.key === propType)!.labelKey) : ''
  const autoTitle = propType
    ? rooms > 0 && propType !== 'land'
      ? t('add.autoTitle.rooms', { rooms, type: propLabel, district: district || '—' })
      : t('add.autoTitle.simple', { type: propLabel, district: district || '—' })
    : t('add.previewTitle')

  const preview: Listing = {
    id: LISTINGS[0].id, // real id so Link prefetch doesn't 404 (card is pointer-events-none anyway)
    img: photos[cover]?.url ?? LISTINGS.find((l) => l.propType === propType)?.img ?? LISTINGS[0].img,
    images: photos.length ? photos.map((p) => p.url) : [LISTINGS[0].img],
    priceUSD: priceN, priceGEL: priceN * USD_GEL, perM2USD: areaN ? Math.round(priceN / areaN) : 0,
    title: autoTitle,
    address: [street && `${street} ${houseNo}`.trim(), district, city].filter(Boolean).join(', ') || '—',
    city: city || '—', district: district || '—',
    dealType: deal ?? 'sale',
    propType: propType ?? 'apartment',
    rooms, beds: rooms, baths, area: areaN, floor: Number(floor) || 1, totalFloors: Number(totalFloors) || 1,
    views: 0, badge: null,
    ai: { score: Math.max(strength, 41), label: t('add.aiPending') },
    features: features.map((f) => t(f)),
    description, coords: { lat: 41.7151, lng: 44.8271 },
    postedAt: new Date().toISOString(),
    agent: { name: name || '—', phone: phone || '—', agency: '' },
    isNew: true,
  }

  const addPhotos = (files: FileList | null) => {
    if (!files) return
    const next = [...photos]
    for (const f of Array.from(files)) {
      if (next.length >= 16) break
      next.push({ url: URL.createObjectURL(f), name: f.name })
    }
    setPhotos(next)
  }

  const aiWrite = () => {
    if (!propType || !city) return
    const dealLabel = deal ? t(DEALS.find((d) => d.key === deal)!.labelKey) : ''
    const text = t('add.aiDesc', {
      city, district: district || '—', deal: dealLabel,
      rooms: rooms > 0 ? t('add.aiDesc.rooms', { n: rooms }) : '',
      type: propLabel.toLowerCase(), area: areaN,
      floor: floor && totalFloors ? t('add.aiDesc.floor', { f: floor, t: totalFloors }) : '',
      condition: condition ? t(condition) : '—',
      features: features.length ? t('add.aiDesc.features', { list: features.map((f) => t(f)).join(', ') }) : '',
    })
    setDescription(text)
    setAiUsed(true)
  }

  const go = (dir: 1 | -1) => {
    if (dir === 1 && !stepValid) { setTouched(true); return }
    setTouched(false)
    setStep((s) => Math.min(Math.max(s + dir, 0), STEPS.length - 1))
  }

  /* ————— shared field styles ————— */
  const input =
    'w-full rounded-control border border-sv-ink/[0.08] bg-sv-surface px-4 py-3.5 text-[15px] font-semibold text-sv-ink placeholder:text-sv-ink/35 outline-none transition-all focus:border-sv-blue focus:ring-4 focus:ring-sv-blue/10'
  const label = 'mb-2 block text-[13px] font-extrabold text-sv-ink/70'
  const err = (bad: boolean) => (touched && bad ? 'border-sv-orange ring-4 ring-sv-orange/10' : '')

  /* ————— success screen ————— */
  if (published) {
    return (
      <section className="min-h-[80vh] bg-sv-cloud py-16 md:py-24">
        <div className="mx-auto max-w-[640px] px-5 text-center">
          <motion.div
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6, ease }}
            className="mx-auto grid h-24 w-24 place-items-center rounded-full bg-sv-blue text-white shadow-glow-blue"
          >
            <CircleCheckBig className="h-11 w-11" />
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15, duration: 0.6, ease }}
            className="mt-8 text-[34px] font-black tracking-[-0.02em] text-sv-ink md:text-[42px]"
          >
            {t('add.successTitle')}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25, duration: 0.6, ease }}
            className="mx-auto mt-4 max-w-[440px] text-[16px] font-semibold leading-relaxed text-sv-ink/55"
          >
            {t('add.successText')}
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35, duration: 0.6, ease }}
            className="mt-10 flex flex-wrap items-center justify-center gap-4"
          >
            <Link
              href="/search"
              className="rounded-full bg-sv-orange px-8 py-4 text-[15px] font-extrabold text-white shadow-glow-orange transition-all duration-300 hover:-translate-y-0.5 hover:shadow-glow-orange-lg"
            >
              {t('add.successView')}
            </Link>
            <button
              onClick={() => { setPublished(false); setStep(0); setPhotos([]); setPrice(''); setDescription(''); setTouched(false) }}
              className="flex items-center gap-2 rounded-full border border-sv-ink/10 bg-sv-surface px-8 py-4 text-[15px] font-extrabold text-sv-ink transition-all duration-300 hover:-translate-y-0.5 hover:shadow-card"
            >
              <Plus className="h-4 w-4" /> {t('add.successNew')}
            </button>
          </motion.div>
        </div>
      </section>
    )
  }

  const strengthColor = strength < 40 ? '#FF6A2D' : strength < 75 ? '#D97706' : '#2E6BFF'
  const strengthLabel = strength < 40 ? t('add.strength.low') : strength < 75 ? t('add.strength.mid') : t('add.strength.high')

  return (
    <section className="bg-sv-cloud py-10 md:py-16">
      <div className="mx-auto max-w-[1440px] px-5 md:px-10">
        {/* header */}
        <div className="mb-10 text-center">
          <h1 className="text-[30px] font-black tracking-[-0.02em] text-sv-ink md:text-[40px]">{t('add.title')}</h1>
          <p className="mx-auto mt-3 max-w-[520px] text-[15px] font-semibold text-sv-ink/50 md:text-[16px]">{t('add.subtitle')}</p>
        </div>

        {/* stepper */}
        <div className="mx-auto mb-10 max-w-[820px]">
          <div className="flex items-center justify-between">
            {STEPS.map((s, i) => (
              <button
                key={s}
                onClick={() => i < step && setStep(i)}
                className="group flex flex-col items-center gap-2"
                aria-current={i === step ? 'step' : undefined}
              >
                <span
                  className={`grid h-10 w-10 place-items-center rounded-full text-[13px] font-black transition-all duration-300 ${
                    i < step
                      ? 'bg-sv-blue text-white'
                      : i === step
                        ? 'bg-sv-orange text-white shadow-glow-orange'
                        : 'border border-sv-ink/10 bg-sv-surface text-sv-ink/40'
                  }`}
                >
                  {i < step ? <Check className="h-4 w-4" /> : i + 1}
                </span>
                <span className={`hidden text-[11px] font-extrabold sm:block ${i === step ? 'text-sv-ink' : 'text-sv-ink/40'}`}>
                  {t(s)}
                </span>
              </button>
            ))}
          </div>
          <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-sv-ink/[0.06]">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-sv-blue to-sv-violet"
              animate={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
              transition={{ duration: 0.5, ease }}
            />
          </div>
          <div className="mt-2 text-center text-[12px] font-bold text-sv-ink/40">
            {t('add.stepOf', { n: step + 1, total: STEPS.length })}
          </div>
        </div>

        <div className="grid items-start gap-8 lg:grid-cols-[1fr_400px]">
          {/* ————— wizard card ————— */}
          <div className="rounded-card border border-sv-ink/[0.06] bg-sv-surface p-6 shadow-card md:p-10">
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -24 }}
                transition={{ duration: 0.4, ease }}
              >
                {/* ——— step 1 · type ——— */}
                {step === 0 && (
                  <div>
                    <h2 className="text-[13px] font-black uppercase tracking-wider text-sv-ink/45">{t('add.dealType')}</h2>
                    <div className="mt-3 grid grid-cols-3 gap-3">
                      {DEALS.map((d) => {
                        const active = deal === d.key
                        return (
                          <button
                            key={d.key}
                            onClick={() => setDeal(d.key)}
                            className={`flex flex-col items-center gap-2.5 rounded-tile border p-5 transition-all duration-300 hover:-translate-y-0.5 ${
                              active ? 'border-transparent shadow-card' : 'border-sv-ink/[0.08] bg-sv-surface hover:shadow-card'
                            }`}
                            style={active ? { backgroundColor: `${d.hue}0D`, boxShadow: `0 0 0 2px ${d.hue}` } : undefined}
                          >
                            <span
                              className="grid h-11 w-11 place-items-center rounded-module"
                              style={{ backgroundColor: active ? d.hue : `${d.hue}14`, color: active ? '#fff' : d.hue }}
                            >
                              <d.icon className="h-5 w-5" />
                            </span>
                            <span className="text-[13px] font-extrabold text-sv-ink">{t(d.labelKey)}</span>
                          </button>
                        )
                      })}
                    </div>

                    <h2 className="mt-8 text-[13px] font-black uppercase tracking-wider text-sv-ink/45">{t('add.propType')}</h2>
                    <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
                      {PROP_TYPES.map((p) => {
                        const active = propType === p.key
                        return (
                          <button
                            key={p.key}
                            onClick={() => setPropType(p.key)}
                            className={`flex flex-col items-center gap-2.5 rounded-tile border p-5 transition-all duration-300 hover:-translate-y-0.5 ${
                              active ? 'border-transparent' : 'border-sv-ink/[0.08] bg-sv-surface hover:shadow-card'
                            }`}
                            style={active ? { backgroundColor: p.brand.chipVar, boxShadow: `0 0 0 2px ${p.brand.hue}` } : undefined}
                          >
                            <span
                              className="grid h-11 w-11 place-items-center rounded-module transition-colors"
                              style={{ backgroundColor: active ? p.brand.hue : p.brand.chipVar, color: active ? '#fff' : p.brand.hue }}
                            >
                              <p.icon className="h-5 w-5" />
                            </span>
                            <span className="text-[13px] font-extrabold text-sv-ink">{t(p.labelKey)}</span>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* ——— step 2 · location ——— */}
                {step === 1 && (
                  <div className="grid gap-5 sm:grid-cols-2">
                    <div>
                      <label className={label}>{t('search.city')} *</label>
                      <div className="flex flex-wrap gap-2">
                        {CITIES.map((c) => (
                          <button
                            key={c}
                            onClick={() => { setCity(c); setDistrict('') }}
                            className={`rounded-full px-4 py-2.5 text-[13px] font-extrabold transition-all duration-300 ${
                              city === c ? 'bg-sv-blue text-white shadow-glow-blue-sm' : 'border border-sv-ink/[0.08] bg-sv-surface text-sv-ink/60 hover:border-sv-blue/40 hover:text-sv-blue'
                            }`}
                          >
                            {c}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className={label}>{t('search.district')} *</label>
                      <input
                        className={`${input} ${err(!district)}`}
                        placeholder={t('add.districtPh')}
                        value={district}
                        onChange={(e) => setDistrict(e.target.value)}
                        list="district-list"
                      />
                      <datalist id="district-list">
                        {districts.map((d) => <option key={d} value={d} />)}
                      </datalist>
                    </div>
                    <div>
                      <label className={label}>{t('add.street')} *</label>
                      <input
                        className={`${input} ${err(!street)}`}
                        placeholder={t('add.streetPh')}
                        value={street}
                        onChange={(e) => setStreet(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className={label}>{t('add.houseNo')}</label>
                      <input className={input} value={houseNo} onChange={(e) => setHouseNo(e.target.value)} placeholder="47" />
                    </div>
                    <div className="sm:col-span-2">
                      <label className={label}>{t('add.cadastral')}</label>
                      <input
                        className={input}
                        placeholder={t('add.cadastralPh')}
                        value={cadastral}
                        onChange={(e) => setCadastral(e.target.value)}
                      />
                      <p className="mt-2 flex items-center gap-1.5 text-[12px] font-bold text-sv-ink/40">
                        <BadgeCheck className="h-3.5 w-3.5 text-sv-blue" /> {t('add.cadastralNote')}
                      </p>
                    </div>
                  </div>
                )}

                {/* ——— step 3 · details ——— */}
                {step === 2 && (
                  <div className="grid gap-6">
                    <div className="grid gap-5 sm:grid-cols-3">
                      <div>
                        <label className={label}>{t('search.area')} (მ²) *</label>
                        <div className="relative">
                          <Ruler className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-sv-ink/35" />
                          <input
                            className={`${input} pl-11 ${err(!areaN)}`}
                            inputMode="numeric"
                            placeholder="74"
                            value={area}
                            onChange={(e) => setArea(e.target.value.replace(/[^\d]/g, ''))}
                          />
                        </div>
                      </div>
                      <div>
                        <label className={label}>{t('spec.rooms')}</label>
                        <div className="flex items-center gap-2">
                          <button onClick={() => setRooms(Math.max(0, rooms - 1))} className="grid h-[52px] w-[52px] shrink-0 place-items-center rounded-control border border-sv-ink/[0.08] text-[20px] font-black text-sv-ink/50 transition-colors hover:border-sv-blue hover:text-sv-blue">−</button>
                          <div className="grid h-[52px] flex-1 place-items-center rounded-control border border-sv-ink/[0.08] bg-sv-surface text-[17px] font-black text-sv-ink">
                            <span className="flex items-center gap-2"><BedDouble className="h-4 w-4 text-sv-ink/35" />{rooms}</span>
                          </div>
                          <button onClick={() => setRooms(Math.min(12, rooms + 1))} className="grid h-[52px] w-[52px] shrink-0 place-items-center rounded-control border border-sv-ink/[0.08] text-[20px] font-black text-sv-ink/50 transition-colors hover:border-sv-blue hover:text-sv-blue">+</button>
                        </div>
                      </div>
                      <div>
                        <label className={label}>{t('spec.baths')}</label>
                        <div className="flex items-center gap-2">
                          <button onClick={() => setBaths(Math.max(1, baths - 1))} className="grid h-[52px] w-[52px] shrink-0 place-items-center rounded-control border border-sv-ink/[0.08] text-[20px] font-black text-sv-ink/50 transition-colors hover:border-sv-blue hover:text-sv-blue">−</button>
                          <div className="grid h-[52px] flex-1 place-items-center rounded-control border border-sv-ink/[0.08] bg-sv-surface text-[17px] font-black text-sv-ink">
                            <span className="flex items-center gap-2"><Bath className="h-4 w-4 text-sv-ink/35" />{baths}</span>
                          </div>
                          <button onClick={() => setBaths(Math.min(6, baths + 1))} className="grid h-[52px] w-[52px] shrink-0 place-items-center rounded-control border border-sv-ink/[0.08] text-[20px] font-black text-sv-ink/50 transition-colors hover:border-sv-blue hover:text-sv-blue">+</button>
                        </div>
                      </div>
                    </div>

                    <div className="grid gap-5 sm:grid-cols-2">
                      <div>
                        <label className={label}>{t('spec.floor')}</label>
                        <div className="relative">
                          <Layers className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-sv-ink/35" />
                          <input className={`${input} pl-11`} inputMode="numeric" placeholder="5" value={floor} onChange={(e) => setFloor(e.target.value.replace(/[^\d]/g, ''))} />
                        </div>
                      </div>
                      <div>
                        <label className={label}>{t('add.totalFloors')}</label>
                        <input className={input} inputMode="numeric" placeholder="12" value={totalFloors} onChange={(e) => setTotalFloors(e.target.value.replace(/[^\d]/g, ''))} />
                      </div>
                    </div>

                    <div>
                      <label className={label}>{t('add.condition')}</label>
                      <div className="flex flex-wrap gap-2">
                        {CONDITIONS.map((c) => (
                          <button
                            key={c}
                            onClick={() => setCondition(c)}
                            className={`rounded-full px-4 py-2.5 text-[13px] font-extrabold transition-all duration-300 ${
                              condition === c ? 'bg-sv-ink text-sv-cloud' : 'border border-sv-ink/[0.08] bg-sv-surface text-sv-ink/60 hover:border-sv-ink/30'
                            }`}
                          >
                            {t(c)}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className={label}>{t('add.status')}</label>
                      <div className="flex flex-wrap gap-2">
                        {STATUSES.map((s) => (
                          <button
                            key={s}
                            onClick={() => setStatus(s)}
                            className={`rounded-full px-4 py-2.5 text-[13px] font-extrabold transition-all duration-300 ${
                              status === s ? 'bg-sv-ink text-sv-cloud' : 'border border-sv-ink/[0.08] bg-sv-surface text-sv-ink/60 hover:border-sv-ink/30'
                            }`}
                          >
                            {t(s)}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className={label}>{t('add.features')}</label>
                      <div className="flex flex-wrap gap-2">
                        {FEATURES.map((f) => {
                          const on = features.includes(f)
                          return (
                            <button
                              key={f}
                              onClick={() => setFeatures(on ? features.filter((x) => x !== f) : [...features, f])}
                              className={`flex items-center gap-1.5 rounded-full px-4 py-2.5 text-[13px] font-extrabold transition-all duration-300 ${
                                on ? 'bg-sv-blue text-white shadow-glow-blue-sm' : 'border border-sv-ink/[0.08] bg-sv-surface text-sv-ink/60 hover:border-sv-blue/40 hover:text-sv-blue'
                              }`}
                            >
                              {on && <Check className="h-3.5 w-3.5" />}
                              {t(f)}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {/* ——— step 4 · photos ——— */}
                {step === 3 && (
                  <div>
                    <h2 className="text-[18px] font-extrabold text-sv-ink">{t('add.photosTitle')}</h2>
                    <button
                      onClick={() => fileRef.current?.click()}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => { e.preventDefault(); addPhotos(e.dataTransfer.files) }}
                      className="mt-4 flex w-full flex-col items-center gap-3 rounded-tile border-2 border-dashed border-sv-blue/25 bg-sv-blue/[0.03] px-6 py-12 text-center transition-all duration-300 hover:border-sv-blue/50 hover:bg-sv-blue/[0.06]"
                    >
                      <span className="grid h-14 w-14 place-items-center rounded-full bg-sv-blue text-white shadow-glow-blue-sm">
                        <ImagePlus className="h-6 w-6" />
                      </span>
                      <span className="text-[15px] font-extrabold text-sv-ink">{t('add.photosDrop')}</span>
                      <span className="text-[13px] font-bold text-sv-ink/40">{t('add.photosOr')}</span>
                      <span className="rounded-full bg-sv-blue px-6 py-2.5 text-[13px] font-extrabold text-white">{t('add.photosBtn')}</span>
                    </button>
                    <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={(e) => addPhotos(e.target.files)} />

                    <div className="mt-4 flex items-center justify-between text-[13px] font-bold text-sv-ink/45">
                      <span>{t('add.photosCount', { n: photos.length })}</span>
                    </div>

                    {photos.length > 0 && (
                      <div className="mt-3 grid grid-cols-3 gap-3 sm:grid-cols-4">
                        {photos.map((p, i) => (
                          <div key={p.url} className={`group/ph relative aspect-[4/3] overflow-hidden rounded-module ring-2 transition-all ${i === cover ? 'ring-sv-orange' : 'ring-transparent'}`}>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={p.url} alt={p.name} className="h-full w-full object-cover" />
                            {i === cover && (
                              <span className="absolute left-2 top-2 flex items-center gap-1 rounded-full bg-sv-orange px-2.5 py-1 text-[10px] font-black text-white">
                                <Star className="h-3 w-3 fill-current" /> {t('add.photosCover')}
                              </span>
                            )}
                            <div className="absolute inset-x-0 bottom-0 flex translate-y-full gap-1 bg-sv-navy/70 p-1.5 backdrop-blur transition-transform duration-300 group-hover/ph:translate-y-0">
                              {i !== cover && (
                                <button onClick={() => setCover(i)} className="flex-1 rounded-lg bg-white/15 px-2 py-1 text-[10px] font-bold text-white hover:bg-white/25">
                                  {t('add.photosSetCover')}
                                </button>
                              )}
                              <button
                                onClick={() => { setPhotos(photos.filter((_, j) => j !== i)); if (cover >= i && cover > 0) setCover(cover - 1) }}
                                className="grid w-7 place-items-center rounded-lg bg-white/15 text-white hover:bg-sv-orange"
                                aria-label={t('add.photosRemove')}
                              >
                                <X className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    <p className="mt-5 flex items-start gap-2 rounded-module bg-sv-blue/[0.05] p-4 text-[13px] font-semibold leading-relaxed text-sv-ink/55 ring-1 ring-inset ring-sv-blue/10">
                      <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-sv-blue" /> {t('add.photosTip')}
                    </p>

                    <div className="mt-5">
                      <label className={label}>{t('add.videoLink')}</label>
                      <div className="relative">
                        <Video className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-sv-ink/35" />
                        <input className={`${input} pl-11`} placeholder={t('add.videoPh')} value={video} onChange={(e) => setVideo(e.target.value)} />
                      </div>
                    </div>
                  </div>
                )}

                {/* ——— step 5 · price & description ——— */}
                {step === 4 && (
                  <div className="grid gap-6">
                    <div className="grid gap-5 sm:grid-cols-2">
                      <div>
                        <label className={label}>{t('add.price')} ($) *</label>
                        <input
                          className={`${input} text-[20px] font-black ${err(!priceN && !negotiable)}`}
                          inputMode="numeric"
                          placeholder={t('add.pricePh')}
                          value={price}
                          disabled={negotiable}
                          onChange={(e) => setPrice(e.target.value.replace(/[^\d]/g, ''))}
                        />
                        {priceN > 0 && areaN > 0 && (
                          <p className="mt-2 text-[13px] font-bold text-sv-ink/45">
                            {t('add.perM2', { v: formatUSD(Math.round(priceN / areaN)) })} · {formatGEL(priceN * USD_GEL)}
                          </p>
                        )}
                      </div>
                      <div className="flex items-end pb-1">
                        <button
                          onClick={() => setNegotiable(!negotiable)}
                          className={`flex items-center gap-2.5 rounded-control border px-4 py-3.5 text-[14px] font-extrabold transition-all duration-300 ${
                            negotiable ? 'border-transparent bg-sv-blue text-white shadow-glow-blue-sm' : 'border-sv-ink/[0.08] bg-sv-surface text-sv-ink/60 hover:border-sv-blue/40'
                          }`}
                        >
                          <span className={`grid h-5 w-5 place-items-center rounded-md border ${negotiable ? 'border-white bg-white/20' : 'border-sv-ink/20'}`}>
                            {negotiable && <Check className="h-3.5 w-3.5" />}
                          </span>
                          {t('add.negotiable')}
                        </button>
                      </div>
                    </div>

                    {/* AI estimate */}
                    <div className="overflow-hidden rounded-tile bg-gradient-to-r from-sv-blue/[0.07] to-sv-violet/[0.07] p-6 ring-1 ring-inset ring-sv-blue/15">
                      <div className="flex items-center gap-2.5">
                        <span className="grid h-9 w-9 place-items-center rounded-module bg-gradient-to-br from-sv-blue to-sv-violet text-white">
                          <Sparkles className="h-4 w-4" />
                        </span>
                        <div>
                          <div className="text-[14px] font-black text-sv-ink">{t('add.aiEstimate')}</div>
                          {estimate && <div className="text-[12px] font-bold text-sv-ink/45">{t('add.aiEstimateBody', { n: estimate.n })}</div>}
                        </div>
                      </div>
                      {estimate ? (
                        <div className="mt-5">
                          <div className="text-[12px] font-black uppercase tracking-wider text-sv-ink/45">{t('add.aiRange')}</div>
                          <div className="mt-1.5 flex flex-wrap items-baseline gap-2">
                            <span className="text-[26px] font-black tracking-tight text-sv-ink">{formatUSD(estimate.low)} — {formatUSD(estimate.high)}</span>
                            {verdict && (
                              <span
                                className="rounded-full px-3 py-1 text-[11px] font-black text-white"
                                style={{ backgroundColor: verdict === 'high' ? '#FF6A2D' : verdict === 'low' ? '#2E6BFF' : '#16A34A' }}
                              >
                                {t(`add.priceVerdict.${verdict}` as DictKey)}
                              </span>
                            )}
                          </div>
                          <button
                            onClick={() => { setPrice(String(estimate.mid)); setNegotiable(false) }}
                            className="mt-4 rounded-full bg-sv-blue px-6 py-2.5 text-[13px] font-extrabold text-white shadow-glow-blue-sm transition-all duration-300 hover:-translate-y-0.5"
                          >
                            {t('add.aiApply')} · {formatUSD(estimate.mid)}
                          </button>
                        </div>
                      ) : (
                        <p className="mt-4 text-[13px] font-semibold text-sv-ink/50">{t('add.aiNoData')}</p>
                      )}
                    </div>

                    {/* description */}
                    <div>
                      <div className="flex items-center justify-between">
                        <label className={label}>{t('add.description')}</label>
                        <button
                          onClick={aiWrite}
                          disabled={!propType || !city}
                          className="mb-2 flex items-center gap-1.5 rounded-full bg-gradient-to-r from-sv-blue to-sv-violet px-4 py-2 text-[12px] font-extrabold text-white transition-all duration-300 hover:-translate-y-0.5 hover:shadow-glow-blue-sm disabled:opacity-40 disabled:hover:translate-y-0"
                        >
                          <Sparkles className="h-3.5 w-3.5" /> {t('add.aiWrite')}
                        </button>
                      </div>
                      <textarea
                        className={`${input} min-h-[160px] resize-y leading-relaxed`}
                        placeholder={t('add.descPh')}
                        value={description}
                        maxLength={3000}
                        onChange={(e) => setDescription(e.target.value)}
                      />
                      <div className="mt-2 flex items-center justify-between text-[12px] font-bold text-sv-ink/40">
                        <span className="flex items-center gap-1.5">
                          {aiUsed && <><Sparkles className="h-3.5 w-3.5 text-sv-violet" /> {t('add.aiWritten')}</>}
                        </span>
                        <span>{t('add.descCount', { n: description.length })}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* ——— step 6 · contact ——— */}
                {step === 5 && (
                  <div className="grid gap-6">
                    <h2 className="text-[18px] font-extrabold text-sv-ink">{t('add.contact')}</h2>
                    <div className="grid gap-5 sm:grid-cols-2">
                      <div>
                        <label className={label}>{t('add.name')} *</label>
                        <div className="relative">
                          <User className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-sv-ink/35" />
                          <input className={`${input} pl-11 ${err(!name.trim())}`} placeholder={t('add.namePh')} value={name} onChange={(e) => setName(e.target.value)} />
                        </div>
                      </div>
                      <div>
                        <label className={label}>{t('add.phone')} *</label>
                        <div className="relative">
                          <Phone className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-sv-ink/35" />
                          <input className={`${input} pl-11 ${err(!PHONE_RE.test(phone))}`} placeholder={t('add.phonePh')} value={phone} onChange={(e) => setPhone(formatPhone(e.target.value))} />
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className={label}>{t('add.messengers')}</label>
                      <div className="flex flex-wrap gap-2">
                        {['WhatsApp', 'Viber', 'Telegram'].map((m) => {
                          const on = messengers.includes(m)
                          return (
                            <button
                              key={m}
                              onClick={() => setMessengers(on ? messengers.filter((x) => x !== m) : [...messengers, m])}
                              className={`flex items-center gap-2 rounded-full px-4 py-2.5 text-[13px] font-extrabold transition-all duration-300 ${
                                on ? 'bg-sv-blue text-white shadow-glow-blue-sm' : 'border border-sv-ink/[0.08] bg-sv-surface text-sv-ink/60 hover:border-sv-blue/40 hover:text-sv-blue'
                              }`}
                            >
                              <MessageCircle className="h-3.5 w-3.5" /> {m}
                            </button>
                          )
                        })}
                      </div>
                    </div>

                    <button
                      onClick={() => setTerms(!terms)}
                      className="flex items-start gap-3 rounded-module border border-sv-ink/[0.08] bg-sv-cloud/60 p-4 text-left transition-colors hover:border-sv-blue/30"
                    >
                      <span className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-md border transition-all ${terms ? 'border-sv-blue bg-sv-blue text-white' : 'border-sv-ink/25 bg-sv-surface'} ${touched && !terms ? 'border-sv-orange ring-4 ring-sv-orange/10' : ''}`}>
                        {terms && <Check className="h-3.5 w-3.5" />}
                      </span>
                      <span className="text-[13px] font-semibold leading-relaxed text-sv-ink/60">{t('add.terms')}</span>
                    </button>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>

            {/* footer nav */}
            <div className="mt-10 flex items-center justify-between border-t border-sv-ink/[0.06] pt-6">
              {step > 0 ? (
                <button onClick={() => go(-1)} className="flex items-center gap-2 rounded-full border border-sv-ink/10 bg-sv-surface px-6 py-3.5 text-[14px] font-extrabold text-sv-ink transition-all duration-300 hover:-translate-y-0.5 hover:shadow-card">
                  <ChevronLeft className="h-4 w-4" /> {t('add.back')}
                </button>
              ) : (
                <span className="flex items-center gap-2 text-[12px] font-bold text-sv-ink/35">
                  <Check className="h-3.5 w-3.5" /> {t('add.draftSaved')}
                </span>
              )}
              <div className="flex flex-col items-end gap-2">
                {touched && !stepValid && (
                  <span className="flex items-center gap-1.5 text-[12px] font-extrabold text-sv-orange">
                    <Flame className="h-3.5 w-3.5" /> {t('add.fillRequired')}
                  </span>
                )}
                {step < STEPS.length - 1 ? (
                  <button onClick={() => go(1)} className="rounded-full bg-sv-orange px-8 py-3.5 text-[14px] font-extrabold text-white shadow-glow-orange transition-all duration-300 hover:-translate-y-0.5 hover:shadow-glow-orange-lg">
                    {t('add.continue')}
                  </button>
                ) : (
                  <button
                    onClick={() => (stepValid ? setPublished(true) : setTouched(true))}
                    className="rounded-full bg-gradient-to-r from-sv-orange-light via-sv-orange to-sv-orange-deep px-8 py-3.5 text-[14px] font-extrabold text-white shadow-glow-orange transition-all duration-300 hover:-translate-y-0.5 hover:shadow-glow-orange-lg"
                  >
                    {t('add.publish')}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* ————— live preview column ————— */}
          <div className="sticky top-24 hidden lg:block">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <div className="text-[14px] font-black text-sv-ink">{t('add.preview')}</div>
                <div className="text-[12px] font-bold text-sv-ink/40">{t('add.previewHint')}</div>
              </div>
              <MapPin className="h-4 w-4 text-sv-ink/25" />
            </div>
            <div className="pointer-events-none [&>article]:w-full [&>article]:max-w-none">
              <ListingCard l={preview} layout="wide" animate={false} />
            </div>

            {/* strength meter */}
            <div className="mt-5 rounded-tile border border-sv-ink/[0.06] bg-sv-surface p-5 shadow-card">
              <div className="flex items-center justify-between">
                <span className="text-[13px] font-black text-sv-ink">{t('add.strength')}</span>
                <span className="text-[13px] font-black" style={{ color: strengthColor }}>{strength}%</span>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-sv-ink/[0.06]">
                <motion.div
                  className="h-full rounded-full"
                  style={{ backgroundColor: strengthColor }}
                  animate={{ width: `${strength}%` }}
                  transition={{ duration: 0.6, ease }}
                />
              </div>
              <p className="mt-2.5 text-[12px] font-bold text-sv-ink/45">{strengthLabel}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
