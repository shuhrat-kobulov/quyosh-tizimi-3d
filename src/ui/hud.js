// DOM layer: the info panel, the quick-jump buttons, the language switcher and
// the name labels projected from 3D positions.
import * as THREE from 'three';
import * as I18N from '../i18n/index.js';

const $ = (id) => document.getElementById(id);

/* ---------------- Static strings ---------------- */
// Everything in index.html that is plain text carries a `data-i18n` attribute,
// so a language switch is one walk over the document instead of a list of
// getElementById calls that drifts out of date whenever the markup changes.
export function applyStaticStrings() {
  for (const el of document.querySelectorAll('[data-i18n]')) {
    el.textContent = I18N.t(el.dataset.i18n);
  }
  for (const el of document.querySelectorAll('[data-i18n-title]')) {
    el.title = I18N.t(el.dataset.i18nTitle);
  }
  for (const el of document.querySelectorAll('[data-i18n-aria]')) {
    el.setAttribute('aria-label', I18N.t(el.dataset.i18nAria));
  }

  const loc = I18N.locale();
  document.documentElement.lang = loc.htmlLang;
  document.title = I18N.t('docTitle');
  document.querySelector('meta[name="description"]')?.setAttribute('content', I18N.t('docDescription'));
}

/* ---------------- Language switcher ---------------- */
export function buildLangSwitcher(onSelect) {
  const host = $('lang-switch');
  host.innerHTML = '';
  const buttons = new Map();

  for (const loc of I18N.LOCALES) {
    const b = document.createElement('button');
    b.className = 'lang-btn';
    b.type = 'button';
    b.textContent = loc.short;
    b.lang = loc.htmlLang;
    // The full name is the accessible label — "UZ" alone tells a screen
    // reader nothing.
    b.setAttribute('aria-label', loc.label);
    b.title = loc.label;
    b.addEventListener('click', () => onSelect(loc.code));
    host.append(b);
    buttons.set(loc.code, b);
  }

  return function setActive(code) {
    for (const [c, b] of buttons) {
      const on = c === code;
      b.classList.toggle('active', on);
      b.setAttribute('aria-pressed', String(on));
    }
  };
}

/* ---------------- Info panel ---------------- */
export function showPanel(info) {
  $('panel-kind').textContent = info.kind;
  $('panel-name').textContent = info.name;
  $('panel-sub').textContent = info.sub;
  $('panel-fact').textContent = info.fact;

  const dl = $('panel-facts');
  dl.innerHTML = '';
  for (const [k, v] of info.facts) {
    const row = document.createElement('div');
    row.className = 'fact-row';
    const dt = document.createElement('dt');
    dt.textContent = k;
    const dd = document.createElement('dd');
    dd.textContent = v;
    row.append(dt, dd);
    dl.append(row);
  }

  // Source link: shows where the figures come from. A body without a `source`
  // hides the link rather than pointing nowhere.
  const src = $('panel-source');
  if (info.source) {
    src.href = info.source;
    src.hidden = false;
  } else {
    src.removeAttribute('href');
    src.hidden = true;
  }

  $('panel').classList.remove('hidden');
}

export function hidePanel() {
  $('panel').classList.add('hidden');
}

/* ---------------- Quick-jump buttons ---------------- */
export function buildNav(items, onSelect) {
  const nav = $('planet-nav');
  nav.innerHTML = '';
  const buttons = new Map();

  for (const it of items) {
    const b = document.createElement('button');
    b.className = 'pbtn';
    b.type = 'button';

    const dot = document.createElement('i');
    dot.style.background = it.color;
    dot.style.color = it.color;
    b.append(dot, document.createTextNode(it.name));

    b.addEventListener('click', () => onSelect(it.key));
    nav.append(b);
    buttons.set(it.key, b);
  }

  return function setActive(key) {
    for (const [k, b] of buttons) b.classList.toggle('active', k === key);
  };
}

/* ---------------- 3D name labels ---------------- */
export function createLabels(entries, onClick) {
  const host = $('labels');
  host.innerHTML = '';
  const items = entries.map((e) => {
    const el = document.createElement('div');
    el.className = 'label';
    el.textContent = e.name;
    el.addEventListener('click', () => onClick(e.key));
    host.append(el);
    return { ...e, el, pos: new THREE.Vector3() };
  });

  let visible = true;
  const camDir = new THREE.Vector3();
  const objDir = new THREE.Vector3();
  const sunDir = new THREE.Vector3();
  const camUp = new THREE.Vector3();
  const pCenter = new THREE.Vector3();
  const pTop = new THREE.Vector3();

  function update(camera, w, h, sunPos, sunRadius) {
    if (!visible) return;

    const distSun = camera.position.distanceTo(sunPos);
    const sunAngle = Math.asin(Math.min(1, sunRadius * 1.15 / Math.max(distSun, sunRadius + 1e-3)));
    sunDir.copy(sunPos).sub(camera.position).normalize();
    camera.getWorldDirection(camDir);
    camUp.set(0, 1, 0).applyQuaternion(camera.quaternion); // screen "up" direction

    for (const it of items) {
      it.getPos(it.pos);
      const distObj = camera.position.distanceTo(it.pos);
      objDir.copy(it.pos).sub(camera.position).normalize();

      // Hide when behind the camera, or hidden behind the Sun
      let hide = objDir.dot(camDir) <= 0;
      if (!hide && distObj > distSun && objDir.angleTo(sunDir) < sunAngle) hide = true;

      if (hide) {
        it.el.classList.add('hide');
        continue;
      }

      // Measure the body's on-screen radius and place the label above it, so
      // the label never lands on top of the planet when you fly close.
      pCenter.copy(it.pos).project(camera);
      pTop.copy(it.pos).addScaledVector(camUp, it.radius).project(camera);

      const x = (pCenter.x * 0.5 + 0.5) * w;
      const y = (-pCenter.y * 0.5 + 0.5) * h;
      const yTop = (-pTop.y * 0.5 + 0.5) * h;
      const offset = Math.min(Math.max(Math.abs(y - yTop) + 16, 20), h * 0.45);

      it.el.classList.remove('hide');
      it.el.style.transform = `translate(-50%,-50%) translate(${x}px, ${y - offset}px)`;
      it.el.style.opacity = String(Math.max(0.25, Math.min(1, 900 / distObj)));
    }
  }

  function setVisible(v) {
    visible = v;
    host.style.display = v ? '' : 'none';
  }

  function setActive(key) {
    for (const it of items) it.el.classList.toggle('on', it.key === key);
  }

  // Renaming in place keeps the labels' DOM nodes and positions — a language
  // switch must not make the scene flicker.
  function setNames(nameFor) {
    for (const it of items) it.el.textContent = nameFor(it.key);
  }

  return { update, setVisible, setActive, setNames };
}

export function setLoaderProgress(fraction, text) {
  $('loader-fill').style.width = `${Math.round(fraction * 100)}%`;
  if (text) $('loader-status').textContent = text;
}

export function hideLoader() {
  $('loader').classList.add('done');
}

/* ---------------- Notices ---------------- */
// A short message that appears once and fades out on its own. The element is
// `role="status"`, so a screen reader reads it without stealing focus, and it
// is never given a close button: nothing here is worth a tap.
export function showToast(text, ms = 5000) {
  const el = $('toast');
  if (!el) return;

  el.textContent = text;
  el.hidden = false;
  requestAnimationFrame(() => el.classList.add('show'));

  setTimeout(() => {
    el.classList.remove('show');
    setTimeout(() => { el.hidden = true; }, 400);
  }, ms);
}

/* ---------------- WebGL support and fatal errors ---------------- */
export function hasWebGL() {
  try {
    const c = document.createElement('canvas');
    const gl = c.getContext('webgl2') ?? c.getContext('webgl');
    // Release the probe context immediately: browsers cap how many WebGL
    // contexts may be open at once.
    gl?.getExtension('WEBGL_lose_context')?.loseContext();
    return !!gl;
  } catch {
    return false;
  }
}

// Shown when the scene cannot run at all. Reopens the loader even if it was
// already dismissed (for example when the GL context is lost mid-session).
export function showFatal(title, text) {
  const loader = $('loader');
  if (!loader) return;

  const h = document.createElement('h1');
  h.textContent = title;
  const p = document.createElement('p');
  p.textContent = text;

  const box = document.createElement('div');
  box.className = 'loader-inner fatal';
  box.append(h, p);

  loader.innerHTML = '';
  loader.append(box);
  loader.classList.remove('done');
}
