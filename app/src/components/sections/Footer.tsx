'use client'

import Link from 'next/link'
import { Mail, Phone, MapPin } from 'lucide-react'
import { Logo } from '@/components/Logo'
import { useI18n, type DictKey } from '@/lib/i18n/context'

/* Brand glyphs (lucide-react v1 dropped brand icons) — same 24px stroke style */
function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  )
}
function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  )
}
function YoutubeIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z" />
      <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" />
    </svg>
  )
}
function LinkedinIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
      <rect x="2" y="9" width="4" height="12" />
      <circle cx="4" cy="4" r="2" />
    </svg>
  )
}

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
      { key: 'footer.sv.projects', href: '/projects' },
      { key: 'footer.sv.agents', href: '/advertise' },
      { key: 'footer.sv.developers', href: '/advertise' },
      { key: 'footer.sv.renovation', href: '/contact' },
      { key: 'footer.sv.mortgage', href: '/contact' },
      { key: 'footer.sv.ai', href: '/#ai' },
    ],
  },
  {
    titleKey: 'footer.colCompany',
    links: [
      { key: 'footer.co.about', href: '/about' },
      { key: 'footer.co.careers', href: '/contact' },
      { key: 'footer.co.blog', href: '/blog' },
      { key: 'footer.co.partnership', href: '/contact' },
      { key: 'footer.co.ads', href: '/advertise' },
      { key: 'footer.co.contact', href: '/contact' },
    ],
  },
]

const SOCIALS = [
  { icon: FacebookIcon, label: 'Facebook' },
  { icon: InstagramIcon, label: 'Instagram' },
  { icon: YoutubeIcon, label: 'YouTube' },
  { icon: LinkedinIcon, label: 'LinkedIn' },
]

export default function Footer() {
  const { t } = useI18n()

  return (
    <footer className="relative overflow-hidden border-t border-white/[0.07] bg-sv-navy">
      <div aria-hidden className="absolute inset-0 bg-grid-dark opacity-50" />
      <div aria-hidden className="absolute -top-40 left-1/3 h-[360px] w-[560px] rounded-full bg-sv-blue/10 blur-[160px]" />
      <div className="relative mx-auto max-w-[1440px] px-5 py-16 md:px-10 md:py-20">
        <div className="grid gap-12 lg:grid-cols-[1.3fr_1fr_1fr_1fr]">
          <div>
            <Logo light />
            <p className="mt-5 max-w-[320px] text-[14px] font-medium leading-relaxed text-white/50">
              {t('footer.tagline')}
            </p>
            <div className="mt-6 space-y-2.5 text-[14px] font-semibold text-white/60">
              <a href="mailto:info@sivrce.ge" className="flex items-center gap-2.5 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sv-blue-light focus-visible:ring-offset-2 focus-visible:ring-offset-sv-navy">
                <Mail className="h-4 w-4 text-sv-blue-light" /> info@sivrce.ge
              </a>
              <a href="tel:+995322000000" className="flex items-center gap-2.5 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sv-blue-light focus-visible:ring-offset-2 focus-visible:ring-offset-sv-navy">
                <Phone className="h-4 w-4 text-sv-blue-light" /> +995 32 2 00 00 00
              </a>
              <span className="flex items-center gap-2.5">
                <MapPin className="h-4 w-4 text-sv-blue-light" /> {t('footer.location')}
              </span>
            </div>
            <div className="mt-7 flex gap-3">
              {SOCIALS.map((s) => (
                <a
                  key={s.label}
                  href="#"
                  aria-label={s.label}
                  className="grid h-11 w-11 place-items-center rounded-full border border-white/10 text-white/60 transition-all duration-300 hover:border-sv-blue hover:bg-sv-blue hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sv-blue-light focus-visible:ring-offset-2 focus-visible:ring-offset-sv-navy"
                >
                  <s.icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {COLS.map((c) => (
            <div key={c.titleKey}>
              <h4 className="text-[13px] font-black uppercase tracking-wider text-white/60">{t(c.titleKey)}</h4>
              <ul className="mt-5 space-y-3">
                {c.links.map((l) => (
                  <li key={l.key}>
                    <Link
                      href={l.href}
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

        <div className="mt-14 flex flex-wrap items-center justify-between gap-4 border-t border-white/[0.07] pt-8">
          <p className="text-[13px] font-semibold text-white/55">
            {t('footer.rights')}
          </p>
          <div className="flex gap-6 text-[13px] font-semibold text-white/60">
            <Link href="/terms" className="transition-colors hover:text-white">{t('footer.terms')}</Link>
            <Link href="/privacy" className="transition-colors hover:text-white">{t('footer.privacy')}</Link>
            <Link href="/privacy#cookies" className="transition-colors hover:text-white">{t('footer.cookies')}</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
