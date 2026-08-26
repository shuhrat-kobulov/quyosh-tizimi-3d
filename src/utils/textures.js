// Barcha teksturalar shu yerda kod bilan chiziladi (canvas + fbm shovqin).
// Loyihada birorta ham tashqi rasm fayli ishlatilmaydi.
import * as THREE from 'three';
import { makeFbm, ridged, ramp, clamp01, lerp, smoothstep } from './noise.js';

let ANISO = 8;
export function setAnisotropy(v) { ANISO = v; }

// Tekstura o'lchami qurilma darajasiga qarab kichraytiriladi (utils/quality.js).
// fbm shovqin har bir piksel uchun hisoblanadi — o'lchamni yarmiga tushirish
// yuklash vaqtini ham, video xotirani ham ~4 barobar kamaytiradi.
let TEX_SCALE = 1;
export function setTextureScale(s) { TEX_SCALE = s; }
const res = (n) => Math.max(64, Math.round((n * TEX_SCALE) / 2) * 2);

function newCanvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
}

function toTexture(canvas, { srgb = true } = {}) {
  const t = new THREE.CanvasTexture(canvas);
  t.wrapS = THREE.RepeatWrapping;
  t.wrapT = THREE.ClampToEdgeWrapping;
  t.anisotropy = ANISO;
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

// u o'qi bo'ylab eng qisqa masofa (tekstura o'ralishini hisobga oladi).
function du(a, b) {
  let d = Math.abs(a - b);
  return d > 0.5 ? 1 - d : d;
}

/* ------------------------------------------------------------------ */
/*  Toshli sayyoralar: Merkuriy, Venera, Mars                          */
/* ------------------------------------------------------------------ */
export function makeRockyTexture({
  seed, w = 512, h = 256, stops,
  craters = 0.35, warp = 0.0, poles = 0, poleColor = [235, 240, 250], detail = 5,
}) {
  w = res(w); h = res(h);
  const colorCv = newCanvas(w, h);
  const bumpCv = newCanvas(w, h);
  const cctx = colorCv.getContext('2d');
  const bctx = bumpCv.getContext('2d');
  const cimg = cctx.createImageData(w, h);
  const bimg = bctx.createImageData(w, h);

  const base = makeFbm(seed, 6, 3, detail);
  const rough = ridged(makeFbm(seed + 131, 10, 5, 4));
  const warpN = makeFbm(seed + 977, 4, 2, 3);
  const poleN = makeFbm(seed + 613, 8, 4, 3);

  for (let y = 0; y < h; y++) {
    const v = y / (h - 1);
    const latAbs = Math.abs(v * 2 - 1);
    for (let x = 0; x < w; x++) {
      let u = x / w;
      if (warp > 0) u += warp * (warpN(u, v) - 0.5);

      const b = base(u, v);
      const r = rough(u, v);
      let e = clamp01(b * (1 - craters) + r * craters);

      let [cr, cg, cb] = ramp(stops, e);

      // Qutb qalpoqchalari — chegarasi shovqin bilan buzilgan
      if (poles > 0) {
        const edge = poles + (poleN(u, v) - 0.5) * 0.18;
        const k = smoothstep(1 - edge, 1 - edge + 0.06, latAbs);
        cr = lerp(cr, poleColor[0], k);
        cg = lerp(cg, poleColor[1], k);
        cb = lerp(cb, poleColor[2], k);
        e = lerp(e, 0.75, k);
      }

      const i = (y * w + x) * 4;
      cimg.data[i] = cr; cimg.data[i + 1] = cg; cimg.data[i + 2] = cb; cimg.data[i + 3] = 255;
      const g = e * 255;
      bimg.data[i] = g; bimg.data[i + 1] = g; bimg.data[i + 2] = g; bimg.data[i + 3] = 255;
    }
  }

  cctx.putImageData(cimg, 0, 0);
  bctx.putImageData(bimg, 0, 0);
  return { map: toTexture(colorCv), bump: toTexture(bumpCv, { srgb: false }) };
}

/* ------------------------------------------------------------------ */
/*  Gaz gigantlari: Yupiter, Saturn, Uran, Neptun                      */
/* ------------------------------------------------------------------ */
export function makeGasTexture({
  seed, w = 1024, h = 512, stops,
  turbulence = 0.055, bandFreq = 26, contrast = 0.14, swirl = 0.05, spot = null,
}) {
  w = res(w); h = res(h);
  const cv = newCanvas(w, h);
  const ctx = cv.getContext('2d');
  const img = ctx.createImageData(w, h);

  const warpN = makeFbm(seed, 5, 9, 4);          // kenglikni buzuvchi turbulentlik
  const detailN = makeFbm(seed + 401, 14, 26, 4); // mayda oqim tolalari
  const swirlN = makeFbm(seed + 733, 3, 6, 3);
  const spotN = makeFbm(seed + 191, 8, 8, 3);

  for (let y = 0; y < h; y++) {
    const v = y / (h - 1);
    for (let x = 0; x < w; x++) {
      const u = x / w;
      const uu = u + swirl * (swirlN(u, v) - 0.5);
      const vv = clamp01(v + turbulence * (warpN(uu, v) - 0.5));

      let [cr, cg, cb] = ramp(stops, vv);

      // Zonal chiziqlar + mayda detallar
      const stripe = Math.sin(vv * bandFreq * Math.PI * 2) * 0.5 + 0.5;
      const d = detailN(uu, vv);
      const k = 1 + (stripe - 0.5) * contrast + (d - 0.5) * contrast * 1.35;
      cr *= k; cg *= k; cb *= k;

      // Katta dog' (masalan Yupiterning Qizil Dog'i)
      if (spot) {
        const ddu = du(uu, spot.u) / spot.rx;
        const ddv = (vv - spot.v) / spot.ry;
        const r = Math.sqrt(ddu * ddu + ddv * ddv) + (spotN(u, v) - 0.5) * 0.28;
        const m = 1 - smoothstep(0.55, 1.0, r);
        if (m > 0) {
          const swirlK = 0.75 + 0.5 * spotN(uu * 1.7, vv * 1.7);
          cr = lerp(cr, spot.color[0] * swirlK, m);
          cg = lerp(cg, spot.color[1] * swirlK, m);
          cb = lerp(cb, spot.color[2] * swirlK, m);
        }
      }

      const i = (y * w + x) * 4;
      img.data[i] = clamp01(cr / 255) * 255;
      img.data[i + 1] = clamp01(cg / 255) * 255;
      img.data[i + 2] = clamp01(cb / 255) * 255;
      img.data[i + 3] = 255;
    }
  }

  ctx.putImageData(img, 0, 0);
  return { map: toTexture(cv) };
}

/* ------------------------------------------------------------------ */
/*  Yer: okean, qit'alar, cho'llar, muz qalpoqlari va bulutlar          */
/* ------------------------------------------------------------------ */
export function makeEarthTextures(w = 1024, h = 512) {
  w = res(w); h = res(h);
  const colorCv = newCanvas(w, h);
  const bumpCv = newCanvas(w, h);
  const roughCv = newCanvas(w, h);
  const cctx = colorCv.getContext('2d');
  const bctx = bumpCv.getContext('2d');
  const rctx = roughCv.getContext('2d');
  const cimg = cctx.createImageData(w, h);
  const bimg = bctx.createImageData(w, h);
  const rimg = rctx.createImageData(w, h);

  const shape = makeFbm(20260826, 3, 2, 4);   // qit'alarning umumiy shakli
  const relief = makeFbm(778, 9, 5, 6);        // relyef
  const iceN = makeFbm(4242, 7, 4, 3);

  const deep = [5, 20, 62], shallow = [26, 92, 156];
  const land = [
    [0.00, [200, 186, 138]],
    [0.14, [74, 116, 56]],
    [0.42, [46, 88, 46]],
    [0.68, [104, 92, 62]],
    [1.00, [148, 144, 138]],
  ];
  const sand = [206, 176, 118];
  const snow = [242, 246, 252];

  for (let y = 0; y < h; y++) {
    const v = y / (h - 1);
    const latAbs = Math.abs(v * 2 - 1);
    for (let x = 0; x < w; x++) {
      const u = x / w;
      const cont = shape(u, v) * 0.62 + relief(u, v) * 0.38;
      let cr, cg, cb, elev, rough;

      if (cont < 0.5) {
        const t = smoothstep(0.34, 0.5, cont);
        cr = lerp(deep[0], shallow[0], t);
        cg = lerp(deep[1], shallow[1], t);
        cb = lerp(deep[2], shallow[2], t);
        elev = 0.34;
        rough = 0.22; // suv sirti silliq — Quyosh unda aks etadi
      } else {
        const e = (cont - 0.5) / 0.5;
        [cr, cg, cb] = ramp(land, e);
        // Cho'l mintaqalari (~30° kenglik)
        const desert = Math.exp(-Math.pow((latAbs - 0.34) / 0.11, 2)) * 0.72;
        cr = lerp(cr, sand[0], desert); cg = lerp(cg, sand[1], desert); cb = lerp(cb, sand[2], desert);
        elev = 0.45 + e * 0.55;
        rough = 0.9;
      }

      // Muz qalpoqlari
      const ice = smoothstep(0.7, 0.86, latAbs + (iceN(u, v) - 0.5) * 0.14);
      cr = lerp(cr, snow[0], ice); cg = lerp(cg, snow[1], ice); cb = lerp(cb, snow[2], ice);
      rough = lerp(rough, 0.6, ice);

      const i = (y * w + x) * 4;
      cimg.data[i] = cr; cimg.data[i + 1] = cg; cimg.data[i + 2] = cb; cimg.data[i + 3] = 255;
      const g = elev * 255;
      bimg.data[i] = g; bimg.data[i + 1] = g; bimg.data[i + 2] = g; bimg.data[i + 3] = 255;
      const rr = rough * 255;
      rimg.data[i] = rr; rimg.data[i + 1] = rr; rimg.data[i + 2] = rr; rimg.data[i + 3] = 255;
    }
  }

  cctx.putImageData(cimg, 0, 0);
  bctx.putImageData(bimg, 0, 0);
  rctx.putImageData(rimg, 0, 0);

  return {
    map: toTexture(colorCv),
    bump: toTexture(bumpCv, { srgb: false }),
    rough: toTexture(roughCv, { srgb: false }),
    clouds: makeCloudTexture(w, h, true), // w/h allaqachon miqyoslangan
  };
}

export function makeCloudTexture(w = 1024, h = 512, sized = false) {
  if (!sized) { w = res(w); h = res(h); }
  const cv = newCanvas(w, h);
  const ctx = cv.getContext('2d');
  const img = ctx.createImageData(w, h);
  const n = makeFbm(9091, 10, 5, 7, 0.5);

  for (let y = 0; y < h; y++) {
    const v = y / (h - 1);
    const latAbs = Math.abs(v * 2 - 1);
    // Ekvator va ~60° kenglikda bulut ko'p, tropiklarda kam
    const belt = 0.55
      + 0.45 * Math.exp(-Math.pow(latAbs / 0.16, 2))
      + 0.4 * Math.exp(-Math.pow((latAbs - 0.62) / 0.18, 2))
      - 0.4 * Math.exp(-Math.pow((latAbs - 0.33) / 0.13, 2));

    for (let x = 0; x < w; x++) {
      const u = x / w;
      const c = n(u, v) * belt;
      const a = smoothstep(0.44, 0.68, c) * 255;
      const i = (y * w + x) * 4;
      img.data[i] = 255; img.data[i + 1] = 255; img.data[i + 2] = 255; img.data[i + 3] = a;
    }
  }

  ctx.putImageData(img, 0, 0);
  return toTexture(cv);
}

/* ------------------------------------------------------------------ */
/*  Saturn halqasi — radius bo'ylab 1D chiziq                          */
/* ------------------------------------------------------------------ */
export function makeRingTexture(w = 1024) {
  w = res(w);
  const h = 8;
  const cv = newCanvas(w, h);
  const ctx = cv.getContext('2d');
  const img = ctx.createImageData(w, h);
  const n = makeFbm(31337, 64, 1, 5, 0.6);

  // Zichlik pasayadigan bo'shliqlar (Kassini bo'linmasi va boshqalar)
  const gaps = [
    [0.00, 0.06], [0.03, 0.02], [0.46, 0.035], [0.52, 0.012], [0.74, 0.02], [0.985, 0.05],
  ];

  for (let x = 0; x < w; x++) {
    const t = x / (w - 1);
    let density = 0.35 + 0.65 * n(t, 0.5);
    density *= smoothstep(0.0, 0.09, t) * (1 - smoothstep(0.9, 1.0, t));
    for (const [g, wdt] of gaps) {
      density *= 1 - (1 - smoothstep(0, wdt, Math.abs(t - g))) * 0.94;
    }
    density = clamp01(density);

    const tint = 0.82 + 0.18 * n(t * 3.1, 0.2);
    const r = 226 * tint, gg = 206 * tint, b = 172 * tint;
    for (let y = 0; y < h; y++) {
      const i = (y * w + x) * 4;
      img.data[i] = r; img.data[i + 1] = gg; img.data[i + 2] = b;
      img.data[i + 3] = density * 235;
    }
  }

  ctx.putImageData(img, 0, 0);
  const t = new THREE.CanvasTexture(cv);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = ANISO;
  return t;
}

/* ------------------------------------------------------------------ */
/*  Sprayt teksturalari: yulduz nuqtasi va Quyosh nuri                 */
/* ------------------------------------------------------------------ */
export function makeStarSprite(size = 64) {
  const cv = newCanvas(size, size);
  const ctx = cv.getContext('2d');
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0.0, 'rgba(255,255,255,1)');
  g.addColorStop(0.25, 'rgba(255,255,255,0.75)');
  g.addColorStop(0.55, 'rgba(180,205,255,0.18)');
  g.addColorStop(1.0, 'rgba(120,160,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  const t = new THREE.CanvasTexture(cv);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export function makeGlowSprite(size = 256, stops = [
  [0.0, 'rgba(255,236,190,0.95)'],
  [0.18, 'rgba(255,190,90,0.55)'],
  [0.42, 'rgba(255,140,50,0.18)'],
  [1.0, 'rgba(255,140,40,0)'],
]) {
  const cv = newCanvas(size, size);
  const ctx = cv.getContext('2d');
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  for (const [p, c] of stops) g.addColorStop(p, c);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  const t = new THREE.CanvasTexture(cv);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
