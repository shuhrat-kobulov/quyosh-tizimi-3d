# Solar System — A 3D Journey

An interactive solar system built with Three.js. Click a planet and the camera
flies over to it while a panel shows what we know about it. Available in
**Uzbek, Russian and English**.

**Live:** https://shuhrat-kobulov.github.io/quyosh-tizimi-3d

*(If you fork this, change `VITE_SITE_URL` in `.env` and the link above to your
own address — link previews on social networks depend on it.)*

**The project ships no image files at all.** Every planet texture, Saturn's
ring, the stars and the nebulae are drawn in code with `canvas` and fbm noise
when the page loads. The Sun is a live GLSL shader.

## Running it

```bash
npm install
npm run dev        # http://localhost:5173
```

Other commands:

```bash
npm run build      # bundle into dist/
npm run preview    # serve the built version
```

## Deploying

The site is fully static — no server needed. Drop `dist/` on any host
(`vite.config.js` sets `base: './'`, so it works from any subdirectory).

**GitHub Pages** is already wired up: push to `main` and
`.github/workflows/deploy.yml` does the rest. One-time setup — in GitHub,
**Settings → Pages → Source = "GitHub Actions"**.

Then set your address in **`.env`**:

```bash
VITE_SITE_URL=https://your-user.github.io/quyosh-tizimi-3d
```

That address is used for the `og:image` that Telegram and other networks read
when someone shares the link. It **must** be absolute, or the link renders as
plain text. The preview image itself is `public/og.png`.

For Netlify or Vercel: build command `npm run build`, output directory `dist`.

## Controls

| Action | What it does |
|---|---|
| Click a planet | Fly to that planet |
| Drag | Orbit the camera |
| Scroll wheel | Zoom in / out |
| `1` … `8` | Mercury through Neptune |
| `Q` | Jump to the Sun |
| `0` or `Esc` | Back to the overview |
| `Space` | Pause / resume time |
| `O` | Toggle orbit lines |
| `L` | Toggle name labels |

### Languages

Three buttons in the top-right corner switch between **UZ / RU / EN**. Nothing
in the 3D scene depends on language, so switching only redraws text — the
camera, the clock and the current selection all stay where they were.

The language is picked in this order: the `?lang=` parameter, then the
visitor's previous choice (`localStorage`), then the browser's language, and
Uzbek if none of those match.

```
?lang=uz | ru | en
```

Adding a language means adding one file under `src/i18n/` and listing it in
`src/i18n/index.js`. Nothing else has to change: `src/data/planets.js` holds
only physical data — radii, orbits, textures — and no display text at all.

The static `<title>` and `og:` tags in `index.html` stay in Uzbek, because that
is the primary audience and it is what a crawler reads when a link is shared;
the running page rewrites the title and description to the reader's language.

### Sharing a link

The address bar tracks the selected body and the current language, so copying
the link straight out of the browser shows the recipient the same thing:

```
?planet=saturn&lang=ru
```

A teacher can hand out one link and have everyone land on the same planet.

Links shared before the codebase moved to English keys still work:
`?sayyora=merkuriy` and `?til=uz` are accepted as aliases.

The "Speed" slider at the bottom runs from 0x to 10x. **At 1.0x one Earth year
takes about 45 seconds** — every other planet moves at its true speed relative
to that.

### Where the numbers come from

Each panel ends with a **source link** to NASA's fact page for that body — the
figures in the panel are based on those pages. If a question comes up in class,
the source is one click away.

The URLs live in the `NASA` object in `src/data/planets.js`. They do not follow
one pattern (`/facts/` and `/venus-facts/` are mixed), so they are written out
by hand. If NASA moves the pages, that one object is the only thing to fix.

### Accessibility

- With **reduced motion** enabled in the device settings (iOS: Settings →
  Accessibility → Motion; Windows and macOS have the same switch), the camera
  no longer flies between bodies — it cuts straight there. Large sweeping
  camera motion is what triggers nausea in people sensitive to it. Planet
  rotation keeps running: it is the subject, not decoration.
- The page can be pinch-zoomed (no `maximum-scale` restriction).
- Keyboard focus is visible, and when focus is on a button `Space` presses that
  button rather than toggling pause.
- The panel is marked `aria-live`, so a screen reader announces the new body
  when the selection changes.

## Files

```
src/
  main.js               scene, camera, post-processing, controls
  data/planets.js       physical data only (sizes, orbits, textures, sources)
  i18n/index.js         language detection, storage, string lookup
  i18n/{uz,ru,en}.js    all display text, one file per language
  utils/noise.js        seeded PRNG and fbm noise that tiles horizontally
  utils/quality.js      picks how heavy the scene may be for the device
  utils/textures.js     every texture is drawn here
  objects/sun.js        the Sun: photosphere shader, corona, glow
  objects/planets.js    planets, atmospheres, rings, moons, orbit lines
  objects/space.js      stars, nebulae, asteroid belt
  ui/hud.js             panel, buttons, language switcher, projected labels
```

## How it works inside

**Procedural textures.** The value noise in `utils/noise.js` is written to be
periodic along the `x` axis, so no seam shows on the sphere. Rocky planets add
"ridged" noise on top of plain fbm (crater rims); on gas giants latitude is
distorted by turbulence, which is what produces Jupiter's zonal bands. Earth is
a special case: ocean depth, continents, desert bands around 30° latitude, ice
caps, a separate cloud layer and a roughness map (smooth ocean, rough land).

**The Sun.** The photosphere is two layers of 3D simplex noise: slow, large
convection cells and faster granulation, with limb darkening at the edges. A
plain Fresnel term does not work for the corona — it puts the brightest point
on the outer edge and produces a hard-edged bubble. So the curve is inverted:
brightness peaks at the photosphere edge and falls to zero outward.

**The asteroid belt.** 2,200 rocks in a single `InstancedMesh`. Each has its own
orbital radius and speed — inner ones move faster, in the spirit of Kepler's
law — so the belt shears apart over time.

**Quality tiers.** `utils/quality.js` sizes up the device before loading (core
count, memory, screen size, touch or not) and picks one of three tiers:

| Tier | pixelRatio | bloom | textures | asteroids | stars |
|---|---|---|---|---|---|
| `low` | 1.0 | no | ½ | 550 | 2,200 |
| `medium` | 1.5 | yes | ¾ | 1,200 | 4,000 |
| `high` | 2.0 | yes | 1× | 2,200 | 6,500 |

Halving the texture size cuts both load time and video memory by roughly 4x —
fbm noise is evaluated per pixel. At the low tier the `EffectComposer` for bloom
is never built at all.

A static guess is not always right, so the first 90 frames are measured: below
34 fps the tier drops one step (once only, so the scene does not oscillate).
Force a tier for testing: `?quality=low`, `?quality=medium`, `?quality=high`.

**Camera.** Transitions are tied to wall-clock time rather than frame count, so
a move takes the same number of seconds on a slow device. Once the transition
ends the camera tracks the planet along its orbit, while you can still rotate
and zoom freely. The approach angle is chosen from the Sun's side, so you see
the lit face rather than the night side.

## Tinkering

`__solar` is exposed in the browser console:

```js
__solar.bloom.strength = 0.3;      // less glow
__solar.renderer.toneMappingExposure = 1.2;
__solar.bodies[2].data.speed = 3;  // speed Earth up
__solar.I18N.setLanguage('ru');    // switch language from the console
```

`__solar.bloom` is `null` at the low tier (bloom disabled) — open the page with
`?quality=high` to experiment with it.

To add a planet or a moon, edit `src/data/planets.js` for the physical side and
add its text to each file in `src/i18n/`. Everything else is built from those.

## License

MIT — [LICENSE](LICENSE). Use it in a school, in a lesson or in your own
project; modify it and redistribute it freely.
