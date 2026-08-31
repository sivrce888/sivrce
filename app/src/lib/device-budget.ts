/**
 * Device + map RAM budget. Detect once; never poll performance.memory.
 * Lite: ≤2 GB deviceMemory, ≤2 cores, Save-Data, or reduced motion.
 */

export const LITE_BOOT = `(function(){try{var n=navigator,c=n.connection||n.mozConnection||n.webkitConnection;if((c&&c.saveData)||(n.deviceMemory&&n.deviceMemory<=2)||(n.hardwareConcurrency&&n.hardwareConcurrency<=2)||matchMedia('(prefers-reduced-motion: reduce)').matches)document.documentElement.setAttribute('data-lite','')}catch(e){}})();`

type Nav = Navigator & {
  deviceMemory?: number
  connection?: { saveData?: boolean }
}

export function isLiteDevice(): boolean {
  if (typeof window === "undefined") return false
  if (document.documentElement.hasAttribute("data-lite")) return true
  const n = navigator as Nav
  if (n.connection?.saveData) return true
  if ((n.deviceMemory ?? 8) <= 2) return true
  if ((n.hardwareConcurrency ?? 8) <= 2) return true
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches
}

/** MapLibre GPU/RAM caps. Call at map construct time (browser only). */
export function mapRuntimeOptions() {
  const lite = isLiteDevice()
  const dpr = typeof window === "undefined" ? 1 : window.devicePixelRatio || 1
  return {
    antialias: !lite,
    maxTileCacheSize: lite ? 24 : 80,
    pixelRatio: Math.min(dpr, lite ? 1.25 : 2),
    collectResourceTiming: false as const,
    preserveDrawingBuffer: false as const,
    refreshExpiredTiles: !lite,
  }
}
