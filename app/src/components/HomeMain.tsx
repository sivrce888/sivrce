import Navbar from '@/components/sections/Navbar'
import Hero from '@/components/sections/Hero'
import Stats from '@/components/sections/Stats'
import Categories from '@/components/sections/Categories'
import Collections from '@/components/sections/Collections'
import Listings from '@/components/sections/Listings'
import MapSection from '@/components/sections/MapSection'
import AISection from '@/components/sections/AISection'
import Projects from '@/components/sections/Projects'
import Services from '@/components/sections/Services'
import CTA from '@/components/sections/CTA'
import Footer from '@/components/sections/Footer'
import { LISTINGS, type Listing } from '@/data/listings'
import { getAllListings } from '@/lib/listings-db'
import type { Lang } from '@/lib/i18n/core'

/** DB-first featured rail; static mock is the build-time/outage fallback. */
async function getFeatured(): Promise<Listing[]> {
  try {
    const rows = await getAllListings()
    if (rows.length >= 6) return rows.slice(0, 6)
  } catch { /* DB unavailable at build — fall through to static */ }
  return LISTINGS.slice(0, 6)
}

/** Homepage section assembly — lang drives CMS block copy on server sections. */
export default async function HomeMain({ lang = 'ka' }: { lang?: Lang }) {
  const featured = await getFeatured()
  return (
    <div className="min-h-screen bg-sv-surface">
      <Navbar />
      <main id="main">
        <Hero lang={lang} />
        <Stats />
        <Categories lang={lang} />
        <Collections lang={lang} />
        <Listings items={featured} />
        <MapSection />
        <AISection />
        <Projects />
        <Services lang={lang} />
        <CTA lang={lang} />
      </main>
      <Footer />
    </div>
  )
}
