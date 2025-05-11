// Service Worker for Legacy Cricket Academy PWA

const CACHE_NAME = 'cricket-academy-v1.1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icons/favicon.svg',
  '/icons/icon-72x72.png',
  '/icons/icon-96x96.png',
  '/icons/apple-touch-icon.png',
  '/icons/apple-splash-640-1136.png',
  '/icons/apple-splash-750-1334.png',
  '/icons/apple-splash-828-1792.png',
  '/icons/apple-splash-1125-2436.png',
  '/icons/apple-splash-1242-2208.png',
  '/icons/apple-splash-1242-2688.png',
  '/icons/apple-splash-1536-2048.png',
  '/icons/apple-splash-1668-2388.png',
  '/icons/apple-splash-2048-2732.png'
];

// Install event - cache basic assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(ASSETS_TO_CACHE);
      })
      .catch((error) => {
        console.error('Failed to cache assets:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// API request handler - network first, then cache
const handleApiRequest = async (request) => {
  try {
    // Try network first
    const networkResponse = await fetch(request);
    
    // If successful, clone and store in cache
    if (networkResponse.ok) {
      const responseToCache = networkResponse.clone();
      const cache = await caches.open(CACHE_NAME);
      await cache.put(request, responseToCache);
    }
    
    return networkResponse;
  } catch (error) {
    // If network fails, try cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // If nothing in cache, fail
    throw error;
  }
};

// Static asset request handler - cache first, then network
const handleAssetRequest = async (request) => {
  // Try cache first
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }
  
  // If not in cache, go to network
  try {
    const networkResponse = await fetch(request);
    
    // If successful, clone and store in cache
    if (networkResponse.ok) {
      const responseToCache = networkResponse.clone();
      const cache = await caches.open(CACHE_NAME);
      await cache.put(request, responseToCache);
    }
    
    return networkResponse;
  } catch (error) {
    console.error('Failed to fetch asset:', error);
    throw error;
  }
};

// Fetch event - different strategies for API vs assets
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // Skip cross-origin requests
  if (url.origin !== self.location.origin) {
    return;
  }
  
  // Skip Firebase API requests (they'll handle their own caching)
  if (url.hostname.includes('firebaseio.com') || 
      url.hostname.includes('googleapis.com')) {
    return;
  }
  
  // API requests - network first, then cache
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleApiRequest(event.request));
    return;
  }
  
  // Assets - cache first, then network
  event.respondWith(handleAssetRequest(event.request));
});

// Handle push notifications
self.addEventListener('push', (event) => {
  const data = event.data?.json() ?? { title: 'New Notification', body: 'You have a new notification.' };
  
  const options = {
    body: data.body,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-96x96.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    }
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  event.waitUntil(
    clients.openWindow('/')
  );
});