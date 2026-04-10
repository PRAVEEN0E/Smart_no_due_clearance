const CACHE_NAME = 'nodue-v3'; 
const ASSETS = [
    '/',
    '/index.html',
    '/manifest.json',
    '/logo192.png',
    '/logo512.png'
];

self.addEventListener('install', (event) => {
    self.skipWaiting();
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys.filter(key => key !== CACHE_NAME)
                    .map(key => caches.delete(key))
            );
        })
    );
});

self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);
    
    // ONLY intercept requests to our own origin
    if (url.origin !== self.location.origin) {
        return;
    }

    // API requests should NOT be cached by the service worker by default
    if (url.pathname.startsWith('/api')) {
        return;
    }

    // Navigation fallback for SPA: Return index.html for navigation requests
    if (event.request.mode === 'navigate') {
        event.respondWith(
            fetch(event.request).catch(() => {
                return caches.match('/index.html') || caches.match('/');
            })
        );
        return;
    }

    // Cache First for static assets
    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            if (cachedResponse) {
                return cachedResponse;
            }

            return fetch(event.request).then((response) => {
                // Don't cache non-success responses or non-GET requests
                if (!response || response.status !== 200 || response.type !== 'basic' || event.request.method !== 'GET') {
                    return response;
                }

                const responseToCache = response.clone();
                caches.open(CACHE_NAME).then((cache) => {
                    cache.put(event.request, responseToCache);
                });

                return response;
            }).catch(() => {
                // If fetch fails (offline), and it's not in cache, we could return a fallback image or text
                // For now, just let it fail gracefully
                return new Response('Network error occurred', { status: 408, headers: { 'Content-Type': 'text/plain' } });
            });
        })
    );
});
