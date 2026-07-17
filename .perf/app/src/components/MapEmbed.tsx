'use client'

/**
 * SIVRCE — Interactive map embed via the keyless Google Maps output=embed
 * endpoint. No API key, no npm deps, shows a real interactive map.
 *
 * ponytail: keyless embed for MVP. Upgrade path: MapLibre+MapTiler JS API
 * when interactions (filters, clusters) outgrow a plain iframe.
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
  q,
  className = '',
  aspect = '4/3',
}: MapEmbedProps) {
  const query = q ?? `${lat},${lng}`
  const src =
    `https://maps.google.com/maps?q=${encodeURIComponent(query)}` +
    `&z=${zoom}&hl=ka&output=embed`

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
