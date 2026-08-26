import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

import { SUN, SUN_RADIUS, PLANETS } from './data/planets.js';
import { setAnisotropy, setTextureScale } from './utils/textures.js';
import { QUALITY, lowerTier } from './utils/quality.js';
import { createSun } from './objects/sun.js';
import { createPlanets } from './objects/planets.js';
import { createStarfield, createNebulae, createAsteroidBelt } from './objects/space.js';
import * as I18N from './i18n/index.js';
import * as HUD from './ui/hud.js';

/* ------------------------------------------------------------------ */
/*  Language                                                           */
/* ------------------------------------------------------------------ */
// Applied before anything else so the loading screen and any fatal error
// message are already in the right language.
HUD.applyStaticStrings();

/* ------------------------------------------------------------------ */
/*  Renderer, scene, camera                                            */
/* ------------------------------------------------------------------ */
const canvas = document.getElementById('scene');

// No WebGL (old browser, graphics disabled) — a message instead of a blank
// page. The `throw` stops module execution so the message stays on screen.
if (!HUD.hasWebGL()) {
  HUD.showFatal(I18N.t('errNoWebglTitle'), I18N.t('errNoWebglText'));
  throw new Error('WebGL is not available');
}

setTextureScale(QUALITY.textureScale); // textures are drawn at this tier

let renderer;
try {
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
} catch (err) {
  HUD.showFatal(I18N.t('errInitTitle'), String(err?.message ?? err));
  throw err;
}
renderer.setPixelRatio(Math.min(window.devicePixelRatio, QUALITY.pixelRatio));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;
setAnisotropy(Math.min(8, renderer.capabilities.getMaxAnisotropy()));

// Context loss happens when a phone reclaims video memory — say why.
canvas.addEventListener('webglcontextlost', (e) => {
  e.preventDefault();
  HUD.showFatal(I18N.t('errContextTitle'), I18N.t('errContextText'));
});

const timer = new THREE.Timer();
timer.connect(document); // avoids a huge dt jump when returning to the tab

const scene = new THREE.Scene();
scene.add(new THREE.AmbientLight(0x9fb4ff, 0.14)); // starlight, so shadows are not pure black

const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.5, 4000);
camera.position.set(0, 420, 620);

const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.dampingFactor = 0.06;
controls.rotateSpeed = 0.5;
controls.zoomSpeed = 0.9;
controls.panSpeed = 0.6;
controls.minDistance = 2.5;
controls.maxDistance = 800;

/* ------------------------------------------------------------------ */
/*  Post-processing (bloom)                                            */
/* ------------------------------------------------------------------ */
// At the low tier the composer is never built: bloom's mip chain eats both
// frame time and video memory on weak phones.
let composer = null;
let bloom = null;

function buildComposer() {
  composer = new EffectComposer(renderer);
  composer.setPixelRatio(renderer.getPixelRatio());
  composer.addPass(new RenderPass(scene, camera));
  bloom = new UnrealBloomPass(
    new THREE.Vector2(window.innerWidth, window.innerHeight),
    0.55, // strength
    0.55, // radius
    0.85  // threshold
  );
  composer.addPass(bloom);
  composer.addPass(new OutputPass());
}

if (QUALITY.bloom) buildComposer();

function render() {
  if (composer) composer.render();
  else renderer.render(scene, camera);
}

/* ------------------------------------------------------------------ */
/*  Body content: physical data + translated text                      */
/* ------------------------------------------------------------------ */
const SOURCES = Object.fromEntries(
  [SUN, ...PLANETS].map((b) => [b.key, b.source])
);

// The panel needs both halves: the numbers live in the locale files, the
// source URL lives with the physical data.
function infoFor(key) {
  return { ...I18N.body(key), source: SOURCES[key] };
}

/* ------------------------------------------------------------------ */
/*  Building the scene                                                 */
/* ------------------------------------------------------------------ */
const OVERVIEW_OFFSET = new THREE.Vector3(0, 108, 232);

let sun, system, stars, belt;
let labels, setNavActive, setLangActive;
const pickable = [];

async function build() {
  HUD.setLoaderProgress(0.05, I18N.t('loaderStars'));
  await new Promise((r) => setTimeout(r, 30));

  stars = createStarfield(QUALITY.starCount, renderer.getPixelRatio());
  scene.add(stars.points);
  scene.add(createNebulae());

  HUD.setLoaderProgress(0.14, I18N.t('loaderSun'));
  await new Promise((r) => setTimeout(r, 30));

  sun = createSun(SUN_RADIUS);
  scene.add(sun.group);
  pickable.push(sun.core);

  // createPlanets reports the body key, not a finished sentence — the wording
  // is this layer's job so the builder stays language-free.
  system = await createPlanets(scene, (f, key) =>
    HUD.setLoaderProgress(0.18 + f * 0.68, I18N.t('loaderBody', { name: I18N.name(key) }))
  );
  pickable.push(...system.pickable);

  HUD.setLoaderProgress(0.92, I18N.t('loaderBelt'));
  await new Promise((r) => setTimeout(r, 30));

  belt = createAsteroidBelt(QUALITY.beltCount);
  scene.add(belt.mesh);

  /* Labels and buttons */
  const entries = [
    { key: SUN.key, name: I18N.name(SUN.key), radius: SUN_RADIUS, getPos: (v) => v.set(0, 0, 0) },
    ...system.bodies.map((b) => ({
      key: b.data.key,
      name: I18N.name(b.data.key),
      radius: b.data.radius * (b.data.ring ? b.data.ring.outer : 1),
      getPos: (v) => b.holder.getWorldPosition(v),
    })),
  ];
  labels = HUD.createLabels(entries, focusByKey);

  buildNav();

  HUD.setLoaderProgress(1, I18N.t('loaderReady'));
  await new Promise((r) => setTimeout(r, 260));
  HUD.hideLoader();

  // If the link names a body (?planet=mars) fly straight there
  const linked = keyFromUrl();
  if (linked) focusByKey(linked, 2.6);
  else goOverview(2.6); // opening move
}

function buildNav() {
  setNavActive = HUD.buildNav(
    [SUN, ...PLANETS].map((b) => ({ key: b.key, name: I18N.name(b.key), color: b.color })),
    focusByKey
  );
}

/* ------------------------------------------------------------------ */
/*  Camera: focus and transitions                                      */
/* ------------------------------------------------------------------ */
const trans = { active: false, t: 0, dur: 1.6, start: 0, from: new THREE.Vector3(), fromTarget: new THREE.Vector3() };
const focusOffset = new THREE.Vector3();
const tmpTarget = new THREE.Vector3();
const desiredPos = new THREE.Vector3();
const delta = new THREE.Vector3();
const prevFocusPos = new THREE.Vector3();

let focused = null;   // { key, getPos, dist } or null (overview)
let following = false;

const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

// Flying from body to body sweeps the whole field of view, which can trigger
// nausea in people sensitive to vestibular motion. When the system asks for
// reduced motion the camera cuts straight to its destination instead. Planet
// rotation is left alone — that is the subject, not decoration.
// `matches` is read each time so changing the setting mid-session works
// without a reload.
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

function startTransition(dur) {
  trans.active = true;
  trans.t = 0;
  // Not zero: updateCamera would divide 0 by 0 and get NaN.
  trans.dur = reduceMotion.matches ? 0.001 : dur;
  // Tied to wall-clock time rather than frame count, so the move takes the
  // same number of seconds on a slow device.
  trans.start = timer.getElapsed();
  trans.from.copy(camera.position);
  trans.fromTarget.copy(controls.target);
  following = false;
}

function focusOn(target, dur = 1.7) {
  focused = target;
  target.getPos(tmpTarget);

  // Approach from the sunlit side, slightly off to one side and above, so the
  // lit face is what you see rather than the night side.
  const out = tmpTarget.lengthSq() > 1 ? tmpTarget.clone().normalize() : new THREE.Vector3(0.6, 0, 1).normalize();
  focusOffset
    .copy(out).multiplyScalar(-0.45)
    .add(new THREE.Vector3(0, 0.55, 0)) // a little from above — Saturn's rings read better
    .add(new THREE.Vector3(-out.z, 0, out.x).multiplyScalar(0.7))
    .normalize()
    .multiplyScalar(target.dist);

  startTransition(dur);
  HUD.showPanel(infoFor(target.key));
  setNavActive?.(target.key);
  labels?.setActive(target.key);
  syncUrl();
}

function goOverview(dur = 1.6) {
  focused = null;
  focusOffset.copy(OVERVIEW_OFFSET);
  startTransition(dur);
  HUD.hidePanel();
  setNavActive?.(null);
  labels?.setActive(null);
  syncUrl();
}

function focusByKey(key, dur) {
  if (key === SUN.key) {
    focusOn({ key: SUN.key, dist: SUN.focusDist, getPos: (v) => v.set(0, 0, 0) }, dur);
    return;
  }
  const b = system.bodies.find((x) => x.data.key === key);
  if (!b) return;
  focusOn({
    key,
    dist: b.focusDist,
    getPos: (v) => b.holder.getWorldPosition(v),
  }, dur);
}

/* ------------------------------------------------------------------ */
/*  Links: ?planet=mars&lang=ru                                        */
/* ------------------------------------------------------------------ */
const KEYS = new Set([SUN.key, ...PLANETS.map((p) => p.key)]);

// Links shared before the codebase moved to English keys used Uzbek ones, and
// teachers hand those links out. They must keep working.
const LEGACY_KEYS = {
  quyosh: 'sun', merkuriy: 'mercury', venera: 'venus', yer: 'earth',
  yupiter: 'jupiter', uran: 'uranus', neptun: 'neptune',
};

function keyFromUrl() {
  const q = new URLSearchParams(location.search);
  const raw = (q.get('planet') ?? q.get('sayyora') ?? '').trim().toLowerCase();
  const key = LEGACY_KEYS[raw] ?? raw;
  return KEYS.has(key) ? key : null;
}

// Keeps the address bar matching what is on screen, so copying the link and
// sending it shows the recipient the same body in the same language.
// Single writer for both parameters — focus changes and language changes both
// come through here. replaceState so Back is not flooded with history entries.
function syncUrl() {
  const url = new URL(location.href);
  if (focused) url.searchParams.set('planet', focused.key);
  else url.searchParams.delete('planet');
  url.searchParams.set('lang', I18N.lang());
  url.searchParams.delete('sayyora');
  url.searchParams.delete('til');
  history.replaceState(null, '', url);
}

function updateCamera(now) {
  if (trans.active) {
    trans.t = Math.min(1, (now - trans.start) / trans.dur);
    const e = easeInOut(trans.t);

    if (focused) focused.getPos(tmpTarget);
    else tmpTarget.set(0, 0, 0);

    desiredPos.copy(tmpTarget).add(focusOffset);
    camera.position.lerpVectors(trans.from, desiredPos, e);
    controls.target.lerpVectors(trans.fromTarget, tmpTarget, e);

    if (trans.t >= 1) {
      trans.active = false;
      following = !!focused;
      prevFocusPos.copy(tmpTarget);
    }
  } else if (following && focused) {
    // As the planet moves along its orbit the camera moves with it, while you
    // can still rotate and zoom freely.
    focused.getPos(tmpTarget);
    delta.subVectors(tmpTarget, prevFocusPos);
    camera.position.add(delta);
    controls.target.add(delta);
    prevFocusPos.copy(tmpTarget);
  }
}

/* ------------------------------------------------------------------ */
/*  Picking with the pointer                                           */
/* ------------------------------------------------------------------ */
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
let downAt = null;

function pick(ev) {
  pointer.x = (ev.clientX / window.innerWidth) * 2 - 1;
  pointer.y = -(ev.clientY / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(pointer, camera);
  return raycaster.intersectObjects(pickable, false)[0]?.object ?? null;
}

canvas.addEventListener('pointerdown', (e) => { downAt = { x: e.clientX, y: e.clientY }; });
canvas.addEventListener('pointerup', (e) => {
  if (!downAt) return;
  const moved = Math.hypot(e.clientX - downAt.x, e.clientY - downAt.y);
  downAt = null;
  if (moved > 6 || !system) return;
  const hit = pick(e);
  if (hit?.userData.key) focusByKey(hit.userData.key);
});

let hoverRaf = 0;
canvas.addEventListener('pointermove', (e) => {
  if (hoverRaf || !system) return;
  hoverRaf = requestAnimationFrame(() => {
    hoverRaf = 0;
    canvas.style.cursor = pick(e) ? 'pointer' : 'default';
  });
});

/* ------------------------------------------------------------------ */
/*  Controls                                                           */
/* ------------------------------------------------------------------ */
let timeScale = 1;
let paused = false;
let simTime = 0;

const speedEl = document.getElementById('speed');
const speedVal = document.getElementById('speed-val');
speedEl.addEventListener('input', () => {
  timeScale = Number(speedEl.value) / 30;
  speedVal.textContent = `${timeScale.toFixed(1)}×`;
});

// On phones the info panel sits above the control bar. How tall that bar is
// depends on how many rows the buttons wrap into, so measure it and hand the
// number to CSS (`--controls-h` in style.css).
const controlsEl = document.getElementById('controls');
new ResizeObserver(([entry]) => {
  const h = entry.borderBoxSize?.[0]?.blockSize ?? entry.contentRect.height;
  document.documentElement.style.setProperty('--controls-h', `${Math.round(h)}px`);
}).observe(controlsEl);

const btnOrbits = document.getElementById('btn-orbits');
const btnLabels = document.getElementById('btn-labels');
const btnPause = document.getElementById('btn-pause');

function toggleOrbits() {
  const on = !btnOrbits.classList.contains('active');
  btnOrbits.classList.toggle('active', on);
  for (const l of system.orbitLines) l.visible = on;
}

function toggleLabels() {
  const on = !btnLabels.classList.contains('active');
  btnLabels.classList.toggle('active', on);
  labels.setVisible(on);
}

// The pause button's caption depends on state, so it is written from JS rather
// than carrying a `data-i18n` attribute — a language switch would otherwise
// reset a paused button to "Pause".
function syncPauseButton() {
  btnPause.textContent = paused ? I18N.t('btnResume') : I18N.t('btnPause');
}

function togglePause() {
  paused = !paused;
  btnPause.classList.toggle('active', paused);
  syncPauseButton();
}

btnOrbits.addEventListener('click', () => system && toggleOrbits());
btnLabels.addEventListener('click', () => labels && toggleLabels());
btnPause.addEventListener('click', togglePause);
document.getElementById('btn-overview').addEventListener('click', () => goOverview());
document.getElementById('panel-close').addEventListener('click', () => goOverview());

window.addEventListener('keydown', (e) => {
  if (!system) return;
  // When focus is in the slider or a text field, leave the shortcuts alone —
  // the arrow keys belong to that control.
  if (e.target?.closest?.('input, select, textarea')) return;

  // Space activates the focused button. So when focus is on a button we do not
  // steal it for pause, otherwise a keyboard user could never press the button
  // at all. Number and letter keys do not clash with buttons — after a mouse
  // click (which leaves focus on the button) `1`…`8`, `Q`, `O`, `L` and `Esc`
  // must keep working.
  if (e.code === 'Space') {
    if (e.target?.closest?.('button, a[href]')) return;
    e.preventDefault();
    togglePause();
    return;
  }
  if (e.key === 'Escape' || e.key === '0') { goOverview(); return; }
  if (e.key.toLowerCase() === 'o') { toggleOrbits(); return; }
  if (e.key.toLowerCase() === 'l') { toggleLabels(); return; }
  if (e.key.toLowerCase() === 'q') { focusByKey(SUN.key); return; }
  const n = Number(e.key);
  if (n >= 1 && n <= PLANETS.length) focusByKey(PLANETS[n - 1].key);
});

window.addEventListener('resize', () => {
  const w = window.innerWidth;
  const h = window.innerHeight;
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h);
  composer?.setSize(w, h);
  bloom?.setSize(w, h);
});

/* ------------------------------------------------------------------ */
/*  Switching language                                                 */
/* ------------------------------------------------------------------ */
// Nothing in the 3D scene depends on language, so this only redraws text. The
// camera, the simulation clock and the current selection all stay put.
setLangActive = HUD.buildLangSwitcher(I18N.setLanguage);
setLangActive(I18N.lang());

I18N.onLanguageChange(() => {
  HUD.applyStaticStrings();
  setLangActive(I18N.lang());
  syncPauseButton();

  labels?.setNames(I18N.name);
  if (system) {
    buildNav();
    setNavActive(focused ? focused.key : null);
  }
  if (focused) HUD.showPanel(infoFor(focused.key));

  syncUrl();
});

syncPauseButton();

/* ------------------------------------------------------------------ */
/*  Frame-rate watchdog                                                */
/* ------------------------------------------------------------------ */
// The static check cannot always judge a device correctly (a new phone whose
// browser fell back to software rendering, say). So real fps is measured over
// the first seconds and the tier drops one step if it falls short — once only,
// so the scene does not oscillate.
let fpsFrames = 0;
let fpsTime = 0;
let downgraded = false;

function watchFps(dt) {
  if (downgraded || trans.active) return; // measuring during a transition is misleading
  fpsFrames++;
  fpsTime += dt;
  if (fpsFrames < 90) return;

  const fps = fpsFrames / fpsTime;
  fpsFrames = 0;
  fpsTime = 0;

  if (fps >= 34) return;
  if (!lowerTier()) { downgraded = true; return; }

  downgraded = true;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, QUALITY.pixelRatio));
  if (!QUALITY.bloom && composer) {
    composer.dispose?.();
    composer = null;
    bloom = null;
  } else {
    composer?.setPixelRatio(renderer.getPixelRatio());
  }
  console.info(`[solar-system] ${Math.round(fps)} fps — quality lowered to "${QUALITY.tier}"`);
}

/* ------------------------------------------------------------------ */
/*  Main loop                                                          */
/* ------------------------------------------------------------------ */
const sunPos = new THREE.Vector3(0, 0, 0);

function animate() {
  requestAnimationFrame(animate);
  timer.update();
  const dt = Math.min(timer.getDelta(), 0.05);
  const now = timer.getElapsed();

  if (!paused) simTime += dt * timeScale;

  sun?.update(now, camera.position.distanceTo(sunPos));
  stars?.update(now);
  system?.update(simTime);
  belt?.update(simTime);

  updateCamera(now);
  controls.update();

  labels?.update(camera, window.innerWidth, window.innerHeight, sunPos, SUN_RADIUS);
  render();
  watchFps(dt);
}

// For tinkering from the browser console: __solar.bloom.strength = 0.4 etc.
window.__solar = {
  THREE, scene, camera, controls, renderer, QUALITY, I18N,
  get composer() { return composer; },
  get bloom() { return bloom; },
  get bodies() { return system?.bodies; },
};

build().catch((err) => {
  console.error(err);
  document.getElementById('loader-status').textContent =
    I18N.t('loaderError', { message: err.message });
});
animate();
