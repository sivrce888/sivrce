import { Suspense, type ReactNode } from 'react'
import Navbar from '@/components/sections/Navbar'
import Hero from '@/components/sections/Hero'
import Stats from '@/components/sections/Stats'
import Categories from '@/components/sections/Categories'
import NeighborhoodsRail from '@/components/sections/NeighborhoodsRail'
import StoriesRail from '@/components/sections/StoriesRail'
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
import type { Listing } from '@/data/listings'
import { AGENT_PROFILES } from '@/data/professionals'
import {
  getAgentListingCountsByKaName,
  getDistrictListingCounts,
  getFeaturedListings,
  getStoryListings,
  type Listing as StoryListing,
} from '@/lib/listings-db'
import { developersLive, projectsLive } from '@/lib/directory-live'
import { getHomeStats } from '@/lib/home-stats'
import { AdSlot } from '@/components/ads/AdSlot'
import { CmsSection } from '@/components/cms/CmsPreviewBridge'
import { getHomeLayout } from '@/lib/cms'
import type { HomeFlowId } from '@/lib/cms-studio'
import type { Lang } from '@/lib/i18n/core'

/** DB-first featured rail; empty when DB is down — fallback cards 404'd
 * (detail pages are DB-only by design), so the section hides instead. */
async function getFeatured(): Promise<Listing[]> {
  try {
    return await getFeaturedListings(6)
  } catch { /* DB unavailable — hide the rail, never link to 404s */ }
  return []
}

/** Below-fold: await DB here so Hero paints without waiting on Prisma. */
async function HomeBelowFold({ lang }: { lang: Lang }) {
  const [featured, stories, projects, stats, developers, agentCounts, districtCounts] = await Promise.all([
    getFeatured(),
    getStoryListings().catch(() => [] as StoryListing[]),
    projectsLive().catch(() => []),
    getHomeStats(),
    developersLive().catch(() => []),
    getAgentListingCountsByKaName().catch(() => ({}) as Record<string, number>),
    getDistrictListingCounts().catch(() => ({}) as Record<string, number>),
  ])
  // Under-construction first; real CDN heroes over stock npN/pN. Rail shows 8 — rest via /projects.
  const building = projects.filter((p) => p.done < 100)
  const pool = building.length >= 2 ? building : projects
  const withHero = pool.filter((p) => !/\/(?:np|p)\d+\.webp(?:\?|$)/.test(p.img))
  const homeProjects = (withHero.length >= 2 ? withHero : pool).slice(0, 8)

  const activeByDev: Record<string, number> = {}
  for (const p of projects) {
    if (p.developerSlug && p.done < 100) {
      activeByDev[p.developerSlug] = (activeByDev[p.developerSlug] ?? 0) + 1
    }
  }
  const topDevelopers = [...developers]
    .map((d) => ({
      slug: d.slug,
      name: d.name,
      city: d.city,
      verified: d.verified,
      logoUrl: d.logoUrl,
      projectsDone: d.projectsDone,
      listingsCount: activeByDev[d.slug] ?? 0,
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

  const layout = await getHomeLayout()
  const nodes: Record<HomeFlowId, ReactNode> = {
    stories: <StoriesRail items={stories} />,
    categories: <Categories lang={lang} />,
    listings: <Listings items={featured} />,
    ad_mid: <AdSlot slot="home_mid" lang={lang} />,
    neighborhoods: <NeighborhoodsRail counts={districtCounts} />,
    map: <MapSection />,
    projects: <Projects items={homeProjects} total={projects.length} />,
    ad_after_projects: <AdSlot slot="home_after_projects" lang={lang} />,
    agents: <AgentSlider agents={topAgents} total={AGENT_PROFILES.length} />,
    developers: <DeveloperSlider developers={topDevelopers} total={developers.length} />,
    services: <Services lang={lang} />,
    stats: <Stats live={stats} />,
    forum: <ForumTeaser />,
    blog: <BlogNewsSection />,
    cta: <CTA lang={lang} />,
  }

  return (
    <>
      {layout.map((item) =>
        item.hidden ? null : (
          <CmsSection key={item.id} id={item.id}>
            {nodes[item.id]}
          </CmsSection>
        ),
      )}
    </>
  )
}

/** Homepage section assembly — lang drives CMS block copy on server sections. */
export default function HomeMain({ lang = 'ka' }: { lang?: Lang }) {
  return (
    <div className="min-h-screen bg-sv-cloud">
      <Navbar />
      <main id="main">
        <Hero lang={lang} />
        <Suspense fallback={null}>
          <div className="sv-below-fold">
            <HomeBelowFold lang={lang} />
          </div>
        </Suspense>
      </main>
      <Footer />
    </div>
  )
}
