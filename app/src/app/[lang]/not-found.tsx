'use client'

import LocalizedLink from '@/components/LocalizedLink'
import { ArrowLeft } from 'lucide-react'
import { LogoMark } from '@/components/Logo'
import Navbar from '@/components/sections/Navbar'
import Footer from '@/components/sections/Footer'
import { Reveal } from '@/components/Reveal'
import { useI18n } from '@/lib/i18n/context'

export default function NotFound() {
  const { t } = useI18n()

  return (
    <div className="font-geo min-h-screen bg-sv-cloud antialiased">
      <Navbar />
      <main id="main" className="sv-pt-nav mx-auto flex min-h-[80vh] max-w-[1440px] flex-col items-center justify-center px-5 text-center">
        <Reveal className="flex flex-col items-center">
          <span className="grid h-20 w-20 place-items-center rounded-module bg-sv-blue/10">
            <LogoMark size={36} />
          </span>
          <h1 className="mt-6 sv-h1 text-sv-ink">
            {t('detail.notFoundTitle')}
          </h1>
          <p className="sv-lead mt-3 max-w-[420px] text-sv-ink/60">
            {t('detail.notFoundText')}
          </p>
          <LocalizedLink
            href="/search"
            className="sv-cta mt-8"
          >
            <ArrowLeft className="h-4 w-4" /> {t('detail.backToSearch')}
          </LocalizedLink>
        </Reveal>
      </main>
      <Footer />
    </div>
  )
}
