import type { Metadata } from 'next'
import { Suspense } from 'react'
import Navbar from '@/components/sections/Navbar'
import Footer from '@/components/sections/Footer'
import AddListingClient from '@/components/add-listing/AddListingClient'
import { langAlternates } from '@/lib/i18n/server'

export const metadata: Metadata = {
  title: 'განცხადების დამატება',
  description:
    'განათავსე უძრავი ქონების განცხადება სივრცეზე 6 მარტივი ნაბიჯით — ფოტოებით, რუკით, AI ფასის შეფასებით და ცოცხალი გადახედვით.',
  alternates: { canonical: '/add-listing', languages: langAlternates('/add-listing') },
  robots: { index: false, follow: true },
}

export default function AddListingPage() {
  return (
    <div className="font-geo min-h-screen bg-sv-cloud antialiased">
      <Navbar />
      <main className="pt-[68px]">
        <Suspense fallback={<div className="grid min-h-[40vh] place-items-center text-[15px] font-bold text-sv-ink/45">…</div>}>
          <AddListingClient />
        </Suspense>
      </main>
      <Footer />
    </div>
  )
}
