'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Heart, Menu, X, Plus, Search, Phone } from 'lucide-react'
import { Logo } from '@/components/Logo'
import { LangSwitcher } from '@/components/LangSwitcher'
import { CurrencySwitcher } from '@/components/CurrencySwitcher'
import { ThemeToggle } from '@/components/ThemeToggle'
import { AccountMenu } from '@/components/nav/AccountMenu'
import { CONTACT_PHONE, telHref } from '@/lib/inquiries/phone'
import { useFavorites } from '@/lib/favorites'
import { useI18n, localizedHref, stripLangPrefix } from '@/lib/i18n/context'
import type { DictKey } from '@/lib/i18n/context'

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  const { count } = useFavorites()
  const { t, lang } = useI18n()
  const pathname = usePathname()
  // Locale-agnostic path for chrome state (hero transparency, hash links) —
  // also strips the internal /ka rewrite target so SSR and hydration agree.
  const bare = stripLangPrefix(pathname)
  const menuBtnRef = useRef<HTMLButtonElement>(null)

  // Escape closes the mobile menu and returns focus to the menu button
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false)
        menuBtnRef.current?.focus()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  // Close the mobile menu on route change (render-time state adjustment)
  const [prevPathname, setPrevPathname] = useState(pathname)
  if (prevPathname !== pathname) {
    setPrevPathname(pathname)
    setOpen(false)
  }

  // On homepage top: transparent bar. Light theme = ink chrome over the day
  // sky; dark theme = white chrome over the night sky. Everywhere else (or
  // once scrolled) the glass pill uses ink tokens (they flip in .dark).
  const light = scrolled || bare !== '/'
  // Field lives on home hero + /search + map. Nav gets an icon so inner pages
  // (and the home pill after scroll) still have one tap to search.
  const searchEntry = !bare.startsWith('/search') && (bare !== '/' || scrolled)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Desktop: deal types + services at every width; 3D map + projects join at
  // ≥1280 (xl). Budgeted against the TIGHTEST state — inner-page glass pill
  // with the search icon — not the roomier homepage hero: 1024 fits 4 ka
  // labels and 1280 fits all 6 only while the add-listing CTA is icon-only
  // (its label returns at ≥1366). Rest → hamburger + footer. Keep 6 as the
  // hard cap.
  const NAV_LINKS: { key: DictKey; to: string; mobileOnly?: boolean; xlOnly?: boolean }[] = [
    { key: 'nav.buy', to: '/sale' },
    { key: 'nav.rent', to: '/rent' },
    { key: 'nav.daily', to: '/daily' },
    { key: 'map.pledge', to: '/pledge', mobileOnly: true },
    { key: 'nav.map', to: '/map', xlOnly: true },
    { key: 'nav.projects', to: '/projects', xlOnly: true },
    { key: 'nav.services', to: '/services' },
    { key: 'nav.buildings', to: '/buildings', mobileOnly: true },
    { key: 'nav.neighborhoods', to: '/neighborhoods', mobileOnly: true },
    { key: 'nav.blog', to: '/blog', mobileOnly: true },
    { key: 'nav.forum', to: '/forum', mobileOnly: true },
    { key: 'nav.agents', to: '/agents', mobileOnly: true },
    { key: 'nav.agencies', to: '/agencies', mobileOnly: true },
    { key: 'nav.developers', to: '/developers', mobileOnly: true },
    { key: 'nav.advertise', to: '/advertise', mobileOnly: true },
    { key: 'nav.search', to: '/search', mobileOnly: true },
  ]

  const isActive = (to: string) => {
    if (to.includes('#')) return false
    return bare === to || bare.startsWith(`${to}/`)
  }

  return (
    <header data-cms-section="nav" className="sv-nav-in fixed inset-x-0 top-0 z-50 pt-[env(safe-area-inset-top,0px)]">
      <div
        className={`mx-auto flex min-h-[clamp(3.75rem,3.4rem+1vw,4.25rem)] min-w-0 w-full max-w-[1440px] items-center gap-2 px-5 py-1.5 transition-[margin-top,max-width,border-radius,background-color,box-shadow] duration-500 sm:gap-3 md:px-10 ${
          light
            ? 'mt-3 max-w-[1240px] rounded-tile glass-light shadow-card md:mt-4'
            : 'bg-transparent'
        }`}
      >
        <div className="shrink-0">
          <Logo adaptive href={localizedHref('/', lang)} />
        </div>

        <nav
          className="hidden min-w-0 flex-1 items-center justify-center gap-0 lg:flex"
          aria-label={t('nav.main')}
        >
          {NAV_LINKS.map((l) => {
            const active = isActive(l.to)
            const cls = `whitespace-nowrap rounded-full px-2 py-2 text-[13px] font-semibold transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sv-blue focus-visible:ring-offset-2 xl:px-2.5 ${
              l.mobileOnly ? 'hidden' : ''
            } ${l.xlOnly ? 'hidden xl:inline' : ''} ${
              light
                ? active
                  ? 'bg-sv-ink/5 text-sv-ink'
                  : 'text-sv-ink/80 hover:bg-sv-ink/5 hover:text-sv-ink'
                : active
                  ? 'bg-sv-ink/5 text-sv-ink dark:bg-white/10 dark:text-white'
                  : 'text-sv-ink/80 hover:bg-sv-ink/5 hover:text-sv-ink dark:text-white/85 dark:hover:bg-white/10 dark:hover:text-white'
            }`
            return l.to.includes('#') ? (
              <a key={l.key} href={localizedHref(l.to, lang)} data-cms-key={l.key} className={cls}>
                {t(l.key)}
              </a>
            ) : (
              <Link
                key={l.key}
                href={localizedHref(l.to, lang)}
                data-cms-key={l.key}
                aria-current={active ? 'page' : undefined}
                className={cls}
              >
                {t(l.key)}
              </Link>
            )
          })}
        </nav>

        <div className="ml-auto hidden shrink-0 items-center gap-1 lg:flex">
          {searchEntry && (
            <Link
              href={localizedHref('/search', lang)}
              data-cms-key="nav.search"
              aria-label={t('nav.search')}
              className={`grid h-11 w-11 place-items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sv-blue focus-visible:ring-offset-2 ${
                light ? 'text-sv-ink/70 hover:bg-sv-ink/5' : 'text-sv-ink/70 hover:bg-sv-ink/5 dark:text-white/85 dark:hover:bg-white/10'
              }`}
            >
              <Search className="h-[18px] w-[18px]" />
            </Link>
          )}
          <Link
            href={localizedHref("/favorites", lang)}
            data-cms-key="nav.favorites"
            aria-label={`${t('nav.favorites')}${count > 0 ? ` — ${count}` : ''}`}
            className={`relative grid h-11 w-11 place-items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sv-blue focus-visible:ring-offset-2 ${
              light ? 'text-sv-ink/70 hover:bg-sv-ink/5' : 'text-sv-ink/70 hover:bg-sv-ink/5 dark:text-white/85 dark:hover:bg-white/10'
            }`}
          >
            <Heart className="h-[18px] w-[18px]" />
            {count > 0 && (
              <span className="absolute -right-0.5 -top-0.5 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-sv-orange px-1 text-[10px] font-black text-sv-ink">
                {count > 99 ? '99+' : count}
              </span>
            )}
          </Link>
          <ThemeToggle light={light} />
          <CurrencySwitcher light={light} />
          <LangSwitcher light={light} />
          <AccountMenu light={light} />
          <Link
            href={localizedHref("/add-listing", lang)}
            data-cms-key="nav.addListing"
            aria-label={t('nav.addListing')}
            className="group flex h-11 shrink-0 items-center gap-1.5 rounded-full bg-sv-orange px-3.5 text-[13px] font-black text-sv-ink shadow-glow-orange transition-all duration-300 hover:-translate-y-0.5 hover:shadow-glow-orange-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sv-blue focus-visible:ring-offset-2 active:scale-[0.98] xl:gap-2 xl:px-5 xl:text-[14px]"
          >
            <Plus className="h-4 w-4 transition-transform duration-300 group-hover:rotate-90" />
            <span className="hidden min-[1366px]:inline">{t('nav.addListing')}</span>
          </Link>
        </div>

        <div className="ml-auto flex shrink-0 items-center lg:hidden">
          {searchEntry && (
            <Link
              href={localizedHref('/search', lang)}
              aria-label={t('nav.search')}
              className={`grid h-11 w-11 place-items-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sv-blue focus-visible:ring-offset-2 ${
                light ? 'text-sv-ink/70' : 'text-sv-ink/70 dark:text-white/85'
              }`}
            >
              <Search className="h-[18px] w-[18px]" />
            </Link>
          )}
          <button
            ref={menuBtnRef}
            className={`grid h-11 w-11 place-items-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sv-blue focus-visible:ring-offset-2 ${
              light ? 'text-sv-ink' : 'text-sv-ink dark:text-white'
            }`}
            onClick={() => setOpen(!open)}
            aria-label={t('nav.menu')}
            aria-expanded={open}
            aria-controls="mobile-menu"
          >
            {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Always mounted so aria-controls resolves; .sv-mobile-menu CSS does
          the in/out and `inert` keeps closed links out of the tab order. */}
      <div
        id="mobile-menu"
        inert={!open}
        data-open={open || undefined}
        className="sv-mobile-menu absolute inset-x-4 top-[calc(100%+0.5rem)] max-h-[min(80dvh,calc(100dvh-5.5rem-env(safe-area-inset-top,0px)))] overflow-y-auto overscroll-contain rounded-tile glass-light p-4 pb-[calc(1rem+env(safe-area-inset-bottom,0px))] shadow-card lg:hidden"
      >
            {NAV_LINKS.map((l) => {
              const active = isActive(l.to)
              const cls = `block rounded-control px-4 py-3 text-[16px] font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sv-blue focus-visible:ring-offset-2 ${
                active ? 'bg-sv-ink/5 text-sv-ink' : 'text-sv-ink hover:bg-sv-ink/5'
              }`
              return l.to.includes('#') ? (
                <a
                  key={l.key}
                  href={localizedHref(l.to, lang)}
                  data-cms-key={l.key}
                  onClick={() => setOpen(false)}
                  className={cls}
                >
                  {t(l.key)}
                </a>
              ) : (
                <Link
                  key={l.key}
                  href={localizedHref(l.to, lang)}
                  data-cms-key={l.key}
                  onClick={() => setOpen(false)}
                  aria-current={active ? 'page' : undefined}
                  className={cls}
                >
                  {t(l.key)}
                </Link>
              )
            })}
            <div className="mt-2 flex items-center justify-between rounded-control bg-sv-ink/[0.04] px-4 py-3">
              <span className="text-[12px] font-extrabold uppercase tracking-wide text-sv-ink/60">
                {t('nav.currency')}
              </span>
              <CurrencySwitcher light />
            </div>
            <div className="mt-2 flex items-center justify-between rounded-control bg-sv-ink/[0.04] px-4 py-3">
              <span className="text-[12px] font-extrabold uppercase tracking-wide text-sv-ink/60">
                {t('nav.language')}
              </span>
              <LangSwitcher light />
            </div>
            <div className="mt-2 flex items-center justify-between rounded-control bg-sv-ink/[0.04] px-4 py-3">
              <span className="text-[12px] font-extrabold uppercase tracking-wide text-sv-ink/60">
                {t('nav.theme')}
              </span>
              <ThemeToggle light />
            </div>
            <a
              href={telHref(CONTACT_PHONE)}
              className="mt-2 flex items-center justify-between rounded-control bg-sv-ink/[0.04] px-4 py-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sv-blue focus-visible:ring-offset-2"
            >
              <span className="text-[12px] font-extrabold uppercase tracking-wide text-sv-ink/60">
                {t('footer.co.contact')}
              </span>
              <span className="flex items-center gap-2 text-[15px] font-extrabold text-sv-ink">
                <Phone className="h-[18px] w-[18px] text-sv-blue" aria-hidden />
                <span className="tabular-nums">{CONTACT_PHONE}</span>
              </span>
            </a>
            <Link
              href={localizedHref("/favorites", lang)}
              onClick={() => setOpen(false)}
              className="mt-2 flex items-center justify-between rounded-control bg-sv-ink/[0.04] px-4 py-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sv-blue focus-visible:ring-offset-2"
            >
              <span className="text-[12px] font-extrabold uppercase tracking-wide text-sv-ink/60">
                {t('nav.favorites')}
              </span>
              <span className="relative grid h-10 w-10 place-items-center text-sv-ink/70">
                <Heart className="h-[18px] w-[18px]" />
                {count > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-sv-orange px-1 text-[10px] font-black text-sv-ink">
                    {count > 99 ? '99+' : count}
                  </span>
                )}
              </span>
            </Link>
            <AccountMenu light variant="panel" onNavigate={() => setOpen(false)} />
            <Link
              href={localizedHref("/add-listing", lang)}
              onClick={() => setOpen(false)}
              className="mt-2 flex items-center justify-center gap-2 rounded-full bg-sv-orange px-4 py-3.5 text-[15px] font-black text-sv-ink shadow-glow-orange focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sv-blue focus-visible:ring-offset-2 active:scale-[0.98]"
            >
              <Plus className="h-4 w-4" /> {t('nav.addListingFull')}
            </Link>
      </div>
    </header>
  )
}
