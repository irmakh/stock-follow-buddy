const CACHE_NAME = 'stock-follow-buddy-v6'; // Bumped version to ensure update
const APP_SHELL_URL = './index.html';
const urlsToCache = [
  APP_SHELL_URL,
  './manifest.json',
  './icon-192.svg',
  './icon-512.svg'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        // Setting { cache: 'reload' } is important to bypass the browser's HTTP cache during install.
        const requests = urlsToCache.map(url => new Request(url, { cache: 'reload' }));
        return cache.addAll(requests);
      })
  );
});

self.addEventListener('fetch', event => {
  // We only care about GET requests.
  if (event.request.method !== 'GET') {
    return;
  }

  // For navigation requests (loading the page itself), we use an App Shell model.
  // We immediately serve the cached index.html. This makes the app load instantly
  // and makes it resilient to server routing issues for this SPA.
  if (event.request.mode === 'navigate') {
    event.respondWith(
      caches.match(APP_SHELL_URL).then(response => {
        // If the app shell is in the cache, return it. Otherwise, fetch it from the network.
        // This fallback is crucial for the very first visit before the service worker is installed.
        return response || fetch(event.request);
      })
    );
    return;
  }

  // For all other requests (assets like JS, CSS, images, API calls),
  // we use a "stale-while-revalidate" strategy.
  // This serves assets from the cache for speed, while updating them in the background.
  event.respondWith(
    caches.open(CACHE_NAME).then(cache => {
      return cache.match(event.request).then(response => {
        // Asynchronously fetch a fresh version of the asset and update the cache.
        const fetchPromise = fetch(event.request).then(networkResponse => {
          // We only cache successful responses to avoid caching errors.
          if (networkResponse && networkResponse.ok) {
            cache.put(event.request, networkResponse.clone());
          }
          return networkResponse;
        }).catch(err => {
          // The fetch failed, possibly because the user is offline.
          // In this case, we don't do anything; the initial `response` from cache will be used if available.
          console.warn(`Fetch for ${event.request.url} failed:`, err);
        });

        // Return the cached response immediately if available, otherwise wait for the network.
        return response || fetchPromise;
      });
    })
  );
});

self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            // Delete old caches to clean up.
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});