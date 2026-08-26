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
import * as HUD from './ui/hud.js';

/* ------------------------------------------------------------------ */
/*  Renderer, sahna, kamera                                            */
/* ------------------------------------------------------------------ */
const canvas = document.getElementById('scene');

// WebGL bo'lmasa (eski brauzer, o'chirilgan grafika) — oq ekran o'rniga xabar.
// Bu yerdagi `throw` modul bajarilishini to'xtatadi: xabar ekranda qoladi.
if (!HUD.hasWebGL()) {
  HUD.showFatal(
    "Brauzeringiz 3D ni qo'llab-quvvatlamadi",
    "Bu sahifa WebGL texnologiyasiga muhtoj. Chrome, Safari yoki Firefox ning yangi versiyasida oching, yoki brauzer sozlamalarida grafik tezlashtirishni (hardware acceleration) yoqing."
  );
  throw new Error('WebGL mavjud emas');
}

setTextureScale(QUALITY.textureScale); // teksturalar shu daraja bilan chiziladi

let renderer;
try {
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
} catch (err) {
  HUD.showFatal("3D dvigatelni ishga tushirib bo'lmadi", String(err?.message ?? err));
  throw err;
}
renderer.setPixelRatio(Math.min(window.devicePixelRatio, QUALITY.pixelRatio));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;
setAnisotropy(Math.min(8, renderer.capabilities.getMaxAnisotropy()));

// Kontekst yo'qolsa (telefon xotirani tozalaganda bo'ladi) sabab aytiladi
canvas.addEventListener('webglcontextlost', (e) => {
  e.preventDefault();
  HUD.showFatal('Grafik ulanish uzildi', 'Qurilma video xotirani bo\'shatdi. Sahifani yangilang.');
});

const timer = new THREE.Timer();
timer.connect(document); // tab almashtirilganda katta dt sakrashining oldini oladi

const scene = new THREE.Scene();
scene.add(new THREE.AmbientLight(0x9fb4ff, 0.14)); // yulduzlararo yorug'lik — soyalar butunlay qora bo'lmasin

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
// Past darajada composer umuman qurilmaydi: bloom o'zining mip zanjiri bilan
// zaif telefonda ham kadrni, ham video xotirani yeydi.
let composer = null;
let bloom = null;

function buildComposer() {
  composer = new EffectComposer(renderer);
  composer.setPixelRatio(renderer.getPixelRatio());
  composer.addPass(new RenderPass(scene, camera));
  bloom = new UnrealBloomPass(
    new THREE.Vector2(window.innerWidth, window.innerHeight),
    0.55, // kuch
    0.55, // radius
    0.85  // ostona
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
/*  Sahnani yig'ish                                                    */
/* ------------------------------------------------------------------ */
const OVERVIEW_OFFSET = new THREE.Vector3(0, 108, 232);

let sun, system, stars, belt;
let labels, setNavActive;
const pickable = [];

async function build() {
  HUD.setLoaderProgress(0.05, "Yulduzlar yoqilmoqda…");
  await new Promise((r) => setTimeout(r, 30));

  stars = createStarfield(QUALITY.starCount, renderer.getPixelRatio());
  scene.add(stars.points);
  scene.add(createNebulae());

  HUD.setLoaderProgress(0.14, 'Quyosh yoqilmoqda…');
  await new Promise((r) => setTimeout(r, 30));

  sun = createSun(SUN_RADIUS);
  scene.add(sun.group);
  pickable.push(sun.core);

  system = await createPlanets(scene, (f, text) => HUD.setLoaderProgress(0.18 + f * 0.68, text));
  pickable.push(...system.pickable);

  HUD.setLoaderProgress(0.92, 'Asteroidlar kamari sochilmoqda…');
  await new Promise((r) => setTimeout(r, 30));

  belt = createAsteroidBelt(QUALITY.beltCount);
  scene.add(belt.mesh);

  /* Nomlar va tugmalar */
  const entries = [
    { key: 'quyosh', name: 'Quyosh', radius: SUN_RADIUS, getPos: (v) => v.set(0, 0, 0) },
    ...system.bodies.map((b) => ({
      key: b.data.key,
      name: b.data.name,
      radius: b.data.radius * (b.data.ring ? b.data.ring.outer : 1),
      getPos: (v) => b.holder.getWorldPosition(v),
    })),
  ];
  labels = HUD.createLabels(entries, focusByKey);

  setNavActive = HUD.buildNav(
    [{ key: 'quyosh', name: 'Quyosh', color: SUN.color },
     ...PLANETS.map((p) => ({ key: p.key, name: p.name, color: p.color }))],
    focusByKey
  );

  HUD.setLoaderProgress(1, 'Tayyor');
  await new Promise((r) => setTimeout(r, 260));
  HUD.hideLoader();

  // Havolada sayyora ko'rsatilgan bo'lsa (?sayyora=mars) — o'shanga uchamiz
  const linked = keyFromUrl();
  if (linked) focusByKey(linked, 2.6);
  else goOverview(2.6); // ochilish paytidagi kirish harakati
}

/* ------------------------------------------------------------------ */
/*  Kamera: fokus va o'tish                                            */
/* ------------------------------------------------------------------ */
const trans = { active: false, t: 0, dur: 1.6, start: 0, from: new THREE.Vector3(), fromTarget: new THREE.Vector3() };
const focusOffset = new THREE.Vector3();
const tmpTarget = new THREE.Vector3();
const desiredPos = new THREE.Vector3();
const delta = new THREE.Vector3();
const prevFocusPos = new THREE.Vector3();

let focused = null;   // { key, getPos, dist } yoki null (umumiy ko'rinish)
let following = false;

const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

// Sayyoradan sayyoraga uchganda butun ko'rish maydoni siljiydi — vestibulyar
// sezgirligi bor odamda bu ko'ngil aynishiga olib keladi. Tizim sozlamasida
// "harakatni kamaytirish" yoqilgan bo'lsa, kamera uchmay, darrov joyiga
// o'tadi. Sayyoralarning aylanishiga tegilmaydi — u bezak emas, mazmun.
// `matches` har safar o'qiladi: foydalanuvchi sozlamani yo'lakay o'zgartirsa
// ham sahifani yangilash shart bo'lmasin.
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

function startTransition(dur) {
  trans.active = true;
  trans.t = 0;
  // Nol emas, juda kichik son: updateCamera da 0/0 = NaN bo'lib qolmasin.
  trans.dur = reduceMotion.matches ? 0.001 : dur;
  // Kadrlar tezligiga emas, real vaqtga bog'laymiz — sekin qurilmada ham
  // o'tish o'zi belgilangan sekundlarda tugaydi.
  trans.start = timer.getElapsed();
  trans.from.copy(camera.position);
  trans.fromTarget.copy(controls.target);
  following = false;
}

function focusOn(target, dur = 1.7) {
  focused = target;
  target.getPos(tmpTarget);

  // Quyosh tomonidan, biroz yon va yuqoridan yaqinlashamiz —
  // shunda sayyoraning yoritilgan yuzi ko'rinadi, tungi tomoni emas.
  const out = tmpTarget.lengthSq() > 1 ? tmpTarget.clone().normalize() : new THREE.Vector3(0.6, 0, 1).normalize();
  focusOffset
    .copy(out).multiplyScalar(-0.45)
    .add(new THREE.Vector3(0, 0.55, 0)) // biroz tepadan — Saturn halqalari yaxshi ko'rinsin
    .add(new THREE.Vector3(-out.z, 0, out.x).multiplyScalar(0.7))
    .normalize()
    .multiplyScalar(target.dist);

  startTransition(dur);
  HUD.showPanel(target.info);
  setNavActive?.(target.key);
  labels?.setActive(target.key);
  syncUrl(target.key);
}

function goOverview(dur = 1.6) {
  focused = null;
  focusOffset.copy(OVERVIEW_OFFSET);
  startTransition(dur);
  HUD.hidePanel();
  setNavActive?.(null);
  labels?.setActive(null);
  syncUrl(null);
}

function focusByKey(key, dur) {
  if (key === 'quyosh') {
    focusOn({ key: 'quyosh', dist: SUN.focusDist, info: SUN, getPos: (v) => v.set(0, 0, 0) }, dur);
    return;
  }
  const b = system.bodies.find((x) => x.data.key === key);
  if (!b) return;
  focusOn({
    key,
    dist: b.focusDist,
    info: b.data,
    getPos: (v) => b.holder.getWorldPosition(v),
  }, dur);
}

/* ------------------------------------------------------------------ */
/*  Havola: ?sayyora=mars — to'g'ridan-to'g'ri o'sha sayyoraga          */
/* ------------------------------------------------------------------ */
const KEYS = new Set(['quyosh', ...PLANETS.map((p) => p.key)]);

// Inglizcha nomlar ham ishlasin — havola begona joyga tushsa ham ochiladi
const ALIASES = {
  sun: 'quyosh', mercury: 'merkuriy', venus: 'venera', earth: 'yer',
  jupiter: 'yupiter', uranus: 'uran', neptune: 'neptun',
};

function keyFromUrl() {
  const q = new URLSearchParams(location.search);
  const raw = (q.get('sayyora') ?? q.get('planet') ?? '').trim().toLowerCase();
  const key = ALIASES[raw] ?? raw;
  return KEYS.has(key) ? key : null;
}

// Manzil qatorini fokusga moslab turadi — foydalanuvchi havolani shundoq
// nusxalab yuborsa, qabul qiluvchi aynan shu sayyorani ko'radi.
// replaceState: "orqaga" tugmasi tarixga to'lib ketmasin.
function syncUrl(key) {
  const url = new URL(location.href);
  if (key) url.searchParams.set('sayyora', key);
  else url.searchParams.delete('sayyora');
  url.searchParams.delete('planet');
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
    // Sayyora orbitada siljiganda kamera u bilan birga siljiydi,
    // lekin foydalanuvchi baribir erkin aylantira/yaqinlashtira oladi.
    focused.getPos(tmpTarget);
    delta.subVectors(tmpTarget, prevFocusPos);
    camera.position.add(delta);
    controls.target.add(delta);
    prevFocusPos.copy(tmpTarget);
  }
}

/* ------------------------------------------------------------------ */
/*  Sichqoncha bilan tanlash                                           */
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
/*  Boshqaruv elementlari                                              */
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

// Telefonda ma'lumot paneli boshqaruv panelining ustiga qo'yiladi. Tugmalar
// qatori ekran eniga qarab bir necha qatorga o'raladi, shuning uchun uning
// balandligini o'lchab CSS ga beramiz (style.css dagi `--controls-h`).
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

function togglePause() {
  paused = !paused;
  btnPause.classList.toggle('active', paused);
  btnPause.textContent = paused ? '▶ Davom' : '⏸ Pauza';
}

btnOrbits.addEventListener('click', () => system && toggleOrbits());
btnLabels.addEventListener('click', () => labels && toggleLabels());
btnPause.addEventListener('click', togglePause);
document.getElementById('btn-overview').addEventListener('click', () => goOverview());
document.getElementById('panel-close').addEventListener('click', () => goOverview());

window.addEventListener('keydown', (e) => {
  if (!system) return;
  // Fokus slayderda yoki matn maydonida bo'lsa, tezkor tugmalarga umuman
  // tegmaymiz — o'q tugmalari o'sha yerda ishlashi kerak.
  if (e.target?.closest?.('input, select, textarea')) return;

  // "Bo'sh joy" fokusdagi tugmani bosadi. Shuning uchun fokus tugmada turganda
  // uni pauzaga o'g'irlamaymiz, aks holda klaviatura bilan yuruvchi odam
  // tugmani umuman bosa olmaydi. Raqam va harf tugmalari esa tugma bilan
  // to'qnashmaydi — sichqoncha bilan tugma bosilgandan keyin ham (fokus o'sha
  // tugmada qoladi) `1`…`8`, `Q`, `O`, `L`, `Esc` ishlayverishi kerak.
  if (e.code === 'Space') {
    if (e.target?.closest?.('button, a[href]')) return;
    e.preventDefault();
    togglePause();
    return;
  }
  if (e.key === 'Escape' || e.key === '0') { goOverview(); return; }
  if (e.key.toLowerCase() === 'o') { toggleOrbits(); return; }
  if (e.key.toLowerCase() === 'l') { toggleLabels(); return; }
  if (e.key.toLowerCase() === 'q') { focusByKey('quyosh'); return; }
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
/*  Kadr tezligini kuzatish                                            */
/* ------------------------------------------------------------------ */
// Statik tekshiruv qurilmani har doim ham to'g'ri baholay olmaydi (masalan,
// yangi telefon, lekin brauzer dasturiy renderingda ishlayapti). Shuning uchun
// birinchi sekundlarda haqiqiy fps o'lchanadi va yetmasa daraja bir pog'ona
// pasaytiriladi — bir marta, sahna "sakrab" turmasligi uchun.
let fpsFrames = 0;
let fpsTime = 0;
let downgraded = false;

function watchFps(dt) {
  if (downgraded || trans.active) return; // o'tish paytida o'lchash noto'g'ri
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
  console.info(`[quyosh-tizimi] ${Math.round(fps)} fps — sifat "${QUALITY.tier}" darajasiga tushirildi`);
}

/* ------------------------------------------------------------------ */
/*  Asosiy halqa                                                       */
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

// Brauzer konsolidan sozlash uchun: __solar.bloom.strength = 0.4 va h.k.
window.__solar = {
  THREE, scene, camera, controls, renderer, QUALITY,
  get composer() { return composer; },
  get bloom() { return bloom; },
  get bodies() { return system?.bodies; },
};

build().catch((err) => {
  console.error(err);
  document.getElementById('loader-status').textContent = 'Xatolik: ' + err.message;
});
animate();
