/**
 * Full /projects card corpus for the hub's client filters — static per locale,
 * ISR-refreshed hourly, served from the CDN. The hub page itself ships only
 * the first page of cards; the explorer fetches this when a reader reaches
 * for the filters (~120 KB gz no longer rides on every visit).
 */
import { NextResponse } from 'next/server'
import { projectsLive } from '@/lib/directory-live'
import { marketDeltas } from '@/lib/project-insights'
import { isProjectInGeorgia, toCard } from '@/app/[lang]/projects/to-card'
import { hostKind, MARKET_HEADER } from '@/lib/site-host'

export const revalidate = 3600

const LOCS = ['ka', 'en', 'ru', 'de'] as const
type Loc = (typeof LOCS)[number]

export function generateStaticParams() {
  return LOCS.map((loc) => ({ loc }))
}

export async function GET(req: Request, { params }: { params: Promise<{ loc: string }> }) {
  const { loc } = await params
  if (!(LOCS as readonly string[]).includes(loc)) return NextResponse.json({ error: 'bad_locale' }, { status: 404 })
  const url = new URL(req.url)
  const country = url.searchParams.get('country')?.toUpperCase()
  const host = (req.headers.get('x-forwarded-host') || req.headers.get('host') || '')
    .split(',')[0]!.trim().split(':')[0]!.toLowerCase()
  const kind = host ? hostKind(host, process.env.VERCEL_ENV) : 'dev'
  const market = req.headers.get(MARKET_HEADER)
  const isGe = country === 'GE' || kind === 'ge' || market === 'ge'

  const all = await projectsLive()
  const projects = isGe ? all.filter((p) => isProjectInGeorgia(p)) : all
  const deltas = marketDeltas(projects)
  return NextResponse.json(projects.map((p) => toCard(p, loc as Loc, deltas)))
}
