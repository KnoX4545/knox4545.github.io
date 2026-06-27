// ================================================================
// Service Worker – Dillimore Projects
// ================================================================

const CACHE_NAME = 'dillimore-v2';
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
  'https://uploadkon.ir/uploads/d44327_26dillimore-icon.png',
  'https://uploadkon.ir/uploads/0daa27_26snake-icon.png',
  'https://uploadkon.ir/uploads/aad227_26calculator-icon.png',
  'https://uploadkon.ir/uploads/e38e27_26calendar-icon.png',
  'https://uploadkon.ir/uploads/2ad227_26download.png',
  'https://uploadkon.ir/uploads/966926_264155897.png'
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
