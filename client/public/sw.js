const CACHE = 'sndc-v1';
const STATIC_ASSETS = ['/', '/login', '/register'];
const API_CACHE = 'sndc-api-v1';
const API_TIMEOUT = 60000;

self.addEventListener('install', (event) => {
    self.skipWaiting();
    event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(STATIC_ASSETS)));
});

self.addEventListener('activate', (event) => {
    event.waitUntil(clients.claim());
});

self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);
    if (url.pathname.startsWith('/api/')) {
        event.respondWith(networkFirstWithTimeout(request, API_CACHE));
        return;
    }
    if (url.pathname.match(/\.(js|css|png|jpg|jpeg|gif|svg|ico|woff2?)$/)) {
        event.respondWith(cacheFirst(request, CACHE));
        return;
    }
    if (request.mode === 'navigate') {
        event.respondWith(networkFirstWithTimeout(request, CACHE));
        return;
    }
    event.respondWith(networkFirstWithTimeout(request, CACHE));
});

// Push event handler
self.addEventListener('push', (event) => {
    if (!event.data) return;
    try {
        const data = event.data.json();
        const options = {
            body: data.body || '',
            icon: data.icon || '/favicon.ico',
            badge: data.badge || '/favicon.ico',
            vibrate: [200, 100, 200],
            data: { url: data.url || '/' }
        };
        event.waitUntil(
            self.registration.showNotification(data.title || 'Notification', options)
        );
    } catch { /* ignore */ }
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    const url = event.notification.data?.url || '/';
    event.waitUntil(clients.openWindow(url));
});

async function cacheFirst(request, cacheName) {
    const cached = await caches.match(request);
    if (cached) return cached;
    try {
        const response = await fetch(request);
        if (response.ok) {
            const cache = await caches.open(cacheName);
            cache.put(request, response.clone());
        }
        return response;
    } catch {
        return new Response('Offline', { status: 503 });
    }
}

async function networkFirstWithTimeout(request, cacheName, timeout = API_TIMEOUT) {
    try {
        const controller = new AbortController();
        const id = setTimeout(() => controller.abort(), timeout);
        const response = await fetch(request, { signal: controller.signal });
        clearTimeout(id);
        if (response.ok) {
            const cache = await caches.open(cacheName);
            cache.put(request, response.clone());
        }
        return response;
    } catch {
        const cached = await caches.match(request);
        if (cached) return cached;
        if (request.mode === 'navigate') return caches.match('/');
        return new Response(JSON.stringify({ offline: true, message: 'You are offline' }), {
            status: 503, headers: { 'Content-Type': 'application/json' }
        });
    }
}
