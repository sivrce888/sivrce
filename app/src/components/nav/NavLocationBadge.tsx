'use client'

import { useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import { MapPin, ChevronDown, Check } from 'lucide-react'
import { Flag, type FlagCode } from '@/components/Flag'
import { COM_ORIGIN, COUNTRY_IDS, MARKETS, parseCountryPath, type PathCountryId } from '@/lib/markets'
import { useI18n } from '@/lib/i18n/context'
import { cityBySlug } from '@/lib/map/user-place'

const MARKET_LABELS: Record<string, { ka: string; en: string }> = {
  ge: { ka: 'საქართველო', en: 'Georgia' },
  de: { ka: 'გერმანია', en: 'Germany' },
  ae: { ka: 'არაბთა საამიროები', en: 'UAE' },
  us: { ka: 'აშშ', en: 'USA' },
  gb: { ka: 'დიდი ბრიტანეთი', en: 'UK' },
  es: { ka: 'ესპანეთი', en: 'Spain' },
  fr: { ka: 'საფრანგეთი', en: 'France' },
  tr: { ka: 'თურქეთი', en: 'Turkey' },
  cy: { ka: 'კვიპროსი', en: 'Cyprus' },
  gr: { ka: 'საბერძნეთი', en: 'Greece' },
  it: { ka: 'იტალია', en: 'Italy' },
  pt: { ka: 'პორტუგალია', en: 'Portugal' },
  nl: { ka: 'ნიდერლანდები', en: 'Netherlands' },
  ch: { ka: 'შვეიცარია', en: 'Switzerland' },
  at: { ka: 'ავსტრია', en: 'Austria' },
  pl: { ka: 'პოლონეთი', en: 'Poland' },
  cz: { ka: 'ჩეხეთი', en: 'Czech Republic' },
  hu: { ka: 'უნგრეთი', en: 'Hungary' },
  ie: { ka: 'ირლანდია', en: 'Ireland' },
  se: { ka: 'შვედეთი', en: 'Sweden' },
  dk: { ka: 'დანია', en: 'Denmark' },
  no: { ka: 'ნორვეგია', en: 'Norway' },
  fi: { ka: 'ფინეთი', en: 'Finland' },
  be: { ka: 'ბელგია', en: 'Belgium' },
  lu: { ka: 'ლუქსემბურგი', en: 'Luxembourg' },
  sa: { ka: 'საუდის არაბეთი', en: 'Saudi Arabia' },
  qa: { ka: 'ყატარი', en: 'Qatar' },
  kw: { ka: 'ქუვეითი', en: 'Kuwait' },
  bh: { ka: 'ბაჰრეინი', en: 'Bahrain' },
  om: { ka: 'ომანი', en: 'Oman' },
  il: { ka: 'ისრაელი', en: 'Israel' },
  sg: { ka: 'სინგაპური', en: 'Singapore' },
  jp: { ka: 'იაპონია', en: 'Japan' },
  kr: { ka: 'სამხრეთ კორეა', en: 'South Korea' },
  au: { ka: 'ავსტრალია', en: 'Australia' },
  nz: { ka: 'ახალი ზელანდია', en: 'New Zealand' },
  ca: { ka: 'კანადა', en: 'Canada' },
  mx: { ka: 'მექსიკა', en: 'Mexico' },
  br: { ka: 'ბრაზილია', en: 'Brazil' },
  ar: { ka: 'არგენტინა', en: 'Argentina' },
  cl: { ka: 'ჩილე', en: 'Chile' },
  th: { ka: 'ტაილანდი', en: 'Thailand' },
  id: { ka: 'ინდონეზია', en: 'Indonesia' },
  my: { ka: 'მალაიზია', en: 'Malaysia' },
  vn: { ka: 'ვიეტნამი', en: 'Vietnam' },
  ph: { ka: 'ფილიპინები', en: 'Philippines' },
  in: { ka: 'ინდოეთი', en: 'India' },
  kz: { ka: 'ყაზახეთი', en: 'Kazakhstan' },
  uz: { ka: 'უზბეკეთი', en: 'Uzbekistan' },
  za: { ka: 'სამხრეთ აფრიკა', en: 'South Africa' },
}

const TOP_ITEMS: { id: 'ge' | PathCountryId; flag: FlagCode }[] = [
  { id: 'ge', flag: 'ge' },
  ...COUNTRY_IDS.map((id) => ({ id, flag: id as FlagCode })),
]

function isComHost() {
  if (typeof window === 'undefined') return false
  const h = window.location.hostname
  return h === 'sivrce.com' || h === 'www.sivrce.com'
}

function marketHref(id: 'ge' | PathCountryId): string {
  if (id === 'ge') {
    return isComHost() ? '/ge' : '/'
  }
  const path = MARKETS[id].pathPrefix
  return isComHost() ? path : `/en${path}`
}

export function NavLocationBadge({ light = false }: { light?: boolean }) {
  const pathname = usePathname()
  const { lang } = useI18n()
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  const parsed = parseCountryPath(pathname)
  const countryId: 'ge' | PathCountryId = parsed?.country ?? 'ge'
  const citySlug = parsed?.city ?? MARKETS[countryId as PathCountryId]?.defaultCitySlug ?? 'tbilisi'
  const cityObj = cityBySlug(citySlug)

  const countryName = (lang === 'ka' ? MARKET_LABELS[countryId]?.ka : MARKET_LABELS[countryId]?.en) ?? countryId.toUpperCase()
  const cityName = cityObj ? (lang === 'ka' ? cityObj.ka : cityObj.en) : citySlug

  useEffect(() => {
    if (!open) return
    const onPointer = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('pointerdown', onPointer)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onPointer)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div ref={rootRef} className="relative inline-flex items-center">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Location & Market"
        className={`group flex h-8 items-center gap-1.5 rounded-full border border-sv-ink/10 px-2.5 text-[11px] font-bold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sv-blue ${
          light
            ? 'bg-sv-ink/5 text-sv-ink hover:bg-sv-ink/10'
            : 'bg-sv-ink/5 text-sv-ink hover:bg-sv-ink/10 dark:border-white/15 dark:bg-white/10 dark:text-white dark:hover:bg-white/20'
        }`}
      >
        <Flag code={countryId as FlagCode} size={14} />
        <span className="max-w-[110px] truncate tracking-tight sm:max-w-[160px]">
          {countryName} <span className="opacity-60">· {cityName}</span>
        </span>
        <ChevronDown className={`h-3 w-3 shrink-0 opacity-60 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>

      <div
        role="menu"
        aria-label="Location & Market"
        inert={!open}
        data-open={open || undefined}
        className="sv-pop glass-light absolute start-0 top-full z-50 mt-2 max-h-[min(22rem,65vh)] w-56 origin-top-start overflow-y-auto rounded-2xl p-1.5 shadow-card"
      >
        <div className="px-3 py-1.5 text-[11px] font-black uppercase tracking-wider text-sv-ink/50">
          {lang === 'ka' ? 'ლოკაცია / ბაზარი' : 'Market / Location'}
        </div>
        {TOP_ITEMS.map((m) => {
          const href = marketHref(m.id)
          const on = m.id === countryId
          const label = (lang === 'ka' ? MARKET_LABELS[m.id]?.ka : MARKET_LABELS[m.id]?.en) ?? m.id.toUpperCase()
          return (
            <a
              key={m.id}
              href={href}
              role="menuitemradio"
              aria-checked={on}
              className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-start text-[13px] font-semibold transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sv-blue ${
                on ? 'bg-sv-blue/10 text-sv-blue' : 'text-sv-ink hover:bg-sv-ink/5'
              }`}
            >
              <Flag code={m.flag} size={16} />
              <span className="flex-1 truncate">{label}</span>
              {on && <Check className="h-4 w-4 shrink-0" />}
            </a>
          )
        })}
      </div>
    </div>
  )
}
