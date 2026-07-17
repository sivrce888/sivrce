/* SIVRCE — minimal service worker.
   Cache-first for static media (/images, /icons, /logo), network-first for pages. */
const CACHE = 'sivrce-v1'
const CACHEABLE = /^\/(images|icons|logo)\//

self.addEventListener('install', () => self.skipWaiting())

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (e) => {
  const { request } = e
  if (request.method !== 'GET') return
  const url = new URL(request.url)
  if (url.origin !== location.origin) return

  // Static media: cache-first, populate on miss
  if (CACHEABLE.test(url.pathname)) {
    e.respondWith(
      caches.match(request).then((hit) => {
        if (hit) return hit
        return fetch(request).then((res) => {
          if (res.ok) {
            const copy = res.clone()
            caches.open(CACHE).then((c) => c.put(request, copy))
          }
          return res
        })
      }),
    )
    return
  }

  // Pages: network-first, cache fallback when offline
  if (request.mode === 'navigate') {
    e.respondWith(fetch(request).catch(() => caches.match(request)))
  }
})
