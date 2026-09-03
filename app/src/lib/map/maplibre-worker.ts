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
  if (bound || typeof window === 'undefined') return
  bound = true
  ml.setWorkerUrl(`${window.location.origin}/maplibre/maplibre-gl-worker.mjs`)
  ml.prewarm()
}
