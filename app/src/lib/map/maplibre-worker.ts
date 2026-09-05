/**
 * MapLibre 6 needs a real https worker URL. Turbopack's bundled
 * import.meta.url is not http(s), so defaultWorkerUrl() is '' → 0 actors.
 * ponytail: public/maplibre copied from node_modules (see copy-maplibre-worker.mjs).
 */
let bound = false

type MlWorkerApi = {
  setWorkerUrl: (url: string) => void
  prewarm: () => void
}

export function bindMaplibreWorker(ml: MlWorkerApi) {
  if (typeof window === 'undefined') return
  ml.setWorkerUrl(`${window.location.origin}/maplibre/maplibre-gl-worker.mjs`)
  if (bound) return
  bound = true
  ml.prewarm()
}
