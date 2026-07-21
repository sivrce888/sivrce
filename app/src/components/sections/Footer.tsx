'use client'

import Link from 'next/link'
import { Mail, Phone, MapPin } from 'lucide-react'
import { Logo } from '@/components/Logo'
import { useI18n, localizedHref, type DictKey } from '@/lib/i18n/context'
import { footerKeywordCols, type SeoLoc } from '@/lib/seo-pages'

/** Exact-query keyword columns — computed once from the static catalog. */
const KEYWORD_COLS = footerKeywordCols()

const COLS: { titleKey: DictKey; links: { key: DictKey; href: string }[] }[] = [
  {
    titleKey: 'footer.colRealEstate',
    links: [
      { key: 'footer.re.apartments', href: '/sale/apartments' },
      { key: 'footer.re.houses', href: '/sale/houses' },
      { key: 'footer.re.rent', href: '/rent/apartments' },
      { key: 'footer.re.daily', href: '/daily' },
      { key: 'footer.re.land', href: '/sale/land' },
      { key: 'footer.re.commercial', href: '/sale/commercial' },
      { key: 'nav.neighborhoods', href: '/neighborhoods' },
    ],
  },
  {
    titleKey: 'footer.colServices',
    links: [
      { key: 'nav.map', href: '/map' },
      { key: 'nav.buildings', href: '/buildings' },
      { key: 'footer.sv.projects', href: '/projects' },
      { key: 'footer.sv.agents', href: '/advertise' },
      { key: 'footer.sv.developers', href: '/advertise' },
      { key: 'footer.sv.renovation', href: '/contact' },
      { key: 'footer.sv.mortgage', href: '/mortgage-calculator' },
      { key: 'footer.sv.ai', href: '/#ai' },
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

export default function Footer() {
  const { t, lang } = useI18n()
  const loc: SeoLoc = lang === 'en' || lang === 'ru' ? lang : 'ka'

  return (
    <footer className="relative overflow-hidden border-t border-white/[0.07] bg-sv-navy">
      <div aria-hidden className="absolute inset-0 bg-grid-dark opacity-50" />
      <div aria-hidden className="absolute -top-40 left-1/3 h-[360px] w-[560px] rounded-full bg-sv-blue/10 blur-[160px]" />
      <div className="relative mx-auto max-w-[1440px] px-5 py-16 md:px-10 md:py-20">
        <div className="grid gap-12 lg:grid-cols-[1.3fr_1fr_1fr_1fr]">
          <div>
            <Logo light href={localizedHref('/', lang)} />
            <p className="mt-5 max-w-[320px] text-[14px] font-medium leading-relaxed text-white/50">
              {t('footer.tagline')}
            </p>
            <div className="mt-6 space-y-1 text-[14px] font-semibold text-white/60">
              <a href="mailto:hi@sivrce.ge" className="flex items-center gap-2.5 py-1.5 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sv-blue-light focus-visible:ring-offset-2 focus-visible:ring-offset-sv-navy">
                <Mail className="h-4 w-4 text-sv-blue-light" /> hi@sivrce.ge
              </a>
              <a href="tel:+995322000000" className="flex items-center gap-2.5 py-1.5 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sv-blue-light focus-visible:ring-offset-2 focus-visible:ring-offset-sv-navy">
                <Phone className="h-4 w-4 text-sv-blue-light" /> +995 32 2 00 00 00
              </a>
              <span className="flex items-center gap-2.5 py-1.5">
                <MapPin className="h-4 w-4 text-sv-blue-light" /> {t('footer.location')}
              </span>
            </div>
          </div>

          {COLS.map((c) => (
            <div key={c.titleKey}>
              <p className="text-[13px] font-black uppercase tracking-wider text-white/60">{t(c.titleKey)}</p>
              <ul className="mt-5 space-y-3">
                {c.links.map((l) => (
                  <li key={l.key}>
                    <Link
                      href={localizedHref(l.href, lang)}
                      className="text-[14px] font-semibold text-white/65 transition-colors hover:text-white"
                    >
                      {t(l.key)}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Exact-query keyword columns (ss.ge/myhome pattern) — anchors match
            each hub page's <h1>; only inventory-carrying pages are linked. */}
        <nav aria-label="Popular searches" className="mt-14 border-t border-white/[0.07] pt-10">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {KEYWORD_COLS.map((c) => (
              <div key={c.id}>
                <p className="text-[13px] font-black uppercase tracking-wider text-white/45">{c.title[loc]}</p>
                <ul className="mt-4 space-y-2">
                  {c.links.map((l) => (
                    <li key={l.href}>
                      <Link
                        href={localizedHref(l.href, lang)}
                        className="block text-[13px] font-semibold leading-snug text-white/55 transition-colors hover:text-white"
                      >
                        {l.label[loc]}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </nav>

        <div className="mt-14 flex flex-wrap items-center justify-between gap-4 border-t border-white/[0.07] pt-8">
          <p className="text-[13px] font-semibold text-white/55">
            {t('footer.rights')}
          </p>
          <div className="flex items-center gap-6 text-[13px] font-semibold text-white/60">
            {/* ponytail: text link only — counter.js sets 3P cookies (LH BP fail) */}
            <a
              href="https://top.ge/rate?id=117677"
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 transition-colors hover:text-white"
            >
              TOP.GE
            </a>
            <Link href={localizedHref("/terms", lang)} className="transition-colors hover:text-white">{t('footer.terms')}</Link>
            <Link href={localizedHref("/privacy", lang)} className="transition-colors hover:text-white">{t('footer.privacy')}</Link>
            <Link href={localizedHref("/privacy#cookies", lang)} className="transition-colors hover:text-white">{t('footer.cookies')}</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
