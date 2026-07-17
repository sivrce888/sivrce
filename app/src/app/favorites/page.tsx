import type { Metadata } from 'next'
import Navbar from '@/components/sections/Navbar'
import Footer from '@/components/sections/Footer'
import FavoritesClient from '@/components/favorites/FavoritesClient'

export const metadata: Metadata = {
  title: 'ფავორიტები',
  description: 'შენი შენახული განცხადებები sivrce-ზე.',
  robots: { index: false },
}

export default function FavoritesPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <main id="main" className="pt-24 md:pt-28">
        <section className="mx-auto max-w-6xl px-6 py-14 md:py-20">
          <h1 className="text-4xl font-black tracking-[-0.02em] text-sv-ink text-balance md:text-5xl">
            ფავორიტები
          </h1>
          <p className="mt-3 text-[15px] font-medium text-sv-ink/60">
            განცხადებები, რომლებიც გულით მონიშნე — ინახება მხოლოდ შენს მოწყობილობაზე.
          </p>
          <div className="mt-10">
            <FavoritesClient />
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
