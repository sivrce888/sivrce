import type { Metadata } from 'next'
import { cookies } from 'next/headers'
import LocalizedLink from '@/components/LocalizedLink'
import { ArrowLeft } from 'lucide-react'
import { Logo } from '@/components/Logo'
import { projectsLive } from '@/lib/directory-live'
import { getDbBuildingClusters, getMapListings } from '@/lib/map/db-buildings'
import { getMapPlatformConfig } from '@/lib/map/platform-config'
import { MAP_UI_COOKIE, parseMapUiRaw } from '@/lib/map/map-ui'
import { Map3DLazy } from './Map3DLazy'

export const metadata: Metadata = {
  title: '3D რუკა — კორპუსები და განცხადებები',
  description: '3D რუკა — აირჩიე კორპუსი, ნახე განცხადებები.',
  openGraph: {
    title: 'sivrce 3D რუკა',
    description: 'აირჩიე შენობა რუკაზე — განცხადებები პანელში.',
  },
}

export default async function MapPage() {
  const cookieStore = await cookies()
  const initialUi = parseMapUiRaw(cookieStore.get(MAP_UI_COOKIE)?.value)
  const [dbBuildings, listings, projects, platform] = await Promise.all([
    getDbBuildingClusters(),
    getMapListings(),
    projectsLive(),
    getMapPlatformConfig(),
  ])
  return (
    <div className="flex min-h-dvh flex-col bg-sv-navy">
      <header className="z-40 flex h-[4.5rem] shrink-0 items-center justify-between border-b border-white/8 bg-sv-navy/95 px-4 backdrop-blur-md md:h-20 md:px-8">
        <div className="flex items-center gap-3">
          <LocalizedLink
            href="/"
            className="grid h-10 w-10 place-items-center rounded-full border border-white/10 text-white/70 transition hover:border-sv-blue/40 hover:text-white"
            aria-label="უკან"
          >
            <ArrowLeft className="h-4 w-4" />
          </LocalizedLink>
          <Logo light />
        </div>
        <p className="hidden text-[13px] font-semibold text-white/50 sm:block">
          აირჩიე კორპუსი — განცხადებები მარჯვნივ
        </p>
        <div className="flex items-center gap-2">
          <LocalizedLink
            href="/buildings"
            className="hidden rounded-full border border-white/15 px-4 py-2 text-[13px] font-extrabold text-white/80 transition hover:border-sv-blue/40 hover:text-white sm:inline-flex"
          >
            შენობები
          </LocalizedLink>
          <LocalizedLink
            href="/search"
            className="rounded-full bg-sv-orange px-4 py-2 text-[13px] font-extrabold text-white shadow-glow-orange transition hover:-translate-y-0.5"
          >
            სია
          </LocalizedLink>
        </div>
      </header>
      <Map3DLazy
        dbBuildings={dbBuildings}
        listings={listings}
        projects={projects}
        initialUi={initialUi}
        platform={platform}
      />
    </div>
  )
}
