// This is a basic service worker. In a real-world application,
// you would add caching strategies for offline support.

self.addEventListener('install', (event) => {
  console.log('Service Worker: Installed');
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activated');
});

self.addEventListener('fetch', (event) => {
  // We are not adding any fetch handling for now.
  // This is a placeholder for future offline capabilities.
});
