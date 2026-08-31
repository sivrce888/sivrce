import type { Metadata } from 'next'
import { Suspense } from 'react'
import Navbar from '@/components/sections/Navbar'
import Footer from '@/components/sections/Footer'
import AddListingClient from '@/components/add-listing/AddListingClient'
import { isValidLang } from '@/lib/i18n/core'
import { getServerT, langAlternates } from '@/lib/i18n/server'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>
}): Promise<Metadata> {
  const { lang: raw } = await params
  const lang = isValidLang(raw) ? raw : 'ka'
  const t = getServerT(lang)
  return {
    title: t('add.title'),
    description: t('add.subtitle'),
    alternates: { canonical: '/add-listing', languages: langAlternates('/add-listing') },
    robots: { index: false, follow: true },
  }
}

export default function AddListingPage() {
  return (
    <div className="font-geo min-h-screen bg-sv-cloud antialiased">
      <Navbar />
      <main className="pt-[calc(68px+env(safe-area-inset-top,0px))]">
        <Suspense fallback={<div className="grid min-h-[40vh] place-items-center text-[15px] font-bold text-sv-ink/45">…</div>}>
          <AddListingClient />
        </Suspense>
      </main>
      <div className="pb-20 md:pb-0">
        <Footer />
      </div>
    </div>
  )
}
