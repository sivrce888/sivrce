'use client'

/**
 * SIVRCE — Add Listing wizard (6 steps)
 * Type → Photos → Location → Details → Price & description → Contact.
 * Live preview, listing-strength meter, AI price estimate, AI description.
 * All colors come from locked tokens (BRAND.md §3/§3.1) — category icons
 * use CATEGORY_BRAND, actions use sv-orange, brand surfaces use sv-blue.
 */

import { useEffect, useMemo, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import {
  Building, Home, Briefcase, Map, Tag, KeyRound, CalendarClock,
  MapPin, Ruler, Layers, Check, ChevronLeft,
  ImagePlus, Star, X, Sparkles, Phone, User, MessageCircle,
  CircleCheckBig, Plus, Video, BadgeCheck, Flame, Trees, Hotel,
  CircleHelp, MonitorPlay,
} from 'lucide-react'
import { SparkMark } from '@/components/SparkMark'
import MapEmbed from '@/components/MapEmbed'
import { useI18n, type DictKey } from '@/lib/i18n/context'
import { CATEGORY_BRAND, DEAL_BRAND } from '@/lib/category-brand'
import { cap1, seoTitleParts } from '@/lib/seo-title'
import { FEATURE_KEYS } from '@/lib/features'
import {
  DEALS_FOR, dealLabelKey, fieldsFor, conditionsFor, statusesFor,
  projectsFor, floorTypesFor, RENT_PERIODS, RENT_TYPES, LAND_FEATURE_KEYS,
} from '@/lib/add-listing-fields'
import {
  CITIES, districtsOf, LISTINGS, USD_GEL, formatUSD, formatGEL,
  type DealType, type Listing, type PropType,
} from '@/data/listings'
import ListingCard from '@/components/ListingCard'
import LocationPicker, { locationLabel, type LocationValue } from '@/components/search/LocationPicker'
import { MAP_CENTER } from '@/lib/map/buildings'
import { cityCenter, splitStreetHouse, type GeocodeHit } from '@/lib/map/geocode'
import { canonicalizeDistrict } from '@/lib/district-canon'

type Deal = DealType
type Photo = { url: string; name: string; file: File }

const PROP_TYPES: { key: PropType; icon: typeof Building; brand: (typeof CATEGORY_BRAND)[keyof typeof CATEGORY_BRAND]; labelKey: DictKey; titleKey: DictKey }[] = [
  { key: 'apartment', icon: Building, brand: CATEGORY_BRAND.apartments, labelKey: 'prop.apartment', titleKey: 'prop.apartment' },
  { key: 'house', icon: Home, brand: CATEGORY_BRAND.houses, labelKey: 'prop.house', titleKey: 'prop.houseShort' },
  { key: 'villa', icon: Trees, brand: CATEGORY_BRAND.cottages, labelKey: 'prop.villa', titleKey: 'prop.villa' },
  { key: 'land', icon: Map, brand: CATEGORY_BRAND.land, labelKey: 'prop.land', titleKey: 'prop.land' },
  { key: 'commercial', icon: Briefcase, brand: CATEGORY_BRAND.commercial, labelKey: 'prop.commercial', titleKey: 'add.titleType.commercial' },
  { key: 'hotel', icon: Hotel, brand: CATEGORY_BRAND.hotels, labelKey: 'prop.hotel', titleKey: 'prop.hotel' },
]

const DEALS: { key: Deal; icon: typeof Tag; hue: string }[] = [
  { key: 'sale', icon: Tag, hue: DEAL_BRAND.sale },
  { key: 'rent', icon: KeyRound, hue: DEAL_BRAND.rent },
  { key: 'pledge', icon: BadgeCheck, hue: DEAL_BRAND.pledge },
  { key: 'daily', icon: CalendarClock, hue: DEAL_BRAND.daily },
]

const FEATURES = FEATURE_KEYS

const STEPS = ['add.step.type', 'add.step.photos', 'add.step.location', 'add.step.details', 'add.step.price', 'add.step.contact'] as const
const STEP_TIPS = ['add.tip.type', 'add.tip.photos', 'add.tip.location', 'add.tip.details', 'add.tip.price', 'add.tip.contact'] as const

/** rough market $/m² baselines for the AI estimate (display-only demo model) */
const BASE_M2: Record<PropType, number> = {
  apartment: 1150, house: 720, villa: 680, commercial: 1350, land: 95, hotel: 1100,
}
const CITY_MULT: Record<string, number> = { თბილისი: 1, ბათუმი: 0.9, ქუთაისი: 0.55, რუსთავი: 0.5 }

const ease = [0.21, 0.65, 0.2, 1] as const

const PHONE_RE = /^\+995 \d{3} \d{2} \d{2} \d{2}$/
const DRAFT_KEY = 'sivrce.add-listing.v1'

/** Normalize to `+995 XXX XX XX XX` while typing (9 digits after the forced prefix) */
const formatPhone = (raw: string): string => {
  let d = raw.replace(/\D/g, '')
  if (d.startsWith('995')) d = d.slice(3)
  d = d.slice(0, 9)
  const groups = [d.slice(0, 3), d.slice(3, 5), d.slice(5, 7), d.slice(7, 9)].filter(Boolean)
  return `+995${groups.length ? ` ${groups.join(' ')}` : ''}`
}

export default function AddListingClient() {
  const { t, lang } = useI18n()
  const { data: session } = useSession()
  const fileRef = useRef<HTMLInputElement>(null)
  const nameSeeded = useRef(false)

  const [step, setStep] = useState(0)
  const [touched, setTouched] = useState(false)
  const [publishedId, setPublishedId] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [failed, setFailed] = useState(false)

  const [deal, setDeal] = useState<Deal | null>(null)
  const [propType, setPropType] = useState<PropType | null>(null)
  const [city, setCity] = useState('')
  const [district, setDistrict] = useState('')
  const [locOpen, setLocOpen] = useState(false)
  const [street, setStreet] = useState('')
  const [houseNo, setHouseNo] = useState('')
  const [coords, setCoords] = useState<{ lat: number; lng: number }>({
    lat: MAP_CENTER.lat,
    lng: MAP_CENTER.lng,
  })
  const [geocoding, setGeocoding] = useState(false)
  const [pinReady, setPinReady] = useState(false)
  const [suggests, setSuggests] = useState<GeocodeHit[]>([])
  const [suggestOpen, setSuggestOpen] = useState(false)
  // ponytail: mute one geocode cycle after reverse-fill / suggest so pin↔address don't fight
  const muteGeocode = useRef(false)
  const [cadastral, setCadastral] = useState('')
  const [cadastralPublic, setCadastralPublic] = useState(false)
  const [area, setArea] = useState('')
  const [areaUnit, setAreaUnit] = useState<'m2' | 'ha'>('m2')
  const [yardArea, setYardArea] = useState('')
  const [rooms, setRooms] = useState(0)
  const [baths, setBaths] = useState(0)
  const [floor, setFloor] = useState('')
  const [totalFloors, setTotalFloors] = useState('')
  const [condition, setCondition] = useState<DictKey | ''>('')
  const [status, setStatus] = useState<DictKey | ''>('')
  const [project, setProject] = useState<DictKey | ''>('')
  const [floorType, setFloorType] = useState<DictKey | ''>('')
  const [kitchenArea, setKitchenArea] = useState('')
  const [features, setFeatures] = useState<DictKey[]>([])
  const [rentPeriod, setRentPeriod] = useState<number | null>(null)
  const [rentType, setRentType] = useState<DictKey | ''>('')
  const [guests, setGuests] = useState(0)
  const [photos, setPhotos] = useState<Photo[]>([])
  const [cover, setCover] = useState(0)
  const [video, setVideo] = useState('')
  const [matterport, setMatterport] = useState('')
  const [price, setPrice] = useState('')
  const [priceCur, setPriceCur] = useState<'USD' | 'GEL'>('USD')
  const [priceMode, setPriceMode] = useState<'total' | 'm2'>('total')
  const [negotiable, setNegotiable] = useState(false)
  const [exchangeable, setExchangeable] = useState(false)
  const [description, setDescription] = useState('')
  const [aiUsed, setAiUsed] = useState(false)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [phoneCode, setPhoneCode] = useState('')
  const [phoneVerified, setPhoneVerified] = useState(false)
  const [phoneBusy, setPhoneBusy] = useState(false)
  const [messengers, setMessengers] = useState<string[]>(['WhatsApp', 'Viber'])
  const [onlineView, setOnlineView] = useState(false)
  const [terms, setTerms] = useState(false)

  const areaN = (Number(area) || 0) * (areaUnit === 'ha' ? 10_000 : 1)
  const yardN = Number(yardArea) || 0
  const priceEntered = Number(price) || 0
  const priceTotalCur = priceMode === 'm2' && areaN > 0 ? priceEntered * areaN : priceEntered
  const priceN = priceCur === 'GEL' ? Math.round(priceTotalCur / USD_GEL) : Math.round(priceTotalCur)
  const formFields = deal && propType ? fieldsFor(propType, deal) : null
  const availableDeals = propType ? DEALS_FOR[propType] : DEALS.map((d) => d.key)
  const conditionOpts = propType && deal ? conditionsFor(propType, deal) : []
  const statusOpts = propType ? statusesFor(propType) : []
  const projectOpts = propType ? projectsFor(propType) : []
  const floorTypeOpts = propType ? floorTypesFor(propType) : []
  const featureOpts = (propType === 'land' ? LAND_FEATURE_KEYS : FEATURES).filter(
    (f) => f !== 'add.f.onlineView',
  )

  // ponytail: localStorage draft — photos are File blobs, not persisted; restore form only.
  const [draftReady, setDraftReady] = useState(false)
  const [draftSavedAt, setDraftSavedAt] = useState(0)

  /* eslint-disable react-hooks/set-state-in-effect -- one-time draft hydration from localStorage (external store) */
  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY)
      if (!raw) { setDraftReady(true); return }
      const d = JSON.parse(raw) as Record<string, unknown>
      if (d.v !== 1) { setDraftReady(true); return }
      if (typeof d.deal === 'string') setDeal(d.deal as Deal)
      if (typeof d.propType === 'string') setPropType(d.propType as PropType)
      if (typeof d.city === 'string') setCity(d.city)
      if (typeof d.district === 'string') setDistrict(d.district)
      if (typeof d.street === 'string') setStreet(d.street)
      if (typeof d.houseNo === 'string') setHouseNo(d.houseNo)
      if (typeof d.cadastral === 'string') setCadastral(d.cadastral)
      if (typeof d.cadastralPublic === 'boolean') setCadastralPublic(d.cadastralPublic)
      if (typeof d.area === 'string') setArea(d.area)
      if (d.areaUnit === 'm2' || d.areaUnit === 'ha') setAreaUnit(d.areaUnit)
      if (typeof d.yardArea === 'string') setYardArea(d.yardArea)
      if (typeof d.rooms === 'number') setRooms(d.rooms)
      if (typeof d.baths === 'number') setBaths(d.baths)
      if (typeof d.floor === 'string') setFloor(d.floor)
      if (typeof d.totalFloors === 'string') setTotalFloors(d.totalFloors)
      if (typeof d.condition === 'string') setCondition(d.condition as DictKey | '')
      if (typeof d.status === 'string') setStatus(d.status as DictKey | '')
      if (typeof d.project === 'string') setProject(d.project as DictKey | '')
      if (typeof d.floorType === 'string') setFloorType(d.floorType as DictKey | '')
      if (typeof d.kitchenArea === 'string') setKitchenArea(d.kitchenArea)
      if (Array.isArray(d.features)) {
        const feats = d.features.filter((x): x is DictKey => typeof x === 'string')
        setOnlineView(feats.includes('add.f.onlineView') || d.onlineView === true)
        setFeatures(feats.filter((f) => f !== 'add.f.onlineView'))
      } else if (typeof d.onlineView === 'boolean') {
        setOnlineView(d.onlineView)
      }
      if (typeof d.rentPeriod === 'number' || d.rentPeriod === null) setRentPeriod(d.rentPeriod as number | null)
      if (typeof d.rentType === 'string') setRentType(d.rentType as DictKey | '')
      if (typeof d.guests === 'number') setGuests(d.guests)
      if (typeof d.video === 'string') setVideo(d.video)
      if (typeof d.matterport === 'string') setMatterport(d.matterport)
      if (typeof d.price === 'string') setPrice(d.price)
      if (d.priceCur === 'USD' || d.priceCur === 'GEL') setPriceCur(d.priceCur)
      if (d.priceMode === 'total' || d.priceMode === 'm2') setPriceMode(d.priceMode)
      if (typeof d.negotiable === 'boolean') setNegotiable(d.negotiable)
      if (typeof d.exchangeable === 'boolean') setExchangeable(d.exchangeable)
      if (typeof d.description === 'string') setDescription(d.description)
      if (typeof d.name === 'string') setName(d.name)
      if (typeof d.phone === 'string') setPhone(d.phone)
      if (Array.isArray(d.messengers)) setMessengers(d.messengers.filter((x): x is string => typeof x === 'string'))
      if (typeof d.terms === 'boolean') setTerms(d.terms)
      if (typeof d.step === 'number' && d.step >= 0 && d.step <= 5) setStep(d.step)
      if (d.coords && typeof d.coords === 'object') {
        const c = d.coords as { lat?: unknown; lng?: unknown }
        if (typeof c.lat === 'number' && typeof c.lng === 'number') {
          setCoords({ lat: c.lat, lng: c.lng })
          setPinReady(true)
        }
      }
    } catch { /* corrupt draft — start fresh */ }
    setDraftReady(true)
  }, [])
  /* eslint-enable react-hooks/set-state-in-effect */

  // Seed contact name from session once (after draft restore). Skip phone — not on session JWT.
  /* eslint-disable react-hooks/set-state-in-effect -- seed name once from async session */
  useEffect(() => {
    if (!draftReady || nameSeeded.current) return
    if (name.trim()) { nameSeeded.current = true; return }
    const n = session?.user?.name?.trim()
    if (!n) return
    setName(n)
    nameSeeded.current = true
  }, [draftReady, session?.user?.name, name])
  /* eslint-enable react-hooks/set-state-in-effect */

  useEffect(() => {
    if (!draftReady || publishedId) return
    const t = window.setTimeout(() => {
      try {
        localStorage.setItem(DRAFT_KEY, JSON.stringify({
          v: 1, step, deal, propType, city, district, street, houseNo, coords,
          cadastral, cadastralPublic, area, areaUnit, yardArea, rooms, baths,
          floor, totalFloors, condition, status, project, floorType, kitchenArea, features, rentPeriod, rentType,
          guests, video, matterport, price, priceCur, priceMode, negotiable,
          exchangeable, description, name, phone, messengers, onlineView, terms,
        }))
        setDraftSavedAt(Date.now())
      } catch { /* quota / private mode */ }
    }, 500)
    return () => window.clearTimeout(t)
  }, [
    draftReady, publishedId, step, deal, propType, city, district, street, houseNo,
    coords, cadastral, cadastralPublic, area, areaUnit, yardArea, rooms, baths,
    floor, totalFloors, condition, status, project, floorType, kitchenArea, features, rentPeriod, rentType, guests,
    video, matterport, price, priceCur, priceMode, negotiable, exchangeable,
    description, name, phone, messengers, onlineView, terms,
  ])

  const pickDeal = (d: Deal) => {
    setDeal(d)
    setCondition('')
    setStatus('')
    setProject('')
    setFloorType('')
    setRentPeriod(null)
    setRentType('')
    setGuests(0)
    setExchangeable(false)
  }
  const pickProp = (p: PropType) => {
    setPropType(p)
    setCondition('')
    setStatus('')
    setProject('')
    setFloorType('')
    setKitchenArea('')
    setAreaUnit('m2')
    setYardArea('')
    setFeatures([])
    if (deal && !DEALS_FOR[p].includes(deal)) setDeal(null)
  }

  // City → map center until street geocode lands.
  /* eslint-disable react-hooks/set-state-in-effect -- city change re-centers the pin until geocode lands */
  useEffect(() => {
    if (!city || street.trim().length >= 2) return
    setCoords(cityCenter(city))
    setPinReady(false)
  }, [city, street])
  /* eslint-enable react-hooks/set-state-in-effect */

  // Address → pin (structured geocode). House № → building-level zoom.
  useEffect(() => {
    if (muteGeocode.current) {
      muteGeocode.current = false
      return
    }
    if (!city || street.trim().length < 2) return
    const ac = new AbortController()
    const params = new URLSearchParams({
      street: street.trim(),
      city,
      ...(houseNo.trim() ? { houseNo: houseNo.trim() } : {}),
      ...(district.trim() ? { district: district.trim() } : {}),
    })
    const t = setTimeout(() => {
      setGeocoding(true)
      fetch(`/api/geocode?${params}`, { signal: ac.signal })
        .then((r) => (r.ok ? r.json() : null))
        .then((d: GeocodeHit & { ok?: boolean } | null) => {
          if (d?.ok && typeof d.lat === 'number' && typeof d.lng === 'number') {
            setCoords({ lat: d.lat, lng: d.lng })
            setPinReady(true)
            // Soft-fill blanks from OSM; mute so we don't re-fire.
            if ((d.houseNo && !houseNo.trim()) || (d.district && !district.trim())) {
              muteGeocode.current = true
              if (d.houseNo && !houseNo.trim()) setHouseNo(d.houseNo)
              if (d.district && !district.trim()) setDistrict(d.district)
            }
          }
        })
        .catch(() => {})
        .finally(() => setGeocoding(false))
    }, 400)
    return () => {
      clearTimeout(t)
      ac.abort()
    }
  }, [street, houseNo, district, city])

  // Street autocomplete (Nominatim suggest).
  useEffect(() => {
    if (!city || street.trim().length < 2) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- reset suggestions when input drops below min length
      setSuggests([])
      return
    }
    const ac = new AbortController()
    const t = setTimeout(() => {
      const params = new URLSearchParams({
        suggest: '1',
        q: street.trim(),
        city,
      })
      fetch(`/api/geocode?${params}`, { signal: ac.signal })
        .then((r) => (r.ok ? r.json() : null))
        .then((d: { ok?: boolean; hits?: GeocodeHit[] } | null) => {
          if (d?.ok && Array.isArray(d.hits)) setSuggests(d.hits)
        })
        .catch(() => {})
    }, 280)
    return () => {
      clearTimeout(t)
      ac.abort()
    }
  }, [street, city])

  const applyLocation = (v: LocationValue) => {
    setCity(v.city)
    // Municipalities without ubani: district = city (search still filters).
    const next =
      canonicalizeDistrict(v.district, v.city) ||
      v.district ||
      (v.city && districtsOf(v.city).length === 0 ? v.city : '')
    setDistrict(next)
    if (v.street.trim()) setStreet(v.street.trim())
    setLocOpen(false)
  }

  const setDistrictCanon = (raw: string, cityHint?: string) => {
    const c = cityHint || city
    setDistrict(canonicalizeDistrict(raw, c) || raw)
  }

  const applyHit = (hit: GeocodeHit) => {
    muteGeocode.current = true
    setCoords({ lat: hit.lat, lng: hit.lng })
    setPinReady(true)
    setSuggestOpen(false)
    setSuggests([])
    if (hit.street) setStreet(hit.street)
    if (hit.houseNo) setHouseNo(hit.houseNo)
    if (hit.city && CITIES.includes(hit.city)) setCity(hit.city)
    if (hit.district) setDistrictCanon(hit.district, hit.city)
  }

  const onStreetChange = (raw: string) => {
    const split = splitStreetHouse(raw)
    // If user typed "Street 47" into street field, peel house № into its box.
    if (split.houseNo && split.street !== raw.trim()) {
      setStreet(split.street)
      setHouseNo(split.houseNo)
    } else {
      setStreet(raw)
    }
    setSuggestOpen(true)
  }

  const onMapPick = (lat: number, lng: number) => {
    setCoords({ lat, lng })
    setPinReady(true)
    setSuggestOpen(false)
    fetch(`/api/geocode?lat=${lat}&lng=${lng}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d: (GeocodeHit & { ok?: boolean }) | null) => {
        if (!d?.ok) return
        muteGeocode.current = true
        if (d.street) setStreet(d.street)
        if (d.houseNo) setHouseNo(d.houseNo)
        if (d.city && CITIES.includes(d.city)) setCity(d.city)
        if (d.district) setDistrictCanon(d.district, d.city)
      })
      .catch(() => {})
  }

  const mapZoom = houseNo.trim() ? 18 : street.trim() ? 16 : 13

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
      !!deal && !!propType,
      !!(city && district && street),
      areaN > 0,
      !formFields?.rooms || rooms > 0,
      !formFields?.condition || !!condition,
      !!status,
      features.length >= 3,
      photos.length >= 1,
      photos.length >= 5,
      priceN > 0 || negotiable,
      description.length >= 80,
      !!(video || matterport),
      onlineView,
      PHONE_RE.test(phone),
    ]
    return Math.round((signals.filter(Boolean).length / signals.length) * 100)
  }, [deal, propType, city, district, street, areaN, rooms, condition, status, features, photos, priceN, negotiable, description, video, matterport, onlineView, phone, formFields])

  const detailsOk = !!formFields && areaN > 0
    && (!formFields.rooms || rooms > 0)
    && (!formFields.guests || guests > 0)
    && !!status

  const stepValid = [
    !!deal && !!propType,
    photos.length >= 1,
    !!(city && district && street),
    detailsOk,
    priceN > 0 || negotiable,
    !!(name.trim() && PHONE_RE.test(phone) && terms),
  ][step]

  const propLabel = propType ? t(PROP_TYPES.find((p) => p.key === propType)!.labelKey) : ''
  /* SEO title: deal + rooms + type + locative place — "იყიდება 2-ოთახიანი ბინა ჭავჭავაძეზე ვაკეში" */
  const titleLabel = propType ? t(PROP_TYPES.find((p) => p.key === propType)!.titleKey) : ''
  const dealLabel = deal ? t(dealLabelKey(deal, propType)) : ''
  const { deal: dealWord, where } = seoTitleParts({ lang, deal, dealLabel, street, district, city })
  const autoTitle = !propType
    ? t('add.previewTitle')
    : cap1(
        t(rooms > 0 && propType !== 'land' ? 'add.autoTitle.rooms' : 'add.autoTitle.simple', {
          deal: dealWord, rooms, type: titleLabel, where,
        }),
      )

  const coverUrl = photos[cover]?.url
  const preview: Listing | null = coverUrl
    ? {
        id: LISTINGS[0].id, // real id so Link prefetch doesn't 404 (card is pointer-events-none anyway)
        img: coverUrl,
        images: photos.map((p) => p.url),
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
        description, coords,
        postedAt: new Date().toISOString(),
        agent: { name: name || '—', phone: phone || '—', agency: '' },
        isNew: true,
      }
    : null

  const addPhotos = (files: FileList | null) => {
    if (!files) return
    const next = [...photos]
    for (const f of Array.from(files)) {
      if (next.length >= 16) break
      next.push({ url: URL.createObjectURL(f), name: f.name, file: f })
    }
    setPhotos(next)
  }

  const removePhoto = (i: number) => {
    const p = photos[i]
    if (p) URL.revokeObjectURL(p.url)
    setPhotos(photos.filter((_, j) => j !== i))
    if (cover >= i && cover > 0) setCover(cover - 1)
  }

  /* drag-to-reorder: cover index follows its photo */
  const [dragFrom, setDragFrom] = useState<number | null>(null)
  const movePhoto = (from: number | null, to: number) => {
    if (from === null || from === to) return
    const next = photos.slice()
    const [moved] = next.splice(from, 1)
    if (!moved) return
    next.splice(to, 0, moved)
    setPhotos(next)
    if (cover === from) setCover(to)
    else if (from < cover && to >= cover) setCover(cover - 1)
    else if (from > cover && to <= cover) setCover(cover + 1)
  }

  const aiWrite = () => {
    if (!propType || !city) return
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

  /* ————— publish: photos → R2, then POST /api/listings ————— */
  const publish = async () => {
    if (!stepValid || photos.length < 1) { setTouched(true); return }
    setBusy(true)
    setFailed(false)
    try {
      // Cover photo must upload first — the listing hero is images[0].
      const coverPhoto = photos[cover]
      const ordered = coverPhoto ? [coverPhoto, ...photos.filter((p) => p !== coverPhoto)] : photos
      const images = await Promise.all(
        ordered.map(async (p) => {
          const fd = new FormData()
          fd.append('file', p.file)
          const r = await fetch('/api/upload', { method: 'POST', body: fd })
          if (!r.ok) throw new Error('upload')
          return ((await r.json()) as { url: string }).url
        }),
      )
      const res = await fetch('/api/listings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: autoTitle,
          deal, propType, city, district,
          address: `${street} ${houseNo}`.trim(),
          cadastral: cadastral || null,
          cadastralPublic,
          area: areaN, rooms: formFields?.rooms ? rooms : 0, baths: formFields?.baths ? baths : 0,
          floor: formFields?.floor ? Number(floor) || null : null,
          totalFloors: formFields?.totalFloors ? Number(totalFloors) || null : null,
          condition: formFields?.condition ? condition || null : null,
          buildingStatus: status || null,
          project: formFields?.project ? project || null : null,
          floorType: formFields?.floorType ? floorType || null : null,
          kitchenArea: formFields?.kitchen ? (Number(kitchenArea) || null) : null,
          features: onlineView
            ? [...features.filter((f) => f !== 'add.f.onlineView'), 'add.f.onlineView']
            : features.filter((f) => f !== 'add.f.onlineView'),
          images, video: video || null, matterport: matterport || null,
          price: priceN, currency: 'USD', negotiable, exchangeable: formFields?.exchange ? exchangeable : false,
          description,
          yardArea: formFields?.yard ? yardN || null : null,
          rentPeriod: formFields?.rentPeriod ? rentPeriod : null,
          rentType: formFields?.rentType ? rentType || null : null,
          guests: formFields?.guests ? guests || null : null,
          areaUnit: formFields?.areaHa && areaUnit === 'ha' ? 'ha' : 'm2',
          onlineView,
          name: name.trim(), phone, messengers,
          lat: coords.lat, lng: coords.lng,
        }),
      })
      if (res.status === 401) {
        window.location.href = '/auth/signin?callbackUrl=/add-listing'
        return
      }
      if (!res.ok) throw new Error('publish')
      const data = (await res.json()) as { id?: string }
      try { localStorage.removeItem(DRAFT_KEY) } catch { /* ignore */ }
      setPublishedId(data.id ?? 'ok')
    } catch {
      setFailed(true)
    } finally {
      setBusy(false)
    }
  }

  /* ————— shared field styles ————— */
  const input =
    'w-full rounded-control border border-sv-ink/[0.08] bg-sv-surface px-4 py-3.5 text-[15px] font-semibold text-sv-ink placeholder:text-sv-ink/35 outline-none transition-all focus:border-sv-blue focus:ring-4 focus:ring-sv-blue/10'
  const label = 'mb-2 block text-[13px] font-extrabold text-sv-ink/70'
  const err = (bad: boolean) => (touched && bad ? 'border-sv-orange ring-4 ring-sv-orange/10' : '')

  /* ————— success screen ————— */
  if (publishedId) {
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
              href={publishedId === 'ok' ? '/seller/listings' : `/listing/${publishedId}`}
              className="rounded-full bg-sv-orange px-8 py-4 text-[15px] font-extrabold text-white shadow-glow-orange transition-all duration-300 hover:-translate-y-0.5 hover:shadow-glow-orange-lg"
            >
              {t('add.successViewListing')}
            </Link>
            <button
              onClick={() => {
                try { localStorage.removeItem(DRAFT_KEY) } catch { /* ignore */ }
                setPublishedId(null); setStep(0); setPhotos([]); setPrice(''); setDescription(''); setTouched(false); setDraftSavedAt(0)
              }}
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
            <div className="mb-6 flex items-start gap-3 rounded-tile border border-sv-blue/15 bg-sv-blue/[0.04] p-4 lg:hidden">
              <CircleHelp className="mt-0.5 h-4 w-4 shrink-0 text-sv-blue" />
              <p className="text-[13px] font-semibold leading-relaxed text-sv-ink/60">{t(STEP_TIPS[step])}</p>
            </div>
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
                    <h2 className="text-[13px] font-black uppercase tracking-wider text-sv-ink/45">{t('add.propType')}</h2>
                    <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
                      {PROP_TYPES.map((p) => {
                        const active = propType === p.key
                        return (
                          <button
                            key={p.key}
                            onClick={() => pickProp(p.key)}
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

                    <h2 className="mt-8 text-[13px] font-black uppercase tracking-wider text-sv-ink/45">{t('add.dealType')}</h2>
                    <div className={`mt-3 grid gap-3 ${availableDeals.length === 3 ? 'grid-cols-3' : 'grid-cols-2 sm:grid-cols-4'}`}>
                      {DEALS.filter((d) => availableDeals.includes(d.key)).map((d) => {
                        const active = deal === d.key
                        return (
                          <button
                            key={d.key}
                            onClick={() => pickDeal(d.key)}
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
                            <span className="text-center text-[13px] font-extrabold text-sv-ink">{t(dealLabelKey(d.key, propType))}</span>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* ——— step 2 · photos ——— */}
                {step === 1 && (
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
                          <div
                            key={p.url}
                            draggable
                            onDragStart={() => setDragFrom(i)}
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={(e) => { e.preventDefault(); movePhoto(dragFrom, i) }}
                            title={t('add.photosReorder')}
                            className={`group/ph relative aspect-[4/3] cursor-grab overflow-hidden rounded-module ring-2 transition-all active:cursor-grabbing ${i === cover ? 'ring-sv-orange' : 'ring-transparent'} ${dragFrom !== null && dragFrom !== i ? 'hover:ring-sv-blue/60' : ''}`}
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={p.url} alt={p.name} className="pointer-events-none h-full w-full object-cover" draggable={false} />
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
                                onClick={() => removePhoto(i)}
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
                    {touched && photos.length < 1 && (
                      <p className="mt-3 flex items-center gap-1.5 text-[13px] font-extrabold text-sv-orange">
                        <Flame className="h-3.5 w-3.5" /> {t('add.photosRequired')}
                      </p>
                    )}

                    <div className="mt-5 grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className={label}>{t('add.youtube')}</label>
                        <div className="relative">
                          <Video className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-sv-ink/35" />
                          <input className={`${input} pl-11`} placeholder={t('add.youtubePh')} value={video} onChange={(e) => setVideo(e.target.value)} />
                        </div>
                      </div>
                      <div>
                        <label className={label}>{t('add.matterport')}</label>
                        <div className="relative">
                          <Video className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-sv-ink/35" />
                          <input className={`${input} pl-11`} placeholder={t('add.matterportPh')} value={matterport} onChange={(e) => setMatterport(e.target.value)} />
                        </div>
                      </div>
                    </div>
                    <p className="mt-4 flex items-start gap-2 rounded-module bg-sv-orange/[0.06] p-4 text-[13px] font-semibold leading-relaxed text-sv-ink/55 ring-1 ring-inset ring-sv-orange/15">
                      <MonitorPlay className="mt-0.5 h-4 w-4 shrink-0 text-sv-orange" /> {t('add.videoTip')}
                    </p>
                  </div>
                )}

                {/* ——— step 3 · location ——— */}
                {step === 2 && (
                  <div className="grid gap-5 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                      <label className={label}>{t('search.city')} / {t('search.district')} *</label>
                      <button
                        type="button"
                        onClick={() => setLocOpen(true)}
                        className={`flex h-12 w-full items-center gap-2.5 rounded-control border bg-sv-surface px-3.5 text-left text-[14px] font-bold transition-colors ${
                          !city || !district
                            ? 'border-sv-orange/50 text-sv-ink'
                            : 'border-sv-ink/10 text-sv-ink hover:border-sv-blue/40'
                        }`}
                      >
                        <MapPin className={`h-4 w-4 shrink-0 ${city ? 'text-sv-blue' : 'text-sv-ink/35'}`} />
                        <span className={city ? 'text-sv-ink' : 'text-sv-ink/35'}>
                          {locationLabel({ city, district, street: '' })}
                        </span>
                      </button>
                      <LocationPicker
                        open={locOpen}
                        value={{ city, district, street: '' }}
                        onClose={() => setLocOpen(false)}
                        onApply={applyLocation}
                      />
                    </div>
                    <div className="relative">
                      <label className={label}>{t('add.street')} *</label>
                      <input
                        className={`${input} ${err(!street)}`}
                        placeholder={t('add.streetPh')}
                        value={street}
                        onChange={(e) => onStreetChange(e.target.value)}
                        onFocus={() => setSuggestOpen(true)}
                        onBlur={() => {
                          // let suggestion click land first
                          setTimeout(() => setSuggestOpen(false), 150)
                        }}
                        autoComplete="street-address"
                      />
                      {suggestOpen && suggests.length > 0 && (
                        <ul
                          role="listbox"
                          className="absolute z-20 mt-1 max-h-56 w-full overflow-auto rounded-module border border-sv-ink/10 bg-sv-surface py-1 shadow-card"
                        >
                          {suggests.map((s) => (
                            <li key={`${s.lat}:${s.lng}:${s.label}`}>
                              <button
                                type="button"
                                role="option"
                                aria-selected={false}
                                className="flex w-full flex-col gap-0.5 px-3.5 py-2.5 text-left transition hover:bg-sv-blue/8"
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => applyHit(s)}
                              >
                                <span className="text-[13px] font-extrabold text-sv-ink">
                                  {[s.street, s.houseNo].filter(Boolean).join(' ') || s.label.split(',')[0]}
                                </span>
                                <span className="text-[11px] font-bold text-sv-ink/45">
                                  {[s.district, s.city].filter(Boolean).join(' · ') || s.label}
                                </span>
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}
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
                      {cadastral.trim() && (
                        <button
                          type="button"
                          onClick={() => setCadastralPublic(!cadastralPublic)}
                          className={`mt-3 flex items-center gap-2.5 rounded-control border px-4 py-3 text-[13px] font-extrabold transition-all ${
                            !cadastralPublic
                              ? 'border-transparent bg-sv-ink text-sv-cloud'
                              : 'border-sv-ink/[0.08] bg-sv-surface text-sv-ink/60'
                          }`}
                        >
                          <span className={`grid h-5 w-5 place-items-center rounded-md border ${!cadastralPublic ? 'border-white/40 bg-white/15' : 'border-sv-ink/20'}`}>
                            {!cadastralPublic && <Check className="h-3.5 w-3.5" />}
                          </span>
                          {t('add.cadastralHide')}
                        </button>
                      )}
                    </div>
                    {city && (
                      <div className="sm:col-span-2">
                        <div className="mb-2 flex items-center justify-between gap-3">
                          <label className={label + ' mb-0'}>
                            <span className="inline-flex items-center gap-1.5">
                              <MapPin className="h-3.5 w-3.5 text-sv-orange" />
                              Sivrce Maps
                            </span>
                          </label>
                          <span className="text-[11px] font-bold tabular-nums text-sv-ink/40">
                            {geocoding
                              ? 'მისამართი…'
                              : pinReady
                                ? `${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)}`
                                : 'შეიყვანე ქუჩა — პინი ავტომატურად'}
                          </span>
                        </div>
                        <MapEmbed
                          lat={coords.lat}
                          lng={coords.lng}
                          zoom={mapZoom}
                          q={[street && `${street} ${houseNo}`.trim(), district, city]
                            .filter(Boolean)
                            .join(', ')}
                          aspect="16/9"
                          highlight
                          onPick={onMapPick}
                        />
                        <p className="mt-2 text-[11px] font-bold text-sv-ink/40">
                          პინი და შენობა ავტომატურად · ან დააჭირე რუკას — შენობაზე მონიშვნისთვის
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* ——— step 4 · details ——— */}
                {step === 3 && formFields && (
                  <div className="grid gap-6">
                    {formFields.rentPeriod && (
                      <div>
                        <label className={label}>{t('add.rentPeriod')}</label>
                        <div className="flex flex-wrap gap-2">
                          {RENT_PERIODS.map((n) => (
                            <button
                              key={n}
                              onClick={() => setRentPeriod(n)}
                              className={`rounded-full px-4 py-2.5 text-[13px] font-extrabold transition-all duration-300 ${
                                rentPeriod === n ? 'bg-sv-ink text-sv-cloud' : 'border border-sv-ink/[0.08] bg-sv-surface text-sv-ink/60 hover:border-sv-ink/30'
                              }`}
                            >
                              {t('add.rentPeriod.n', { n })}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {formFields.rentType && (
                      <div>
                        <label className={label}>{t('add.rentType')}</label>
                        <div className="flex flex-wrap gap-2">
                          {RENT_TYPES.map((k) => (
                            <button
                              key={k}
                              onClick={() => setRentType(k)}
                              className={`rounded-full px-4 py-2.5 text-[13px] font-extrabold transition-all duration-300 ${
                                rentType === k ? 'bg-sv-ink text-sv-cloud' : 'border border-sv-ink/[0.08] bg-sv-surface text-sv-ink/60 hover:border-sv-ink/30'
                              }`}
                            >
                              {t(k)}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {formFields.guests && (
                      <div>
                        <label className={label}>{t('add.guests')}</label>
                        <div className="flex flex-wrap gap-2">
                          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                            <button
                              key={n}
                              onClick={() => setGuests(n)}
                              className={`rounded-full px-4 py-2.5 text-[13px] font-extrabold transition-all duration-300 ${
                                guests === n ? 'bg-sv-ink text-sv-cloud' : 'border border-sv-ink/[0.08] bg-sv-surface text-sv-ink/60 hover:border-sv-ink/30'
                              }`}
                            >
                              {n === 10 ? '10+' : n}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {statusOpts.length > 0 && (
                      <div>
                        <label className={label}>{t('add.status')} *</label>
                        <div className={`flex flex-wrap gap-2 rounded-control p-1 ${touched && !status ? 'ring-4 ring-sv-orange/10' : ''}`}>
                          {statusOpts.map((s) => (
                            <button
                              key={s}
                              type="button"
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
                    )}

                    {formFields.condition && conditionOpts.length > 0 && (
                      <div>
                        <label className={label}>{t('add.condition')}</label>
                        <div className="flex flex-wrap gap-2">
                          {conditionOpts.map((c) => (
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
                    )}

                    {formFields.project && projectOpts.length > 0 && (
                      <div>
                        <label className={label}>{t('add.project')}</label>
                        <p className="mb-2 text-[12px] font-semibold text-sv-ink/45">{t('add.projectHint')}</p>
                        <div className="flex flex-wrap gap-2">
                          {projectOpts.map((p) => (
                            <button
                              key={p}
                              type="button"
                              onClick={() => setProject(project === p ? '' : p)}
                              className={`rounded-full px-4 py-2.5 text-[13px] font-extrabold transition-all duration-300 ${
                                project === p ? 'bg-sv-blue text-white shadow-glow-blue-sm' : 'border border-sv-ink/[0.08] bg-sv-surface text-sv-ink/60 hover:border-sv-blue/40 hover:text-sv-blue'
                              }`}
                            >
                              {t(p)}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {formFields.floorType && floorTypeOpts.length > 0 && (
                      <div>
                        <label className={label}>{t('add.floorType')}</label>
                        <div className="flex flex-wrap gap-2">
                          {floorTypeOpts.map((ft) => (
                            <button
                              key={ft}
                              type="button"
                              onClick={() => setFloorType(floorType === ft ? '' : ft)}
                              className={`rounded-full px-4 py-2.5 text-[13px] font-extrabold transition-all duration-300 ${
                                floorType === ft ? 'bg-sv-ink text-sv-cloud' : 'border border-sv-ink/[0.08] bg-sv-surface text-sv-ink/60 hover:border-sv-ink/30'
                              }`}
                            >
                              {t(ft)}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="grid gap-5">
                      <div>
                        <label className={label}>
                          {t('search.area')} ({formFields.areaHa ? (areaUnit === 'ha' ? t('add.areaUnit.ha') : t('add.areaUnit.m2')) : t('add.areaUnit.m2')}) *
                        </label>
                        <div className="relative max-w-xs">
                          <Ruler className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-sv-ink/35" />
                          <input
                            className={`${input} pl-11 ${err(!areaN)}`}
                            inputMode="decimal"
                            placeholder={formFields.areaHa && areaUnit === 'ha' ? '0.5' : '74'}
                            value={area}
                            onChange={(e) => setArea(e.target.value.replace(/[^\d.]/g, ''))}
                          />
                        </div>
                        {formFields.areaHa && (
                          <div className="mt-2 flex gap-2">
                            {(['m2', 'ha'] as const).map((u) => (
                              <button
                                key={u}
                                type="button"
                                onClick={() => setAreaUnit(u)}
                                className={`rounded-full px-3 py-1.5 text-[12px] font-extrabold ${
                                  areaUnit === u ? 'bg-sv-blue text-white' : 'border border-sv-ink/[0.08] text-sv-ink/55'
                                }`}
                              >
                                {t(u === 'ha' ? 'add.areaUnit.ha' : 'add.areaUnit.m2')}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                      {formFields.kitchen && (
                        <div>
                          <label className={label}>{t('add.kitchenArea')} ({t('add.areaUnit.m2')})</label>
                          <input
                            className={`${input} max-w-xs`}
                            inputMode="decimal"
                            placeholder="12"
                            value={kitchenArea}
                            onChange={(e) => setKitchenArea(e.target.value.replace(/[^\d.]/g, ''))}
                          />
                        </div>
                      )}
                      {formFields.rooms && (
                        <div>
                          <label className={label}>{t('spec.rooms')} *</label>
                          <div className={`flex flex-wrap gap-2 ${touched && !rooms ? 'rounded-control ring-4 ring-sv-orange/10' : ''}`}>
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                              <button
                                key={n}
                                type="button"
                                onClick={() => setRooms(n)}
                                className={`min-w-[44px] rounded-full px-3.5 py-2.5 text-[13px] font-extrabold transition-all ${
                                  rooms === n ? 'bg-sv-ink text-sv-cloud' : 'border border-sv-ink/[0.08] bg-sv-surface text-sv-ink/60 hover:border-sv-ink/30'
                                }`}
                              >
                                {n === 10 ? '10+' : n}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                      {formFields.baths && (
                        <div>
                          <label className={label}>{t('spec.baths')}</label>
                          <div className="flex flex-wrap gap-2">
                            {[1, 2, 3, 4, 5].map((n) => (
                              <button
                                key={n}
                                type="button"
                                onClick={() => setBaths(n)}
                                className={`min-w-[44px] rounded-full px-3.5 py-2.5 text-[13px] font-extrabold transition-all ${
                                  baths === n ? 'bg-sv-ink text-sv-cloud' : 'border border-sv-ink/[0.08] bg-sv-surface text-sv-ink/60 hover:border-sv-ink/30'
                                }`}
                              >
                                {n === 5 ? '5+' : n}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {formFields.yard && (
                      <div>
                        <label className={label}>{t('add.yard')} (მ²)</label>
                        <input
                          className={input}
                          inputMode="numeric"
                          placeholder="120"
                          value={yardArea}
                          onChange={(e) => setYardArea(e.target.value.replace(/[^\d]/g, ''))}
                        />
                      </div>
                    )}

                    {(formFields.floor || formFields.totalFloors) && (
                      <div className={`grid gap-5 ${formFields.floor ? 'sm:grid-cols-2' : ''}`}>
                        {formFields.floor && (
                          <div>
                            <label className={label}>{t('spec.floor')}</label>
                            <div className="relative">
                              <Layers className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-sv-ink/35" />
                              <input className={`${input} pl-11`} inputMode="numeric" placeholder="5" value={floor} onChange={(e) => setFloor(e.target.value.replace(/[^\d]/g, ''))} />
                            </div>
                          </div>
                        )}
                        {formFields.totalFloors && (
                          <div>
                            <label className={label}>{t('add.totalFloors')}</label>
                            <input className={input} inputMode="numeric" placeholder="12" value={totalFloors} onChange={(e) => setTotalFloors(e.target.value.replace(/[^\d]/g, ''))} />
                          </div>
                        )}
                      </div>
                    )}

                    <div>
                      <label className={label}>{t('add.features')}</label>
                      <div className="flex flex-wrap gap-2">
                        {featureOpts.map((f) => {
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

                    <button
                      type="button"
                      onClick={() => setOnlineView(!onlineView)}
                      className={`flex w-full items-start gap-3 rounded-module border p-4 text-left transition-all ${
                        onlineView
                          ? 'border-transparent bg-sv-blue text-white shadow-glow-blue-sm'
                          : 'border-sv-ink/[0.08] bg-sv-cloud/60 hover:border-sv-blue/30'
                      }`}
                    >
                      <span className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-md border ${onlineView ? 'border-white/40 bg-white/20' : 'border-sv-ink/20 bg-sv-surface'}`}>
                        {onlineView && <Check className="h-3.5 w-3.5" />}
                      </span>
                      <span>
                        <span className={`block text-[14px] font-extrabold ${onlineView ? 'text-white' : 'text-sv-ink'}`}>{t('add.onlineView')}</span>
                        <span className={`mt-1 block text-[12px] font-semibold leading-relaxed ${onlineView ? 'text-white/75' : 'text-sv-ink/50'}`}>{t('add.onlineViewHint')}</span>
                      </span>
                    </button>
                  </div>
                )}

                {/* ——— step 5 · price & description ——— */}
                {step === 4 && (
                  <div className="grid gap-6">
                    <div>
                      <label className={label}>{t('add.price')} *</label>
                      <div className="mb-3 flex flex-wrap gap-2">
                        {([
                          ['total', 'add.priceTotal'],
                          ['m2', 'add.pricePerM2'],
                        ] as const).map(([mode, key]) => (
                          <button
                            key={mode}
                            type="button"
                            onClick={() => setPriceMode(mode)}
                            className={`rounded-full px-4 py-2 text-[13px] font-extrabold transition-all ${
                              priceMode === mode ? 'bg-sv-ink text-sv-cloud' : 'border border-sv-ink/[0.08] text-sv-ink/60'
                            }`}
                          >
                            {t(key)}
                          </button>
                        ))}
                        <span className="mx-1 hidden h-8 w-px bg-sv-ink/10 sm:block" />
                        {(['GEL', 'USD'] as const).map((c) => (
                          <button
                            key={c}
                            type="button"
                            onClick={() => {
                              if (c === priceCur || !priceEntered) { setPriceCur(c); return }
                              // keep the same USD value when flipping currency
                              const asUsd = priceCur === 'GEL' ? priceEntered / USD_GEL : priceEntered
                              setPrice(String(Math.round(c === 'GEL' ? asUsd * USD_GEL : asUsd)))
                              setPriceCur(c)
                            }}
                            className={`rounded-full px-4 py-2 text-[13px] font-extrabold transition-all ${
                              priceCur === c ? 'bg-sv-blue text-white' : 'border border-sv-ink/[0.08] text-sv-ink/60'
                            }`}
                          >
                            {c === 'GEL' ? '₾' : '$'}
                          </button>
                        ))}
                      </div>
                      <div className="grid gap-5 sm:grid-cols-2">
                        <div>
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
                              {priceMode === 'total'
                                ? t('add.perM2', { v: formatUSD(Math.round(priceN / areaN)) })
                                : `${t('add.priceTotal')}: ${formatUSD(priceN)}`}
                              {' · '}
                              {formatGEL(priceN * USD_GEL)}
                            </p>
                          )}
                        </div>
                        <div className="flex flex-col justify-end gap-2 pb-1">
                          <button
                            type="button"
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
                          {formFields?.exchange && (
                            <button
                              type="button"
                              onClick={() => setExchangeable(!exchangeable)}
                              className={`flex items-center gap-2.5 rounded-control border px-4 py-3.5 text-[14px] font-extrabold transition-all duration-300 ${
                                exchangeable ? 'border-transparent bg-sv-blue text-white shadow-glow-blue-sm' : 'border-sv-ink/[0.08] bg-sv-surface text-sv-ink/60 hover:border-sv-blue/40'
                              }`}
                            >
                              <span className={`grid h-5 w-5 place-items-center rounded-md border ${exchangeable ? 'border-white bg-white/20' : 'border-sv-ink/20'}`}>
                                {exchangeable && <Check className="h-3.5 w-3.5" />}
                              </span>
                              {t('add.exchange')}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* AI estimate */}
                    <div className="overflow-hidden rounded-tile bg-gradient-to-r from-sv-blue/[0.07] to-sv-violet/[0.07] p-6 ring-1 ring-inset ring-sv-blue/15">
                      <div className="flex items-center gap-2.5">
                        <span className="grid h-9 w-9 place-items-center rounded-module bg-gradient-to-br from-sv-blue to-sv-violet text-white">
                          <SparkMark className="h-4 w-4" mono />
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
                            onClick={() => {
                              const mid = estimate.mid
                              const shown = priceMode === 'm2' && areaN > 0
                                ? Math.round(mid / areaN)
                                : mid
                              setPrice(String(priceCur === 'GEL' ? Math.round(shown * USD_GEL) : shown))
                              setNegotiable(false)
                            }}
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
                          <SparkMark className="h-3.5 w-3.5" mono /> {t('add.aiWrite')}
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
                          {aiUsed && <><SparkMark className="h-3.5 w-3.5" /> {t('add.aiWritten')}</>}
                        </span>
                        <span>{t('add.descCount', { n: description.length })}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* ——— step 6 · contact ——— */}
                {step === 5 && (
                  <div className="grid gap-6">
                    <div>
                      <h2 className="text-[18px] font-extrabold text-sv-ink">{t('add.contact')}</h2>
                      <p className="mt-2 text-[13px] font-semibold leading-relaxed text-sv-ink/50">{t('add.contactHint')}</p>
                    </div>
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
                          <input
                            className={`${input} pl-11 ${err(!PHONE_RE.test(phone))}`}
                            placeholder={t('add.phonePh')}
                            value={phone}
                            onChange={(e) => {
                              setPhone(formatPhone(e.target.value))
                              setPhoneVerified(false)
                            }}
                          />
                        </div>
                        {PHONE_RE.test(phone) && (
                          <div className="mt-2 flex flex-wrap items-center gap-2">
                            {!phoneVerified ? (
                              <>
                                <button
                                  type="button"
                                  disabled={phoneBusy}
                                  onClick={async () => {
                                    setPhoneBusy(true)
                                    try {
                                      await fetch('/api/phone/send-code', {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({ phone }),
                                      })
                                    } finally {
                                      setPhoneBusy(false)
                                    }
                                  }}
                                  className="rounded-full border border-sv-ink/12 bg-sv-surface px-3.5 py-2 text-[12px] font-extrabold text-sv-ink/75 transition-colors hover:border-sv-blue/40 hover:text-sv-blue disabled:opacity-50"
                                >
                                  {t('add.phoneSendCode')}
                                </button>
                                <input
                                  className={`${input} max-w-[140px] py-2 text-[13px]`}
                                  placeholder={t('add.phoneCodePh')}
                                  value={phoneCode}
                                  onChange={(e) => setPhoneCode(e.target.value.replace(/\D/g, '').slice(0, 8))}
                                  inputMode="numeric"
                                />
                                <button
                                  type="button"
                                  disabled={phoneBusy || phoneCode.length < 4}
                                  onClick={async () => {
                                    setPhoneBusy(true)
                                    try {
                                      const r = await fetch('/api/phone/verify-code', {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({ phone, code: phoneCode }),
                                      })
                                      if (r.ok) setPhoneVerified(true)
                                    } finally {
                                      setPhoneBusy(false)
                                    }
                                  }}
                                  className="rounded-full bg-sv-blue px-3.5 py-2 text-[12px] font-extrabold text-white disabled:opacity-50"
                                >
                                  {t('add.phoneVerify')}
                                </button>
                              </>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 text-[12px] font-extrabold text-sv-blue">
                                <BadgeCheck className="h-4 w-4" /> {t('add.phoneVerified')}
                              </span>
                            )}
                          </div>
                        )}
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
                  {draftSavedAt > 0 && <><Check className="h-3.5 w-3.5" /> {t('add.draftSaved')}</>}
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
                  <>
                    {failed && (
                      <span className="flex items-center gap-1.5 text-[12px] font-extrabold text-sv-orange">
                        <Flame className="h-3.5 w-3.5" /> {t('add.publishError')}
                      </span>
                    )}
                    <button
                      onClick={publish}
                      disabled={busy}
                      className="rounded-full bg-gradient-to-r from-sv-orange-light via-sv-orange to-sv-orange-deep px-8 py-3.5 text-[14px] font-extrabold text-white shadow-glow-orange transition-all duration-300 hover:-translate-y-0.5 hover:shadow-glow-orange-lg disabled:opacity-60"
                    >
                      {busy ? t('add.publishing') : t('add.publish')}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* ————— live preview column ————— */}
          <div className="sticky top-24 hidden lg:block">
            <div className="mb-4 flex items-start gap-3 rounded-tile border border-sv-blue/15 bg-sv-blue/[0.04] p-4">
              <CircleHelp className="mt-0.5 h-4 w-4 shrink-0 text-sv-blue" />
              <p className="text-[13px] font-semibold leading-relaxed text-sv-ink/60">{t(STEP_TIPS[step])}</p>
            </div>
            <div className="mb-3 flex items-center justify-between">
              <div>
                <div className="text-[14px] font-black text-sv-ink">{t('add.preview')}</div>
                <div className="text-[12px] font-bold text-sv-ink/40">{t('add.previewHint')}</div>
              </div>
              <MapPin className="h-4 w-4 text-sv-ink/25" />
            </div>
            <div className="pointer-events-none [&>article]:w-full [&>article]:max-w-none">
              {preview ? (
                <ListingCard l={preview} layout="wide" animate={false} />
              ) : (
                <div className="flex aspect-[4/3] flex-col items-center justify-center gap-3 rounded-card border border-dashed border-sv-ink/15 bg-sv-surface px-6 text-center shadow-card">
                  <span className="grid h-12 w-12 place-items-center rounded-full bg-sv-blue/10 text-sv-blue">
                    <ImagePlus className="h-5 w-5" />
                  </span>
                  <p className="text-[14px] font-extrabold text-sv-ink">{t('add.photosRequired')}</p>
                  <p className="text-[12px] font-semibold text-sv-ink/45">{t('add.previewEmpty')}</p>
                </div>
              )}
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
