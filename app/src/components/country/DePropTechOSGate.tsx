'use client'

import { useSyncExternalStore } from 'react'
import dynamic from 'next/dynamic'
import { isLiteDevice } from '@/lib/device-budget'

const DePropTechOS = dynamic(() => import('./DePropTechOS'), { ssr: false })

const subscribe = () => () => {}
const clientOn = () => !isLiteDevice()
const serverOff = () => false

/** Below-fold: skip the 6-tab underwriting island on lite phones. BuyerCosts already tells the statutory story. */
export default function DePropTechOSGate({ citySlug, de = true }: { citySlug?: string; de?: boolean }) {
  const on = useSyncExternalStore(subscribe, clientOn, serverOff)
  if (!on) return null
  return <DePropTechOS citySlug={citySlug} de={de} />
}
