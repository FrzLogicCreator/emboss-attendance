// Emboss Attendance — Service Worker (branch-aware)
// Each branch URL gets its own separate cache and install

function getBranch(url) {
  try { return new URL(url).searchParams.get('branch') || 'default'; }
  catch { return 'default'; }
}

self.addEventListener('install', e => {
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;

  const branch = getBranch(e.request.url);
  const CACHE = 'emboss-' + branch + '-v1';

  e.respondWith(
    fetch(e.request)
      .then(response => {
        // Save to branch-specific cache
        const clone = response.clone();
        caches.open(CACHE).then(cache => cache.put(e.request, clone));
        return response;
      })
      .catch(() => caches.match(e.request))
  );
});
