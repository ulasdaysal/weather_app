
const CACHE_NAME = 'weather-pwa-v2';
const STATIC_CACHE = 'weather-pwa-static-v2';
const API_CACHE = 'weather-pwa-api-v2';

/**
 * Get base path for assets (works in subdirectories)
 */
function getBasePath() {
    // Get the directory where service-worker.js is located
    const basePath = self.location.pathname.replace(/\/[^/]*$/, '');
    return basePath || '';
}

const BASE_PATH = getBasePath();

// Assets to cache on install (static resources) - using relative paths
const STATIC_ASSETS = [
    `${BASE_PATH}/`,
    `${BASE_PATH}/index.html`,
    `${BASE_PATH}/forecast.html`,
    `${BASE_PATH}/locations.html`,
    `${BASE_PATH}/styles.css`,
    `${BASE_PATH}/config.js`,
    `${BASE_PATH}/utils.js`,
    `${BASE_PATH}/api.js`,
    `${BASE_PATH}/modal.js`,
    `${BASE_PATH}/app.js`,
    `${BASE_PATH}/forecast.js`,
    `${BASE_PATH}/locations.js`,
    `${BASE_PATH}/service-worker-register.js`,
    `${BASE_PATH}/manifest.json`,
    `${BASE_PATH}/icons/icon-72x72.png`,
    `${BASE_PATH}/icons/icon-96x96.png`,
    `${BASE_PATH}/icons/icon-128x128.png`,
    `${BASE_PATH}/icons/icon-144x144.png`,
    `${BASE_PATH}/icons/icon-152x152.png`,
    `${BASE_PATH}/icons/icon-192x192.png`,
    `${BASE_PATH}/icons/icon-384x384.png`,
    `${BASE_PATH}/icons/icon-512x512.png`
];

/**
  Cache static assets
 */
self.addEventListener('install', (event) => {
    console.log('Service Worker: Installing...');
    
    event.waitUntil(
        caches.open(STATIC_CACHE)
            .then((cache) => {
                console.log('Service Worker: Caching static assets');
                // Cache all static assets
                return cache.addAll(STATIC_ASSETS.map(asset => new Request(asset, { cache: 'reload' })))
                    .catch((err) => {
                        console.warn('Service Worker: Some assets failed to cache', err);
                        // Continue even if some assets fail
                    });
            })
            .then(() => {
                // Force the waiting service worker to become the active service worker
                return self.skipWaiting();
            })
    );
});

/**
 Clean up old caches
 */
self.addEventListener('activate', (event) => {
    console.log('Service Worker: Activating...');
    
    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames.map((cacheName) => {
                        // Delete old caches that don't match current version
                        if (cacheName !== STATIC_CACHE && cacheName !== API_CACHE && cacheName !== CACHE_NAME) {
                            console.log('Service Worker: Deleting old cache', cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                );
            })
            .then(() => {
                // Take control of all pages immediately
                return self.clients.claim();
            })
    );
});

/**
 * Fetch Event - Implement caching strategies
 */
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Skip non-GET requests
    if (request.method !== 'GET') {
        return;
    }

    // Skip chrome-extension and other non-http(s) requests
    if (!url.protocol.startsWith('http')) {
        return;
    }

    // Network First for HTML (so UI updates ship reliably)
    if (isHTMLRequest(request.url)) {
        event.respondWith(networkFirstStrategy(request));
        return;
    }

    // Stale While Revalidate for other static assets (JS/CSS/icons)
    if (isStaticAsset(request.url)) {
        event.respondWith(staleWhileRevalidateStrategy(request, STATIC_CACHE));
        return;
    }

    // Network First for API calls (weather data)
    if (isAPIRequest(request.url)) {
        event.respondWith(networkFirstStrategy(request));
        return;
    }

    //  Stale While Revalidate for other resources
    event.respondWith(staleWhileRevalidateStrategy(request, CACHE_NAME));
});

/**
 * Check if request is for a static asset (works with relative paths)
 */
function isStaticAsset(url) {
    const urlPath = new URL(url).pathname;
    return urlPath.includes('styles.css') ||
           urlPath.includes('config.js') ||
           urlPath.includes('utils.js') ||
           urlPath.includes('api.js') ||
           urlPath.includes('modal.js') ||
           urlPath.includes('app.js') ||
           urlPath.includes('forecast.js') ||
           urlPath.includes('locations.js') ||
           urlPath.includes('service-worker-register.js') ||
           urlPath.includes('manifest.json') ||
           urlPath.includes('/icons/') ||
           urlPath.endsWith('/');
}

/**
 * Check if request is for an HTML document
 */
function isHTMLRequest(url) {
    const urlPath = new URL(url).pathname;
    return urlPath.endsWith('.html') || urlPath.endsWith('/');
}

/**
 * Check if request is for an API call
 */
function isAPIRequest(url) {
    return url.includes('api.openweathermap.org');
}

/**
 * Cache First Strategy
 * Use cached version if available, otherwise fetch from network
 * Best for: Static assets that don't change often
 */
async function cacheFirstStrategy(request) {
    try {
        const cachedResponse = await caches.match(request);
        
        if (cachedResponse) {
            return cachedResponse;
        }
        
        const networkResponse = await fetch(request);
        
        // Cache the new response
        if (networkResponse.ok) {
            const cache = await caches.open(STATIC_CACHE);
            cache.put(request, networkResponse.clone());
        }
        
        return networkResponse;
    } catch (error) {
        console.error('Cache First Strategy Error:', error);
        // Return a fallback response if available
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }
        throw error;
    }
}

/**
 * Network First Strategy
 * Try network first, fall back to cache if offline
 * Best for: API calls that need fresh data
 */
async function networkFirstStrategy(request) {
    try {
        const networkResponse = await fetch(request);
        
        // If network request succeeds, cache it
        if (networkResponse.ok) {
            const cache = await caches.open(API_CACHE);
            cache.put(request, networkResponse.clone());
        }
        
        return networkResponse;
    } catch (error) {
        console.log('Network First: Network failed, trying cache...', error);
        
        // Network failed, try cache
        const cachedResponse = await caches.match(request);
        
        if (cachedResponse) {
            return cachedResponse;
        }
        
        // If no cache, return error response
        return new Response(
            JSON.stringify({ error: 'Network error and no cached data available' }),
            {
                status: 503,
                statusText: 'Service Unavailable',
                headers: { 'Content-Type': 'application/json' }
            }
        );
    }
}

/**
 * Stale While Revalidate Strategy
 * Return cached version immediately, update cache in background
 * Best for: Resources that can be slightly stale
 */
async function staleWhileRevalidateStrategy(request, cacheName) {
    const cache = await caches.open(cacheName);
    const cachedResponse = await cache.match(request);
    
    // Fetch fresh data in the background
    const fetchPromise = fetch(request).then((networkResponse) => {
        if (networkResponse.ok) {
            cache.put(request, networkResponse.clone());
        }
        return networkResponse;
    }).catch(() => {
        // Ignore network errors in background fetch
    });
    
    // Return cached version immediately if available, otherwise wait for network
    return cachedResponse || fetchPromise;
}

/**
 * Message Event - Handle messages from the app
 */
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
    
    if (event.data && event.data.type === 'CACHE_URLS') {
        event.waitUntil(
            caches.open(STATIC_CACHE).then((cache) => {
                return cache.addAll(event.data.urls);
            })
        );
    }
});

/**
 * Background Sync Event - Sync data when connection is restored
 */
self.addEventListener('sync', (event) => {
    if (event.tag === 'sync-weather-data') {
        event.waitUntil(syncWeatherData());
    }
});

/**
 * Sync weather data when back online
 */
async function syncWeatherData() {
    // This would sync any pending weather requests
    // For now, we rely on the app to refresh when online
    console.log('Service Worker: Syncing weather data');
}

/**
 * Push Event - Handle push notifications
 */
self.addEventListener('push', (event) => {
    const data = event.data ? event.data.json() : {};
    const title = data.title || 'Weather Alert';
    const options = {
        body: data.body || 'You have a new weather update',
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-72x72.png',
        tag: 'weather-alert',
        requireInteraction: false
    };
    
    event.waitUntil(
        self.registration.showNotification(title, options)
    );
});

/**
 * Notification Click Event - Handle notification clicks
 */
self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    
    event.waitUntil(
        clients.openWindow('/')
    );
});

