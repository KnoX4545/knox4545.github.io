// ================================================================
// Service Worker – Dillimore Projects
// ================================================================

const CACHE_NAME = 'dillimore-v4';
const urlsToCache = [
  '/',
  '/StarWars.html',
  '/Snake.html',
  '/Calculator.html',
  '/Calendar.html',
  '/TicTacToe.html',
  '/404.html',
  '/manifest.json',
  '/sw.js',
  'https://uploadkon.ir/uploads/dedf27_26Dillimore.png',
  'https://uploadkon.ir/uploads/a1d927_26Dillimore-Snake.png',
  'https://uploadkon.ir/uploads/f83927_26Dillimore-Calculator.png',
  'https://uploadkon.ir/uploads/0d1427_26Dillimore-Calendar.png',
  'https://uploadkon.ir/uploads/8e6b27_26Dillimore-TicTacToe.png',
  'https://uploadkon.ir/uploads/783527_26Dillimore-StarWars.png'
];

// Install Service Worker
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.addAll(urlsToCache);
      })
  );
});

// Activate Service Worker
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Fetch from cache or network
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        return response || fetch(event.request);
      })
  );
});
