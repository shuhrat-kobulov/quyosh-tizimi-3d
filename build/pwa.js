// Vite plugin that turns the built site into an installable, fully offline
// app. Three jobs:
//
//   1. render the app icons (build/icons.js) and emit them into dist/
//   2. read src/sw.js, fill in the real hashed filenames, emit dist/sw.js
//   3. inject the icon and manifest tags into index.html
//
// The icons are injected rather than written into index.html by hand because
// they do not exist on disk: they are generated per build. `vite dev` serves
// them from memory through the middleware at the bottom.
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { renderIcon } from './icons.js';

// `safe` leaves a margin inside the square. Launchers crop a maskable icon to
// a circle or a squircle, which can eat the outer 20%, so its drawing is
// pulled well inside; the plain icons only need to keep the orbit ring off
// the edge.
const ICONS = [
  { file: 'favicon.png', size: 32, safe: 0.92 },
  { file: 'apple-touch-icon.png', size: 180, safe: 0.92 },
  { file: 'icon-192.png', size: 192, safe: 0.92 },
  { file: 'icon-512.png', size: 512, safe: 0.92 },
  { file: 'icon-maskable-512.png', size: 512, safe: 0.7 },
];

// Relative hrefs, because the site has to work from a subdirectory
// (github.io/quyosh-tizimi-3d/) as well as from a domain root.
//
// These are injected as tag descriptors rather than written into index.html,
// because Vite resolves `href`s it finds in the HTML against the project and
// these files exist only after the build has run.
const HEAD_TAGS = [
  { tag: 'link', attrs: { rel: 'icon', type: 'image/png', sizes: '32x32', href: './favicon.png' } },
  { tag: 'link', attrs: { rel: 'apple-touch-icon', href: './apple-touch-icon.png' } },
  { tag: 'link', attrs: { rel: 'manifest', href: './manifest.webmanifest' } },
  { tag: 'meta', attrs: { name: 'mobile-web-app-capable', content: 'yes' } },
  { tag: 'meta', attrs: { name: 'apple-mobile-web-app-capable', content: 'yes' } },
  { tag: 'meta', attrs: { name: 'apple-mobile-web-app-title', content: 'Quyosh Tizimi' } },
  { tag: 'meta', attrs: { name: 'apple-mobile-web-app-status-bar-style', content: 'black-translucent' } },
].map((t) => ({ ...t, injectTo: 'head' }));

export function pwa() {
  const swSource = new URL('../src/sw.js', import.meta.url);

  return {
    name: 'solar-pwa',

    // 'post' so index.html and every hashed asset are already in the bundle
    // when the precache list is built.
    enforce: 'post',

    transformIndexHtml() {
      return HEAD_TAGS;
    },

    generateBundle(_options, bundle) {
      const precache = ['./index.html', './manifest.webmanifest'];

      for (const name of Object.keys(bundle)) {
        if (name.endsWith('.js') || name.endsWith('.css')) precache.push(`./${name}`);
      }

      for (const icon of ICONS) {
        this.emitFile({ type: 'asset', fileName: icon.file, source: renderIcon(icon.size, icon) });
        precache.push(`./${icon.file}`);
      }

      // The cache name has to change whenever any cached byte changes.
      // Hashed asset names cover the JS and the CSS; index.html is not
      // hashed, so its contents go into the digest directly.
      const digest = createHash('sha256');
      for (const name of Object.keys(bundle).sort()) {
        const entry = bundle[name];
        digest.update(name);
        digest.update(entry.type === 'chunk' ? entry.code : Buffer.from(entry.source));
      }

      const source = readFileSync(swSource, 'utf8')
        .replace("'__VERSION__'", JSON.stringify(digest.digest('hex').slice(0, 12)))
        .replace('__PRECACHE__', JSON.stringify(precache, null, 2));

      this.emitFile({ type: 'asset', fileName: 'sw.js', source });
    },

    // In dev there is no sw.js (a stale cache would hide every edit), but the
    // icons are served so the manifest and the tab icon look right.
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const name = (req.url ?? '').split('?')[0].replace(/^\//, '');
        const icon = ICONS.find((i) => i.file === name);
        if (!icon) return next();

        res.setHeader('Content-Type', 'image/png');
        res.setHeader('Cache-Control', 'no-cache');
        res.end(renderIcon(icon.size, icon));
      });
    },
  };
}
