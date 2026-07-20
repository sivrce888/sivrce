'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { Heart, Menu, X, Plus, User } from 'lucide-react'
import { Logo } from '@/components/Logo'
import { LangSwitcher } from '@/components/LangSwitcher'
import { CurrencySwitcher } from '@/components/CurrencySwitcher'
import { ThemeToggle } from '@/components/ThemeToggle'
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
  const reduceMotion = useReducedMotion()
  const { data: session } = useSession()
  const menuBtnRef = useRef<HTMLButtonElement>(null)
  // ponytail: first name only in chrome — full name lives on /dashboard; initials/truncate if i18n needs it
  const navName = session?.user?.name?.trim().split(/\s+/)[0]

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

  // On dark hero (homepage top) the bar is transparent with white text.
  // Everywhere else (or once scrolled) it uses the light glass style.
  const light = scrolled || bare !== '/'

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Desktop from lg (1024+). Only 4 money links — 6 Georgian labels overflow the pill.
  // map/buildings/rest live in the hamburger + footer.
  const NAV_LINKS: { key: DictKey; to: string; mobileOnly?: boolean }[] = [
    { key: 'nav.buy', to: '/sale' },
    { key: 'nav.rent', to: '/rent' },
    { key: 'nav.daily', to: '/daily' },
    { key: 'nav.projects', to: '/projects' },
    { key: 'nav.map', to: '/map', mobileOnly: true },
    { key: 'nav.buildings', to: '/buildings', mobileOnly: true },
    { key: 'nav.neighborhoods', to: '/neighborhoods', mobileOnly: true },
    { key: 'nav.blog', to: '/blog', mobileOnly: true },
    { key: 'nav.services', to: `${bare === '/' ? '' : '/'}#services`, mobileOnly: true },
    { key: 'nav.search', to: '/search', mobileOnly: true },
  ]

  return (
    <header className="sv-nav-in fixed inset-x-0 top-0 z-50">
      <div
        className={`mx-auto flex h-[68px] w-full max-w-[1440px] items-center gap-2 px-4 transition-all duration-500 sm:gap-3 sm:px-5 md:px-8 ${
          light
            ? 'mt-3 max-w-[1240px] rounded-tile glass-light shadow-card md:mt-4'
            : 'bg-transparent'
        }`}
      >
        <div className="shrink-0">
          <Logo light={!light} href={localizedHref('/', lang)} />
        </div>

        <nav
          className="hidden min-w-0 flex-1 items-center justify-center gap-0 lg:flex"
          aria-label={t('nav.main')}
        >
          {NAV_LINKS.map((l) =>
            l.to.includes('#') ? (
              <a
                key={l.key}
                href={localizedHref(l.to, lang)}
                className={`whitespace-nowrap rounded-full px-2 py-2 text-[13px] font-semibold transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sv-blue focus-visible:ring-offset-2 xl:px-2.5 ${
                  l.mobileOnly ? 'hidden' : ''
                } ${
                  light
                    ? 'text-sv-ink/80 hover:bg-sv-ink/5 hover:text-sv-ink'
                    : 'text-white/85 hover:bg-white/10 hover:text-white'
                }`}
              >
                {t(l.key)}
              </a>
            ) : (
              <Link
                key={l.key}
                href={localizedHref(l.to, lang)}
                className={`whitespace-nowrap rounded-full px-2 py-2 text-[13px] font-semibold transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sv-blue focus-visible:ring-offset-2 xl:px-2.5 ${
                  l.mobileOnly ? 'hidden' : ''
                } ${
                  light
                    ? 'text-sv-ink/80 hover:bg-sv-ink/5 hover:text-sv-ink'
                    : 'text-white/85 hover:bg-white/10 hover:text-white'
                }`}
              >
                {t(l.key)}
              </Link>
            ),
          )}
        </nav>

        <div className="ml-auto hidden shrink-0 items-center gap-1 lg:flex">
          <Link
            href={localizedHref("/favorites", lang)}
            aria-label={`${t('nav.favorites')}${count > 0 ? ` — ${count}` : ''}`}
            className={`relative grid h-11 w-11 place-items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sv-blue focus-visible:ring-offset-2 ${
              light ? 'text-sv-ink/70 hover:bg-sv-ink/5' : 'text-white/85 hover:bg-white/10'
            }`}
          >
            <Heart className="h-[18px] w-[18px]" />
            {count > 0 && (
              <span className="absolute -right-0.5 -top-0.5 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-sv-orange px-1 text-[10px] font-black text-white">
                {count > 99 ? '99+' : count}
              </span>
            )}
          </Link>
          <ThemeToggle light={light} />
          <CurrencySwitcher light={light} />
          <LangSwitcher light={light} />
          {session?.user ? (
            <Link
              href={localizedHref("/dashboard", lang)}
              aria-label={session.user.name ?? t('nav.login')}
              title={session.user.name ?? undefined}
              className={`flex h-10 max-w-[8.5rem] items-center gap-1.5 rounded-full px-2.5 text-[14px] font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sv-blue focus-visible:ring-offset-2 ${
                light ? 'text-sv-ink hover:bg-sv-ink/5' : 'text-white hover:bg-white/10'
              }`}
            >
              {session.user.image ? (
                // Remote OAuth avatar — next/image remotePatterns not configured
                // eslint-disable-next-line @next/next/no-img-element
                <img src={session.user.image} alt="" className="h-5 w-5 shrink-0 rounded-full" referrerPolicy="no-referrer" />
              ) : (
                <User className="h-4 w-4 shrink-0" />
              )}
              {/* ponytail: avatar-only in chrome — name on /dashboard */}
              <span className="sr-only">{navName ?? t('nav.login')}</span>
            </Link>
          ) : (
            <Link
              href="/auth/signin"
              aria-label={t('nav.login')}
              className={`flex h-10 items-center gap-1.5 rounded-full px-3 text-[14px] font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sv-blue focus-visible:ring-offset-2 ${
                light ? 'text-sv-ink hover:bg-sv-ink/5' : 'text-white hover:bg-white/10'
              }`}
            >
              <User className="h-4 w-4" />
            </Link>
          )}
          <Link
            href={localizedHref("/add-listing", lang)}
            className="group flex h-11 shrink-0 items-center gap-1.5 rounded-full bg-sv-orange px-3.5 text-[13px] font-extrabold text-white shadow-glow-orange transition-all duration-300 hover:-translate-y-0.5 hover:shadow-glow-orange-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sv-blue focus-visible:ring-offset-2 active:scale-[0.98] xl:gap-2 xl:px-5 xl:text-[14px]"
          >
            <Plus className="h-4 w-4 transition-transform duration-300 group-hover:rotate-90" />
            {t('nav.addListing')}
          </Link>
        </div>

        <button
          ref={menuBtnRef}
          className={`ml-auto grid h-11 w-11 place-items-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sv-blue focus-visible:ring-offset-2 lg:hidden ${
            light ? 'text-sv-ink' : 'text-white'
          }`}
          onClick={() => setOpen(!open)}
          aria-label={t('nav.menu')}
          aria-expanded={open}
          aria-controls="mobile-menu"
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            id="mobile-menu"
            initial={reduceMotion ? false : { opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduceMotion ? undefined : { opacity: 0, y: -12 }}
            transition={{ duration: 0.25 }}
            className="mx-4 mt-2 rounded-tile glass-light p-4 pb-[calc(1rem+env(safe-area-inset-bottom,0px))] shadow-card lg:hidden"
          >
            {NAV_LINKS.map((l) =>
              l.to.includes('#') ? (
                <a
                  key={l.key}
                  href={localizedHref(l.to, lang)}
                  onClick={() => setOpen(false)}
                  className="block rounded-control px-4 py-3 text-[16px] font-semibold text-sv-ink hover:bg-sv-ink/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sv-blue focus-visible:ring-offset-2"
                >
                  {t(l.key)}
                </a>
              ) : (
                <Link
                  key={l.key}
                  href={localizedHref(l.to, lang)}
                  onClick={() => setOpen(false)}
                  className="block rounded-control px-4 py-3 text-[16px] font-semibold text-sv-ink hover:bg-sv-ink/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sv-blue focus-visible:ring-offset-2"
                >
                  {t(l.key)}
                </Link>
              ),
            )}
            <div className="mt-2 flex items-center justify-between rounded-control bg-sv-ink/[0.04] px-4 py-3">
              <span className="text-[12px] font-extrabold uppercase tracking-wide text-sv-ink/45">
                {t('nav.currency')}
              </span>
              <CurrencySwitcher light />
            </div>
            <div className="mt-2 flex items-center justify-between rounded-control bg-sv-ink/[0.04] px-4 py-3">
              <span className="text-[12px] font-extrabold uppercase tracking-wide text-sv-ink/45">
                {t('nav.language')}
              </span>
              <LangSwitcher light />
            </div>
            <div className="mt-2 flex items-center justify-between rounded-control bg-sv-ink/[0.04] px-4 py-3">
              <span className="text-[12px] font-extrabold uppercase tracking-wide text-sv-ink/45">
                {t('nav.theme')}
              </span>
              <ThemeToggle light />
            </div>
            <Link
              href={localizedHref("/favorites", lang)}
              onClick={() => setOpen(false)}
              className="mt-2 flex items-center justify-between rounded-control bg-sv-ink/[0.04] px-4 py-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sv-blue focus-visible:ring-offset-2"
            >
              <span className="text-[12px] font-extrabold uppercase tracking-wide text-sv-ink/45">
                {t('nav.favorites')}
              </span>
              <span className="relative grid h-10 w-10 place-items-center text-sv-ink/70">
                <Heart className="h-[18px] w-[18px]" />
                {count > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-sv-orange px-1 text-[10px] font-black text-white">
                    {count > 99 ? '99+' : count}
                  </span>
                )}
              </span>
            </Link>
            {session?.user ? (
              <Link
                href={localizedHref("/dashboard", lang)}
                onClick={() => setOpen(false)}
                className="mt-2 flex items-center justify-center gap-2 rounded-control bg-sv-blue px-4 py-3.5 text-[15px] font-extrabold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sv-blue focus-visible:ring-offset-2 active:scale-[0.98]"
              >
                <User className="h-4 w-4" />
                <span className="truncate">{navName ?? t('nav.login')}</span>
              </Link>
            ) : (
              <Link
                href="/auth/signin"
                onClick={() => setOpen(false)}
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-control bg-sv-ink/[0.06] px-4 py-3.5 text-[15px] font-extrabold text-sv-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sv-blue focus-visible:ring-offset-2 active:scale-[0.98]"
              >
                <User className="h-4 w-4" /> {t('nav.login')}
              </Link>
            )}
            <Link
              href={localizedHref("/add-listing", lang)}
              onClick={() => setOpen(false)}
              className="mt-2 flex items-center justify-center gap-2 rounded-control bg-sv-orange px-4 py-3.5 text-[15px] font-extrabold text-white shadow-glow-orange focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sv-blue focus-visible:ring-offset-2 active:scale-[0.98]"
            >
              <Plus className="h-4 w-4" /> {t('nav.addListingFull')}
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
