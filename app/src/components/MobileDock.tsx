'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { Heart, Map, Plus, Search } from 'lucide-react'
import LocalizedLink from '@/components/LocalizedLink'
import { LogoMark } from '@/components/Logo'
import { useFavorites } from '@/lib/favorites'
import { useI18n, stripLangPrefix } from '@/lib/i18n/context'

/** Thumb-zone app bar — Apple tab bar. Hidden on listing (own conversion bar) + admin. */
export default function MobileDock() {
  const pathname = usePathname()
  const { t } = useI18n()
  const { count } = useFavorites()
  const bare = stripLangPrefix(pathname)
  const hidden =
    bare.startsWith('/listing/') ||
    bare.startsWith('/add-listing') ||
    bare.startsWith('/admin') ||
    bare === '/map' ||
    bare.startsWith('/map/')

  useEffect(() => {
    const root = document.documentElement
    const mq = window.matchMedia('(max-width: 1023px)')
    const sync = () => root.classList.toggle('sv-has-dock', !hidden && mq.matches)
    sync()
    mq.addEventListener('change', sync)
    return () => {
      mq.removeEventListener('change', sync)
      root.classList.remove('sv-has-dock')
    }
  }, [hidden])

  if (hidden) return null

  const items = [
    { href: '/', label: 'sivrce', match: bare === '/', icon: 'home' as const },
    { href: '/search', label: t('nav.search'), match: bare === '/search' || bare.startsWith('/search/') || bare === '/sale' || bare.startsWith('/sale/') || bare === '/rent' || bare.startsWith('/rent/') || bare === '/daily' || bare.startsWith('/daily/'), icon: 'search' as const },
    { href: '/map', label: t('nav.map'), match: bare === '/map' || bare.startsWith('/map/'), icon: 'map' as const },
    { href: '/favorites', label: t('nav.favorites'), match: bare === '/favorites' || bare.startsWith('/favorites/'), icon: 'heart' as const },
    { href: '/add-listing', label: t('nav.addListing'), match: bare.startsWith('/add-listing'), icon: 'add' as const },
  ]

  return (
    <nav
      data-sv-dock
      aria-label={t('nav.main')}
      className="fixed inset-x-0 bottom-0 z-[45] border-t border-sv-ink/[0.08] bg-sv-surface/92 pb-[env(safe-area-inset-bottom,0px)] shadow-card backdrop-blur-xl lg:hidden dark:border-white/10"
    >
      <ul className="mx-auto grid h-14 max-w-[520px] grid-cols-5 px-1">
        {items.map((item) => (
          <li key={item.href} className="min-w-0">
            <LocalizedLink
              href={item.href}
              aria-current={item.match ? 'page' : undefined}
              className={`flex h-full min-h-[44px] min-w-0 flex-col items-center justify-center gap-0.5 touch-manipulation ${
                item.match ? 'text-sv-blue' : 'text-sv-ink/45 dark:text-white/45'
              }`}
            >
              {item.icon === 'home' ? (
                <LogoMark size={22} />
              ) : item.icon === 'search' ? (
                <Search className="h-[22px] w-[22px]" strokeWidth={item.match ? 2.4 : 2} />
              ) : item.icon === 'map' ? (
                <Map className="h-[22px] w-[22px]" strokeWidth={item.match ? 2.4 : 2} />
              ) : item.icon === 'heart' ? (
                <span className="relative">
                  <Heart className={`h-[22px] w-[22px] ${item.match ? 'fill-current' : ''}`} strokeWidth={item.match ? 2.4 : 2} />
                  {count > 0 && (
                    <span className="absolute -right-2.5 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-sv-orange px-0.5 text-[9px] font-black text-white">
                      {count > 99 ? '99+' : count}
                    </span>
                  )}
                </span>
              ) : (
                <span className="grid h-7 w-7 place-items-center rounded-full bg-sv-orange text-white shadow-glow-orange">
                  <Plus className="h-4 w-4" strokeWidth={2.6} />
                </span>
              )}
              <span className="max-w-full truncate px-0.5 text-[10px] font-extrabold leading-none">
                {item.label}
              </span>
            </LocalizedLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
