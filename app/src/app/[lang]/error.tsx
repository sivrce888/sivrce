'use client'

import { useEffect } from 'react'
import Link from 'next/link'
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
      <main className="mx-auto flex min-h-[80vh] max-w-[1440px] flex-col items-center justify-center px-5 pt-24 text-center">
        <Reveal className="flex flex-col items-center">
          <span className="grid h-20 w-20 place-items-center rounded-module bg-sv-orange/10">
            <TriangleAlert className="h-9 w-9 text-sv-orange" />
          </span>
          <h1 className="mt-6 text-[30px] font-black tracking-[-0.02em] text-sv-ink md:text-[38px]">
            {t('error.title')}
          </h1>
          <p className="mt-3 max-w-[420px] text-[15px] font-semibold leading-relaxed text-sv-ink/50">
            {t('error.text')}
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={reset}
              className="flex h-12 items-center gap-2 rounded-full bg-sv-orange px-7 text-[15px] font-extrabold text-white shadow-glow-orange transition-all duration-300 hover:-translate-y-0.5 hover:shadow-glow-orange-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sv-blue/40 focus-visible:ring-offset-2 active:scale-[0.98]"
            >
              <RotateCcw className="h-4 w-4" /> {t('error.retry')}
            </button>
            <Link
              href="/"
              className="flex h-12 items-center rounded-full border border-sv-ink/10 bg-sv-surface px-7 text-[15px] font-extrabold text-sv-ink transition-all duration-300 hover:-translate-y-0.5 hover:border-sv-blue/30 hover:text-sv-blue focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sv-blue/40 focus-visible:ring-offset-2 active:scale-[0.98]"
            >
              {t('error.home')}
            </Link>
          </div>
        </Reveal>
      </main>
      <Footer />
    </div>
  )
}
