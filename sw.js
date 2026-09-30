// Emboss Attendance — Branch-Aware Service Worker
// Each branch gets its own separate cache so installs don't conflict

function getBranch(url) {
  try { return new URL(url).searchParams.get('branch') || 'default'; }
  catch(e) { return 'default'; }
}

// Get branch from the SW registration URL (?branch=masif etc.)
const swBranch = getBranch(location.href);
const CACHE = 'emboss-' + swBranch + '-v1';

self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE).then(cache =>
      cache.add('./attendance.html?branch=' + swBranch)
    ).catch(() => {})
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE).map(k => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;

  // Network first — always try live, fall back to cache if offline
  e.respondWith(
    fetch(e.request)
      .then(response => {
        const clone = response.clone();
        caches.open(CACHE).then(cache => cache.put(e.request, clone));
        return response;
      })
      .catch(() => caches.match(e.request))
  );
});
