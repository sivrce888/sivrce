'use client'

import { useEffect, useRef, type ReactNode } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Building2, ChevronDown, Lock, Mail, MapPin, MessageCircle, Phone, ShieldCheck, Zap } from 'lucide-react'
import { Logo } from '@/components/Logo'
import HScroll from '@/components/HScroll'
import { setConsent } from '@/lib/consent'
import { useI18n, localizedHref, type DictKey } from '@/lib/i18n/context'
import { stripLangPrefix } from '@/lib/i18n/core'
import { CONTACT_PHONE, telHref, waHref } from '@/lib/inquiries/phone'
import { chromeMarket, countryBasePath, countryIsoForMarket, MARKETS, type PathCountryId } from '@/lib/markets'
import { marketCityLabel } from '@/lib/market-city-label'
import type { SeoLoc } from '@/lib/seo-pages'
import { FOOTER_COLS } from '@/lib/footer-cols.gen'

/** Exact-query keyword columns — build-time snapshot (scripts/gen-footer-cols.ts)
 *  so this client component never imports the seo-pages → data/listings graph. */
const KEYWORD_COLS = FOOTER_COLS
const CITY_COL = KEYWORD_COLS.find((c) => c.id === 'cities')
const GRID_COLS = KEYWORD_COLS.filter((c) => c.id !== 'cities')

const COLS: { titleKey: DictKey; links: { key: DictKey; href: string }[] }[] = [
  {
    titleKey: 'footer.colRealEstate',
    links: [
      { key: 'footer.re.apartments', href: '/sale/apartments' },
      { key: 'footer.re.houses', href: '/sale/houses' },
      { key: 'footer.re.rent', href: '/rent/apartments' },
      { key: 'add.deal.lease', href: '/lease' },
      { key: 'footer.re.daily', href: '/daily/apartments' },
      { key: 'nav.hotels', href: '/hotels' },
      { key: 'col.party', href: '/search?deal=daily&feat=add.f.partiesAllowed' },
      { key: 'footer.re.land', href: '/sale/land' },
      { key: 'footer.re.commercial', href: '/sale/commercial' },
      { key: 'nav.neighborhoods', href: '/neighborhoods' },
    ],
  },
  {
    titleKey: 'footer.colServices',
    links: [
      { key: 'nav.services', href: '/services' },
      { key: 'nav.map', href: '/map' },
      { key: 'nav.cadastre', href: '/cadastre' },
      { key: 'nav.buildings', href: '/buildings' },
      { key: 'footer.sv.projects', href: '/projects' },
      { key: 'footer.sv.agents', href: '/agents' },
      { key: 'footer.sv.agencies', href: '/agencies' },
      { key: 'footer.sv.developers', href: '/developers' },
      { key: 'footer.sv.renovation', href: '/services/renovation' },
      { key: 'footer.sv.mortgage', href: '/mortgage-calculator' },
      { key: 'footer.sv.ai', href: '/services/appraisal' },
    ],
  },
  {
    titleKey: 'footer.colCompany',
    links: [
      { key: 'footer.co.about', href: '/about' },
      { key: 'footer.co.careers', href: '/careers' },
      { key: 'footer.co.blog', href: '/blog' },
      { key: 'footer.co.forum', href: '/forum' },
      { key: 'footer.co.partnership', href: '/contact' },
      { key: 'footer.co.ads', href: '/advertise' },
      { key: 'footer.co.contact', href: '/contact' },
    ],
  },
]

/** German top metro cities (leaf-safe static constants) */
const DE_CITIES = [
  { name: 'Berlin', href: '/de/berlin' },
  { name: 'München', href: '/search?country=DE&city=munich' },
  { name: 'Hamburg', href: '/search?country=DE&city=hamburg' },
  { name: 'Frankfurt am Main', href: '/search?country=DE&city=frankfurt' },
  { name: 'Köln', href: '/search?country=DE&city=cologne' },
  { name: 'Stuttgart', href: '/search?country=DE&city=stuttgart' },
  { name: 'Düsseldorf', href: '/search?country=DE&city=dusseldorf' },
  { name: 'Leipzig', href: '/search?country=DE&city=leipzig' },
  { name: 'Dresden', href: '/search?country=DE&city=dresden' },
  { name: 'Nürnberg', href: '/search?country=DE&city=nuremberg' },
  { name: 'Hannover', href: '/search?country=DE&city=hannover' },
  { name: 'Bremen', href: '/search?country=DE&city=bremen' },
  { name: 'Dortmund', href: '/search?country=DE&city=dortmund' },
  { name: 'Essen', href: '/search?country=DE&city=essen' },
  { name: 'Bonn', href: '/search?country=DE&city=bonn' },
]

/** Trust badges backed by shipped behavior: one-click consent withdrawal
 *  (footer "Cookies" button), opt-in-only analytics, the purchase-cost
 *  calculator, TLS. Deliberately no "konform/geprüft" certification wording. */
const DE_TRUST_BADGES = [
  { id: 'withdraw', Icon: ShieldCheck, tone: 'text-emerald-400', label: { de: 'Cookie-Einwilligung jederzeit widerrufbar', en: 'Cookie consent revocable anytime', ka: 'ქუქიების თანხმობა ნებისმიერ დროს გაუქმდება' } },
  { id: 'optin', Icon: Zap, tone: 'text-amber-400', label: { de: 'Analytics nur nach Opt-in', en: 'Analytics only after opt-in', ka: 'ანალიტიკა მხოლოდ თანხმობის შემდეგ' } },
  { id: 'costs', Icon: Building2, tone: 'text-sv-blue-light', label: { de: 'Notar- & Grunderwerbsteuer-Rechner', en: 'Notary & transfer-tax calculator', ka: 'ნოტარიუსისა და გადასახადების კალკულატორი' } },
  { id: 'tls', Icon: Lock, tone: 'text-white/60', label: { de: 'SSL/TLS verschlüsselt', en: 'SSL/TLS encrypted', ka: 'SSL/TLS დაშიფრული' } },
] as const

/** German-specific SEO keyword and discovery columns */
const DE_GRID_COLS = [
  {
    title: { de: 'Wohnen & Kaufen', en: 'Buy & Rent', ka: 'ყიდვა და ქირაობა' },
    links: [
      { label: { de: 'Wohnung kaufen Berlin', en: 'Buy flat Berlin', ka: 'ბინა ბერლინში' }, href: '/search?country=DE&city=berlin&deal=sale&type=apartment' },
      { label: { de: 'Wohnung mieten Berlin', en: 'Rent flat Berlin', ka: 'ქირა ბერლინში' }, href: '/search?country=DE&city=berlin&deal=rent&type=apartment' },
      { label: { de: 'Wohnung kaufen München', en: 'Buy flat Munich', ka: 'ბინა მიუნხენში' }, href: '/search?country=DE&city=munich&deal=sale&type=apartment' },
      { label: { de: 'Haus kaufen Hamburg', en: 'Buy house Hamburg', ka: 'სახლი ჰამბურგში' }, href: '/search?country=DE&city=hamburg&deal=sale&type=house' },
      { label: { de: 'Mietwohnung Frankfurt', en: 'Rent flat Frankfurt', ka: 'ქირა ფრანკფურტში' }, href: '/search?country=DE&city=frankfurt&deal=rent&type=apartment' },
      { label: { de: 'Altbauwohnung Leipzig', en: 'Period flat Leipzig', ka: 'ბინა ლაიფციგში' }, href: '/search?country=DE&city=leipzig&deal=sale&type=apartment' },
      { label: { de: 'Neubauprojekte Deutschland', en: 'New developments Germany', ka: 'მშენებარე ბინები' }, href: '/de#projects' },
    ],
  },
  {
    title: { de: 'Berlin Bezirke', en: 'Berlin Districts', ka: 'ბერლინის უბნები' },
    links: [
      { label: { de: 'Mitte', en: 'Mitte', ka: 'მიტე' }, href: '/search?country=DE&city=berlin&district=mitte' },
      { label: { de: 'Friedrichshain-Kreuzberg', en: 'Friedrichshain-Kreuzberg', ka: 'ფრიდრიხსჰაინი' }, href: '/search?country=DE&city=berlin&district=friedrichshain-kreuzberg' },
      { label: { de: 'Charlottenburg-Wilmersdorf', en: 'Charlottenburg-Wilmersdorf', ka: 'შარლოტენბურგი' }, href: '/search?country=DE&city=berlin&district=charlottenburg-wilmersdorf' },
      { label: { de: 'Pankow / Prenzlauer Berg', en: 'Pankow / Prenzlauer Berg', ka: 'პანკოვი' }, href: '/search?country=DE&city=berlin&district=pankow' },
      { label: { de: 'Schöneberg & Tempelhof', en: 'Schöneberg & Tempelhof', ka: 'შონებერგი' }, href: '/search?country=DE&city=berlin&district=tempelhof-schoeneberg' },
      { label: { de: 'Neukölln', en: 'Neukölln', ka: 'ნოიკოლნი' }, href: '/search?country=DE&city=berlin&district=neukoelln' },
      { label: { de: 'Steglitz-Zehlendorf', en: 'Steglitz-Zehlendorf', ka: 'შტეგლიცი' }, href: '/search?country=DE&city=berlin&district=steglitz-zehlendorf' },
    ],
  },
  {
    title: { de: 'Tools & Transparenz', en: 'Tools & Intelligence', ka: 'ხელსაწყოები' },
    links: [
      { label: { de: '3D-Karte Deutschland', en: '3D Map Germany', ka: '3D რუკა' }, href: '/map?country=DE' },
      { label: { de: 'U-/S-Bahn Metro Explorer', en: 'U-/S-Bahn Metro Lines', ka: 'მეტრო ხაზები' }, href: '/de/metro' },
      { label: { de: 'Mieten vs. Kaufen Rechner', en: 'Rent vs Buy Calculator', ka: 'ქირაობა თუ ყიდვა' }, href: '/de/miete-oder-kaufen' },
      { label: { de: 'Kaufnebenkosten & Notar', en: 'Purchase Costs & Notary', ka: 'გადასახადები და ნოტარიუსი' }, href: '/de/miete-oder-kaufen#calculator' },
      { label: { de: 'BORIS Bodenrichtwerte', en: 'BORIS Land Values', ka: 'მიწის ფასები BORIS' }, href: '/de/berlin#boris' },
      { label: { de: 'Bauträger & Projekte', en: 'Developers & Projects', ka: 'დეველოპერები' }, href: '/developers?country=DE' },
    ],
  },
  {
    title: { de: 'Recht & Compliance', en: 'Legal & Standards', ka: 'სამართალი და სტანდარტები' },
    links: [
      { label: { de: 'Impressum (§ 5 DDG)', en: 'Imprint (§ 5 DDG)', ka: 'იმპრესუმი' }, href: '/legal/impressum' },
      { label: { de: 'Datenschutz (DSGVO)', en: 'Privacy (GDPR)', ka: 'კონფიდენციალურობა' }, href: '/legal/datenschutz' },
      { label: { de: 'AGB Plattform', en: 'Terms of Service', ka: 'წესები და პირობები' }, href: '/legal/agb' },
      { label: { de: 'Widerrufsbelehrung', en: 'Right of Withdrawal', ka: 'გაუქმების უფლება' }, href: '/legal/widerruf' },
      { label: { de: 'Verbraucherinformationen', en: 'Consumer Information', ka: 'მომხმარებლის ინფორმაცია' }, href: '/legal/verbraucherinformationen' },
      { label: { de: 'Partner- & Werbekennzeichnung', en: 'Partner & ad disclosures', ka: 'პარტნიორები და რეკლამა' }, href: '/legal/partner-disclosures' },
    ],
  },
]

function regionName(iso: string, lang: string): string {
  try {
    const loc = lang === 'ka' || lang === 'ru' || lang === 'de' ? lang : 'en'
    return new Intl.DisplayNames([loc], { type: 'region' }).of(iso) ?? iso
  } catch {
    return iso
  }
}

/** Link column — an accordion under md (a phone footer stays one screen, like
 *  Apple's), a plain open list from md up. Links stay in the DOM either way. */
function FooterCol({ title, children }: { title: string; children: ReactNode }) {
  return (
    <details className="group border-b border-white/[0.07] md:border-0">
      <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 text-[13px] font-black uppercase tracking-wider text-white/60 md:pointer-events-none md:min-h-0 [&::-webkit-details-marker]:hidden">
        {title}
        <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-300 group-open:rotate-180 md:hidden" aria-hidden />
      </summary>
      {children}
    </details>
  )
}

export default function Footer({
  marketIso,
  marketCity,
}: {
  marketIso?: string
  marketCity?: string
} = {}) {
  const { t, lang } = useI18n()
  const pathname = usePathname()
  const rootRef = useRef<HTMLElement>(null)
  // SSR ships the columns closed (phone-first); md+ opens them all.
  useEffect(() => {
    const mq = matchMedia('(min-width: 768px)')
    const sync = () => rootRef.current?.querySelectorAll('details').forEach((d) => { d.open = mq.matches })
    sync()
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [])
  // ponytail: the copyright year was frozen at 2026 in 10 dictionaries — derive it.
  const year = new Date().getFullYear()
  // Columns ship ka/en/ru only — every other locale reads English, never Georgian.
  const loc: SeoLoc = lang === 'ka' || lang === 'ru' ? lang : 'en'
  const deLoc: 'de' | 'en' | 'ka' = lang === 'de' ? 'de' : lang === 'ka' ? 'ka' : 'en'
  const cleanPath = stripLangPrefix(pathname)
  const market = chromeMarket(cleanPath, marketIso)
  const offGe = market !== 'ge'
  const isDe = market === 'de'
  const iso = offGe ? (countryIsoForMarket(market) ?? marketIso?.toUpperCase()) : undefined
  const region = iso ? regionName(iso, lang) : ''
  // marketCity arrives pre-resolved from the server; otherwise the market's
  // default city comes from the 74-row leaf, not the 88 KB city catalog —
  // Footer renders on ~208 routes. Locked by bundle-leak.check.
  const cityLabel =
    marketCity ||
    (offGe && market !== 'global'
      ? marketCityLabel(MARKETS[market as PathCountryId].defaultCitySlug, lang)
      : '')

  const pathId = market !== 'ge' && market !== 'global' ? market : null
  const searchQ = iso ? `country=${iso}&` : ''

  const cols = isDe
    ? [
        {
          title: lang === 'de' ? 'Immobilien' : lang === 'ka' ? 'უძრავი ქონება' : 'Real Estate',
          links: [
            { label: lang === 'de' ? 'Wohnungen zum Kauf' : lang === 'ka' ? 'ბინები იყიდება' : 'Apartments for sale', href: '/search?country=DE&deal=sale&type=apartment' },
            { label: lang === 'de' ? 'Häuser zum Kauf' : lang === 'ka' ? 'სახლები იყიდება' : 'Houses for sale', href: '/search?country=DE&deal=sale&type=house' },
            { label: lang === 'de' ? 'Wohnungen zur Miete' : lang === 'ka' ? 'ბინები ქირავდება' : 'Apartments for rent', href: '/search?country=DE&deal=rent&type=apartment' },
            { label: lang === 'de' ? 'Häuser zur Miete' : lang === 'ka' ? 'სახლები ქირავდება' : 'Houses for rent', href: '/search?country=DE&deal=rent&type=house' },
            { label: lang === 'de' ? 'Neubauprojekte' : lang === 'ka' ? 'მშენებარე ბინები' : 'New developments', href: '/de#projects' },
            { label: lang === 'de' ? 'Gewerbeimmobilien' : lang === 'ka' ? 'კომერციული' : 'Commercial properties', href: '/search?country=DE&type=commercial' },
            { label: lang === 'de' ? 'Grundstücke' : lang === 'ka' ? 'მიწის ნაკვეთები' : 'Plots & land', href: '/search?country=DE&type=land' },
          ],
        },
        {
          title: lang === 'de' ? 'Services & Tools' : lang === 'ka' ? 'სერვისები' : 'Services & Tools',
          links: [
            { label: lang === 'de' ? '3D-Karte Deutschland' : lang === 'ka' ? '3D რუკა' : '3D Map Germany', href: '/map?country=DE' },
            { label: lang === 'de' ? 'U-/S-Bahn Explorer' : lang === 'ka' ? 'მეტრო ექსპლორერი' : 'U-/S-Bahn Explorer', href: '/de/metro' },
            { label: lang === 'de' ? 'Mieten vs. Kaufen' : lang === 'ka' ? 'ქირაობა თუ ყიდვა' : 'Rent vs Buy', href: '/de/miete-oder-kaufen' },
            { label: lang === 'de' ? 'Kaufnebenkosten & Notar' : lang === 'ka' ? 'გადასახადები' : 'Purchase costs & notary', href: '/de/miete-oder-kaufen#calculator' },
            { label: lang === 'de' ? 'BORIS Bodenrichtwerte' : lang === 'ka' ? 'BORIS ფასები' : 'BORIS land values', href: '/de/berlin#boris' },
            { label: lang === 'de' ? 'Bauträger & Entwickler' : lang === 'ka' ? 'დეველოპერები' : 'Developers', href: '/developers?country=DE' },
            { label: lang === 'de' ? 'Immobilienmakler' : lang === 'ka' ? 'აგენტები' : 'Real estate agents', href: '/agents?country=DE' },
          ],
        },
        {
          title: lang === 'de' ? 'Unternehmen & Recht' : lang === 'ka' ? 'კომპანია' : 'Company & Legal',
          links: [
            { label: lang === 'de' ? 'Über uns' : lang === 'ka' ? 'ჩვენ შესახებ' : 'About us', href: '/about' },
            { label: lang === 'de' ? 'Karriere' : lang === 'ka' ? 'კარიერა' : 'Careers', href: '/careers' },
            { label: lang === 'de' ? 'Blog & Ratgeber' : lang === 'ka' ? 'ბლოგი' : 'Blog & guides', href: '/blog' },
            { label: lang === 'de' ? 'Werben auf sivrce' : lang === 'ka' ? 'რეკლამა' : 'Advertise', href: '/advertise' },
            { label: lang === 'de' ? 'Kontakt & Support' : lang === 'ka' ? 'კონტაქტი' : 'Contact & support', href: '/contact' },
            { label: lang === 'de' ? 'Impressum (§ 5 DDG)' : lang === 'ka' ? 'იმპრესუმი (§ 5 DDG)' : 'Imprint (§ 5 DDG)', href: '/legal/impressum' },
            { label: lang === 'de' ? 'Datenschutz (DSGVO)' : lang === 'ka' ? 'კონფიდენციალურობა' : 'Privacy (GDPR)', href: '/legal/datenschutz' },
          ],
        },
      ]
    : offGe
      ? [
          {
            title: t('footer.colRealEstate'),
            links: [
              { label: t('footer.re.apartments'), href: `/search?${searchQ}deal=sale&type=apartment` },
              { label: t('footer.re.houses'), href: `/search?${searchQ}deal=sale&type=house` },
              { label: t('footer.re.rent'), href: `/search?${searchQ}deal=rent` },
              { label: t('nav.hotels'), href: pathId ? `/hotels?city=${MARKETS[pathId].defaultCitySlug}` : '/hotels' },
              { label: t('footer.sv.projects'), href: pathId ? countryBasePath(pathId, pathname) : '/projects' },
              { label: t('nav.map'), href: '/map' },
            ],
          },
          {
            title: t('footer.colServices'),
            links: COLS[1]!.links
              .filter((l) => l.href !== '/cadastre')
              .map((l) => ({ label: t(l.key), href: l.href })),
          },
          {
            title: t('footer.colCompany'),
            links: COLS[2]!.links.map((l) => ({ label: t(l.key), href: l.href })),
          },
        ]
      : COLS.map((c) => ({
          title: t(c.titleKey),
          links: c.links.map((l) => ({ label: t(l.key), href: l.href, key: l.key })),
        }))

  const homeHref = pathId ? countryBasePath(pathId, pathname) : '/'

  return (
    <footer ref={rootRef} data-cms-section="footer" className="relative overflow-hidden border-t border-white/[0.07] bg-sv-navy">
      <div aria-hidden className="absolute inset-0 bg-grid-dark opacity-50" />
      <div aria-hidden className="absolute -top-40 left-1/3 h-[360px] w-[560px] rounded-full bg-sv-blue/10 blur-[160px]" />
      <div className="relative mx-auto max-w-[1440px] px-5 py-16 md:px-10 md:py-20">
        <div className="grid md:gap-12 lg:grid-cols-[minmax(0,1.3fr)_repeat(3,minmax(0,1fr))]">
          <div className="mb-8 md:mb-0">
            <Logo light href={localizedHref(homeHref, lang)} />
            <p data-cms-key="footer.tagline" className="mt-5 max-w-[320px] text-[14px] font-medium leading-relaxed text-white/50">
              {isDe && lang === 'de'
                ? 'sivrce – Immobilien in Deutschland. Wohnungen, Häuser, Neubau – kaufen und mieten. Notar, Grundbuch, Energieausweis, 3D-Karte.'
                : isDe
                  ? 'sivrce — Real estate in Germany. Apartments, houses, new-builds — buy and rent. Notary, Grundbuch, energy certificate, 3D map.'
                  : offGe && lang !== 'de'
                    ? `sivrce — ${region ? `${region}. ` : ''}Buy · rent · new developments.`
                    : t('footer.tagline')}
            </p>
            <div className="mt-6 space-y-1 text-[14px] font-semibold text-white/60">
              <a href={telHref(CONTACT_PHONE)} className="flex items-center gap-2.5 py-1.5 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sv-blue-light focus-visible:ring-offset-2 focus-visible:ring-offset-sv-navy">
                <Phone className="h-4 w-4 text-sv-blue-light" aria-hidden /> <span className="tabular-nums">{CONTACT_PHONE}</span>
              </a>
              <a href={waHref(CONTACT_PHONE)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2.5 py-1.5 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sv-blue-light focus-visible:ring-offset-2 focus-visible:ring-offset-sv-navy">
                <MessageCircle className="h-4 w-4 text-sv-blue-light" aria-hidden /> WhatsApp
              </a>
              <a href="mailto:hi@sivrce.ge" className="flex items-center gap-2.5 py-1.5 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sv-blue-light focus-visible:ring-offset-2 focus-visible:ring-offset-sv-navy">
                <Mail className="h-4 w-4 text-sv-blue-light" aria-hidden /> hi@sivrce.ge
              </a>
              <span className="flex items-center gap-2.5 py-1.5">
                <MapPin className="h-4 w-4 text-sv-blue-light" aria-hidden /> {isDe ? (lang === 'de' ? 'Berlin, Deutschland' : 'Berlin, Germany') : offGe && (cityLabel || region) ? [cityLabel, region].filter(Boolean).join(', ') : t('footer.location')}
              </span>
            </div>
          </div>

          {cols.map((c) => (
            <FooterCol key={c.title} title={c.title}>
              {/* py-1 links + space-y-1: same 30px rhythm, 28px tap targets (WCAG 2.5.8) instead of 18px. */}
              <ul className="space-y-1 pb-5 md:mt-4 md:pb-0">
                {c.links.map((l) => (
                  <li key={'key' in l && l.key ? l.key : l.href}>
                    <Link
                      href={localizedHref(l.href, lang)}
                      {...('key' in l && l.key ? { 'data-cms-key': l.key } : {})}
                      className="inline-block py-1 text-[14px] font-semibold text-white/65 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sv-blue-light focus-visible:ring-offset-2 focus-visible:ring-offset-sv-navy"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </FooterCol>
          ))}
        </div>

        {/* Germany market: German Top Metro Cities & Keyword Grid */}
        {isDe && (
          <nav
            aria-label="Immobilien in Deutschland und Berlin"
            className="mt-8 md:mt-14 md:border-t md:border-white/[0.07] md:pt-10"
          >
            <div className="sv-link-grid max-md:!block">
              {DE_GRID_COLS.map((c) => (
                <FooterCol key={c.title.de} title={c.title[deLoc]}>
                  <ul className="space-y-2 pb-5 md:mt-4 md:pb-0">
                    {c.links.map((l) => (
                      <li key={l.href}>
                        <Link
                          href={localizedHref(l.href, lang)}
                          className="block rounded-sm text-[13px] font-semibold leading-snug text-white/55 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sv-blue-light focus-visible:ring-offset-2 focus-visible:ring-offset-sv-navy"
                        >
                          {l.label[deLoc]}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </FooterCol>
              ))}
            </div>

            {/* German Cities HScroll bar */}
            <div className="mt-10">
              <p className="text-[13px] font-black uppercase tracking-wider text-white/45">
                {lang === 'de' ? 'Städte in Deutschland' : lang === 'ka' ? 'გერმანიის ქალაქები' : 'Cities in Germany'}
              </p>
              <div className="mt-4">
                <HScroll
                  size="sm"
                  invert
                  step={280}
                  aria-label="Städte in Deutschland"
                  className="snap-x snap-proximity gap-2 py-0.5"
                >
                  {DE_CITIES.map((c) => (
                    <Link
                      key={c.href}
                      href={localizedHref(c.href, lang)}
                      className="shrink-0 snap-start whitespace-nowrap rounded-full bg-white/[0.08] px-3.5 py-1.5 text-[13px] font-extrabold tracking-[-0.015em] text-white/75 transition-[color,background-color] duration-300 ease-[cubic-bezier(0.21,0.65,0.2,1)] hover:bg-white/[0.14] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sv-blue-light"
                    >
                      {c.name}
                    </Link>
                  ))}
                </HScroll>
              </div>
            </div>

            {/* German Market Trust & Standards Strip — every badge must be
                backed by shipped behavior; no certification-sounding claims
                while the legal docs carry LEGAL_REVIEW_REQUIRED. */}
            <div className="mt-10 flex flex-wrap items-center gap-3 border-t border-white/[0.05] pt-6">
              {DE_TRUST_BADGES.map((b) => (
                <span key={b.id} className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] font-semibold text-white/70">
                  <b.Icon className={`h-3.5 w-3.5 ${b.tone}`} aria-hidden /> {b.label[deLoc]}
                </span>
              ))}
            </div>
          </nav>
        )}

        {/* Georgia domestic market keyword grid */}
        {!offGe && (
          <nav
            aria-label={t('footer.popularSearches')}
            className="mt-8 md:mt-14 md:border-t md:border-white/[0.07] md:pt-10"
          >
            <div className="sv-link-grid max-md:!block">
              {GRID_COLS.map((c) => (
                <FooterCol key={c.id} title={c.title[loc]}>
                  <ul className="space-y-2 pb-5 md:mt-4 md:pb-0">
                    {c.links.map((l) => (
                      <li key={l.href}>
                        <Link
                          href={localizedHref(l.href, lang)}
                          className="block rounded-sm text-[13px] font-semibold leading-snug text-white/55 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sv-blue-light focus-visible:ring-offset-2 focus-visible:ring-offset-sv-navy"
                        >
                          {l.label[loc]}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </FooterCol>
              ))}
            </div>
            {CITY_COL && (
              <div className="mt-10">
                <p className="text-[13px] font-black uppercase tracking-wider text-white/45">{CITY_COL.title[loc]}</p>
                <div className="mt-4">
                  <HScroll
                    size="sm"
                    invert
                    step={280}
                    aria-label={CITY_COL.title[loc]}
                    className="snap-x snap-proximity gap-2 py-0.5"
                  >
                    {CITY_COL.links.map((l) => (
                      <Link
                        key={l.href}
                        href={localizedHref(l.href, lang)}
                        className="shrink-0 snap-start whitespace-nowrap rounded-full bg-white/[0.08] px-3.5 py-1.5 text-[13px] font-extrabold tracking-[-0.015em] text-white/75 transition-[color,background-color] duration-300 ease-[cubic-bezier(0.21,0.65,0.2,1)] hover:bg-white/[0.14] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sv-blue-light"
                      >
                        {l.label[loc]}
                      </Link>
                    ))}
                  </HScroll>
                </div>
              </div>
            )}
          </nav>
        )}

        <div className="mt-14 flex flex-wrap items-center justify-between gap-4 border-t border-white/[0.07] pt-8">
          <p className="text-[13px] font-semibold text-white/55">
            {isDe
              ? `© ${year} Sivrce Germany • sivrce.com/de • sivrce.de`
              : offGe
                ? `© ${year} Sivrce • sivrce.com`
                : t('footer.rights', { year })}
          </p>
          <div className="flex flex-wrap items-center gap-6 text-[13px] font-semibold text-white/60">
            {market === 'de' ? (
              <>
                <Link href={localizedHref('/legal/impressum', lang)} className="rounded-sm transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sv-blue-light focus-visible:ring-offset-2 focus-visible:ring-offset-sv-navy">Impressum</Link>
                <Link href={localizedHref('/legal/datenschutz', lang)} data-cms-key="footer.privacy" className="rounded-sm transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sv-blue-light focus-visible:ring-offset-2 focus-visible:ring-offset-sv-navy">{t('footer.privacy')}</Link>
                <Link href={localizedHref('/legal/agb', lang)} data-cms-key="footer.terms" className="rounded-sm transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sv-blue-light focus-visible:ring-offset-2 focus-visible:ring-offset-sv-navy">{t('footer.terms')}</Link>
                <Link href={localizedHref('/legal/widerruf', lang)} className="rounded-sm transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sv-blue-light focus-visible:ring-offset-2 focus-visible:ring-offset-sv-navy">Widerruf</Link>
                <Link href={localizedHref('/legal/verbraucherinformationen', lang)} className="rounded-sm transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sv-blue-light focus-visible:ring-offset-2 focus-visible:ring-offset-sv-navy">Verbraucherinfo</Link>
                <Link href={localizedHref('/legal/cookies', lang)} className="rounded-sm transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sv-blue-light focus-visible:ring-offset-2 focus-visible:ring-offset-sv-navy">{lang === 'de' ? 'Cookie-Richtlinie' : 'Cookie Policy'}</Link>
              </>
            ) : (
              <>
                <Link href={localizedHref("/terms", lang)} data-cms-key="footer.terms" className="rounded-sm transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sv-blue-light focus-visible:ring-offset-2 focus-visible:ring-offset-sv-navy">{t('footer.terms')}</Link>
                <Link href={localizedHref("/privacy", lang)} data-cms-key="footer.privacy" className="rounded-sm transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sv-blue-light focus-visible:ring-offset-2 focus-visible:ring-offset-sv-navy">{t('footer.privacy')}</Link>
              </>
            )}
            {/* Withdrawal must be as easy as consent (DSGVO Art. 7(3)): one
                click clears the decision, purges tracker state, reopens the prompt. */}
            <button type="button" onClick={() => setConsent(null)} data-cms-key="footer.cookies" className="rounded-sm transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sv-blue-light focus-visible:ring-offset-2 focus-visible:ring-offset-sv-navy">{t('footer.cookies')}</button>
          </div>
        </div>
      </div>
    </footer>
  )
}
