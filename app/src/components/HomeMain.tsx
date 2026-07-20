import { Suspense } from 'react'
import Navbar from '@/components/sections/Navbar'
import Hero from '@/components/sections/Hero'
import Stats from '@/components/sections/Stats'
import Categories from '@/components/sections/Categories'
import StoriesRail from '@/components/sections/StoriesRail'
import Collections from '@/components/sections/Collections'
import Listings from '@/components/sections/Listings'
import MapSection from '@/components/sections/MapSection'
import AISection from '@/components/sections/AISection'
import Projects from '@/components/sections/Projects'
import Services from '@/components/sections/Services'
import CTA from '@/components/sections/CTA'
import Footer from '@/components/sections/Footer'
import { LISTINGS, type Listing } from '@/data/listings'
import { getFeaturedListings, getStoryListings, type Listing as StoryListing } from '@/lib/listings-db'
import type { Lang } from '@/lib/i18n/core'

/** DB-first featured rail; static mock is the build-time/outage fallback. */
async function getFeatured(): Promise<Listing[]> {
  try {
    const rows = await getFeaturedListings(6)
    if (rows.length >= 6) return rows
    if (rows.length > 0) {
      const fill = LISTINGS.filter((l) => !rows.some((r) => r.id === l.id))
      return [...rows, ...fill].slice(0, 6)
    }
  } catch { /* DB unavailable at build — fall through to static */ }
  return LISTINGS.slice(0, 6)
}

/** Below-fold: await DB here so Hero paints without waiting on Prisma. */
async function HomeBelowFold({ lang }: { lang: Lang }) {
  const [featured, stories] = await Promise.all([
    getFeatured(),
    getStoryListings().catch(() => [] as StoryListing[]),
  ])
  return (
    <>
      <StoriesRail items={stories} />
      <Stats />
      <Categories lang={lang} />
      <Collections lang={lang} />
      <Listings items={featured} />
      <MapSection />
      <AISection />
      <Projects />
      <Services lang={lang} />
      <CTA lang={lang} />
    </>
  )
}

/** Homepage section assembly — lang drives CMS block copy on server sections. */
export default function HomeMain({ lang = 'ka' }: { lang?: Lang }) {
  return (
    <div className="min-h-screen bg-sv-surface">
      <Navbar />
      <main id="main">
        <Hero lang={lang} />
        <Suspense fallback={null}>
          <HomeBelowFold lang={lang} />
        </Suspense>
      </main>
      <Footer />
    </div>
  )
}
