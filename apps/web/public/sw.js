// Hayyamed AI — PWA service worker (Phase 1)
// Network-first for navigations (always fresh when online, cached shell when offline),
// cache-first for static assets. Keep cache name versioned to bust on deploy.

const CACHE = 'hayyamed-ai-v1'
const OFFLINE_URL = '/offline.html'
const PRECACHE = ['/offline.html', '/logo.svg']

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(PRECACHE)).then(() => self.skipWaiting())
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return

  const url = new URL(request.url)
  // Never cache API calls — always go to network.
  if (url.pathname.startsWith('/api/')) return

  // Navigations: network-first, fall back to cached page or offline shell.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((res) => {
          const copy = res.clone()
          caches.open(CACHE).then((c) => c.put(request, copy)).catch(() => {})
          return res
        })
        .catch(() => caches.match(request).then((r) => r || caches.match(OFFLINE_URL)))
    )
    return
  }

  // Static assets: cache-first, then network.
  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.match(request).then((cached) =>
        cached ||
        fetch(request).then((res) => {
          const copy = res.clone()
          caches.open(CACHE).then((c) => c.put(request, copy)).catch(() => {})
          return res
        }).catch(() => cached)
      )
    )
  }
})
