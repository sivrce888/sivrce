'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession, signIn } from 'next-auth/react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { ChevronDown, Heart, Menu, X, Plus, User } from 'lucide-react'
import { Logo } from '@/components/Logo'
import { LangSwitcher } from '@/components/LangSwitcher'
import { ThemeToggle } from '@/components/ThemeToggle'
import { useFavorites } from '@/lib/favorites'
import { useI18n } from '@/lib/i18n/context'
import type { DictKey } from '@/lib/i18n/context'

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  const { count } = useFavorites()
  const { t } = useI18n()
  const pathname = usePathname()
  const reduceMotion = useReducedMotion()
  const { data: session } = useSession()
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

  // On dark hero (homepage top) the bar is transparent with white text.
  // Everywhere else (or once scrolled) it uses the light glass style.
  const light = scrolled || pathname !== '/'

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const NAV_LINKS: { key: DictKey; to: string }[] = [
    { key: 'nav.buy', to: '/sale' },
    { key: 'nav.rent', to: '/rent' },
    { key: 'nav.daily', to: '/daily' },
    { key: 'nav.search', to: '/search' },
    { key: 'nav.neighborhoods', to: '/neighborhoods' },
    { key: 'nav.projects', to: '/projects' },
    { key: 'nav.blog', to: '/blog' },
    { key: 'nav.services', to: `${pathname === '/' ? '' : '/'}#services` },
  ]

  return (
    <motion.header
      initial={reduceMotion ? false : { y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.7, ease: [0.21, 0.65, 0.2, 1] }}
      className="fixed inset-x-0 top-0 z-50"
    >
      <div
        className={`mx-auto flex h-[68px] max-w-[1440px] items-center justify-between gap-4 px-5 transition-all duration-500 md:px-10 ${
          light
            ? 'mt-3 max-w-[1240px] rounded-tile glass-light shadow-card md:mt-4'
            : 'bg-transparent'
        }`}
      >
        <Logo light={!light} />

        <nav className="hidden items-center gap-1 lg:flex" aria-label={t('nav.main')}>
          {NAV_LINKS.map((l) =>
            l.to.includes('#') ? (
              <a
                key={l.key}
                href={l.to}
                className={`rounded-full px-4 py-2 text-[15px] font-semibold transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sv-blue focus-visible:ring-offset-2 ${
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
                href={l.to}
                className={`rounded-full px-4 py-2 text-[15px] font-semibold transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sv-blue focus-visible:ring-offset-2 ${
                  light
                    ? 'text-sv-ink/80 hover:bg-sv-ink/5 hover:text-sv-ink'
                    : 'text-white/85 hover:bg-white/10 hover:text-white'
                }`}
              >
                {t(l.key)}
              </Link>
            ),
          )}
          <Link
            href="/search"
            className={`flex items-center gap-1 rounded-full px-4 py-2 text-[15px] font-semibold transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sv-blue focus-visible:ring-offset-2 ${
              light
                ? 'text-sv-ink/80 hover:bg-sv-ink/5'
                : 'text-white/85 hover:bg-white/10'
            }`}
          >
            {t('nav.more')} <ChevronDown className="h-4 w-4" />
          </Link>
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <Link
            href="/favorites"
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
          <LangSwitcher light={light} />
          {session?.user ? (
            <Link
              href="/favorites"
              className={`flex h-10 items-center gap-1.5 rounded-full px-4 text-[14px] font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sv-blue focus-visible:ring-offset-2 ${
                light ? 'text-sv-ink hover:bg-sv-ink/5' : 'text-white hover:bg-white/10'
              }`}
            >
              {session.user.image ? (
                // Remote OAuth avatar — next/image remotePatterns not configured
                // eslint-disable-next-line @next/next/no-img-element
                <img src={session.user.image} alt="" className="h-5 w-5 rounded-full" referrerPolicy="no-referrer" />
              ) : (
                <User className="h-4 w-4" />
              )}
              <span className="max-w-[120px] truncate">{session.user.name ?? t('nav.favorites')}</span>
            </Link>
          ) : (
            <button
              onClick={() => signIn('google')}
              className={`flex h-10 items-center gap-1.5 rounded-full px-4 text-[14px] font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sv-blue focus-visible:ring-offset-2 ${
                light ? 'text-sv-ink hover:bg-sv-ink/5' : 'text-white hover:bg-white/10'
              }`}
            >
              <User className="h-4 w-4" /> {t('nav.login')}
            </button>
          )}
          <Link
            href="/add-listing"
            className="group flex h-11 items-center gap-2 rounded-full bg-sv-orange px-5 text-[14px] font-extrabold text-white shadow-glow-orange transition-all duration-300 hover:-translate-y-0.5 hover:shadow-glow-orange-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sv-blue focus-visible:ring-offset-2 active:scale-[0.98]"
          >
            <Plus className="h-4 w-4 transition-transform duration-300 group-hover:rotate-90" />
            {t('nav.addListing')}
          </Link>
        </div>

        <button
          ref={menuBtnRef}
          className={`grid h-11 w-11 place-items-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sv-blue focus-visible:ring-offset-2 md:hidden ${
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
            className="mx-4 mt-2 rounded-tile glass-light p-4 shadow-card md:hidden"
          >
            {NAV_LINKS.map((l) =>
              l.to.includes('#') ? (
                <a
                  key={l.key}
                  href={l.to}
                  onClick={() => setOpen(false)}
                  className="block rounded-control px-4 py-3 text-[16px] font-semibold text-sv-ink hover:bg-sv-ink/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sv-blue focus-visible:ring-offset-2"
                >
                  {t(l.key)}
                </a>
              ) : (
                <Link
                  key={l.key}
                  href={l.to}
                  onClick={() => setOpen(false)}
                  className="block rounded-control px-4 py-3 text-[16px] font-semibold text-sv-ink hover:bg-sv-ink/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sv-blue focus-visible:ring-offset-2"
                >
                  {t(l.key)}
                </Link>
              ),
            )}
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
              href="/add-listing"
              onClick={() => setOpen(false)}
              className="mt-2 flex items-center justify-center gap-2 rounded-control bg-sv-orange px-4 py-3.5 text-[15px] font-extrabold text-white shadow-glow-orange focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sv-blue focus-visible:ring-offset-2 active:scale-[0.98]"
            >
              <Plus className="h-4 w-4" /> {t('nav.addListingFull')}
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  )
}
