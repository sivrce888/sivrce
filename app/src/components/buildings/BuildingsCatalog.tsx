'use client'

import { useMemo, useState } from 'react'
import Image from 'next/image'
import { MapPin, Building2, Star, Search } from 'lucide-react'
import LocalizedLink from '@/components/LocalizedLink'
import type { BuildingCatalogEntry } from '@/data/buildings'
import { DEAL_BRAND } from '@/lib/category-brand'
import { cityName, MICRO, DISTRICTS, type DirLoc } from '@/lib/directory-seo-lite'
import { MetroLine } from '@/components/MetroLine'

type Counts = { sale: number; rent: number; daily: number; pledge: number }

type Props = {
  buildings: BuildingCatalogEntry[]
  countsBySlug: Record<string, Counts>
  developerNames: Record<string, string>
  loc: DirLoc
}

const empty: Counts = { sale: 0, rent: 0, daily: 0, pledge: 0 }

const L: Record<DirLoc | 'tr' | 'ar' | 'de' | 'he' | 'hy' | 'az' | 'uk', {
  search: string; allCity: string; allDistrict: string; allUbani: string; all: string
  ready: string; construction: string; cityAria: string; districtAria: string
  ubaniAria: string; statusAria: string; nBuildings: (n: number) => string
  none: string; forSale: string; rent: string; daily: string; pledge: string
  listings: (n: number) => string; floorsAbbr: string; unitsAbbr: string
}> = {
  ka: {
    search: 'ძებნა სახელით, უბნით, მისამართით ან დეველოპერით',
    allCity: 'ყველა ქალაქი', allDistrict: 'ყველა რაიონი', allUbani: 'ყველა უბანი', all: 'ყველა',
    ready: 'ჩაბარებული', construction: 'მშენებარე',
    cityAria: 'ქალაქი', districtAria: 'რაიონი', ubaniAria: 'უბანი', statusAria: 'სტატუსი',
    nBuildings: (n) => `${n} შენობა`,
    none: '{t.none}',
    forSale: 'იყიდება', rent: 'ქირა', daily: 'დღიურად', pledge: 'გირავნობა',
    listings: (n) => `${n} განცხადება`, floorsAbbr: 'სართ.', unitsAbbr: 'ბინა',
  },
  en: {
    search: 'Search by name, neighborhood, address or developer',
    allCity: 'All cities', allDistrict: 'All districts', allUbani: 'All neighborhoods', all: 'All',
    ready: 'Completed', construction: 'Under construction',
    cityAria: 'City', districtAria: 'District', ubaniAria: 'Neighborhood', statusAria: 'Status',
    nBuildings: (n) => `${n} buildings`,
    none: 'Nothing found — change a filter or the search term',
    forSale: 'for sale', rent: 'rent', daily: 'daily', pledge: 'pledge',
    listings: (n) => `${n} listings`, floorsAbbr: 'fl.', unitsAbbr: 'units',
  },
  ru: {
    search: 'Поиск по названию, кварталу, адресу или застройщику',
    allCity: 'Все города', allDistrict: 'Все районы', allUbani: 'Все кварталы', all: 'Все',
    ready: 'Сдан', construction: 'Строится',
    cityAria: 'Город', districtAria: 'Район', ubaniAria: 'Квартал', statusAria: 'Статус',
    nBuildings: (n) => `${n} корпусов`,
    none: 'Ничего не найдено — измените фильтр или запрос',
    forSale: 'продажа', rent: 'аренда', daily: 'посуточно', pledge: 'залог',
    listings: (n) => `${n} объявлений`, floorsAbbr: 'эт.', unitsAbbr: 'кв.',
  },
  tr: {
    search: 'İsim, mahalle, adres veya müteahhit ile arayın',
    allCity: 'Tüm şehirler', allDistrict: 'Tüm ilçeler', allUbani: 'Tüm mahalleler', all: 'Tümü',
    ready: 'Teslim edildi', construction: 'İnşaat halinde',
    cityAria: 'Şehir', districtAria: 'İlçe', ubaniAria: 'Mahalle', statusAria: 'Durum',
    nBuildings: (n) => `${n} bina`,
    none: 'Sonuç bulunamadı — filtreyi veya arama terimini değiştirin',
    forSale: 'satılık', rent: 'kiralık', daily: 'günlük', pledge: 'ipotekli',
    listings: (n) => `${n} ilan`, floorsAbbr: 'kat.', unitsAbbr: 'daire',
  },
  ar: {
    search: 'ابحث بالاسم أو الحي أو العنوان أو المطوّر',
    allCity: 'كل المدن', allDistrict: 'كل المناطق', allUbani: 'كل الأحياء', all: 'الكل',
    ready: 'جاهز', construction: 'قيد الإنشاء',
    cityAria: 'المدينة', districtAria: 'المنطقة', ubaniAria: 'الحي', statusAria: 'الحالة',
    nBuildings: (n) => `${n} مبنى`,
    none: 'لا توجد نتائج — غيّر عامل التصفية أو كلمة البحث',
    forSale: 'للبيع', rent: 'إيجار', daily: 'يومي', pledge: 'مرهون',
    listings: (n) => `${n} إعلان`, floorsAbbr: 'طوابق', unitsAbbr: 'وحدات',
  },
  de: {
    search: 'Nach Name, Viertel, Adresse oder Bauträger suchen',
    allCity: 'Alle Städte', allDistrict: 'Alle Bezirke', allUbani: 'Alle Viertel', all: 'Alle',
    ready: 'Fertiggestellt', construction: 'Im Bau',
    cityAria: 'Stadt', districtAria: 'Bezirk', ubaniAria: 'Viertel', statusAria: 'Status',
    nBuildings: (n) => `${n} Gebäude`,
    none: 'Nichts gefunden — Filter oder Suchbegriff ändern',
    forSale: 'Kauf', rent: 'Miete', daily: 'täglich', pledge: 'Pfand',
    listings: (n) => `${n} Inserate`, floorsAbbr: 'Et.', unitsAbbr: 'WE',
  },
  he: {
    search: 'חיפוש לפי שם, שכונה, כתובת או יזם',
    allCity: 'כל הערים', allDistrict: 'כל הרובעים', allUbani: 'כל השכונות', all: 'הכל',
    ready: 'נמסר', construction: 'בבנייה',
    cityAria: 'עיר', districtAria: 'רובע', ubaniAria: 'שכונה', statusAria: 'סטטוס',
    nBuildings: (n) => `${n} בניינים`,
    none: 'לא נמצאו תוצאות — שנו מסנן או טקסט חיפוש',
    forSale: 'למכירה', rent: 'להשכרה', daily: 'יומי', pledge: 'ממושכן',
    listings: (n) => `${n} מודעות`, floorsAbbr: 'קומות', unitsAbbr: 'דירות',
  },
  hy: {
    search: 'Որոնում անվամբ, թաղամասով, հասցեով կամ դեվելոպերով',
    allCity: 'Բոլոր քաղաքները', allDistrict: 'Բոլոր թաղամասերը', allUbani: 'Բոլոր թաղերը', all: 'Բոլորը',
    ready: 'Հանձնված', construction: 'Կառուցվում է',
    cityAria: 'Քաղաք', districtAria: 'Թաղամաս', ubaniAria: 'Թաղ', statusAria: 'Կարգավիճակ',
    nBuildings: (n) => `${n} շենք`,
    none: 'Ոչինչ չի գտնվել — փոխեք ֆիլտրը կամ հարցումը',
    forSale: 'վաճառք', rent: 'վարձակալություն', daily: 'օրեկան', pledge: 'գրավ',
    listings: (n) => `${n} հայտարարություն`, floorsAbbr: 'հարկ.', unitsAbbr: 'բն.',
  },
  az: {
    search: 'Ad, məhəllə, ünvan və ya tikinti şirkəti ilə axtarış',
    allCity: 'Bütün şəhərlər', allDistrict: 'Bütün rayonlar', allUbani: 'Bütün məhəllələr', all: 'Bütün',
    ready: 'Təhvil verilib', construction: 'Tikilir',
    cityAria: 'Şəhər', districtAria: 'Rayon', ubaniAria: 'Məhəllə', statusAria: 'Status',
    nBuildings: (n) => `${n} bina`,
    none: 'Heç nə tapılmadı — filtri və ya sorğunu dəyişdirin',
    forSale: 'satılıq', rent: 'kirayə', daily: 'günlük', pledge: 'girova',
    listings: (n) => `${n} elan`, floorsAbbr: 'mərt.', unitsAbbr: 'mənzil',
  },
  uk: {
    search: 'Пошук за назвою, кварталом, адресою або забудовником',
    allCity: 'Усі міста', allDistrict: 'Усі райони', allUbani: 'Усі квартали', all: 'Усі',
    ready: 'Зданий', construction: 'Будується',
    cityAria: 'Місто', districtAria: 'Район', ubaniAria: 'Квартал', statusAria: 'Статус',
    nBuildings: (n) => `${n} корпусів`,
    none: 'Нічого не знайдено — змініть фільтр або запит',
    forSale: 'продаж', rent: 'оренда', daily: 'подобово', pledge: 'застава',
    listings: (n) => `${n} оголошень`, floorsAbbr: 'пов.', unitsAbbr: 'кв.',
  },
}

/** District/ubani names are KA data keys — show the locale name when one exists. */
function geoName(ka: string, loc: DirLoc): string {
  if (loc === 'ka') return ka
  const d = DISTRICTS.find((x) => x.ka === ka)
  if (d) return loc === 'ru' ? d.ru : d.en
  return ka
}

export function BuildingsCatalog({ buildings, countsBySlug, developerNames, loc }: Props) {
  const t = L[loc] ?? L.en
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
      const dev = (b.developerSlug ? developerNames[b.developerSlug] : undefined) ?? ''
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
            placeholder={t.search}
            className="h-12 w-full rounded-control border border-sv-ink/[0.08] bg-sv-cloud pl-10 pr-4 text-[15px] font-semibold text-sv-ink outline-none transition focus:border-sv-blue focus:ring-2 focus:ring-sv-blue/20"
          />
        </label>

        <div className="flex flex-wrap gap-2" role="tablist" aria-label={t.cityAria}>
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
              {c === 'all' ? t.allCity : cityName(c, loc)}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-2" role="tablist" aria-label={t.districtAria}>
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
                  : 'bg-sv-cloud text-sv-ink/60 hover:bg-sv-ink/[0.06]'
              }`}
            >
              {d === 'all' ? t.allDistrict : geoName(d, loc)}
            </button>
          ))}
        </div>

        {ubanis.length > 2 && (
          <div className="flex flex-wrap gap-2" role="tablist" aria-label={t.ubaniAria}>
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
                    : 'bg-sv-cloud text-sv-ink/60 hover:bg-sv-ink/[0.06]'
                }`}
              >
                {u === 'all' ? t.allUbani : geoName(u, loc)}
              </button>
            ))}
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2" role="tablist" aria-label={t.statusAria}>
            {(
              [
                ['all', t.all],
                ['ready', t.ready],
                ['construction', t.construction],
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
                    ? 'bg-sv-orange text-sv-ink'
                    : 'bg-sv-cloud text-sv-ink/60 hover:bg-sv-ink/[0.06]'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <p className="text-[13px] font-bold text-sv-ink/60">{t.nBuildings(filtered.length)}</p>
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="rounded-module border border-dashed border-sv-ink/15 bg-sv-surface px-6 py-16 text-center text-[15px] font-semibold text-sv-ink/60">
          {t.none}
        </p>
      ) : (
        <div className="sv-card-grid-3">
          {filtered.map((b, i) => {
            const devName = b.developerSlug ? developerNames[b.developerSlug] : undefined
            const counts = countsBySlug[b.slug] ?? empty
            const total = counts.sale + counts.rent + counts.daily + counts.pledge
            const place = [b.district, b.ubani]
              .filter((n): n is string => Boolean(n))
              .map((n) => geoName(n, loc))
              .join(' · ')
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
                      {b.status === 'ready' ? t.ready : t.construction}
                    </span>
                    <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between gap-2">
                      <div className="min-w-0">
                        <p className="mb-0.5 truncate text-[11px] font-bold tracking-wide text-white/70">
                          {place}
                        </p>
                        <h2 className="truncate text-[20px] font-black text-white [text-shadow:0_2px_10px_rgba(5,11,38,0.55)]">
                          {loc === 'ka' ? b.name : b.nameEn}
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
                    <p className="flex items-center gap-1.5 text-[13px] font-semibold text-sv-ink/60">
                      <MapPin className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">{b.address}</span>
                    </p>
                    <MetroLine lat={b.coords.lat} lng={b.coords.lng} />
                    <p className="line-clamp-2 text-[13px] font-medium leading-snug text-sv-ink/60">
                      {b.description[loc]}
                    </p>
                    <div className="flex flex-wrap gap-2 text-[11px] font-extrabold">
                      <span style={{ color: DEAL_BRAND.sale }}>{counts.sale} {t.forSale}</span>
                      <span style={{ color: DEAL_BRAND.rent }}>{counts.rent} {t.rent}</span>
                      <span style={{ color: DEAL_BRAND.daily }}>{counts.daily} {t.daily}</span>
                      <span style={{ color: DEAL_BRAND.pledge }}>{counts.pledge} {t.pledge}</span>
                    </div>
                    <p className="inline-flex flex-wrap items-center gap-1.5 text-[12px] font-bold text-sv-ink/60">
                      <Building2 className="h-3.5 w-3.5" />
                      {t.listings(total)} · {b.floors} {t.floorsAbbr}
                      {b.units ? ` · ${b.units} ${t.unitsAbbr}` : ''}
                      {b.priceFromM2 ? ` · ${b.priceFromM2}${MICRO[loc].perM2}` : ''}
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
