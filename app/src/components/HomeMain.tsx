import { Suspense } from 'react'
import Navbar from '@/components/sections/Navbar'
import Hero from '@/components/sections/Hero'
import Stats from '@/components/sections/Stats'
import Categories from '@/components/sections/Categories'
import StoriesRail from '@/components/sections/StoriesRail'
import Collections from '@/components/sections/Collections'
import Listings from '@/components/sections/Listings'
import MapSection from '@/components/sections/MapSection'
import Projects from '@/components/sections/Projects'
import AgentSlider from '@/components/sections/AgentSlider'
import DeveloperSlider from '@/components/sections/DeveloperSlider'
import Services from '@/components/sections/Services'
import ForumTeaser from '@/components/sections/ForumTeaser'
import BlogNewsSection from '@/components/sections/BlogNewsSection'
import CTA from '@/components/sections/CTA'
import Footer from '@/components/sections/Footer'
import { LISTINGS, type Listing } from '@/data/listings'
import { AGENT_PROFILES } from '@/data/professionals'
import {
  getAgentListingCountsByKaName,
  getDeveloperListingCountsBySlug,
  getFeaturedListings,
  getStoryListings,
  type Listing as StoryListing,
} from '@/lib/listings-db'
import { developersLive, projectsLive } from '@/lib/directory-live'
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

/** Below-fold: await DB here so Hero paints without waiting on Prisma. */
async function HomeBelowFold({ lang }: { lang: Lang }) {
  const [featured, stories, projects, stats, developers, agentCounts] = await Promise.all([
    getFeatured(),
    getStoryListings().catch(() => [] as StoryListing[]),
    projectsLive().catch(() => []),
    getHomeStats(),
    developersLive().catch(() => []),
    getAgentListingCountsByKaName().catch(() => ({}) as Record<string, number>),
  ])
  // Under-construction first; real CDN heroes over stock npN/pN. Rail shows 8 — rest via /projects.
  const building = projects.filter((p) => p.done < 100)
  const pool = building.length >= 2 ? building : projects
  const withHero = pool.filter((p) => !/\/(?:np|p)\d+\.webp(?:\?|$)/.test(p.img))
  const homeProjects = (withHero.length >= 2 ? withHero : pool).slice(0, 8)

  const projectToDev = new Map(
    projects.filter((p) => p.developerSlug).map((p) => [p.slug, p.developerSlug!]),
  )
  const devCounts = await getDeveloperListingCountsBySlug(projectToDev).catch(
    () => ({}) as Record<string, number>,
  )
  const topDevelopers = [...developers]
    .map((d) => ({
      slug: d.slug,
      name: d.name,
      city: d.city,
      verified: d.verified,
      logoUrl: d.logoUrl,
      projectsDone: d.projectsDone,
      listingsCount: devCounts[d.slug] ?? 0,
    }))
    .sort((a, b) => b.listingsCount - a.listingsCount || b.projectsDone - a.projectsDone)
    .slice(0, 12)

  const topAgents = [...AGENT_PROFILES]
    .map((a) => ({
      slug: a.slug,
      name: a.name,
      agency: a.agency,
      city: a.city,
      verified: a.verified,
      listingsCount: agentCounts[a.name.ka] ?? 0,
    }))
    .sort((a, b) => b.listingsCount - a.listingsCount)
    .slice(0, 12)

  return (
    <>
      <StoriesRail items={stories} />
      <Stats live={stats} />
      <Categories lang={lang} />
      <Collections lang={lang} />
      <Listings items={featured} />
      <MapSection />
      <Projects items={homeProjects} total={projects.length} />
      <AgentSlider agents={topAgents} total={AGENT_PROFILES.length} />
      <DeveloperSlider developers={topDevelopers} total={developers.length} />
      <Services lang={lang} />
      <ForumTeaser />
      <BlogNewsSection />
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
