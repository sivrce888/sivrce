'use client'

/**
 * SIVRCE — theme provider (next-themes).
 * Class strategy on <html>, light by default (brand + photos are
 * light-first; every winning RE portal is), persisted to
 * localStorage('sivrce:theme'). Dark is one tap away via the toggle.
 */

import { useEffect, useRef, type ReactNode } from 'react'
import { SessionProvider, useSession } from 'next-auth/react'
import { usePathname } from 'next/navigation'
import { ThemeProvider as NextThemesProvider } from 'next-themes'

function SessionSync() {
  const { update } = useSession()
  const pathname = usePathname()
  const booted = useRef(false)
  // `update`'s identity changes with the session — keep a latest-ref so the
  // navigation effect below can depend on pathname alone (deps on `update`
  // would refetch on every session change).
  const updateRef = useRef(update)
  useEffect(() => {
    updateRef.current = update
  }, [update])

  // First load: skip /api/auth/session until a real gesture — anonymous HTML stays ISR.
  useEffect(() => {
    const boot = () => {
      if (booted.current) return
      booted.current = true
      void updateRef.current()
    }
    window.addEventListener('pointerdown', boot, { once: true, passive: true })
    window.addEventListener('keydown', boot, { once: true, passive: true })
    return () => {
      window.removeEventListener('pointerdown', boot)
      window.removeEventListener('keydown', boot)
    }
  }, [])

  // Soft navigations: server-action auth (sign-in/out, role switch, rename)
  // redirects without remounting this provider, so the client session cache
  // would stay stale until a hard reload — re-sync after every route change.
  const mounted = useRef(false)
  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true
      return
    }
    void updateRef.current()
  }, [pathname])

  return null
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  return (
    // ponytail: session={null} skips the mount fetch. Upgrade → cookie hint if chrome must know auth before first tap.
    <SessionProvider session={null} refetchOnWindowFocus={false} refetchInterval={0}>
      <SessionSync />
      <NextThemesProvider
        attribute="class"
        defaultTheme="light"
        storageKey="sivrce:theme"
      >
        {children}
      </NextThemesProvider>
    </SessionProvider>
  )
}
