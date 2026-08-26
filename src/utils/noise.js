// A seeded PRNG and value noise that tiles horizontally (no visible seam).
// Every planet texture is generated from this - the project ships no image
// files at all.

export function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const fade = (t) => t * t * t * (t * (t * 6 - 15) + 10);

// Periodic across gw (wraps on the x axis), clamped across gh.
function makeNoise(seed, gw, gh) {
  const rnd = mulberry32(seed);
  const g = new Float32Array(gw * gh);
  for (let i = 0; i < g.length; i++) g[i] = rnd();

  return function (x, y) {
    const xi = Math.floor(x);
    const yi = Math.floor(y);
    const u = fade(x - xi);
    const v = fade(y - yi);

    const x0 = ((xi % gw) + gw) % gw;
    const x1 = (x0 + 1) % gw;
    const y0 = Math.min(Math.max(yi, 0), gh - 1);
    const y1 = Math.min(y0 + 1, gh - 1);

    const a = g[y0 * gw + x0];
    const b = g[y0 * gw + x1];
    const c = g[y1 * gw + x0];
    const d = g[y1 * gw + x1];

    const top = a + (b - a) * u;
    const bottom = c + (d - c) * u;
    return top + (bottom - top) * v;
  };
}

// Multi-octave fbm. The returned function takes (u, v) in [0..1] and is fully
// periodic in u, so a sphere shows no seam.
export function makeFbm(seed, baseW, baseH, octaves = 5, gain = 0.5) {
  const layers = [];
  let w = baseW;
  let h = baseH;
  let amp = 1;
  let norm = 0;

  for (let i = 0; i < octaves; i++) {
    layers.push({ n: makeNoise(seed + i * 7919, w, h), amp, w, h });
    norm += amp;
    w *= 2;
    h *= 2;
    amp *= gain;
  }

  return function (u, v) {
    let s = 0;
    for (let i = 0; i < layers.length; i++) {
      const L = layers[i];
      s += L.amp * L.n(u * L.w, v * L.h);
    }
    return s / norm;
  };
}

// Ridged variant - for crater rims and mountain ridges.
export function ridged(fbm) {
  return (u, v) => 1 - Math.abs(fbm(u, v) * 2 - 1);
}

export const clamp01 = (x) => (x < 0 ? 0 : x > 1 ? 1 : x);
export const lerp = (a, b, t) => a + (b - a) * t;
export const smoothstep = (e0, e1, x) => {
  const t = clamp01((x - e0) / (e1 - e0));
  return t * t * (3 - 2 * t);
};

// Samples a colour from stops shaped as [position, [r, g, b]].
export function ramp(stops, t) {
  t = clamp01(t);
  for (let i = 0; i < stops.length - 1; i++) {
    const [p0, c0] = stops[i];
    const [p1, c1] = stops[i + 1];
    if (t >= p0 && t <= p1) {
      const k = p1 === p0 ? 0 : (t - p0) / (p1 - p0);
      return [lerp(c0[0], c1[0], k), lerp(c0[1], c1[1], k), lerp(c0[2], c1[2], k)];
    }
  }
  return t <= stops[0][0] ? stops[0][1] : stops[stops.length - 1][1];
}
