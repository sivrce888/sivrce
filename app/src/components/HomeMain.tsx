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
import WhatsAppSection from '@/components/sections/WhatsAppSection'
import Projects from '@/components/sections/Projects'
import Services from '@/components/sections/Services'
import CTA from '@/components/sections/CTA'
import Footer from '@/components/sections/Footer'
import { LISTINGS, type Listing } from '@/data/listings'
import { getFeaturedListings, getStoryListings, type Listing as StoryListing } from '@/lib/listings-db'
import { projectsLive } from '@/lib/directory-live'
import { getHomeStats } from '@/lib/home-stats'
import type { Lang } from '@/lib/i18n/core'

/** DB-first featured rail; static mock only when DB returns nothing (build/outage). */
async function getFeatured(): Promise<Listing[]> {
  try {
    const rows = await getFeaturedListings(6)
    if (rows.length > 0) return rows
  } catch { /* DB unavailable at build — fall through to static */ }
  return LISTINGS.slice(0, 6)
}

import DeveloperSlider from '@/components/sections/DeveloperSlider'
import RenovationWidget from '@/components/sections/RenovationWidget'
import MortgageWidget from '@/components/sections/MortgageWidget'
import ForumTeaser from '@/components/sections/ForumTeaser'
import BlogNewsSection from '@/components/sections/BlogNewsSection'
import TrustStrip from '@/components/sections/TrustStrip'

/** Below-fold: await DB here so Hero paints without waiting on Prisma. */
async function HomeBelowFold({ lang }: { lang: Lang }) {
  const [featured, stories, projects, stats] = await Promise.all([
    getFeatured(),
    getStoryListings().catch(() => [] as StoryListing[]),
    projectsLive().catch(() => []),
    getHomeStats(),
  ])
  // Under-construction first; real CDN heroes over stock npN/pN. Rail shows 8 — rest via /projects.
  const building = projects.filter((p) => p.done < 100)
  const pool = building.length >= 2 ? building : projects
  const withHero = pool.filter((p) => !/\/(?:np|p)\d+\.webp(?:\?|$)/.test(p.img))
  const homeProjects = (withHero.length >= 2 ? withHero : pool).slice(0, 8)
  return (
    <>
      <StoriesRail items={stories} />
      <Stats live={stats} />
      <Categories lang={lang} />
      <Collections lang={lang} />
      <Listings items={featured} />
      <MapSection />
      <DeveloperSlider />
      <AISection sample={featured[0] ?? null} />
      <RenovationWidget />
      <MortgageWidget />
      <WhatsAppSection />
      <Projects items={homeProjects} total={projects.length} />
      <Services lang={lang} />
      <ForumTeaser />
      <BlogNewsSection />
      <TrustStrip />
      <CTA lang={lang} live={stats} />
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
