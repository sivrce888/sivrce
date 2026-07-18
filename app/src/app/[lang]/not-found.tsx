'use client'

import Link from 'next/link'
import { SearchX, ArrowLeft } from 'lucide-react'
import Navbar from '@/components/sections/Navbar'
import Footer from '@/components/sections/Footer'
import { Reveal } from '@/components/Reveal'
import { useI18n } from '@/lib/i18n/context'

export default function NotFound() {
  const { t } = useI18n()

  return (
    <div className="font-geo min-h-screen bg-sv-cloud antialiased">
      <Navbar />
      <main className="mx-auto flex min-h-[80vh] max-w-[1440px] flex-col items-center justify-center px-5 pt-24 text-center">
        <Reveal className="flex flex-col items-center">
          <span className="grid h-20 w-20 place-items-center rounded-module bg-sv-blue/10">
            <SearchX className="h-9 w-9 text-sv-blue" />
          </span>
          <h1 className="mt-6 text-[30px] font-black tracking-[-0.02em] text-sv-ink md:text-[38px]">
            {t('detail.notFoundTitle')}
          </h1>
          <p className="mt-3 max-w-[420px] text-[15px] font-semibold leading-relaxed text-sv-ink/50">
            {t('detail.notFoundText')}
          </p>
          <Link
            href="/search"
            className="mt-8 flex h-12 items-center gap-2 rounded-full bg-sv-orange px-7 text-[15px] font-extrabold text-white shadow-glow-orange transition-all duration-300 hover:-translate-y-0.5 hover:shadow-glow-orange-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sv-blue/40 focus-visible:ring-offset-2 active:scale-[0.98]"
          >
            <ArrowLeft className="h-4 w-4" /> {t('detail.backToSearch')}
          </Link>
        </Reveal>
      </main>
      <Footer />
    </div>
  )
}
