const CACHE_NAME = 'nodue-v2'; // Incremented version
const ASSETS = [
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
        return; // Let browser handle external requests (Cloudinary, Google, etc.)
    }

    // Network First strategy for the root/index to prevent old hash issues
    if (url.pathname === '/' || url.pathname === '/index.html') {
        event.respondWith(
            fetch(event.request)
                .then(response => {
                    const clonedResponse = response.clone();
                    caches.open(CACHE_NAME).then(cache => cache.put(event.request, clonedResponse));
                    return response;
                })
                .catch(() => caches.match(event.request))
        );
        return;
    }

    // Cache First for other local assets (JS, CSS, Images in /assets)
    event.respondWith(
        caches.match(event.request).then((response) => {
            return response || fetch(event.request);
        })
    );
});
