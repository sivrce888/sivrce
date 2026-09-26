/**
 * Full /projects card corpus for the hub's client filters — static per locale,
 * ISR-refreshed hourly, served from the CDN. The hub page itself ships only
 * the first page of cards; the explorer fetches this when a reader reaches
 * for the filters (~120 KB gz no longer rides on every visit).
 */
import { NextResponse } from 'next/server'
import { projectsLive } from '@/lib/directory-live'
import { marketDeltas } from '@/lib/project-insights'
import { toCard } from '@/app/[lang]/projects/to-card'

export const revalidate = 3600

const LOCS = ['ka', 'en', 'ru', 'de'] as const
type Loc = (typeof LOCS)[number]

export function generateStaticParams() {
  return LOCS.map((loc) => ({ loc }))
}

export async function GET(_req: Request, { params }: { params: Promise<{ loc: string }> }) {
  const { loc } = await params
  if (!(LOCS as readonly string[]).includes(loc)) return NextResponse.json({ error: 'bad_locale' }, { status: 404 })
  const all = await projectsLive()
  const deltas = marketDeltas(all)
  return NextResponse.json(all.map((p) => toCard(p, loc as Loc, deltas)))
}
