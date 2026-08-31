'use client'

/**
 * SIVRCE — Add Listing, one page (ss.ge / myhome shape).
 * Sticky chips jump to sections; publish scrolls to the first gap.
 */

import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import {
  Building, Building2, Home, Briefcase, Map, Tag, KeyRound, CalendarClock,
  MapPin, Ruler, Layers, Check, Construction,
  ImagePlus, X, Phone, User, MessageCircle,
  CircleCheckBig, Plus, Video, BadgeCheck, Trees, Hotel, Crown,
} from 'lucide-react'
import LocalizedLink from '@/components/LocalizedLink'
import { SparkMark } from '@/components/SparkMark'
import { PartyHouseIcon } from '@/components/PartyHouseIcon'
import MapEmbed from '@/components/MapEmbed'
import TierPurchaseButton from '@/components/payments/TierPurchaseButton'
import { useI18n, type DictKey } from '@/lib/i18n/context'
import { CATEGORY_BRAND, DEAL_BRAND } from '@/lib/category-brand'
import { cap1, seoTitleParts } from '@/lib/seo-title'
import {
  DEALS_FOR, dealLabelKey, fieldsFor, conditionsFor, statusesFor,
  projectsFor, floorTypesFor, featuresFor, RENT_PERIODS, RENT_TYPES,
} from '@/lib/add-listing-fields'
import { groupedFeatures } from '@/lib/features'
import {
  CITIES, districtsOf, LISTINGS, USD_GEL, formatUSD,
  type DealType, type Listing, type PropType,
} from '@/data/listings'
import ListingCard from '@/components/ListingCard'
import LocationPicker, { locationLabel, type LocationValue } from '@/components/search/LocationPicker'
import { FREEDOM_SQUARE } from '@/lib/map/buildings'
import { cityCenter, splitStreetHouse, type GeocodeHit } from '@/lib/map/geocode'
import { naprUniqDigits } from '@/lib/map/napr-parcel'
import { canonicalizeDistrict } from '@/lib/district-canon'

type Deal = DealType
/** file optional: existing CDN photos on edit have url only. */
type Photo = { url: string; name: string; file?: File }

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

const SECTIONS = [
  'add.step.type',
  'add.step.photos',
  'add.step.location',
  'add.step.details',
  'add.step.price',
  'add.step.contact',
] as const

const STATUS_ICON: Partial<Record<DictKey, typeof Building>> = {
  'add.status.new': Building2,
  'add.status.old': Building,
  'add.status.construction': Construction,
  'add.status.completed': CircleCheckBig,
}

/** rough market $/m² baselines for the AI estimate (display-only demo model) */
const BASE_M2: Record<PropType, number> = {
  apartment: 1150, house: 720, villa: 680, commercial: 1350, land: 95, hotel: 1100,
}
const CITY_MULT: Record<string, number> = { თბილისი: 1, ბათუმი: 0.9, ქუთაისი: 0.55, რუსთავი: 0.5 }

const ease = [0.21, 0.65, 0.2, 1] as const

const PHONE_RE = /^\+995 \d{3} \d{2} \d{2} \d{2}$/
const DRAFT_KEY = 'sivrce.add-listing.v1'

/** Local street suggest row (ka primary, en subtitle). */
type StreetSug = { ka: string; en?: string; district?: string }

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
  const searchParams = useSearchParams()
  const editId = searchParams.get('edit')?.trim() || null
  const fileRef = useRef<HTMLInputElement>(null)
  const nameSeeded = useRef(false)
  const editLoaded = useRef(false)

  const [activeSec, setActiveSec] = useState(0)
  const [touched, setTouched] = useState(false)
  const [publishedId, setPublishedId] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [failed, setFailed] = useState(false)
  const [editLoading, setEditLoading] = useState(Boolean(editId))
  const [editLoadFailed, setEditLoadFailed] = useState(false)

  const [deal, setDeal] = useState<Deal | null>(null)
  const [propType, setPropType] = useState<PropType | null>(null)
  const [city, setCity] = useState('')
  const [district, setDistrict] = useState('')
  const [locOpen, setLocOpen] = useState(false)
  const [street, setStreet] = useState('')
  const [houseNo, setHouseNo] = useState('')
  const [coords, setCoords] = useState<{ lat: number; lng: number }>({
    lat: FREEDOM_SQUARE.lat,
    lng: FREEDOM_SQUARE.lng,
  })
  /** OSM building ring from geocode / map snap — paints exact კორპუსი. */
  const [footprint, setFootprint] = useState<[number, number][] | null>(null)
  const [geocoding, setGeocoding] = useState(false)
  const [pinReady, setPinReady] = useState(false)
  // ponytail: local /api/suggest (ka+en catalog) — Nominatim only for pin after pick
  const [suggests, setSuggests] = useState<StreetSug[]>([])
  const [suggestOpen, setSuggestOpen] = useState(false)
  const [suggestHi, setSuggestHi] = useState(-1)
  // ponytail: mute one geocode cycle after reverse-fill so pin↔address don't fight
  const muteGeocode = useRef(false)
  const [cadastral, setCadastral] = useState('')
  const [cadastralPublic, setCadastralPublic] = useState(false)
  /** TAS public permits from /api/site when cadastral / pin known. */
  const [tasDocs, setTasDocs] = useState<{ documentNo: string; publicUrl: string; address?: string }[]>([])
  const [area, setArea] = useState('')
  const [areaUnit, setAreaUnit] = useState<'m2' | 'ha'>('m2')
  const [yardArea, setYardArea] = useState('')
  const [rooms, setRooms] = useState(0)
  const [beds, setBeds] = useState(0)
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
  const [exclusive, setExclusive] = useState(false)
  const [sivrceExclusive, setSivrceExclusive] = useState(false)
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
  const featureOpts = deal && propType ? featuresFor(propType, deal, city || undefined) : []
  const earlyStatus = statusOpts.length > 0 && statusOpts.length <= 3

  // ponytail: localStorage draft — photos are File blobs, not persisted; restore form only.
  // Skip draft when editing an existing listing.
  const [draftReady, setDraftReady] = useState(false)
  const [draftSavedAt, setDraftSavedAt] = useState(0)

  /* eslint-disable react-hooks/set-state-in-effect -- one-time draft hydration from localStorage (external store) */
  useEffect(() => {
    if (editId) { setDraftReady(true); return }
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
      if (typeof d.beds === 'number') setBeds(d.beds)
      else if (typeof d.rooms === 'number' && d.deal === 'daily') setBeds(d.rooms)
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
        const raw = feats.filter((f) => f !== 'add.f.onlineView')
        const dDeal = typeof d.deal === 'string' ? (d.deal as Deal) : null
        const dProp = typeof d.propType === 'string' ? (d.propType as PropType) : null
        const dCity = typeof d.city === 'string' ? d.city : undefined
        setFeatures(dDeal && dProp ? raw.filter((f) => featuresFor(dProp, dDeal, dCity).includes(f)) : raw)
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
      if (typeof d.exclusive === 'boolean') setExclusive(d.exclusive)
      if (typeof d.sivrceExclusive === 'boolean') setSivrceExclusive(d.sivrceExclusive)
      if (typeof d.description === 'string') setDescription(d.description)
      if (typeof d.name === 'string') setName(d.name)
      if (typeof d.phone === 'string') setPhone(d.phone)
      if (Array.isArray(d.messengers)) setMessengers(d.messengers.filter((x): x is string => typeof x === 'string'))
      if (typeof d.terms === 'boolean') setTerms(d.terms)
      if (d.coords && typeof d.coords === 'object') {
        const c = d.coords as { lat?: unknown; lng?: unknown }
        if (typeof c.lat === 'number' && typeof c.lng === 'number') {
          setCoords({ lat: c.lat, lng: c.lng })
          setPinReady(true)
        }
      }
      if (Array.isArray(d.footprint) && d.footprint.length >= 4) {
        const ring = d.footprint.filter(
          (p): p is [number, number] =>
            Array.isArray(p) && typeof p[0] === 'number' && typeof p[1] === 'number',
        )
        if (ring.length >= 4) setFootprint(ring)
      }
    } catch { /* corrupt draft — start fresh */ }
    setDraftReady(true)
  }, [editId])
  /* eslint-enable react-hooks/set-state-in-effect */

  // Hydrate wizard from owned listing when ?edit=.
  useEffect(() => {
    if (!editId || editLoaded.current) return
    editLoaded.current = true
    let cancelled = false
    ;(async () => {
      try {
        const r = await fetch(`/api/listings/${encodeURIComponent(editId)}?edit=1`)
        if (r.status === 401) {
          window.location.href = `/auth/signin?callbackUrl=${encodeURIComponent(`/add-listing?edit=${editId}`)}`
          return
        }
        if (!r.ok) throw new Error('load')
        const data = (await r.json()) as {
          listing?: {
            deal: string
            propType: string
            city: string
            district: string
            street: string
            houseNo: string
            lat: number
            lng: number
            cadastral: string
            cadastralPublic: boolean
            area: string
            areaUnit: 'm2' | 'ha'
            yardArea: string
            rooms: number
            beds: number
            baths: number
            floor: string
            totalFloors: string
            condition: string
            buildingStatus: string
            project: string
            floorType: string
            kitchenArea: string
            features: string[]
            rentPeriod: number | null
            rentType: string
            guests: number
            images: string[]
            video: string
            matterport: string
            price: string
            negotiable: boolean
            exchangeable: boolean
            exclusive: boolean
            sivrceExclusive: boolean
            description: string
            onlineView: boolean
            name: string
            phone: string
            phoneVerified: boolean
            messengers: string[]
          }
        }
        const L = data.listing
        if (!L || cancelled) return
        setDeal(L.deal as Deal)
        setPropType(L.propType as PropType)
        setCity(L.city)
        setDistrict(L.district)
        setStreet(L.street)
        setHouseNo(L.houseNo)
        setCoords({ lat: L.lat, lng: L.lng })
        setPinReady(true)
        setCadastral(L.cadastral)
        setCadastralPublic(L.cadastralPublic)
        setArea(L.area)
        setAreaUnit(L.areaUnit)
        setYardArea(L.yardArea)
        setRooms(L.rooms)
        setBeds(L.beds)
        setBaths(L.baths)
        setFloor(L.floor)
        setTotalFloors(L.totalFloors)
        setCondition((L.condition || '') as DictKey | '')
        setStatus((L.buildingStatus || '') as DictKey | '')
        setProject((L.project || '') as DictKey | '')
        setFloorType((L.floorType || '') as DictKey | '')
        setKitchenArea(L.kitchenArea)
        setOnlineView(L.onlineView)
        setFeatures(
          L.features.filter((f): f is DictKey => typeof f === 'string' && f !== 'add.f.onlineView'),
        )
        setRentPeriod(L.rentPeriod)
        setRentType((L.rentType || '') as DictKey | '')
        setGuests(L.guests)
        setPhotos(
          L.images.map((url, i) => ({
            url,
            name: `photo-${i + 1}`,
          })),
        )
        setCover(0)
        setVideo(L.video)
        setMatterport(L.matterport)
        setPrice(L.price)
        setPriceCur('USD')
        setPriceMode('total')
        setNegotiable(L.negotiable)
        setExchangeable(L.exchangeable)
        setExclusive(L.exclusive)
        setSivrceExclusive(L.sivrceExclusive)
        setDescription(L.description)
        setName(L.name)
        setPhone(L.phone)
        setPhoneVerified(L.phoneVerified)
        setMessengers(L.messengers.length ? L.messengers : ['WhatsApp', 'Viber'])
        setTerms(true)
        nameSeeded.current = true
      } catch {
        if (!cancelled) setEditLoadFailed(true)
      } finally {
        if (!cancelled) setEditLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [editId])

  // Seed contact name from session once (after draft restore). Skip phone — not on session JWT.
  /* eslint-disable react-hooks/set-state-in-effect -- seed name once from async session */
  useEffect(() => {
    if (editId || !draftReady || nameSeeded.current) return
    if (name.trim()) { nameSeeded.current = true; return }
    const n = session?.user?.name?.trim()
    if (!n) return
    setName(n)
    nameSeeded.current = true
  }, [draftReady, session?.user?.name, name, editId])
  /* eslint-enable react-hooks/set-state-in-effect */

  useEffect(() => {
    if (editId || !draftReady || publishedId) return
    const t = window.setTimeout(() => {
      try {
        localStorage.setItem(DRAFT_KEY, JSON.stringify({
          v: 1, deal, propType, city, district, street, houseNo, coords,
          footprint,
          cadastral, cadastralPublic, area, areaUnit, yardArea, rooms, beds, baths,
          floor, totalFloors, condition, status, project, floorType, kitchenArea, features, rentPeriod, rentType,
          guests, video, matterport, price, priceCur, priceMode, negotiable,
          exchangeable, exclusive, sivrceExclusive, description, name, phone, messengers, onlineView, terms,
        }))
        setDraftSavedAt(Date.now())
      } catch { /* quota / private mode */ }
    }, 500)
    return () => window.clearTimeout(t)
  }, [
    editId, draftReady, publishedId, deal, propType, city, district, street, houseNo,
    coords, footprint, cadastral, cadastralPublic, area, areaUnit, yardArea, rooms, beds, baths,
    floor, totalFloors, condition, status, project, floorType, kitchenArea, features, rentPeriod, rentType, guests,
    video, matterport, price, priceCur, priceMode, negotiable, exchangeable,
    exclusive, sivrceExclusive,
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
    if (propType) {
      const allow = new Set<string>(featuresFor(propType, d, city || undefined))
      setFeatures((prev) => prev.filter((f) => allow.has(f)))
    }
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

  /* eslint-disable react-hooks/set-state-in-effect -- drop sea/ski chips when city can't have them */
  useEffect(() => {
    if (!deal || !propType) return
    const allow = new Set<string>(featuresFor(propType, deal, city || undefined))
    setFeatures((prev) => {
      const next = prev.filter((f) => allow.has(f))
      return next.length === prev.length ? prev : next
    })
  }, [deal, propType, city])
  /* eslint-enable react-hooks/set-state-in-effect */

  // City → map center until street geocode lands.
  /* eslint-disable react-hooks/set-state-in-effect -- city change re-centers the pin until geocode lands */
  useEffect(() => {
    if (!city || street.trim().length >= 2) return
    setCoords(cityCenter(city))
    setFootprint(null)
    setPinReady(false)
  }, [city, street])
  /* eslint-enable react-hooks/set-state-in-effect */

  // Address → pin + OSM building ring. House № → building-level zoom.
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
            setFootprint(
              Array.isArray(d.ring) && d.ring.length >= 4 ? (d.ring as [number, number][]) : null,
            )
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

  // Cadastral → site lookup (OSM building ring preferred, NAPR parcel fallback).
  useEffect(() => {
    const digits = naprUniqDigits(cadastral)
    if (!digits) return
    const ac = new AbortController()
    const t = setTimeout(() => {
      fetch(`/api/site?code=${encodeURIComponent(digits)}`, { signal: ac.signal })
        .then((r) => (r.ok ? r.json() : null))
        .then(
          (
            d: {
              ok?: boolean
              ring?: [number, number][]
              lat?: number
              lng?: number
              tasDocs?: { documentNo: string; publicUrl: string; address?: string }[]
            } | null,
          ) => {
            if (!d?.ok) return
            if (Array.isArray(d.tasDocs)) setTasDocs(d.tasDocs.slice(0, 5))
            if (!Array.isArray(d.ring) || d.ring.length < 4) return
            setFootprint(d.ring)
            // ponytail: wrong NAPR parcel must not override Digomi quarter street pin
            if (street.trim().length >= 2) return
            if (typeof d.lat === 'number' && typeof d.lng === 'number') {
              setCoords({ lat: d.lat, lng: d.lng })
              setPinReady(true)
            }
          },
        )
        .catch(() => {})
    }, 450)
    return () => {
      clearTimeout(t)
      ac.abort()
    }
  }, [cadastral, street])

  // Street autocomplete — local ka/en catalog (/api/suggest), same as search.
  useEffect(() => {
    if (!city || street.trim().length < 2) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- reset suggestions when input drops below min length
      setSuggests([])
      setSuggestHi(-1)
      return
    }
    const ac = new AbortController()
    const t = setTimeout(() => {
      const params = new URLSearchParams({ q: street.trim(), city })
      fetch(`/api/suggest?${params}`, { signal: ac.signal })
        .then((r) => (r.ok ? r.json() : null))
        .then((d: { ok?: boolean; suggestions?: { kind: string; ka: string; en?: string; district?: string }[] } | null) => {
          if (!d?.ok || !Array.isArray(d.suggestions)) return
          setSuggests(
            d.suggestions
              .filter((s) => s.kind === 'street')
              .map((s) => ({ ka: s.ka, en: s.en, district: s.district })),
          )
          setSuggestHi(-1)
        })
        .catch(() => {})
    }, 150)
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

  /** Pick catalog street → fill name + soft-fill ubani when catalog-pinned. */
  const applyStreetSug = (s: StreetSug) => {
    setStreet(s.ka)
    // Catalog street → ubani; corrects wrong manual picks (ჭავჭავაძე ≠ საბურთალო).
    if (s.district) setDistrictCanon(s.district)
    setSuggestOpen(false)
    setSuggests([])
    setSuggestHi(-1)
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

  const onStreetKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (!suggestOpen || suggests.length === 0) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSuggestHi((h) => (h + 1) % suggests.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSuggestHi((h) => (h <= 0 ? suggests.length - 1 : h - 1))
    } else if (e.key === 'Enter' && suggestHi >= 0 && suggests[suggestHi]) {
      e.preventDefault()
      applyStreetSug(suggests[suggestHi])
    } else if (e.key === 'Escape') {
      setSuggestOpen(false)
    }
  }

  const onMapPick = (lat: number, lng: number, ring?: [number, number][] | null) => {
    setCoords({ lat, lng })
    setFootprint(ring && ring.length >= 4 ? ring : null)
    setPinReady(true)
    setSuggestOpen(false)
    // Site lookup: keep / upgrade to OSM building contour; fill cadastral from NAPR.
    fetch(`/api/site?lat=${lat}&lng=${lng}`)
      .then((r) => (r.ok ? r.json() : null))
      .then(
        (
          d: {
            ok?: boolean
            ring?: [number, number][]
            parcel?: { uniqCode?: string } | null
            tasDocs?: { documentNo: string; publicUrl: string; address?: string }[]
          } | null,
        ) => {
          if (!d?.ok) return
          if (Array.isArray(d.ring) && d.ring.length >= 4) setFootprint(d.ring)
          if (Array.isArray(d.tasDocs)) setTasDocs(d.tasDocs.slice(0, 5))
          const uniq = d.parcel?.uniqCode
          if (uniq && !cadastral.trim()) setCadastral(uniq)
        },
      )
      .catch(() => {})
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
    // ponytail: heuristic band only — no fake "N comps" from mock LISTINGS.
    return { low: Math.round(mid * 0.92), high: Math.round(mid * 1.08), mid }
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
      !formFields?.rooms || (beds > 0 && rooms > 0),
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
    const pct = Math.round((signals.filter(Boolean).length / signals.length) * 100)
    // ponytail: no "excellent" on a listing that cannot publish (photo required)
    return photos.length < 1 ? Math.min(pct, 70) : pct
  }, [deal, propType, city, district, street, areaN, beds, rooms, condition, status, features, photos, priceN, negotiable, description, video, matterport, onlineView, phone, formFields])

  const detailsOk = !!formFields && areaN > 0
    && (!formFields.rooms || (beds > 0 && rooms > 0))
    && (!formFields.guests || guests > 0)
    && (statusOpts.length === 0 || !!status)

  const typeOk = !!deal && !!propType && (!earlyStatus || !!status)
  const photosOk = photos.length >= 1
  const locOk = !!(city && district && street)
  const priceOk = priceN > 0 || negotiable
  const contactOk = !!(name.trim() && PHONE_RE.test(phone) && terms)
  const sectionOk = [typeOk, photosOk, locOk, detailsOk, priceOk, contactOk]
  const formOk = sectionOk.every(Boolean)

  const propLabel = propType ? t(PROP_TYPES.find((p) => p.key === propType)!.labelKey) : ''
  /* SEO title: bedrooms first — "იყიდება 2-საძინებლიანი ბინა ჭავჭავაძეზე ვაკეში" */
  const titleLabel = propType ? t(PROP_TYPES.find((p) => p.key === propType)!.titleKey) : ''
  const dealLabel = deal ? t(dealLabelKey(deal, propType)) : ''
  const { deal: dealWord, where } = seoTitleParts({ lang, deal, dealLabel, street, district, city })
  const titleKey =
    !propType || propType === 'land' ? 'add.autoTitle.simple'
    : beds > 0 ? 'add.autoTitle.beds'
    : rooms > 0 ? 'add.autoTitle.rooms'
    : 'add.autoTitle.simple'
  const autoTitle = !propType
    ? t('add.previewTitle')
    : cap1(t(titleKey, { deal: dealWord, rooms, beds, type: titleLabel, where }))

  const coverUrl = photos[cover]?.url
  const preview: Listing | null = coverUrl
    ? {
        id: LISTINGS[0].id, // real id so Link prefetch doesn't 404 (card is pointer-events-none anyway)
        img: coverUrl,
        images: photos.map((p) => p.url),
        priceUSD: priceCur === 'USD' ? priceEntered : Math.round(priceEntered / USD_GEL),
        priceGEL: priceCur === 'GEL' ? priceEntered : Math.round(priceEntered * USD_GEL),
        priceOriginal: priceEntered,
        currencyOriginal: priceCur,
        perM2USD: areaN ? Math.round((priceCur === 'GEL' ? priceEntered / USD_GEL : priceEntered) / areaN) : 0,
        title: autoTitle,
        address: [street && `${street} ${houseNo}`.trim(), district, city].filter(Boolean).join(', ') || '—',
        city: city || '—', district: district || '—',
        dealType: deal ?? 'sale',
        propType: propType ?? 'apartment',
        rooms, beds, baths, area: areaN, floor: Number(floor) || 1, totalFloors: Number(totalFloors) || 1,
        views: 0, badge: null,
        // 0 → card renders '—': no fabricated score next to a "pending" label
        ai: { score: 0, label: t('add.aiPending') },
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
    if (p?.url.startsWith('blob:')) URL.revokeObjectURL(p.url)
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
      rooms: beds > 0 ? t('add.aiDesc.beds', { n: beds }) : rooms > 0 ? t('add.aiDesc.rooms', { n: rooms }) : '',
      type: propLabel.toLowerCase(), area: areaN,
      floor: floor && totalFloors ? t('add.aiDesc.floor', { f: floor, t: totalFloors }) : '',
      condition: condition ? t(condition) : '—',
      features: features.length ? t('add.aiDesc.features', { list: features.map((f) => t(f)).join(', ') }) : '',
    })
    setDescription(text)
    setAiUsed(true)
  }

  const jumpTo = (i: number) => {
    setActiveSec(i)
    document.getElementById(`add-sec-${i}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  useEffect(() => {
    if (publishedId || editLoading || editLoadFailed) return
    const els = SECTIONS.map((_, i) => document.getElementById(`add-sec-${i}`)).filter(
      (el): el is HTMLElement => !!el,
    )
    if (!els.length) return
    const io = new IntersectionObserver(
      (entries) => {
        const vis = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0]
        const i = Number((vis?.target as HTMLElement | undefined)?.dataset.sec)
        if (Number.isInteger(i)) setActiveSec((cur) => (cur === i ? cur : i))
      },
      { rootMargin: '-22% 0px -58% 0px', threshold: [0, 0.25, 0.6] },
    )
    for (const el of els) io.observe(el)
    return () => io.disconnect()
  }, [publishedId, editLoading, editLoadFailed])

  /* ————— publish: photos → R2, then POST (create) or PATCH (edit) ————— */
  const publish = async () => {
    if (!formOk) {
      setTouched(true)
      const i = Math.max(0, sectionOk.findIndex((ok) => !ok))
      jumpTo(i)
      return
    }
    setBusy(true)
    setFailed(false)
    try {
      // Cover photo must upload first — the listing hero is images[0].
      const coverPhoto = photos[cover]
      const ordered = coverPhoto ? [coverPhoto, ...photos.filter((p) => p !== coverPhoto)] : photos
      const images = await Promise.all(
        ordered.map(async (p) => {
          if (!p.file) return p.url // existing CDN photo on edit
          const fd = new FormData()
          fd.append('file', p.file)
          const r = await fetch('/api/upload', { method: 'POST', body: fd })
          if (!r.ok) throw new Error('upload')
          return ((await r.json()) as { url: string }).url
        }),
      )
      const payload = {
        title: autoTitle,
        deal, propType, city, district,
        address: `${street} ${houseNo}`.trim(),
        cadastral: cadastral || null,
        cadastralPublic,
        area: areaN, rooms: formFields?.rooms ? rooms : 0, beds: formFields?.rooms ? beds : 0, baths: formFields?.baths ? baths : 0,
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
        exclusive, sivrceExclusive,
        description,
        yardArea: formFields?.yard ? yardN || null : null,
        rentPeriod: formFields?.rentPeriod ? rentPeriod : null,
        rentType: formFields?.rentType ? rentType || null : null,
        guests: formFields?.guests ? guests || null : null,
        areaUnit: formFields?.areaHa && areaUnit === 'ha' ? 'ha' : 'm2',
        onlineView,
        name: name.trim(), phone, messengers,
        lat: coords.lat, lng: coords.lng,
      }
      const res = await fetch(editId ? `/api/listings/${encodeURIComponent(editId)}` : '/api/listings', {
        method: editId ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (res.status === 401) {
        window.location.href = `/auth/signin?callbackUrl=${encodeURIComponent(editId ? `/add-listing?edit=${editId}` : '/add-listing')}`
        return
      }
      if (!res.ok) throw new Error('publish')
      const data = (await res.json()) as { id?: string }
      if (!editId) {
        try { localStorage.removeItem(DRAFT_KEY) } catch { /* ignore */ }
      }
      setPublishedId(data.id ?? editId ?? 'ok')
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
    const realId = publishedId !== 'ok'
    const wasEdit = Boolean(editId)
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
            {wasEdit ? t('add.savedTitle') : t('add.successTitle')}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25, duration: 0.6, ease }}
            className="mx-auto mt-4 max-w-[440px] text-[16px] font-semibold leading-relaxed text-sv-ink/55"
          >
            {wasEdit ? t('add.savedText') : t('add.successText')}
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35, duration: 0.6, ease }}
            className="mt-10 flex flex-wrap items-center justify-center gap-4"
          >
            <Link
              href={realId ? `/listing/${publishedId}` : '/seller/listings'}
              className="rounded-full bg-sv-orange px-8 py-4 text-[15px] font-extrabold text-white shadow-glow-orange transition-all duration-300 hover:-translate-y-0.5 hover:shadow-glow-orange-lg"
            >
              {t('add.successViewListing')}
            </Link>
            {wasEdit ? (
              <LocalizedLink
                href="/seller/listings"
                className="rounded-full border border-sv-ink/10 bg-sv-surface px-8 py-4 text-[15px] font-extrabold text-sv-ink transition-all duration-300 hover:-translate-y-0.5 hover:shadow-card"
              >
                {t('add.manageListings')}
              </LocalizedLink>
            ) : (
              <button
                onClick={() => {
                  try { localStorage.removeItem(DRAFT_KEY) } catch { /* ignore */ }
                  setPublishedId(null); setPhotos([]); setPrice(''); setDescription(''); setTouched(false); setDraftSavedAt(0)
                }}
                className="flex items-center gap-2 rounded-full border border-sv-ink/10 bg-sv-surface px-8 py-4 text-[15px] font-extrabold text-sv-ink transition-all duration-300 hover:-translate-y-0.5 hover:shadow-card"
              >
                <Plus className="h-4 w-4" /> {t('add.successNew')}
              </button>
            )}
          </motion.div>

          {realId && !wasEdit ? (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45, duration: 0.5, ease }}
              className="mt-10 rounded-card border border-sv-ink/[0.06] bg-sv-surface p-6 text-left shadow-card"
            >
              <p className="text-[15px] font-black text-sv-ink">{t('add.boostNow')}</p>
              <p className="mt-1 text-[13px] font-semibold text-sv-ink/55">{t('add.boostHint')}</p>
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <TierPurchaseButton listingId={publishedId} currentTier="standard" defaultOpen />
                <LocalizedLink
                  href="/seller/listings"
                  className="text-[13px] font-bold text-sv-blue hover:text-sv-blue-deep"
                >
                  {t('add.manageListings')}
                </LocalizedLink>
              </div>
            </motion.div>
          ) : null}
        </div>
      </section>
    )
  }

  if (editLoading) {
    return (
      <section className="grid min-h-[50vh] place-items-center bg-sv-cloud py-16">
        <p className="text-[15px] font-bold text-sv-ink/50">{t('add.loading')}</p>
      </section>
    )
  }

  if (editLoadFailed) {
    return (
      <section className="grid min-h-[50vh] place-items-center bg-sv-cloud px-5 py-16 text-center">
        <div>
          <p className="text-[16px] font-extrabold text-sv-ink">{t('add.editLoadError')}</p>
          <LocalizedLink href="/seller/listings" className="mt-4 inline-block text-[14px] font-bold text-sv-blue">
            {t('add.editBack')}
          </LocalizedLink>
        </div>
      </section>
    )
  }

  const strengthTone = strength < 75 ? 'text-sv-orange' : 'text-sv-blue'
  const strengthBar = strength < 75 ? 'bg-sv-orange' : 'bg-sv-blue'
  const strengthLabel = strength < 40 ? t('add.strength.low') : strength < 75 ? t('add.strength.mid') : t('add.strength.high')
  const secCls = (i: number) =>
    `scroll-mt-[calc(7.5rem+env(safe-area-inset-top,0px))] rounded-card border bg-sv-surface p-6 shadow-card md:p-8 ${
      touched && !sectionOk[i] ? 'border-sv-orange/45 ring-2 ring-sv-orange/20' : 'border-sv-ink/[0.06]'
    }`

  return (
    <section className="bg-sv-cloud pb-28 pt-8 md:pt-12">
      <div className="mx-auto max-w-[1440px] px-5 md:px-10">
        <div className="mb-6 max-w-[820px]">
          <h1 className="truncate text-[22px] font-black tracking-[-0.035em] text-sv-ink md:text-[28px]">
            {editId ? t('add.editTitle') : t('add.title')}
          </h1>
          <p className="mt-1.5 max-w-[42em] text-[13px] font-semibold leading-relaxed text-sv-ink/45">
            {editId ? t('add.editSubtitle') : t('add.subtitle')}
          </p>
          <div className="mt-3 flex items-center gap-2 lg:hidden">
            <span className="text-[11px] font-extrabold text-sv-ink/40">{t('add.strength')}</span>
            <div className="h-1 flex-1 overflow-hidden rounded-full bg-sv-ink/[0.06]">
              <motion.div
                className={`h-full rounded-full ${strengthBar}`}
                animate={{ width: `${strength}%` }}
                transition={{ duration: 0.45, ease }}
              />
            </div>
            <span className={`text-[11px] font-black tabular-nums ${strengthTone}`}>{strength}%</span>
          </div>
        </div>

        <nav
          className="sticky top-[calc(68px+env(safe-area-inset-top,0px))] z-20 -mx-5 mb-6 border-y border-sv-ink/[0.06] bg-sv-cloud/92 px-5 py-2.5 backdrop-blur-xl md:-mx-10 md:px-10"
          aria-label={t('add.title')}
        >
          <ol className="flex gap-1.5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {SECTIONS.map((s, i) => {
              const current = activeSec === i
              const done = sectionOk[i]
              return (
                <li key={s} className="shrink-0">
                  <button
                    type="button"
                    aria-current={current ? 'true' : undefined}
                    onClick={() => jumpTo(i)}
                    className={`flex min-h-[36px] items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[12px] font-extrabold transition-colors ${
                      current
                        ? 'bg-sv-orange text-white shadow-glow-orange'
                        : done
                          ? 'bg-sv-blue/10 text-sv-blue'
                          : 'bg-sv-ink/[0.05] text-sv-ink/45 hover:text-sv-ink'
                    }`}
                  >
                    {done ? <Check className="h-3 w-3" strokeWidth={3} /> : <span className="tabular-nums opacity-70">{i + 1}</span>}
                    {t(s)}
                  </button>
                </li>
              )
            })}
          </ol>
        </nav>

        <div className="grid items-start gap-8 lg:grid-cols-[1fr_400px]">
          <div id="add-form" className="grid gap-6">
                <section id="add-sec-0" data-sec="0" className={secCls(0)}>
                    <header className="mb-6">
                      <h2 className="text-[17px] font-black tracking-[-0.03em] text-sv-ink">{t('add.step.type')}</h2>
                      <p className="mt-1 max-w-[42em] text-[13px] font-semibold leading-relaxed text-sv-ink/45">{t('add.tip.type')}</p>
                    </header>
                    <h3 className="text-[13px] font-semibold text-sv-ink/45">{t('add.propType')}</h3>
                    <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
                      {PROP_TYPES.map((p) => {
                        const active = propType === p.key
                        return (
                          <button
                            key={p.key}
                            type="button"
                            aria-pressed={active}
                            onClick={() => pickProp(p.key)}
                            className={`relative flex min-h-[44px] flex-col items-center gap-2.5 rounded-tile border p-5 transition-colors ${
                              active ? 'border-transparent' : 'border-sv-ink/[0.08] bg-sv-surface hover:border-sv-ink/20'
                            }`}
                            style={active ? { backgroundColor: p.brand.chipVar, boxShadow: `0 0 0 2px ${p.brand.hue}` } : undefined}
                          >
                            {active && (
                              <span className="absolute right-2.5 top-2.5 grid h-5 w-5 place-items-center rounded-full bg-sv-blue text-white">
                                <Check className="h-3 w-3" strokeWidth={3} />
                              </span>
                            )}
                            <span
                              className={`grid h-11 w-11 place-items-center rounded-module ${active ? 'text-white' : 'bg-sv-cloud'}`}
                              style={{ backgroundColor: active ? p.brand.hue : undefined, color: active ? undefined : p.brand.hue }}
                            >
                              <p.icon className="h-5 w-5" />
                            </span>
                            <span className="text-[13px] font-extrabold text-sv-ink">{t(p.labelKey)}</span>
                          </button>
                        )
                      })}
                    </div>

                    {propType && (
                      <>
                        <h3 className="mt-8 text-[13px] font-semibold text-sv-ink/45">{t('add.dealType')}</h3>
                        <div
                          className="mt-3 flex rounded-full bg-sv-cloud p-1 ring-1 ring-sv-ink/[0.06]"
                          role="radiogroup"
                          aria-label={t('add.dealType')}
                        >
                          {DEALS.filter((d) => availableDeals.includes(d.key)).map((d) => {
                            const active = deal === d.key
                            return (
                              <button
                                key={d.key}
                                type="button"
                                role="radio"
                                aria-checked={active}
                                onClick={() => pickDeal(d.key)}
                                className={`flex min-h-[44px] min-w-0 flex-1 items-center justify-center gap-1.5 rounded-full px-2 py-2.5 text-[12px] font-extrabold transition-all sm:text-[13px] ${
                                  active ? 'bg-sv-surface text-sv-ink shadow-card' : 'text-sv-ink/45 hover:text-sv-ink'
                                }`}
                              >
                                <d.icon className="h-3.5 w-3.5 shrink-0" style={{ color: active ? d.hue : undefined }} />
                                <span className="truncate">{t(dealLabelKey(d.key, propType))}</span>
                              </button>
                            )
                          })}
                        </div>
                      </>
                    )}

                    {propType && deal && earlyStatus && (
                      <>
                        <h3 className="mt-8 text-[13px] font-semibold text-sv-ink/45">{t('add.status')} *</h3>
                        <div className={`mt-3 grid gap-3 ${statusOpts.length === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
                          {statusOpts.map((s) => {
                            const active = status === s
                            const Icon = STATUS_ICON[s] ?? Building
                            return (
                              <button
                                key={s}
                                type="button"
                                aria-pressed={active}
                                onClick={() => setStatus(s)}
                                className={`flex min-h-[44px] flex-col items-center gap-2 rounded-tile border px-3 py-4 transition-colors ${
                                  active
                                    ? 'border-sv-blue bg-sv-blue/[0.06] shadow-glow-blue-sm'
                                    : 'border-sv-ink/[0.08] bg-sv-surface hover:border-sv-ink/20'
                                }`}
                              >
                                <span className={`grid h-10 w-10 place-items-center rounded-module ${active ? 'bg-sv-blue text-white' : 'bg-sv-cloud text-sv-blue'}`}>
                                  <Icon className="h-5 w-5" />
                                </span>
                                <span className="text-center text-[12px] font-extrabold leading-tight text-sv-ink sm:text-[13px]">{t(s)}</span>
                              </button>
                            )
                          })}
                        </div>
                      </>
                    )}
                </section>

                <section id="add-sec-1" data-sec="1" className={secCls(1)}>
                    <header className="mb-6">
                      <h2 className="text-[17px] font-black tracking-[-0.03em] text-sv-ink">{t('add.step.photos')}</h2>
                      <p className="mt-1 max-w-[42em] text-[13px] font-semibold leading-relaxed text-sv-ink/45">{t('add.tip.photos')}</p>
                    </header>
                    {photos.length === 0 ? (
                      <button
                        type="button"
                        onClick={() => fileRef.current?.click()}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => { e.preventDefault(); addPhotos(e.dataTransfer.files) }}
                        className="flex min-h-[220px] w-full flex-col items-center justify-center gap-3 rounded-tile border border-dashed border-sv-ink/15 bg-sv-cloud/80 px-6 py-14 text-center transition-colors hover:border-sv-blue/40 hover:bg-sv-blue/[0.04]"
                      >
                        <span className="grid h-14 w-14 place-items-center rounded-full bg-sv-blue/10 text-sv-blue">
                          <ImagePlus className="h-6 w-6" />
                        </span>
                        <span className="text-[15px] font-extrabold text-sv-ink">{t('add.photosDrop')}</span>
                        <span className="text-[13px] font-semibold text-sv-ink/40">{t('add.photosCount', { n: photos.length })}</span>
                        <span className="max-w-[28em] text-[12px] font-semibold leading-relaxed text-sv-ink/40">{t('add.photosTip')}</span>
                      </button>
                    ) : (
                      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
                        {photos.map((p, i) => (
                          <div
                            key={p.url}
                            draggable
                            onDragStart={() => setDragFrom(i)}
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={(e) => { e.preventDefault(); movePhoto(dragFrom, i) }}
                            title={t('add.photosReorder')}
                            className={`relative aspect-[4/3] cursor-grab overflow-hidden rounded-module ring-2 active:cursor-grabbing ${i === cover ? 'ring-sv-orange' : 'ring-transparent'}`}
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={p.url} alt={p.name} className="pointer-events-none h-full w-full object-cover" draggable={false} />
                            {i === cover ? (
                              <span className="absolute left-1.5 top-1.5 rounded-full bg-sv-orange px-2 py-0.5 text-[10px] font-black text-white">
                                {t('add.photosCover')}
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setCover(i)}
                                className="absolute bottom-1.5 left-1.5 rounded-full bg-sv-navy/70 px-2 py-1 text-[10px] font-bold text-white"
                              >
                                {t('add.photosSetCover')}
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => removePhoto(i)}
                              className="absolute right-1.5 top-1.5 grid h-7 w-7 place-items-center rounded-full bg-sv-navy/70 text-white"
                              aria-label={t('add.photosRemove')}
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ))}
                        {photos.length < 16 && (
                          <button
                            type="button"
                            onClick={() => fileRef.current?.click()}
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={(e) => { e.preventDefault(); addPhotos(e.dataTransfer.files) }}
                            className="flex aspect-[4/3] flex-col items-center justify-center gap-1.5 rounded-module border border-dashed border-sv-ink/15 bg-sv-cloud/80 text-sv-ink/45 transition-colors hover:border-sv-blue/40 hover:bg-sv-blue/[0.04] hover:text-sv-blue"
                          >
                            <Plus className="h-5 w-5" />
                            <span className="text-[11px] font-extrabold">{t('add.photosAdd')}</span>
                            <span className="text-[10px] font-bold tabular-nums">{t('add.photosCount', { n: photos.length })}</span>
                          </button>
                        )}
                      </div>
                    )}
                    <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/heic,image/heif,image/*" multiple hidden onChange={(e) => addPhotos(e.target.files)} />
                    {touched && photos.length < 1 && (
                      <p className="mt-3 text-[13px] font-extrabold text-sv-orange">{t('add.photosRequired')}</p>
                    )}

                    <div className="mt-6 grid gap-4 sm:grid-cols-2">
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
                </section>

                {/* ——— location ——— */}
                <section id="add-sec-2" data-sec="2" className={secCls(2)}>
                    <header className="mb-6">
                      <h2 className="text-[17px] font-black tracking-[-0.03em] text-sv-ink">{t('add.step.location')}</h2>
                      <p className="mt-1 max-w-[42em] text-[13px] font-semibold leading-relaxed text-sv-ink/45">{t('add.tip.location')}</p>
                    </header>
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
                        value={{ city, district, street }}
                        multi={false}
                        nationwide={false}
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
                        onKeyDown={onStreetKeyDown}
                        onFocus={() => suggests.length > 0 && setSuggestOpen(true)}
                        onBlur={() => {
                          // let suggestion click land first
                          setTimeout(() => setSuggestOpen(false), 150)
                        }}
                        role="combobox"
                        aria-expanded={suggestOpen && suggests.length > 0}
                        aria-controls="street-suggest-list"
                        aria-autocomplete="list"
                        autoComplete="off"
                      />
                      {suggestOpen && suggests.length > 0 && (
                        <ul
                          id="street-suggest-list"
                          role="listbox"
                          className="absolute z-20 mt-1 max-h-56 w-full overflow-auto rounded-module border border-sv-ink/10 bg-sv-surface py-1 shadow-card"
                        >
                          {suggests.map((s, i) => (
                            <li key={s.ka}>
                              <button
                                type="button"
                                role="option"
                                aria-selected={suggestHi === i}
                                className={`flex w-full flex-col gap-0.5 px-3.5 py-2.5 text-left transition ${
                                  suggestHi === i ? 'bg-sv-blue/8' : 'hover:bg-sv-blue/8'
                                }`}
                                onMouseDown={(e) => e.preventDefault()}
                                onMouseEnter={() => setSuggestHi(i)}
                                onClick={() => applyStreetSug(s)}
                              >
                                <span className="text-[13px] font-extrabold text-sv-ink">{s.ka}</span>
                                {(s.district || s.en) && (
                                  <span className="text-[11px] font-bold text-sv-ink/45">
                                    {[s.district, s.en].filter(Boolean).join(' · ')}
                                  </span>
                                )}
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
                              ? 'border-transparent bg-sv-blue text-white shadow-glow-blue-sm'
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
                              ? t('add.mapLocating')
                              : pinReady
                                ? `${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)}`
                                : t('add.mapStreetFirst')}
                          </span>
                        </div>
                        <MapEmbed
                          lat={coords.lat}
                          lng={coords.lng}
                          zoom={mapZoom}
                          terrain="satellite"
                          q={[street && `${street} ${houseNo}`.trim(), district, city]
                            .filter(Boolean)
                            .join(', ')}
                          aspect="16/9"
                          highlight
                          footprint={footprint}
                          onPick={onMapPick}
                        />
                        <p className="mt-2 text-[11px] font-bold text-sv-ink/40">
                          {t('add.mapPickHint')}
                        </p>
                        {tasDocs.length > 0 && (
                          <ul className="mt-3 space-y-1.5 rounded-control border border-sv-ink/[0.06] bg-sv-cloud/60 px-3 py-2.5">
                            <li className="text-[11px] font-black uppercase tracking-wider text-sv-ink/40">
                              {t('detail.tasPermits')}
                            </li>
                            {tasDocs.map((d) => (
                              <li key={d.publicUrl} className="flex items-baseline justify-between gap-2 text-[13px]">
                                <span className="font-bold text-sv-ink">{d.documentNo}</span>
                                <a
                                  href={d.publicUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="font-black text-sv-blue hover:underline"
                                >
                                  {t('detail.tasOpen')}
                                </a>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    )}
                    </div>
                </section>

                {/* ——— details ——— */}
                <section id="add-sec-3" data-sec="3" className={secCls(3)}>
                    <header className="mb-6">
                      <h2 className="text-[17px] font-black tracking-[-0.03em] text-sv-ink">{t('add.step.details')}</h2>
                      <p className="mt-1 max-w-[42em] text-[13px] font-semibold leading-relaxed text-sv-ink/45">{t('add.tip.details')}</p>
                    </header>
                    {formFields ? (
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
                                rentPeriod === n ? 'bg-sv-blue text-white shadow-glow-blue-sm' : 'border border-sv-ink/[0.08] bg-sv-surface text-sv-ink/60 hover:border-sv-blue/40 hover:text-sv-blue'
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
                                rentType === k ? 'bg-sv-blue text-white shadow-glow-blue-sm' : 'border border-sv-ink/[0.08] bg-sv-surface text-sv-ink/60 hover:border-sv-blue/40 hover:text-sv-blue'
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
                                guests === n ? 'bg-sv-blue text-white shadow-glow-blue-sm' : 'border border-sv-ink/[0.08] bg-sv-surface text-sv-ink/60 hover:border-sv-blue/40 hover:text-sv-blue'
                              }`}
                            >
                              {n === 10 ? '10+' : n}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {(statusOpts.length > 0 && (!earlyStatus || !status)) && (
                      <div>
                        <label className={label}>{t('add.status')} *</label>
                        <div className={`flex flex-wrap gap-2 rounded-control p-1 ${touched && !status ? 'ring-4 ring-sv-orange/10' : ''}`}>
                          {statusOpts.map((s) => (
                            <button
                              key={s}
                              type="button"
                              onClick={() => setStatus(s)}
                              className={`rounded-full px-4 py-2.5 text-[13px] font-extrabold transition-all duration-300 ${
                                status === s ? 'bg-sv-blue text-white shadow-glow-blue-sm' : 'border border-sv-ink/[0.08] bg-sv-surface text-sv-ink/60 hover:border-sv-blue/40 hover:text-sv-blue'
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
                                condition === c ? 'bg-sv-blue text-white shadow-glow-blue-sm' : 'border border-sv-ink/[0.08] bg-sv-surface text-sv-ink/60 hover:border-sv-blue/40 hover:text-sv-blue'
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
                                floorType === ft ? 'bg-sv-blue text-white shadow-glow-blue-sm' : 'border border-sv-ink/[0.08] bg-sv-surface text-sv-ink/60 hover:border-sv-blue/40 hover:text-sv-blue'
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
                          {t('spec.area')} ({formFields.areaHa && areaUnit === 'ha' ? t('add.areaUnit.ha') : t('add.areaUnit.m2')}) *
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
                        <>
                        <div>
                          <label className={label}>{t('spec.beds')} *</label>
                          <div className={`flex flex-wrap gap-2 ${touched && !beds ? 'rounded-control ring-4 ring-sv-orange/10' : ''}`}>
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                              <button
                                key={n}
                                type="button"
                                onClick={() => {
                                  setBeds(n)
                                  if (rooms < n) setRooms(n)
                                }}
                                className={`min-w-[44px] rounded-full px-3.5 py-2.5 text-[13px] font-extrabold transition-all ${
                                  beds === n ? 'bg-sv-blue text-white shadow-glow-blue-sm' : 'border border-sv-ink/[0.08] bg-sv-surface text-sv-ink/60 hover:border-sv-blue/40 hover:text-sv-blue'
                                }`}
                              >
                                {n === 10 ? '10+' : n}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div>
                          <label className={label}>{t('spec.rooms')} *</label>
                          <div className={`flex flex-wrap gap-2 ${touched && !rooms ? 'rounded-control ring-4 ring-sv-orange/10' : ''}`}>
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                              <button
                                key={n}
                                type="button"
                                onClick={() => {
                                  setRooms(n)
                                  if (beds > n) setBeds(n)
                                }}
                                className={`min-w-[44px] rounded-full px-3.5 py-2.5 text-[13px] font-extrabold transition-all ${
                                  rooms === n ? 'bg-sv-blue text-white shadow-glow-blue-sm' : 'border border-sv-ink/[0.08] bg-sv-surface text-sv-ink/60 hover:border-sv-blue/40 hover:text-sv-blue'
                                }`}
                              >
                                {n === 10 ? '10+' : n}
                              </button>
                            ))}
                          </div>
                        </div>
                        </>
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
                                  baths === n ? 'bg-sv-blue text-white shadow-glow-blue-sm' : 'border border-sv-ink/[0.08] bg-sv-surface text-sv-ink/60 hover:border-sv-blue/40 hover:text-sv-blue'
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
                        <label className={label}>{t('add.yard')} ({t('add.areaUnit.m2')})</label>
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
                      <p className="mb-3 text-[12px] font-semibold text-sv-ink/45">{t('add.featuresHint')}</p>
                      <div className="grid gap-5">
                        {groupedFeatures(featureOpts).map((g) => (
                          <div key={g.key}>
                            <p className="mb-2 text-[11px] font-black uppercase tracking-wider text-sv-ink/40">{t(g.key)}</p>
                            <div className="flex flex-wrap gap-2">
                              {g.items.map((f) => {
                                const on = features.includes(f)
                                return (
                                  <button
                                    key={f}
                                    type="button"
                                    onClick={() => setFeatures(on ? features.filter((x) => x !== f) : [...features, f])}
                                    className={`flex items-center gap-1.5 rounded-full px-4 py-2.5 text-[13px] font-extrabold transition-all duration-300 ${
                                      on ? 'bg-sv-blue text-white shadow-glow-blue-sm' : 'border border-sv-ink/[0.08] bg-sv-surface text-sv-ink/60 hover:border-sv-blue/40 hover:text-sv-blue'
                                    }`}
                                  >
                                    {f === 'add.f.partiesAllowed' ? (
                                      <PartyHouseIcon
                                        className="h-3.5 w-3.5"
                                        style={on ? undefined : { color: CATEGORY_BRAND.partyHouses.hue }}
                                      />
                                    ) : (
                                      on && <Check className="h-3.5 w-3.5" />
                                    )}
                                    {t(f)}
                                  </button>
                                )
                              })}
                            </div>
                          </div>
                        ))}
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
                    ) : (
                      <p className="rounded-module bg-sv-cloud px-4 py-6 text-[13px] font-semibold leading-relaxed text-sv-ink/45">{t('add.tip.type')}</p>
                    )}
                </section>

                {/* ——— price & description ——— */}
                <section id="add-sec-4" data-sec="4" className={secCls(4)}>
                    <header className="mb-6">
                      <h2 className="text-[17px] font-black tracking-[-0.03em] text-sv-ink">{t('add.step.price')}</h2>
                      <p className="mt-1 max-w-[42em] text-[13px] font-semibold leading-relaxed text-sv-ink/45">{t('add.tip.price')}</p>
                    </header>
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
                              priceMode === mode ? 'bg-sv-blue text-white shadow-glow-blue-sm' : 'border border-sv-ink/[0.08] text-sv-ink/60 hover:border-sv-blue/40 hover:text-sv-blue'
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
                            onClick={() => setPriceCur(c)}
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
                            className={`${input} text-[20px] font-black ${err(!priceEntered && !negotiable)}`}
                            inputMode="numeric"
                            placeholder={t('add.pricePh')}
                            value={price}
                            disabled={negotiable}
                            onChange={(e) => setPrice(e.target.value.replace(/[^\d]/g, ''))}
                          />
                          {priceEntered > 0 && (
                            <p className="mt-2 text-[13px] font-bold text-sv-ink/45">
                              {priceCur === 'GEL'
                                ? `${priceEntered} ₾ (≈ $${Math.round(priceEntered / USD_GEL)})`
                                : `$${priceEntered} (≈ ${Math.round(priceEntered * USD_GEL)} ₾)`}
                              {areaN > 0 && (
                                <>
                                  {' · '}
                                  {priceMode === 'total'
                                    ? `≈ $${Math.round((priceCur === 'GEL' ? priceEntered / USD_GEL : priceEntered) / areaN)} / მ²`
                                    : `სრული: $${Math.round((priceCur === 'GEL' ? priceEntered / USD_GEL : priceEntered) * areaN)}`}
                                </>
                              )}
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
                      <div className="mt-4 grid gap-2 sm:grid-cols-2">
                        <button
                          type="button"
                          onClick={() => setExclusive(!exclusive)}
                          className={`flex items-start gap-2.5 rounded-control border px-4 py-3.5 text-left transition-all duration-300 ${
                            exclusive ? 'border-transparent bg-sv-blue text-white shadow-glow-blue-sm' : 'border-sv-ink/[0.08] bg-sv-surface text-sv-ink/70 hover:border-sv-blue/40'
                          }`}
                        >
                          <span className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-md border ${exclusive ? 'border-white bg-white/20' : 'border-sv-ink/20'}`}>
                            {exclusive ? <Check className="h-3.5 w-3.5" /> : <Crown className="h-3.5 w-3.5" />}
                          </span>
                          <span className="min-w-0">
                            <span className="block text-[14px] font-extrabold">{t('badge.exclusive')}</span>
                            <span className={`mt-0.5 block text-[11px] font-bold leading-snug ${exclusive ? 'text-white/75' : 'text-sv-ink/40'}`}>{t('badge.exclusiveHint')}</span>
                          </span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setSivrceExclusive(!sivrceExclusive)}
                          className={`flex items-start gap-2.5 rounded-control border px-4 py-3.5 text-left transition-all duration-300 ${
                            sivrceExclusive ? 'border-transparent bg-sv-navy text-white shadow-glow-navy' : 'border-sv-ink/[0.08] bg-sv-surface text-sv-ink/70 hover:border-sv-blue/40'
                          }`}
                        >
                          <span className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-md border ${sivrceExclusive ? 'border-white bg-white/20' : 'border-sv-ink/20'}`}>
                            {sivrceExclusive ? <Check className="h-3.5 w-3.5" /> : <SparkMark className="h-3.5 w-3.5 text-sv-orange" mono />}
                          </span>
                          <span className="min-w-0">
                            <span className="block text-[14px] font-extrabold">{t('badge.sivrceExclusive')}</span>
                            <span className={`mt-0.5 block text-[11px] font-bold leading-snug ${sivrceExclusive ? 'text-white/75' : 'text-sv-ink/40'}`}>{t('badge.sivrceExclusiveHint')}</span>
                          </span>
                        </button>
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
                          {estimate && <div className="text-[12px] font-bold text-sv-ink/45">{t('add.aiEstimateBody')}</div>}
                        </div>
                      </div>
                      {estimate ? (
                        <div className="mt-5">
                          <div className="text-[12px] font-black uppercase tracking-wider text-sv-ink/45">{t('add.aiRange')}</div>
                          <div className="mt-1.5 flex flex-wrap items-baseline gap-2">
                            <span className="text-[26px] font-black tracking-tight text-sv-ink">{formatUSD(estimate.low)} — {formatUSD(estimate.high)}</span>
                            {verdict && (
                              <span
                                className={`rounded-full px-3 py-1 text-[11px] font-black text-white ${
                                  verdict === 'high' ? 'bg-sv-orange' : verdict === 'low' ? 'bg-sv-blue' : 'bg-sv-ink'
                                }`}
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
                </section>

                <section id="add-sec-5" data-sec="5" className={secCls(5)}>
                    <header className="mb-6">
                      <h2 className="text-[17px] font-black tracking-[-0.03em] text-sv-ink">{t('add.step.contact')}</h2>
                      <p className="mt-1 max-w-[42em] text-[13px] font-semibold leading-relaxed text-sv-ink/45">{t('add.tip.contact')}</p>
                    </header>
                    <div className="grid gap-6">
                    <p className="text-[13px] font-semibold leading-relaxed text-sv-ink/50">{t('add.contactHint')}</p>
                    <div className="grid gap-5 sm:grid-cols-2">
                      <div>
                        <label className={label}>{t('add.name')} *</label>
                        <div className="relative">
                          <User className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-sv-ink/35" />
                          <input className={`${input} pl-11 ${err(!name.trim())}`} placeholder={t('add.namePh')} value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" autoCapitalize="words" />
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
                            autoComplete="tel"
                            inputMode="tel"
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
                </section>

            <div className="fixed inset-x-0 bottom-0 z-30 flex items-center justify-between gap-3 border-t border-sv-ink/[0.06] bg-sv-surface/92 px-5 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-card backdrop-blur-xl md:px-10">
              <span className="flex min-w-0 items-center gap-2 text-[12px] font-bold text-sv-ink/40">
                {draftSavedAt > 0 && <><Check className="h-3.5 w-3.5 shrink-0 text-sv-blue" /> <span className="truncate">{t('add.draftSaved')}</span></>}
                <span className="hidden tabular-nums sm:inline">
                  {sectionOk.filter(Boolean).length}/{SECTIONS.length}
                </span>
              </span>
              <div className="flex shrink-0 items-center gap-2">
                <div className="flex flex-col items-end gap-1.5">
                {touched && !formOk && (
                  <span className="text-[12px] font-extrabold text-sv-orange">{t('add.fillRequired')}</span>
                )}
                {failed && (
                  <span className="text-[12px] font-extrabold text-sv-orange">{t('add.publishError')}</span>
                )}
                <button
                  type="button"
                  onClick={publish}
                  disabled={busy}
                  className="min-h-[44px] rounded-full bg-gradient-to-r from-sv-orange-light via-sv-orange to-sv-orange-deep px-8 py-3 text-[14px] font-extrabold text-white shadow-glow-orange transition-all duration-300 hover:-translate-y-0.5 hover:shadow-glow-orange-lg disabled:opacity-60"
                >
                  {busy
                    ? (editId ? t('add.saving') : t('add.publishing'))
                    : (editId ? t('add.save') : t('add.publish'))}
                </button>
                </div>
              </div>
            </div>
          </div>

          <div className="sticky top-[calc(7.75rem+env(safe-area-inset-top,0px))] hidden lg:block">
            <div className="mb-3">
              <div className="text-[14px] font-black text-sv-ink">{t('add.preview')}</div>
              <div className="text-[12px] font-bold text-sv-ink/40">{t('add.previewHint')}</div>
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
                <span className={`text-[13px] font-black ${strengthTone}`}>{strength}%</span>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-sv-ink/[0.06]">
                <motion.div
                  className={`h-full rounded-full ${strengthBar}`}
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
