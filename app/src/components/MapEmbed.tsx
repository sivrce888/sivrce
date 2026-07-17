'use client'

/**
 * SIVRCE — Interactive map embed via Google Maps Embed API.
 * Free, no API key needed, no npm deps. Shows a real interactive map.
 *
 * ponytail: Google Maps Embed for MVP. Upgrade path: Google Maps JS API
 * (adapter pattern, per plan.md §10a) or MapLibre+MapTiler when >$5K/mo.
 */

interface MapEmbedProps {
  /** Center lat/lng */
  lat: number
  lng: number
  /** Zoom level (1–21), default 14 */
  zoom?: number
  /** Map mode: 'place' for single pin, 'view' for area, 'search' for nearby */
  mode?: 'place' | 'view' | 'search'
  /** Search query (used when mode='search') */
  q?: string
  /** Optional CSS class */
  className?: string
  /** Aspect ratio, default '4/3' */
  aspect?: '4/3' | '16/9' | '1/1'
}

const ASPECTS = { '4/3': 'aspect-[4/3]', '16/9': 'aspect-video', '1/1': 'aspect-square' }

export default function MapEmbed({
  lat,
  lng,
  zoom = 14,
  mode = 'place',
  q,
  className = '',
  aspect = '4/3',
}: MapEmbedProps) {
  // Build the Google Maps embed URL
  const params = new URLSearchParams()
  params.set('key', '') // embed doesn't require a key for basic usage
  params.set('center', `${lat},${lng}`)
  params.set('zoom', String(zoom))
  params.set('maptype', 'roadmap')
  params.set('language', 'ka') // Georgian labels
  params.set('region', 'GE')

  if (mode === 'place') {
    params.set('q', q ?? `${lat},${lng}`)
  } else if (mode === 'search') {
    params.set('q', q ?? 'თბილისი')
  }

  const src = `https://www.google.com/maps/embed/v1/${mode}?${params.toString()}`

  return (
    <div className={`overflow-hidden rounded-card border border-sv-ink/6 ${ASPECTS[aspect]} ${className}`}>
      <iframe
        src={src}
        title="Interactive map"
        width="100%"
        height="100%"
        style={{ border: 0 }}
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        allowFullScreen
        className="h-full w-full"
      />
    </div>
  )
}
