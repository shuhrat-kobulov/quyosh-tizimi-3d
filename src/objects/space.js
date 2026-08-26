// Backdrop: twinkling stars, distant nebulae and the asteroid belt.
import * as THREE from 'three';
import { makeStarSprite, makeGlowSprite } from '../utils/textures.js';
import { mulberry32 } from '../utils/noise.js';
import { BELT, TIME_RATE } from '../data/planets.js';

/* ------------------------------------------------------------------ */
/*  Stars                                                              */
/* ------------------------------------------------------------------ */
export function createStarfield(count = 6500, pixelRatio = 1) {
  const rnd = mulberry32(777);
  const pos = new Float32Array(count * 3);
  const col = new Float32Array(count * 3);
  const size = new Float32Array(count);
  const phase = new Float32Array(count);

  // Stellar classes: blue-white, white, yellow, orange, red
  const palette = [
    [0.70, 0.80, 1.00],
    [0.90, 0.94, 1.00],
    [1.00, 1.00, 0.96],
    [1.00, 0.92, 0.74],
    [1.00, 0.78, 0.60],
  ];

  const c = new THREE.Color();
  for (let i = 0; i < count; i++) {
    // Even distribution over a sphere, with a denser Milky Way band
    const inBand = rnd() < 0.28;
    const u = rnd() * 2 - 1;
    const theta = rnd() * Math.PI * 2;
    const y = inBand ? u * 0.16 : u;
    const r = Math.sqrt(Math.max(0, 1 - y * y));
    const dist = 900 + rnd() * 700;

    pos[i * 3] = Math.cos(theta) * r * dist;
    pos[i * 3 + 1] = y * dist;
    pos[i * 3 + 2] = Math.sin(theta) * r * dist;

    const p = palette[Math.floor(Math.pow(rnd(), 1.6) * palette.length)] ?? palette[2];
    const b = 0.55 + rnd() * 0.45;
    c.setRGB(p[0] * b, p[1] * b, p[2] * b);
    col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;

    size[i] = (inBand ? 1.4 : 1.8) + Math.pow(rnd(), 7) * 7.5;
    phase[i] = rnd() * Math.PI * 2;
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('aColor', new THREE.BufferAttribute(col, 3));
  geo.setAttribute('aSize', new THREE.BufferAttribute(size, 1));
  geo.setAttribute('aPhase', new THREE.BufferAttribute(phase, 1));

  const mat = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uPixelRatio: { value: pixelRatio },
      uMap: { value: makeStarSprite(64) },
    },
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    vertexShader: /* glsl */ `
      attribute vec3 aColor;
      attribute float aSize;
      attribute float aPhase;
      uniform float uTime;
      uniform float uPixelRatio;
      varying vec3 vColor;
      varying float vTw;
      void main(){
        vColor = aColor;
        vTw = 0.72 + 0.28 * sin(uTime * 1.7 + aPhase);
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = aSize * uPixelRatio * vTw;
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform sampler2D uMap;
      varying vec3 vColor;
      varying float vTw;
      void main(){
        vec4 t = texture2D(uMap, gl_PointCoord);
        if (t.a < 0.02) discard;
        gl_FragColor = vec4(vColor * vTw, t.a);
      }
    `,
  });

  const points = new THREE.Points(geo, mat);
  points.frustumCulled = false;
  points.renderOrder = -10;

  return { points, update: (t) => { mat.uniforms.uTime.value = t; } };
}

/* ------------------------------------------------------------------ */
/*  Distant nebulae - they give the scene depth                        */
/* ------------------------------------------------------------------ */
export function createNebulae() {
  const group = new THREE.Group();
  const rnd = mulberry32(31);

  // A full gradient per nebula: coloured at the centre, transparent at the rim
  const tints = [
    [[0.0, 'rgba(122,86,214,0.55)'], [0.35, 'rgba(74,52,150,0.20)'], [1.0, 'rgba(30,16,70,0)']],
    [[0.0, 'rgba(56,120,220,0.50)'], [0.35, 'rgba(30,70,150,0.18)'], [1.0, 'rgba(8,26,70,0)']],
    [[0.0, 'rgba(212,84,146,0.42)'], [0.35, 'rgba(130,40,90,0.16)'], [1.0, 'rgba(50,10,40,0)']],
    [[0.0, 'rgba(54,190,182,0.36)'], [0.35, 'rgba(24,110,110,0.14)'], [1.0, 'rgba(6,50,50,0)']],
  ];

  for (let i = 0; i < 7; i++) {
    const sprite = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: makeGlowSprite(256, tints[i % tints.length]),
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        opacity: 0.17,
      })
    );
    const th = rnd() * Math.PI * 2;
    const y = (rnd() - 0.5) * 0.8;
    const r = Math.sqrt(Math.max(0, 1 - y * y));
    const d = 1250;
    sprite.position.set(Math.cos(th) * r * d, y * d, Math.sin(th) * r * d);
    sprite.scale.setScalar(320 + rnd() * 420);
    group.add(sprite);
  }

  group.renderOrder = -11;
  return group;
}

/* ------------------------------------------------------------------ */
/*  Asteroid belt (between Mars and Jupiter)                           */
/* ------------------------------------------------------------------ */
export function createAsteroidBelt(countOverride) {
  const { inner, outer } = BELT;
  const count = countOverride ?? BELT.count;
  const rnd = mulberry32(20260826);

  // One base rock: its vertices are jittered to give a natural shape
  const geo = new THREE.IcosahedronGeometry(1, 1);
  const p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const s = 0.68 + rnd() * 0.62;
    p.setXYZ(i, p.getX(i) * s, p.getY(i) * s, p.getZ(i) * s);
  }
  geo.computeVertexNormals();

  const mat = new THREE.MeshStandardMaterial({
    color: 0x9c9186,
    roughness: 1,
    metalness: 0.05,
    flatShading: true,
  });

  const mesh = new THREE.InstancedMesh(geo, mat, count);
  mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  mesh.frustumCulled = false;

  const rocks = new Array(count);
  const quat = new THREE.Quaternion();
  const scl = new THREE.Vector3();
  const pos = new THREE.Vector3();
  const euler = new THREE.Euler();
  const color = new THREE.Color();

  for (let i = 0; i < count; i++) {
    // Averaging two random values packs the belt denser toward its middle
    const t = (rnd() + rnd()) * 0.5;
    const radius = inner + t * (outer - inner);
    const s = 0.1 + Math.pow(rnd(), 2.4) * 0.62;

    rocks[i] = {
      radius,
      angle: rnd() * Math.PI * 2,
      // In the spirit of Kepler's law: inner rocks orbit faster. The speed is
      // in the same unit as the planets use.
      speed: 0.42 * Math.pow(84 / radius, 1.5) * (0.9 + rnd() * 0.2) * Math.PI * 2,
      y: (rnd() - 0.5) * 3.4 * (0.4 + rnd()),
      scale: scl.set(s * (0.7 + rnd() * 0.7), s * (0.7 + rnd() * 0.7), s * (0.7 + rnd() * 0.7)).clone(),
      quat: quat.setFromEuler(euler.set(rnd() * 6.28, rnd() * 6.28, rnd() * 6.28)).clone(),
    };

    const shade = 0.55 + rnd() * 0.6;
    mesh.setColorAt(i, color.setRGB(shade, shade * 0.95, shade * 0.88));
  }
  if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;

  const m = new THREE.Matrix4();
  function update(simTime) {
    const t = simTime * TIME_RATE;
    for (let i = 0; i < count; i++) {
      const r = rocks[i];
      const a = r.angle + t * r.speed;
      pos.set(Math.cos(a) * r.radius, r.y, Math.sin(a) * r.radius);
      m.compose(pos, r.quat, r.scale);
      mesh.setMatrixAt(i, m);
    }
    mesh.instanceMatrix.needsUpdate = true;
  }

  update(0);
  return { mesh, update };
}
