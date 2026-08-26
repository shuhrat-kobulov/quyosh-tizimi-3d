// Service worker registration.
//
// Build only. During `vite dev` a cache sitting in front of the dev server
// would serve yesterday's module on every edit, and `sw.js` is not emitted
// there anyway.
export function registerServiceWorker(onFirstInstall) {
  if (!import.meta.env.PROD || !('serviceWorker' in navigator)) return;

  // Registering after `load` keeps the request out of the way of the first
  // frame — building the textures is already the heaviest thing happening.
  window.addEventListener('load', async () => {
    try {
      // Relative path, so the scope is this directory: the site may live at
      // the root of a domain or under /quyosh-tizimi-3d/.
      // `updateViaCache: 'none'` stops the browser from serving sw.js itself
      // out of the HTTP cache, which is what makes a new deploy visible.
      const reg = await navigator.serviceWorker.register('./sw.js', { updateViaCache: 'none' });

      // A page that is already controlled has been here before — no news to
      // report. Otherwise this is the first install, and it is worth saying
      // once that the page now works offline.
      if (navigator.serviceWorker.controller) return;

      const worker = reg.installing ?? reg.waiting;
      if (!worker) return;

      worker.addEventListener('statechange', () => {
        if (worker.state === 'activated') onFirstInstall?.();
      });
    } catch (err) {
      // Blocked in private mode, or the page is on plain http. The site works
      // exactly as before, just without the offline copy.
      console.info('[solar-system] offline copy unavailable:', err.message);
    }
  });
}
