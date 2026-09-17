'use client'

import { useEffect } from 'react'
import LocalizedLink from '@/components/LocalizedLink'
import { TriangleAlert, RotateCcw } from 'lucide-react'
import Navbar from '@/components/sections/Navbar'
import Footer from '@/components/sections/Footer'
import { Reveal } from '@/components/Reveal'
import { useI18n } from '@/lib/i18n/context'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const { t } = useI18n()

  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="font-geo min-h-screen bg-sv-cloud antialiased">
      <Navbar />
      <main id="main" className="sv-pt-nav mx-auto flex min-h-[80vh] max-w-[1440px] flex-col items-center justify-center px-5 text-center">
        <Reveal className="flex flex-col items-center">
          <span className="grid h-20 w-20 place-items-center rounded-module bg-sv-orange/10">
            <TriangleAlert className="h-9 w-9 text-sv-orange" />
          </span>
          <h1 className="mt-6 sv-h1 text-sv-ink">
            {t('error.title')}
          </h1>
          <p className="sv-lead mt-3 max-w-[420px] text-sv-ink/60">
            {t('error.text')}
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={reset}
              className="sv-cta"
            >
              <RotateCcw className="h-4 w-4" /> {t('error.retry')}
            </button>
            <LocalizedLink
              href="/"
              className="flex h-12 items-center rounded-full border border-sv-ink/10 bg-sv-surface px-7 text-[15px] font-extrabold text-sv-ink transition-colors hover:border-sv-blue/30 hover:text-sv-blue focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sv-blue/40 focus-visible:ring-offset-2"
            >
              {t('error.home')}
            </LocalizedLink>
          </div>
        </Reveal>
      </main>
      <Footer />
    </div>
  )
}
