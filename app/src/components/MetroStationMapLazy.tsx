'use client'

import dynamic from 'next/dynamic'
import type { ComponentProps } from 'react'

/** GL only when scrolled into view territory — server page stays streamable. */
export const MetroStationMapLazy = dynamic(() => import('@/components/MetroStationMap'), {
  ssr: false,
})

export default function MetroStationMapIdle(props: ComponentProps<typeof MetroStationMapLazy>) {
  return <MetroStationMapLazy {...props} />
}
