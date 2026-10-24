// Service Worker for SS+2 High School Ghaghra Notes App
const CACHE_NAME = 'sshs-notes-v13';
const STATIC_ASSETS = [
  './',
  './index.html',
  './admin.html',
  './css/styles.css',
  './css/admin.css',
  './js/security.js',
  './js/data.js',
  './js/storage.js',
  './js/app.js',
  './js/admin.js',
  './js/sw-register.js',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-192.png',
  './icons/icon-maskable-512.png',
  './notices/Notice_142_Notes_Hosted_Library.pdf',
  './notices/Notice_Self_Hosted_Offline_Portal.pdf',
  './notices/Notice_Android_PWA_Install_Guide.pdf'
];

// Install Event: Pre-cache core shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Pre-caching offline shell v3');
      return cache.addAll(STATIC_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// Activate Event: Clean up old caches immediately
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(
        keyList.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[Service Worker] Removing old cache', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event: Network-First with Cache Fallback
// Ensures Live Server / localhost and online users ALWAYS get latest files,
// while preserving complete 100% offline access when disconnected!
self.addEventListener('fetch', (event) => {
  const request = event.request;

  // Only handle GET requests
  if (request.method !== 'GET') return;

  // Bypass Live Server WebSockets
  if (request.url.includes('/ws') || request.url.startsWith('ws://') || request.url.startsWith('wss://')) {
    return;
  }

  event.respondWith(
    fetch(request)
      .then((networkResponse) => {
        // Cache successful basic responses in background
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseToCache);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        // Offline Fallback: Serve from cache
        return caches.match(request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          if (request.headers.get('accept') && request.headers.get('accept').includes('text/html')) {
            return caches.match('./index.html');
          }
        });
      })
  );
});
