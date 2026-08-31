import type { Metadata } from 'next'
import Navbar from '@/components/sections/Navbar'
import Footer from '@/components/sections/Footer'
import { PageHero } from '@/components/PageHero'
import FavoritesClient from '@/components/favorites/FavoritesClient'

export const metadata: Metadata = {
  title: 'ფავორიტები',
  description: 'შენი შენახული განცხადებები sivrce-ზე.',
  robots: { index: false },
}

export default function FavoritesPage() {
  return (
    <div className="min-h-screen bg-sv-cloud">
      <Navbar />
      <main id="main">
        <PageHero
          tone="light"
          kicker="შენახული"
          title="ფავორიტები"
          subtitle="განცხადებები, რომლებიც გულით მონიშნე — ინახება მხოლოდ შენს მოწყობილობაზე."
        />
        <section className="mx-auto max-w-6xl px-6 pb-20">
          <FavoritesClient />
        </section>
      </main>
      <Footer />
    </div>
  )
}
