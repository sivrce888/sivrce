import { Suspense, type ReactNode } from 'react'
import Navbar from '@/components/sections/Navbar'
import Hero from '@/components/sections/Hero'
import Stats from '@/components/sections/Stats'
import Categories from '@/components/sections/Categories'
import NeighborhoodsRail from '@/components/sections/NeighborhoodsRail'
import StoriesRail from '@/components/sections/StoriesRail'
import VideoListingsRail from '@/components/sections/VideoListingsRail'
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
import { AGENT_PROFILES } from '@/data/professionals'
import {
  getAgentListingCountsByKaName,
  getDistrictListingCounts,
  getHomeTierListings,
  getStoryListings,
  getVideoListings,
  type Listing as StoryListing,
} from '@/lib/listings-db'
import { developersLive, projectsLive } from '@/lib/directory-live'
import { getHomeStats } from '@/lib/home-stats'
import { AdSlot } from '@/components/ads/AdSlot'
import { CmsSection } from '@/components/cms/CmsPreviewBridge'
import { getHomeLayout } from '@/lib/cms'
import type { HomeFlowId } from '@/lib/cms-studio'
import { listBlogPosts } from '@/lib/blog-live'
import type { Lang } from '@/lib/i18n/core'
import { cardPhotoPayload } from '@/lib/card-gallery-teaser'
import { homeScopeFor, homeSearchHref, type HomeScope } from '@/lib/home-scope'
import type { MarketId } from '@/lib/markets'

/** Drop description + extra gallery frames from the RSC payload (homepage HTML was ~500KB). */
function railCard(l: StoryListing): StoryListing {
  const images = l.images.length ? l.images : [l.img]
  return { ...l, description: '', ...cardPhotoPayload(images) }
}

import { DEVELOPERS, PROJECTS, getDeveloper, type Developer, type Project } from '@/data/professionals'
import { cityByName, nearestMapCity } from '@/lib/map/user-place'

function countryProjects(country: string): Project[] {
  // Worldwide hub shows the whole shipped catalog (GE + DE + …).
  if (country === '*') return PROJECTS
  return PROJECTS.filter((p) => {
    const pin = cityByName(p.city)
    const cc = pin?.cc ?? (p.coords ? nearestMapCity(p.coords.lat, p.coords.lng)?.cc : null)
    return cc === country
  })
}

function countryDevelopers(country: string): Developer[] {
  if (country === '*') return DEVELOPERS
  return DEVELOPERS.filter((d) => {
    const pin = cityByName(typeof d.city === 'string' ? d.city : (d.city as Record<string, string>)?.ka ?? '')
    return pin?.cc === country
  })
}

/** Below-fold: await DB here so Hero paints without waiting on Prisma. */
async function HomeBelowFold({ lang, scope }: { lang: Lang; scope: HomeScope | null }) {
  const ge = scope?.country === 'GE'
  const country = scope?.country ?? 'GE'
  const [superVip, vipPlus, stories, videos, projects, stats, developers, agentCounts, districtCounts, blogPosts] =
    await Promise.all([
      scope ? getHomeTierListings('diamond', 8, scope).catch(() => []) : Promise.resolve([]),
      scope ? getHomeTierListings('super_vip', 8, scope).catch(() => []) : Promise.resolve([]),
      scope ? getStoryListings(12, scope).catch(() => [] as StoryListing[]) : Promise.resolve([] as StoryListing[]),
      scope ? getVideoListings(16, scope).catch(() => [] as StoryListing[]) : Promise.resolve([] as StoryListing[]),
      ge ? projectsLive().catch(() => []) : Promise.resolve(countryProjects(country)),
      getHomeStats(scope?.country),
      ge ? developersLive().catch(() => []) : Promise.resolve(countryDevelopers(country)),
      ge ? getAgentListingCountsByKaName().catch(() => ({}) as Record<string, number>) : Promise.resolve({} as Record<string, number>),
      ge ? getDistrictListingCounts('GE').catch(() => ({}) as Record<string, number>) : Promise.resolve({} as Record<string, number>),
      listBlogPosts().catch(() => []),
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
  // '*' = worldwide: plain /map (the map has its own country picker), not a bogus ?country=*.
  const mapHref = scope && scope.country !== '*' ? `/map?country=${scope.country}` : '/map'
  const nodes: Record<HomeFlowId, ReactNode> = {
    stories: scope ? (
      <>
        <StoriesRail items={stories.map(railCard)} />
        <VideoListingsRail items={videos.map(railCard)} />
      </>
    ) : null,
    categories: <Categories lang={lang} />,
    listings: (
      <Listings
        items={superVip.map(railCard)}
        rail="superVip"
        href={homeSearchHref({ tier: 'diamond' }, scope)}
      />
    ),
    vip_plus: (
      <Listings
        items={vipPlus.map(railCard)}
        rail="vipPlus"
        href={homeSearchHref({ tier: 'super_vip' }, scope)}
      />
    ),
    ad_mid: <AdSlot slot="home_mid" lang={lang} />,
    neighborhoods: ge ? <NeighborhoodsRail counts={districtCounts} /> : null,
    map: <MapSection href={mapHref} />,
    projects: homeProjects.length > 0 ? (
      // ponytail: dev names resolved server-side — a client getDeveloper() would drag the whole catalog into the bundle.
      <Projects
        items={homeProjects}
        total={projects.length}
        devNames={Object.fromEntries(
          homeProjects.flatMap((p) => {
            const d = getDeveloper(p.developerSlug)
            return d ? [[p.slug, d.name] as const] : []
          }),
        )}
      />
    ) : null,
    ad_after_projects: <AdSlot slot="home_after_projects" lang={lang} />,
    agents: ge ? <AgentSlider agents={topAgents} total={AGENT_PROFILES.length} /> : null,
    developers: topDevelopers.length > 0 ? <DeveloperSlider developers={topDevelopers} total={developers.length} /> : null,
    services: <Services lang={lang} />,
    stats: <Stats live={stats} />,
    forum: <ForumTeaser />,
    blog: <BlogNewsSection articles={blogPosts.slice(0, 4)} />,
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
export default function HomeMain({
  lang = 'ka',
  market = 'ge',
}: {
  lang?: Lang
  market?: MarketId
}) {
  const scope = homeScopeFor(market)
  // '*' is not an ISO — the hero search box searches the world on the hub.
  const heroCountry = scope && scope.country !== '*' ? scope.country : undefined
  return (
    <div className="min-h-screen bg-sv-cloud">
      <Navbar />
      <main id="main">
        <Hero lang={lang} country={heroCountry} geChips={scope?.country === 'GE'} />
        <Suspense fallback={null}>
          <div className="sv-below-fold">
            <HomeBelowFold lang={lang} scope={scope} />
          </div>
        </Suspense>
      </main>
      <Footer />
    </div>
  )
}
