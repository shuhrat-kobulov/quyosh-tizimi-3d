// Sayyoralar, ularning atmosferasi, halqalari, yo'ldoshlari va orbita chiziqlari.
import * as THREE from 'three';
import { PLANETS, TIME_RATE } from '../data/planets.js';
import { makeRockyTexture, makeGasTexture, makeEarthTextures, makeRingTexture } from '../utils/textures.js';
import { seg } from '../utils/quality.js';

const tick = () => new Promise((r) => setTimeout(r, 0));

/* --- Atmosfera: Fresnel qobiq --- */
function makeAtmosphere(radius, { color, opacity, scale }) {
  const mat = new THREE.ShaderMaterial({
    uniforms: {
      uColor: { value: new THREE.Color(color) },
      uOpacity: { value: opacity },
    },
    transparent: true,
    blending: THREE.AdditiveBlending,
    side: THREE.BackSide,
    depthWrite: false,
    vertexShader: /* glsl */ `
      varying vec3 vNormal;
      varying vec3 vView;
      void main(){
        vNormal = normalize(normalMatrix * normal);
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        vView = normalize(-mv.xyz);
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor;
      uniform float uOpacity;
      varying vec3 vNormal;
      varying vec3 vView;
      void main(){
        float rim = 1.0 - abs(dot(normalize(vNormal), normalize(vView)));
        float f = pow(rim, 3.0);
        gl_FragColor = vec4(uColor, f * uOpacity);
      }
    `,
  });
  return new THREE.Mesh(new THREE.SphereGeometry(radius * scale, seg(48), seg(48)), mat);
}

/* --- Halqa: UV ni radius bo'ylab qayta hisoblaymiz --- */
function makeRing(planetRadius, ring, ringTex) {
  const inner = planetRadius * ring.inner;
  const outer = planetRadius * ring.outer;
  const geo = new THREE.RingGeometry(inner, outer, seg(180), 1);

  const pos = geo.attributes.position;
  const uv = geo.attributes.uv;
  for (let i = 0; i < pos.count; i++) {
    const d = Math.hypot(pos.getX(i), pos.getY(i));
    uv.setXY(i, (d - inner) / (outer - inner), 0.5);
  }
  uv.needsUpdate = true;

  const mat = new THREE.MeshBasicMaterial({
    map: ringTex,
    transparent: true,
    opacity: ring.opacity ?? 0.95,
    side: THREE.DoubleSide,
    depthWrite: false,
  });

  const mesh = new THREE.Mesh(geo, mat);
  mesh.rotation.x = -Math.PI / 2; // sayyora ekvatori tekisligiga yotqizamiz
  mesh.renderOrder = 1;
  return mesh;
}

/* --- Orbita chizig'i --- */
function makeOrbitLine(radius, color) {
  const steps = 256;
  const pts = new Float32Array((steps + 1) * 3);
  for (let i = 0; i <= steps; i++) {
    const a = (i / steps) * Math.PI * 2;
    pts[i * 3] = Math.cos(a) * radius;
    pts[i * 3 + 1] = 0;
    pts[i * 3 + 2] = Math.sin(a) * radius;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pts, 3));
  const mat = new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.22 });
  return new THREE.Line(geo, mat);
}

export async function createPlanets(scene, onProgress = () => {}) {
  const ringTex = makeRingTexture();
  const moonTex = makeRockyTexture({
    seed: 5150, w: 256, h: 128, craters: 0.55, detail: 5,
    stops: [
      [0.0, [46, 44, 42]],
      [0.4, [104, 100, 96]],
      [0.75, [162, 157, 150]],
      [1.0, [206, 202, 196]],
    ],
  });

  const bodies = [];
  const orbitLines = [];
  const pickable = [];

  for (let idx = 0; idx < PLANETS.length; idx++) {
    const p = PLANETS[idx];
    onProgress((idx + 1) / (PLANETS.length + 1), `${p.name} yaratilmoqda…`);
    await tick();

    /* Teksturalar */
    let map = null, bump = null, clouds = null, rough = null;
    if (p.type === 'earth') {
      ({ map, bump, rough, clouds } = makeEarthTextures());
    } else if (p.type === 'gas') {
      ({ map } = makeGasTexture(p.texture));
    } else {
      ({ map, bump } = makeRockyTexture(p.texture));
    }

    /* Iyerarxiya: pivot(orbita qiyaligi) → holder(orbitadagi joy) → tilt(o'q qiyaligi) → mesh */
    const pivot = new THREE.Group();
    pivot.rotation.x = p.inclination;
    scene.add(pivot);

    const holder = new THREE.Group();
    pivot.add(holder);

    const tilt = new THREE.Group();
    tilt.rotation.z = p.tilt;
    holder.add(tilt);

    const mat = new THREE.MeshStandardMaterial({
      map,
      roughness: p.material.roughness,
      metalness: p.material.metalness,
    });
    if (bump) {
      mat.bumpMap = bump;
      mat.bumpScale = p.material.bumpScale ?? 0.04;
    }
    if (rough) mat.roughnessMap = rough;

    const mesh = new THREE.Mesh(new THREE.SphereGeometry(p.radius, seg(64), seg(48)), mat);
    mesh.userData.key = p.key;
    tilt.add(mesh);
    pickable.push(mesh);

    /* Bulut qatlami (faqat Yer) */
    let cloudMesh = null;
    if (clouds) {
      cloudMesh = new THREE.Mesh(
        new THREE.SphereGeometry(p.radius * 1.012, seg(48), seg(32)),
        new THREE.MeshStandardMaterial({
          map: clouds,
          transparent: true,
          opacity: 0.55,
          roughness: 1,
          depthWrite: false,
        })
      );
      tilt.add(cloudMesh);
    }

    if (p.atmosphere) tilt.add(makeAtmosphere(p.radius, p.atmosphere));
    if (p.ring) tilt.add(makeRing(p.radius, p.ring, ringTex));

    /* Yo'ldoshlar */
    const moons = [];
    for (const m of p.moons ?? []) {
      const mPivot = new THREE.Group();
      mPivot.rotation.x = (Math.random() - 0.5) * 0.3;
      holder.add(mPivot);

      const mMesh = new THREE.Mesh(
        new THREE.SphereGeometry(m.radius, seg(24), seg(16)),
        new THREE.MeshStandardMaterial({
          map: moonTex.map,
          bumpMap: moonTex.bump,
          bumpScale: 0.03,
          color: m.color,
          roughness: 0.95,
          metalness: 0,
        })
      );
      mPivot.add(mMesh);
      moons.push({ data: m, pivot: mPivot, mesh: mMesh, phase: Math.random() * Math.PI * 2 });
    }

    /* Orbita chizig'i */
    const line = makeOrbitLine(p.orbit, p.color);
    pivot.add(line);
    orbitLines.push(line);

    bodies.push({
      data: p,
      pivot,
      holder,
      tilt,
      mesh,
      cloudMesh,
      moons,
      focusDist: p.radius * 5.5 + 6,
    });
  }

  /* Sayyoralarni bir vaqt qiymatiga ko'ra joylashtiradi */
  function update(simTime) {
    const t = simTime * TIME_RATE;
    for (const b of bodies) {
      const a = b.data.phase + t * b.data.speed * Math.PI * 2;
      b.holder.position.set(Math.cos(a) * b.data.orbit, 0, Math.sin(a) * b.data.orbit);
      b.mesh.rotation.y = t * b.data.spin;
      if (b.cloudMesh) b.cloudMesh.rotation.y = t * b.data.spin * 1.18;

      for (const m of b.moons) {
        const ma = m.phase + t * m.data.speed * Math.PI * 2;
        m.mesh.position.set(Math.cos(ma) * m.data.orbit, 0, Math.sin(ma) * m.data.orbit);
        m.mesh.rotation.y = ma; // har doim sayyoraga bir tomoni bilan qaraydi
      }
    }
  }

  return { bodies, orbitLines, pickable, update };
}
