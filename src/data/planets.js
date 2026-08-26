// Physical layout of the scene. All display text lives in `src/i18n/` — this
// file holds only numbers, colours and texture parameters, so adding a
// language never means touching the simulation.
//
// The scale is not real. At true scale Neptune would sit millions of screens
// away, so sizes and distances are compressed for viewing. Ordering, relative
// proportions and the quoted figures are real.

export const SUN_RADIUS = 12;

// Orbital speeds are relative to Earth (Earth = 1). TIME_RATE ties them to
// wall-clock seconds: at 1.0x speed one Earth year takes ~45 seconds.
export const TIME_RATE = 1 / 45;

// The figures shown in the panels are based on NASA's public fact pages, and
// every body links to its own page so a teacher can show the source in class.
//
// The URLs do not follow one pattern (some are `/facts/`, some
// `/venus-facts/`), so they are written out by hand. The old
// `nssdc.gsfc.nasa.gov/planetary/factsheet/` pages no longer work: they now
// redirect to a generic NSSDC landing page where the figures cannot be found.
const NASA = {
  sun: 'https://science.nasa.gov/sun/facts/',
  mercury: 'https://science.nasa.gov/mercury/facts/',
  venus: 'https://science.nasa.gov/venus/venus-facts/',
  earth: 'https://science.nasa.gov/earth/facts/',
  mars: 'https://science.nasa.gov/mars/facts/',
  jupiter: 'https://science.nasa.gov/jupiter/jupiter-facts/',
  saturn: 'https://science.nasa.gov/saturn/facts/',
  uranus: 'https://science.nasa.gov/uranus/facts/',
  neptune: 'https://science.nasa.gov/neptune/neptune-facts/',
};

export const SUN = {
  key: 'sun',
  color: '#ffb454',
  radius: SUN_RADIUS,
  focusDist: 52,
  source: NASA.sun,
};

export const PLANETS = [
  {
    key: 'mercury',
    color: '#9a8f88',
    radius: 1.05,
    orbit: 26,
    speed: 2.2,
    spin: 5,
    tilt: 0.001,
    inclination: 0.122,
    phase: 0.4,
    type: 'rocky',
    texture: {
      seed: 1101,
      craters: 0.5,
      detail: 6,
      stops: [
        [0.0, [58, 52, 48]],
        [0.35, [104, 96, 88]],
        [0.6, [146, 136, 124]],
        [0.85, [178, 168, 155]],
        [1.0, [206, 198, 186]],
      ],
    },
    material: { roughness: 0.95, metalness: 0.02, bumpScale: 0.045 },
    source: NASA.mercury,
  },
  {
    key: 'venus',
    color: '#e8c07a',
    radius: 2.05,
    orbit: 37,
    speed: 1.31,
    spin: -1.6,
    tilt: 3.096,
    inclination: 0.059,
    phase: 2.1,
    type: 'rocky',
    texture: {
      seed: 2202,
      craters: 0.12,
      warp: 0.22,
      detail: 5,
      stops: [
        [0.0, [150, 106, 52]],
        [0.35, [206, 162, 86]],
        [0.6, [232, 196, 128]],
        [0.85, [246, 224, 172]],
        [1.0, [252, 240, 208]],
      ],
    },
    material: { roughness: 0.85, metalness: 0.0, bumpScale: 0.02 },
    atmosphere: { color: '#ffd9a0', opacity: 0.28, scale: 1.035 },
    source: NASA.venus,
  },
  {
    key: 'earth',
    color: '#4a90d9',
    radius: 2.2,
    orbit: 50,
    speed: 1.0,
    spin: 40,
    tilt: 0.409,
    inclination: 0.0,
    phase: 0.0,
    type: 'earth',
    material: { roughness: 0.72, metalness: 0.05, bumpScale: 0.06 },
    atmosphere: { color: '#6ea8ff', opacity: 0.34, scale: 1.028 },
    moons: [
      { key: 'moon', radius: 0.6, orbit: 4.6, speed: 13, color: 0xbdb8ae, seed: 5150 },
    ],
    source: NASA.earth,
  },
  {
    key: 'mars',
    color: '#d1603f',
    radius: 1.5,
    orbit: 66,
    speed: 0.7,
    spin: 38,
    tilt: 0.44,
    inclination: 0.032,
    phase: 3.4,
    type: 'rocky',
    texture: {
      seed: 3303,
      craters: 0.32,
      poles: 0.14,
      poleColor: [238, 240, 246],
      detail: 6,
      stops: [
        [0.0, [86, 40, 28]],
        [0.3, [138, 66, 40]],
        [0.55, [178, 94, 56]],
        [0.78, [206, 128, 84]],
        [1.0, [228, 172, 130]],
      ],
    },
    material: { roughness: 0.92, metalness: 0.02, bumpScale: 0.055 },
    atmosphere: { color: '#ff9d70', opacity: 0.14, scale: 1.03 },
    moons: [
      { key: 'phobos', radius: 0.22, orbit: 2.6, speed: 26, color: 0x8a7f74, seed: 611 },
      { key: 'deimos', radius: 0.15, orbit: 3.7, speed: 16, color: 0x9a8f84, seed: 612 },
    ],
    source: NASA.mars,
  },
  {
    key: 'jupiter',
    color: '#d8a26a',
    radius: 6.4,
    orbit: 104,
    speed: 0.25,
    spin: 92,
    tilt: 0.055,
    inclination: 0.023,
    phase: 1.2,
    type: 'gas',
    texture: {
      seed: 4404,
      w: 1024, h: 512,
      turbulence: 0.075,
      bandFreq: 24,
      contrast: 0.2,
      swirl: 0.06,
      spot: { u: 0.62, v: 0.63, rx: 0.075, ry: 0.05, color: [206, 104, 72] },
      stops: [
        [0.0, [196, 182, 168]],
        [0.14, [222, 196, 156]],
        [0.3, [186, 146, 106]],
        [0.42, [236, 214, 180]],
        [0.55, [178, 134, 96]],
        [0.68, [230, 206, 172]],
        [0.84, [196, 158, 118]],
        [1.0, [188, 176, 162]],
      ],
    },
    material: { roughness: 1.0, metalness: 0.0 },
    atmosphere: { color: '#ffd9ab', opacity: 0.16, scale: 1.022 },
    moons: [
      { key: 'io', radius: 0.34, orbit: 9.4, speed: 9, color: 0xd8c268, seed: 701 },
      { key: 'europa', radius: 0.3, orbit: 11.6, speed: 6.4, color: 0xd6cbb4, seed: 702 },
      { key: 'ganymede', radius: 0.5, orbit: 14.2, speed: 4.6, color: 0xa2968a, seed: 703 },
      { key: 'callisto', radius: 0.45, orbit: 17.4, speed: 3.2, color: 0x7c7168, seed: 704 },
    ],
    source: NASA.jupiter,
  },
  {
    key: 'saturn',
    color: '#e3c98f',
    radius: 5.4,
    orbit: 142,
    speed: 0.15,
    spin: 86,
    tilt: 0.466,
    inclination: 0.043,
    phase: 4.6,
    type: 'gas',
    texture: {
      seed: 5505,
      w: 1024, h: 512,
      turbulence: 0.05,
      bandFreq: 18,
      contrast: 0.1,
      swirl: 0.03,
      stops: [
        [0.0, [206, 190, 158]],
        [0.2, [232, 212, 168]],
        [0.4, [216, 188, 134]],
        [0.6, [240, 222, 182]],
        [0.8, [214, 190, 142]],
        [1.0, [200, 186, 160]],
      ],
    },
    material: { roughness: 1.0, metalness: 0.0 },
    atmosphere: { color: '#ffeec2', opacity: 0.14, scale: 1.022 },
    ring: { inner: 1.35, outer: 2.35 },
    moons: [
      { key: 'titan', radius: 0.5, orbit: 12.5, speed: 5, color: 0xd8a24e, seed: 801 },
      { key: 'rhea', radius: 0.26, orbit: 9.2, speed: 7.6, color: 0xbfb6a8, seed: 802 },
    ],
    source: NASA.saturn,
  },
  {
    key: 'uranus',
    color: '#8fd3de',
    radius: 3.6,
    orbit: 178,
    speed: 0.086,
    spin: -52,
    tilt: 1.706,
    inclination: 0.013,
    phase: 2.9,
    type: 'gas',
    texture: {
      seed: 6606,
      w: 512, h: 256,
      turbulence: 0.03,
      bandFreq: 10,
      contrast: 0.045,
      swirl: 0.02,
      stops: [
        [0.0, [148, 206, 212]],
        [0.35, [172, 224, 228]],
        [0.65, [158, 214, 222]],
        [1.0, [140, 198, 208]],
      ],
    },
    material: { roughness: 1.0, metalness: 0.0 },
    atmosphere: { color: '#a8ecf5', opacity: 0.24, scale: 1.03 },
    ring: { inner: 1.5, outer: 1.85, opacity: 0.3, vertical: true },
    source: NASA.uranus,
  },
  {
    key: 'neptune',
    color: '#4a6fd8',
    radius: 3.45,
    orbit: 212,
    speed: 0.06,
    spin: 50,
    tilt: 0.494,
    inclination: 0.031,
    phase: 5.5,
    type: 'gas',
    texture: {
      seed: 7707,
      w: 512, h: 256,
      turbulence: 0.05,
      bandFreq: 12,
      contrast: 0.1,
      swirl: 0.05,
      spot: { u: 0.3, v: 0.66, rx: 0.07, ry: 0.045, color: [26, 40, 92] },
      stops: [
        [0.0, [58, 94, 176]],
        [0.3, [70, 116, 202]],
        [0.55, [52, 88, 174]],
        [0.8, [76, 124, 208]],
        [1.0, [56, 92, 178]],
      ],
    },
    material: { roughness: 1.0, metalness: 0.0 },
    atmosphere: { color: '#6f9dff', opacity: 0.26, scale: 1.03 },
    moons: [
      { key: 'triton', radius: 0.4, orbit: 7.6, speed: 6, color: 0xcfd6dc, seed: 901 },
    ],
    source: NASA.neptune,
  },
];

export const BELT = { inner: 76, outer: 92, count: 2200 };
