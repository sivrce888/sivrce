'use client'

/**
 * SIVRCE — theme provider (next-themes).
 * Class strategy on <html>, system by default, persisted to
 * localStorage('sivrce:theme'). Light/dark only — no `theme="system"`
 * exposed in UI; the toggle flips resolvedTheme.
 */

import { useEffect, type ReactNode } from 'react'
import { SessionProvider } from 'next-auth/react'
import { ThemeProvider as NextThemesProvider } from 'next-themes'

export function ThemeProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      navigator.serviceWorker.register('/sw.js')
    }
  }, [])

  return (
    <SessionProvider>
      <NextThemesProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        storageKey="sivrce:theme"
      >
        {children}
      </NextThemesProvider>
    </SessionProvider>
  )
}
