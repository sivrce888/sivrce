'use client'

import { useEffect } from 'react'
import { initRumTelemetry } from '@/lib/rum-telemetry'

/**
 * Passive Real User Monitoring (RUM) Beacon.
 * Boots performance observers on idle callback to record Core Web Vitals (LCP, CLS, TTFB)
 * with zero main thread overhead.
 */
export function RumBeacon() {
  useEffect(() => {
    initRumTelemetry()
  }, [])

  return null
}
