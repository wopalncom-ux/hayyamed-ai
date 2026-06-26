// Hayyamed AI — PWA service worker (Phase 1)
// Network-first for navigations (always fresh when online, cached shell when offline),
// cache-first for static assets. Keep cache name versioned to bust on deploy.

const CACHE = 'hayyamed-ai-v2'
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

// Web push — show the notification
self.addEventListener('push', (event) => {
  let data = { title: 'Hayyamed AI', body: 'You have a new notification', url: '/dashboard' }
  try { if (event.data) data = { ...data, ...event.data.json() } } catch {}
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/logo.svg',
      badge: '/logo.svg',
      data: { url: data.url || '/dashboard' },
      vibrate: [80, 40, 80],
    })
  )
})

// Click a notification — focus or open the app at the target URL
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = (event.notification.data && event.notification.data.url) || '/dashboard'
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      for (const c of clients) { if ('focus' in c) { c.navigate(url); return c.focus() } }
      if (self.clients.openWindow) return self.clients.openWindow(url)
    })
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
