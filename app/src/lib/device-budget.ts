/**
 * Device + map RAM budget. Detect once; never poll performance.memory.
 * Lite: user lock (localStorage sv-lite), ≤4 GB, ≤4 cores, Save-Data, reduced motion.
 */

export const LITE_RAM_GB = 4
export const LITE_CORES = 4
export const LITE_TILE_CACHE = 16
export const FULL_TILE_CACHE = 48

export const LITE_BOOT = `(function(){try{var n=navigator,c=n.connection||n.mozConnection||n.webkitConnection;if(localStorage.getItem('sv-lite')==='1'||(c&&c.saveData)||(n.deviceMemory&&n.deviceMemory<=${LITE_RAM_GB})||(n.hardwareConcurrency&&n.hardwareConcurrency<=${LITE_CORES})||matchMedia('(prefers-reduced-motion: reduce)').matches)document.documentElement.setAttribute('data-lite','')}catch(e){}})();`

type Nav = Navigator & {
  deviceMemory?: number
  connection?: { saveData?: boolean }
}

export function isLiteDevice(): boolean {
  if (typeof window === "undefined") return false
  if (document.documentElement.hasAttribute("data-lite")) return true
  try {
    if (localStorage.getItem("sv-lite") === "1") return true
  } catch {
    // ponytail: private mode — fall through to heuristics
  }
  const n = navigator as Nav
  if (n.connection?.saveData) return true
  if ((n.deviceMemory ?? 8) <= LITE_RAM_GB) return true
  if ((n.hardwareConcurrency ?? 8) <= LITE_CORES) return true
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches
}

/** MapLibre GPU/RAM caps. Call at map construct time (browser only). */
export function mapRuntimeOptions() {
  const lite = isLiteDevice()
  const dpr = typeof window === "undefined" ? 1 : window.devicePixelRatio || 1
  return {
    antialias: !lite,
    maxTileCacheSize: lite ? LITE_TILE_CACHE : FULL_TILE_CACHE,
    pixelRatio: Math.min(dpr, lite ? 1.25 : 2),
    collectResourceTiming: false as const,
    preserveDrawingBuffer: false as const,
    refreshExpiredTiles: !lite,
  }
}
