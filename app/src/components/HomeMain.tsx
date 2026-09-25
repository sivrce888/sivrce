import { Suspense, type ReactNode } from 'react'
import Navbar from '@/components/sections/Navbar'
import Hero from '@/components/sections/Hero'
import Stats from '@/components/sections/Stats'
import Categories from '@/components/sections/Categories'
import NeighborhoodsRail from '@/components/sections/NeighborhoodsRail'
import StoriesRail from '@/components/sections/StoriesRail'
import VideoListingsRail from '@/components/sections/VideoListingsRail'
import PersonalizedRail from '@/components/sections/PersonalizedRail'
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
import { NEIGHBORHOODS, overallScore, pick } from '@/data/neighborhoods'
import { getNeighborhoodMarketStats } from '@/lib/market-stats'
import { USD_GEL } from '@/lib/listings-db'
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
import { placeLabel } from '@/lib/place-label'
import { readableName } from '@/lib/ka-latin'

function projectCountry(p: Project): string {
  const pin = cityByName(p.city)
  return pin?.cc ?? (p.coords ? nearestMapCity(p.coords.lat, p.coords.lng)?.cc : null) ?? 'GE'
}

// Same country resolution as /projects toCard — the rail's "All (N)" matches ?country=N's grid.
function countryProjects(country: string, list: Project[]): Project[] {
  // Worldwide hub shows the whole shipped catalog (GE + DE + …).
  if (country === '*') return list
  return list.filter((p) => projectCountry(p) === country)
}

/** Developers with a project in the market, or headquartered there (DB-only rows carry no projects). */
function countryDevelopers(country: string, list: Developer[], projects: Project[]): Developer[] {
  if (country === '*') return list
  const active = new Set(projects.map((p) => p.developerSlug))
  return list.filter((d) => active.has(d.slug) || cityByName(d.city)?.cc === country)
}

/** Card payload only — descriptions/galleries never ride the RSC stream; places readable in the UI locale. */
function railProject(p: Project, lang: Lang): Project {
  return {
    ...p,
    location: readableName(p.location, lang),
    description: { ka: '', en: '', ru: '' },
    gallery: undefined,
    galleryCredits: undefined,
  }
}

const FEATURED_NEIGHBORHOODS = ['vake', 'saburtalo', 'old-tbilisi', 'mtatsminda', 'vera', 'lisi', 'batumi', 'kutaisi']

/** Rail cards resolved here so the 67 KB guide corpus stays on the server. Live
 *  $/m² from the same cached source as /neighborhoods — home and index agree. */
async function featuredNeighborhoods(lang: Lang, counts: Record<string, number>) {
  const rows = NEIGHBORHOODS.filter((n) => FEATURED_NEIGHBORHOODS.includes(n.slug)).sort(
    (a, b) => FEATURED_NEIGHBORHOODS.indexOf(a.slug) - FEATURED_NEIGHBORHOODS.indexOf(b.slug),
  )
  const live = await Promise.all(
    rows.map((n) => getNeighborhoodMarketStats(n.cityKey, n.districts, USD_GEL).catch(() => null)),
  )
  return rows.map((n, i) => ({
    slug: n.slug,
    name: pick(n.name, lang),
    city: pick(n.city, lang),
    img: n.img,
    score: overallScore(n),
    avgPriceM2USD: live[i]?.stats?.avgPerM2USD || n.avgPriceM2USD,
    count: n.districts.reduce((sum, d) => sum + (counts[d] ?? 0), 0),
  }))
}

/** Below-fold: await DB here so Hero paints without waiting on Prisma. */
async function HomeBelowFold({ lang, scope }: { lang: Lang; scope: HomeScope | null }) {
  const ge = scope?.country === 'GE'
  const country = scope?.country ?? 'GE'
  const [superVip, vipPlus, stories, videos, allProjects, stats, allDevelopers, agentCounts, districtCounts, blogPosts] =
    await Promise.all([
      scope ? getHomeTierListings('diamond', 8, scope).catch(() => []) : Promise.resolve([]),
      scope ? getHomeTierListings('super_vip', 8, scope).catch(() => []) : Promise.resolve([]),
      scope ? getStoryListings(12, scope).catch(() => [] as StoryListing[]) : Promise.resolve([] as StoryListing[]),
      scope ? getVideoListings(16, scope).catch(() => [] as StoryListing[]) : Promise.resolve([] as StoryListing[]),
      ge ? projectsLive().catch(() => []) : Promise.resolve(PROJECTS),
      getHomeStats(scope?.country),
      ge ? developersLive().catch(() => []) : Promise.resolve(DEVELOPERS),
      ge ? getAgentListingCountsByKaName().catch(() => ({}) as Record<string, number>) : Promise.resolve({} as Record<string, number>),
      ge ? getDistrictListingCounts('GE').catch(() => ({}) as Record<string, number>) : Promise.resolve({} as Record<string, number>),
      listBlogPosts().catch(() => []),
    ])
  // sivrce.ge rails stay in Georgia — the live catalog also carries Berlin/Dubai rows.
  const projects = countryProjects(country, allProjects)
  const developers = countryDevelopers(country, allDevelopers, projects)
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
      city: readableName(placeLabel(d.city, lang), lang),
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

  const [layout, nbItems] = await Promise.all([
    getHomeLayout(),
    ge ? featuredNeighborhoods(lang, districtCounts) : Promise.resolve([]),
  ])
  // '*' = worldwide: plain /map (the map has its own country picker), not a bogus ?country=*.
  const mapHref = scope && scope.country !== '*' ? `/map?country=${scope.country}` : '/map'
  // Slim cards hoisted so PersonalizedRail reuses the same object refs —
  // React Flight serializes each once (no duplicate RSC payload).
  const superVipCards = superVip.map(railCard)
  const vipPlusCards = vipPlus.map(railCard)
  const storyCards = stories.map(railCard)
  const videoCards = videos.map(railCard)
  const seen = new Set<string>()
  const railCatalog = [...superVipCards, ...vipPlusCards, ...storyCards, ...videoCards].filter(
    (l) => (seen.has(l.id) ? false : (seen.add(l.id), true)),
  )
  const nodes: Record<HomeFlowId, ReactNode> = {
    stories: scope ? (
      <>
        <StoriesRail items={storyCards} />
        <VideoListingsRail items={videoCards} />
      </>
    ) : null,
    categories: <Categories lang={lang} country={country} projectsTotal={projects.length} />,
    listings: (
      <Listings
        items={superVipCards}
        rail="superVip"
        href={homeSearchHref({ tier: 'diamond' }, scope)}
      />
    ),
    vip_plus: (
      <Listings
        items={vipPlusCards}
        rail="vipPlus"
        href={homeSearchHref({ tier: 'super_vip' }, scope)}
      />
    ),
    personalized: railCatalog.length > 0 ? <PersonalizedRail catalog={railCatalog} /> : null,
    ad_mid: <AdSlot slot="home_mid" lang={lang} />,
    neighborhoods: nbItems.length > 0 ? <NeighborhoodsRail items={nbItems} /> : null,
    map: <MapSection href={mapHref} />,
    projects: homeProjects.length > 0 ? (
      // ponytail: dev names resolved server-side — a client getDeveloper() would drag the whole catalog into the bundle.
      <Projects
        items={homeProjects.map((p) => railProject(p, lang))}
        total={projects.length}
        href={country === '*' ? '/projects' : `/projects?country=${country}`}
        devNames={Object.fromEntries(
          homeProjects.flatMap((p) => {
            const d = getDeveloper(p.developerSlug)
            return d ? [[p.slug, d.name] as const] : []
          }),
        )}
      />
    ) : null,
    ad_after_projects: <AdSlot slot="home_after_projects" lang={lang} />,
    agents: ge && topAgents.length > 0 ? <AgentSlider agents={topAgents} total={AGENT_PROFILES.length} /> : null,
    developers: topDevelopers.length > 0 ? <DeveloperSlider developers={topDevelopers} total={allDevelopers.length} /> : null,
    services: <Services lang={lang} />,
    // Project count = the same scoped catalog the rail links to, not the world total.
    stats: <Stats live={{ ...stats, projects: projects.length }} />,
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
  after,
}: {
  lang?: Lang
  market?: MarketId
  /** Extra sections inside <main>, below the rails and above the footer. */
  after?: ReactNode
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
        {after}
      </main>
      <Footer />
    </div>
  )
}
