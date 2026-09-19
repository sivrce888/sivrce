/* SIVRCE — service worker v2.
   Cache-first for static media (/images, /icons, /logo), network-first for
   pages with navigation preload, offline page as the last resort. */
const CACHE = 'sivrce-v2'
const OFFLINE = '/offline'
const MARK = '/logo/mark-144.png' /* offline page renders the brand mark from cache */
const CACHEABLE = /^\/(images|icons|logo)\//

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches
      .open(CACHE)
      .then((c) => Promise.all([c.add(OFFLINE), c.add(MARK)]))
      // Best-effort: a flaky first visit must not fail the install.
      .catch(() => {}),
  )
  self.skipWaiting()
})

self.addEventListener('activate', (e) => {
  e.waitUntil(
    (async () => {
      // Navigation preload lets the browser fetch while the SW boots —
      // without it every navigate waits on the worker first.
      await self.registration.navigationPreload.enable().catch(() => {})
      await Promise.all(
        (await caches.keys()).filter((k) => k !== CACHE).map((k) => caches.delete(k)),
      )
      await self.clients.claim()
    })(),
  )
})

self.addEventListener('push', (e) => {
  let data = {}
  try {
    data = e.data ? e.data.json() : {}
  } catch {
    data = {}
  }
  e.waitUntil(
    self.registration.showNotification(data.title || 'sivrce', {
      body: data.body || '',
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      data: { url: data.url || '/' },
    }),
  )
})

self.addEventListener('notificationclick', (e) => {
  e.notification.close()
  const url = (e.notification.data && e.notification.data.url) || '/'
  e.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clients) => {
        for (const client of clients) {
          if (new URL(client.url).origin === location.origin) {
            client.navigate(url)
            return client.focus()
          }
        }
        return self.clients.openWindow(url)
      }),
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

  // Pages: preloaded/network fetch, cached copy, offline page last
  if (request.mode === 'navigate') {
    e.respondWith(
      (async () => {
        try {
          const preloaded = await e.preloadResponse
          if (preloaded) return preloaded
        } catch {
          // preload failed (e.g. unsupported) — fall through to fetch
        }
        try {
          return await fetch(request)
        } catch {
          /* offline */
        }
        return (
          (await caches.match(request)) ||
          (await caches.match(OFFLINE)) ||
          new Response('offline', { status: 503, headers: { 'Content-Type': 'text/plain' } })
        )
      })(),
    )
  }
})
