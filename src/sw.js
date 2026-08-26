// Service worker — this is what lets the whole site run with no network.
//
// It is not bundled by Vite. `build/pwa.js` reads this file, substitutes the
// two placeholders below with the real hashed filenames, and emits the result
// as `dist/sw.js`. Nothing here is transpiled, so keep it to plain modern JS.
//
// The site is a few hundred kilobytes and ships no image files, so there is
// nothing to be clever about: every asset is precached on install and served
// from the cache from then on. A school computer that opened the page once
// keeps working after the internet goes down.

const VERSION = '__VERSION__';
const PRECACHE = __PRECACHE__;

// Assets are content-hashed, so a new build means a new cache name and the
// old one is dropped whole on activate.
const CACHE = `solar-${VERSION}`;

// Google Fonts lives in its own cache: it survives deploys, because the font
// files do not change when the site does.
const FONT_CACHE = 'solar-fonts';
const FONT_HOSTS = ['fonts.googleapis.com', 'fonts.gstatic.com'];

// Every navigation is answered with this one file — the app reads `?planet=`
// and `?lang=` from the URL itself, so shared links keep working offline.
const SHELL = './index.html';

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    await cache.addAll(PRECACHE);
    // The page holds every asset it needs in memory already, and there are no
    // lazily loaded chunks to go missing, so taking over immediately is safe
    // and means an update lands on the next navigation instead of the one
    // after it.
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    for (const key of await caches.keys()) {
      if (key !== CACHE && key !== FONT_CACHE) await caches.delete(key);
    }
    await self.clients.claim();
  })());
});

// `ignoreVary` is what makes this work on a real host. Vite's preview server
// sends `Vary: Origin` and GitHub Pages sends `Vary: Accept-Encoding`, while
// the requests `addAll` made during install carried neither header — so a
// plain `cache.match` misses every asset the page loads with `crossorigin`
// (which is every asset Vite emits). Only one copy of each file is ever
// stored here, so there is no variant to pick between.
const MATCH = { ignoreVary: true };

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const hit = await cache.match(request, MATCH);
  if (hit) return hit;

  try {
    const response = await fetch(request);
    // Cross-origin font files come back `opaque` (status 0) and cannot be
    // inspected, but they can still be stored and replayed.
    if (response.ok || response.type === 'opaque') {
      cache.put(request, response.clone());
    }
    return response;
  } catch (err) {
    // Offline and not in the cache. Let the browser show its own error rather
    // than leaving the promise rejected.
    return Response.error();
  }
}

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;

  if (request.mode === 'navigate') {
    event.respondWith((async () => {
      const cached = await caches.match(SHELL, { ...MATCH, cacheName: CACHE });
      return cached ?? fetch(request);
    })());
    return;
  }

  const url = new URL(request.url);

  if (FONT_HOSTS.includes(url.hostname)) {
    event.respondWith(cacheFirst(request, FONT_CACHE));
    return;
  }

  // Anything else cross-origin — the NASA source links, for one — is left to
  // the browser.
  if (url.origin === self.location.origin) {
    event.respondWith(cacheFirst(request, CACHE));
  }
});
