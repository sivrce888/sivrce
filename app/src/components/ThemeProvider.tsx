'use client'

/**
 * SIVRCE — theme provider (next-themes).
 * Class strategy on <html>, light by default (brand + photos are
 * light-first; every winning RE portal is), persisted to
 * localStorage('sivrce:theme'). Dark is one tap away via the toggle.
 */

import { useEffect, useRef, type ReactNode } from 'react'
import { SessionProvider, useSession } from 'next-auth/react'
import { ThemeProvider as NextThemesProvider } from 'next-themes'

/** Skip /api/auth/session until a real gesture — anonymous HTML stays ISR. */
function SessionOnInteract() {
  const { update } = useSession()
  const done = useRef(false)
  useEffect(() => {
    const boot = () => {
      if (done.current) return
      done.current = true
      void update()
    }
    window.addEventListener('pointerdown', boot, { once: true, passive: true })
    window.addEventListener('keydown', boot, { once: true, passive: true })
    return () => {
      window.removeEventListener('pointerdown', boot)
      window.removeEventListener('keydown', boot)
    }
  }, [update])
  return null
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  return (
    // ponytail: session={null} skips the mount fetch. Upgrade → cookie hint if chrome must know auth before first tap.
    <SessionProvider session={null} refetchOnWindowFocus={false} refetchInterval={0}>
      <SessionOnInteract />
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
