'use client'

import LocalizedLink from '@/components/LocalizedLink'
import { mapFiltersToSearchHref, parseMapDeal, parseMapKind } from '@/lib/map/map-href'
import { useSearchParams } from 'next/navigation'

/** Header "სია" — carries /map deal+kind into /search. */
export default function MapListLink({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  const params = useSearchParams()
  const href = mapFiltersToSearchHref(parseMapDeal(params.get('deal')), parseMapKind(params.get('kind')))
  return (
    <LocalizedLink href={href} className={className}>
      {children}
    </LocalizedLink>
  )
}
