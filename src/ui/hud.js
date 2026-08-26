// DOM interfeysi: ma'lumot paneli, tezkor tugmalar va 3D dan proyeksiya
// qilinadigan nomlar.
import * as THREE from 'three';

const $ = (id) => document.getElementById(id);

/* ---------------- Ma'lumot paneli ---------------- */
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

  $('panel').classList.remove('hidden');
}

export function hidePanel() {
  $('panel').classList.add('hidden');
}

/* ---------------- Tezkor tugmalar ---------------- */
export function buildNav(items, onSelect) {
  const nav = $('planet-nav');
  nav.innerHTML = '';
  const buttons = new Map();

  for (const it of items) {
    const b = document.createElement('button');
    b.className = 'pbtn';
    b.innerHTML = `<i style="background:${it.color};color:${it.color}"></i>${it.name}`;
    b.addEventListener('click', () => onSelect(it.key));
    nav.append(b);
    buttons.set(it.key, b);
  }

  return function setActive(key) {
    for (const [k, b] of buttons) b.classList.toggle('active', k === key);
  };
}

/* ---------------- 3D nomlar ---------------- */
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
    camUp.set(0, 1, 0).applyQuaternion(camera.quaternion); // ekrandagi "tepa" yo'nalishi

    for (const it of items) {
      it.getPos(it.pos);
      const distObj = camera.position.distanceTo(it.pos);
      objDir.copy(it.pos).sub(camera.position).normalize();

      // Kamera orqasida yoki Quyosh ortida bo'lsa — yashiramiz
      let hide = objDir.dot(camDir) <= 0;
      if (!hide && distObj > distSun && objDir.angleTo(sunDir) < sunAngle) hide = true;

      if (hide) {
        it.el.classList.add('hide');
        continue;
      }

      // Jismning ekrandagi radiusini o'lchab, yorliqni uning ustiga qo'yamiz —
      // shunda yaqinlashganda ham yorliq sayyora ustiga tushib qolmaydi.
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

  return { update, setVisible, setActive };
}

export function setLoaderProgress(fraction, text) {
  $('loader-fill').style.width = `${Math.round(fraction * 100)}%`;
  if (text) $('loader-status').textContent = text;
}

export function hideLoader() {
  $('loader').classList.add('done');
}

/* ---------------- WebGL bor-yo'qligi va halokatli xato ---------------- */
export function hasWebGL() {
  try {
    const c = document.createElement('canvas');
    const gl = c.getContext('webgl2') ?? c.getContext('webgl');
    // Sinov uchun ochilgan kontekstni darrov qaytaramiz: brauzerda bir vaqtda
    // ochiq bo'la oladigan WebGL kontekstlari soni cheklangan.
    gl?.getExtension('WEBGL_lose_context')?.loseContext();
    return !!gl;
  } catch {
    return false;
  }
}

// Sahna umuman ishlamaganda ko'rsatiladigan xabar. Yuklash ekrani allaqachon
// yopilgan bo'lsa ham qaytarib ochiladi (masalan, kontekst yo'qolganda).
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
