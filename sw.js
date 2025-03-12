const CACHE_NAME = 'media-cache-v1';

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Service Worker: Cache opened');
        // 初始安装时不缓存，等主线程发送 URL 列表
      })
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (!cacheWhitelist.includes(cacheName)) {
            return caches.delete(cacheName);
          }
        })
      );
    })
    .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const requestUrl = event.request.url;

  if (requestUrl.startsWith('https://mx-1341045368.cos.ap-chengdu.myqcloud.com/') &&
      (requestUrl.endsWith('.mp4') || requestUrl.endsWith('.webp') || 
       requestUrl.endsWith('.png') || requestUrl.endsWith('.jpeg') || 
       requestUrl.endsWith('.jpg') || requestUrl.endsWith('.mp3'))) {
    event.respondWith(
      caches.match(event.request)
        .then(response => {
          if (response) {
            return response;
          }
          return fetch(event.request)
            .then(networkResponse => {
              if (!networkResponse || networkResponse.status !== 200) {
                return networkResponse;
              }
              const responseToCache = networkResponse.clone();
              caches.open(CACHE_NAME)
                .then(cache => {
                  cache.put(event.request, responseToCache);
                });
              return networkResponse;
            })
            .catch(err => {
              console.error('Fetch failed:', err);
              return fetch(event.request);
            });
        })
    );
  } else {
    event.respondWith(fetch(event.request));
  }
});

// 监听主线程发送的预缓存消息
self.addEventListener('message', event => {
  if (event.data.action === 'precache' && event.data.urls) {
    event.waitUntil(
      caches.open(CACHE_NAME)
        .then(cache => {
          console.log('Service Worker: Pre-caching media files');
          return cache.addAll(event.data.urls)
            .catch(err => console.error('Pre-caching failed:', err));
        })
    );
  }
});