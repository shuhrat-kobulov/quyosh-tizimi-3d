// App icons, drawn in code — the same rule the scene follows. Nothing here is
// committed as a file: `build/pwa.js` renders these at build time and emits
// them straight into `dist/`, and serves them from memory during `vite dev`.
//
// A PNG is a signature, three chunks and a zlib stream, so it is written by
// hand rather than pulling in an image library for four small squares.
import zlib from 'node:zlib';

/* ---------------- PNG container ---------------- */
const CRC_TABLE = (() => {
  const t = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
  }
  return t;
})();

function crc32(buf) {
  let c = -1;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ -1) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'latin1'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}

// 8-bit RGBA, no interlacing. Every scanline carries filter byte 0 ("none"):
// these images are small, and a real filter search would buy a few hundred
// bytes at the price of another hundred lines here.
function encodePng(size, rgba) {
  const stride = size * 4;
  const raw = Buffer.alloc(size * (stride + 1));
  for (let y = 0; y < size; y++) {
    raw[y * (stride + 1)] = 0;
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride);
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // colour type: truecolour with alpha

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

/* ---------------- The picture ---------------- */
// Same palette as src/style.css, so the installed icon and the page agree.
const BG_IN = [11, 16, 36];
const BG_OUT = [4, 5, 12];
const SUN_CORE = [255, 247, 226];
const SUN_EDGE = [255, 166, 54];
const CORONA = [255, 180, 84];
const ORBIT = [110, 168, 255];
const PLANET = [168, 206, 255];

const mix = (a, b, t) => [
  a[0] + (b[0] - a[0]) * t,
  a[1] + (b[1] - a[1]) * t,
  a[2] + (b[2] - a[2]) * t,
];
const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);

// Radii are in units of half the icon's width, so one description covers
// every size. `safe` shrinks the drawing for the maskable variant, whose
// corners a launcher is free to crop away.
function shade(nx, ny, minStroke) {
  const r = Math.hypot(nx, ny);

  let col = mix(BG_IN, BG_OUT, clamp01(r / 1.3));

  const sunR = 0.3;
  const coronaR = 0.72;
  const orbitR = 0.78;
  const orbitW = Math.max(0.024, minStroke);
  const planetR = Math.max(0.085, minStroke * 2.2);

  // Corona first: it has to sit under everything it glows behind.
  if (r > sunR) {
    const t = clamp01(1 - (r - sunR) / (coronaR - sunR));
    col = mix(col, CORONA, Math.pow(t, 2.4) * 0.62);
  }

  // The orbit ring dims where it crosses the glow, which is what keeps it
  // reading as a ring around the Sun rather than a flat circle on top of it.
  if (Math.abs(r - orbitR) < orbitW) col = mix(col, ORBIT, 0.8);

  // One planet on the ring, up and to the right.
  const a = -0.72;
  if (Math.hypot(nx - orbitR * Math.cos(a), ny - orbitR * Math.sin(a)) < planetR) {
    col = PLANET;
  }

  // Limb darkening: bright core falling to the photosphere edge.
  if (r < sunR) col = mix(SUN_CORE, SUN_EDGE, Math.pow(r / sunR, 0.8));

  return col;
}

// 3x3 supersampling. At 512px that is 2.4M samples of straight arithmetic —
// a few milliseconds, and it saves writing an analytic coverage term for
// every shape above.
const SS = 3;

export function renderIcon(size, { safe = 1 } = {}) {
  const rgba = Buffer.alloc(size * size * 4);
  const half = size / 2;
  const minStroke = 1.2 / (half * safe); // never let a line fall under ~1px

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let r = 0, g = 0, b = 0;
      for (let sy = 0; sy < SS; sy++) {
        for (let sx = 0; sx < SS; sx++) {
          const nx = ((x + (sx + 0.5) / SS - half) / half) / safe;
          const ny = ((y + (sy + 0.5) / SS - half) / half) / safe;
          const c = shade(nx, ny, minStroke);
          r += c[0]; g += c[1]; b += c[2];
        }
      }
      const i = (y * size + x) * 4;
      const n = SS * SS;
      rgba[i] = Math.round(r / n);
      rgba[i + 1] = Math.round(g / n);
      rgba[i + 2] = Math.round(b / n);
      rgba[i + 3] = 255; // fully opaque: a maskable icon must have no holes
    }
  }

  return encodePng(size, rgba);
}
