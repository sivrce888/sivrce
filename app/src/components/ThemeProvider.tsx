'use client'

/**
 * SIVRCE — theme provider (next-themes).
 * Class strategy on <html>, light by default (brand + photos are
 * light-first; every winning RE portal is), persisted to
 * localStorage('sivrce:theme'). Dark is one tap away via the toggle.
 */

import type { ReactNode } from 'react'
import { SessionProvider } from 'next-auth/react'
import { ThemeProvider as NextThemesProvider } from 'next-themes'

export function ThemeProvider({ children }: { children: ReactNode }) {
  return (
    // ponytail: default focus-refetch was top /api/auth/session burner
    <SessionProvider refetchOnWindowFocus={false} refetchInterval={0}>
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
